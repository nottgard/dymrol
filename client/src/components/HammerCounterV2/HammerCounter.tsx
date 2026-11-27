import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import HammerCursor from './HammerCursor.tsx';
import { useHammerSound } from './useHammerSound.ts';
import { FireFlame } from '../FireFlame/FireFlame.tsx';
import { api } from '../../api/client.ts';

// Clases que se añaden/quitan desde JS para reiniciar animaciones (deben ser strings literales para que Tailwind las detecte)
const CLS_GOLPE = 'golpe';
const CLS_POP_TOTAL = 'animate-pop-total';
const CLS_POP_BAR = 'animate-bar-glow';
const CLS_MAS =
  'fixed pointer-events-none font-extrabold text-2xl text-ember [text-shadow:0_1px_2px_rgba(0,0,0,0.8),0_0_10px_rgba(229,106,78,0.5)] animate-sube';
const CLS_CHISPA =
  'fixed pointer-events-none size-1.5 rounded-full bg-gold shadow-[0_0_8px_#f2b705] animate-chispa';

/**
 * Estos 6 números deciden el límite de golpes de cada nivel.
 * Cada valor representa los golpes necesarios para completar ese nivel y avanzar al siguiente:
 *
 *   Nivel 1 -> [0] golpes
 *   Nivel 2 -> [1] golpes
 *   Nivel 3 -> [2] golpes
 *   Nivel 4 -> [3] golpes
 *   Nivel 5 -> [4] golpes
 *   Nivel 6 -> [5] golpes (Nivel final / máximo)
 * ============================================================================
 */
export const DEFAULT_LEVEL_THRESHOLDS: number[] = [1000, 2500, 5000, 10000, 20000, 50000];

/** Tiempo sin golpear (ms) tras el que se envían al servidor los golpes acumulados. */
const FLUSH_DELAY_MS = 700;
/** Cada cuánto (ms) se vuelve a leer el total del servidor. */
const POLL_INTERVAL_MS = 5000;
/** Espera (ms) antes de reintentar si falla el envío. */
const FLUSH_RETRY_MS = 3000;

/**
 * Modifica este valor para que cada clic sume más de un golpe (+1, +2, +5, +10...).
 * - Puedes indicar un número fijo (ej. 5 para sumar siempre +5).
 * - O un array de 6 números con el poder específico de cada nivel (ej. [1, 2, 5, 10, 20, 50]).
 * ============================================================================
 */
export const DEFAULT_HIT_POWER: number | number[] = 1;

/**
 * Formatea el número de golpes mostrando todos los dígitos con separador de miles (ej. 1.000, 10.000, 1.000.000)
 */
export function formatHits(num: number): string {
  return new Intl.NumberFormat('es-ES').format(num);
}

export interface LevelProgressInfo {
  level: number;
  currentHits: number;
  targetHits: number;
  progressPercent: number;
  isMax: boolean;
}

export function calculateLevelProgress(
  totalHits: number,
  thresholds: number[] = DEFAULT_LEVEL_THRESHOLDS
): LevelProgressInfo {
  const maxLevels = thresholds.length || 6;
  let remaining = Math.max(0, totalHits);

  for (let i = 0; i < maxLevels; i++) {
    const threshold = thresholds[i] ?? 1;
    const target = threshold > 0 ? threshold : 1;
    const isLast = i === maxLevels - 1;

    if (isLast) {
      const currentHits = Math.min(remaining, target);
      const isMax = remaining >= target;
      const progressPercent = Math.min(100, (currentHits / target) * 100);
      return {
        level: maxLevels,
        currentHits,
        targetHits: target,
        progressPercent,
        isMax,
      };
    }

    if (remaining < target) {
      const currentHits = remaining;
      const progressPercent = Math.min(100, (currentHits / target) * 100);
      return {
        level: i + 1,
        currentHits,
        targetHits: target,
        progressPercent,
        isMax: false,
      };
    }

    remaining -= target;
  }

  const lastTarget = thresholds[maxLevels - 1] || 1;
  return {
    level: maxLevels,
    currentHits: lastTarget,
    targetHits: lastTarget,
    progressPercent: 100,
    isMax: true,
  };
}

export interface HammerCounterProps {
  className?: string;
  levelThresholds?: number[];
  hitPower?: number | number[];
}

export function HammerCounter({
  className = '',
  levelThresholds = DEFAULT_LEVEL_THRESHOLDS,
  hitPower = DEFAULT_HIT_POWER,
}: HammerCounterProps) {
  // Total guardado en la base de datos (compartido por todos los usuarios)
  const [synced, setSynced] = useState<number>(0);
  // Golpes de este usuario aún no confirmados por el servidor (sin enviar + en vuelo)
  const [unsynced, setUnsynced] = useState<number>(0);
  const total = synced + unsynced;

  const unsentRef = useRef(0); // golpes acumulados que todavía no se han enviado
  const inFlightRef = useRef(0); // golpes de la petición en curso
  const flushTimerRef = useRef<number | undefined>(undefined);
  const postSeqRef = useRef(0); // sube con cada POST confirmado; sirve para descartar lecturas obsoletas
  const flushRef = useRef<() => void>(() => {}); // permite que flush se reprograme a sí misma

  // Envía los golpes acumulados al servidor (una sola petición a la vez)
  const flush = useCallback(async () => {
    window.clearTimeout(flushTimerRef.current);
    if (inFlightRef.current > 0 || unsentRef.current === 0) return;

    const amount = unsentRef.current;
    unsentRef.current = 0;
    inFlightRef.current = amount;
    try {
      const { smashes } = await api.post<{ smashes: string }>('/forge-counter', { amount });
      postSeqRef.current += 1;
      // La respuesta ya incluye nuestros golpes y los de los demás usuarios
      setSynced(Number(smashes));
      setUnsynced((u) => u - amount);
      inFlightRef.current = 0;
      if (unsentRef.current > 0) flushTimerRef.current = window.setTimeout(() => flushRef.current(), FLUSH_DELAY_MS);
    } catch {
      // Falló el envío: devolvemos los golpes a la cola y reintentamos más tarde
      unsentRef.current += amount;
      inFlightRef.current = 0;
      flushTimerRef.current = window.setTimeout(() => flushRef.current(), FLUSH_RETRY_MS);
    }
  }, []);
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  useEffect(() => {
    let cancelled = false;

    // Lee el total del servidor (así se ven los golpes de otros usuarios)
    const fetchTotal = () => {
      const seq = postSeqRef.current;
      api
        .get<{ smashes: string }>('/forge-counter')
        .then(({ smashes }) => {
          // Si mientras tanto llegó la respuesta de un POST, esta lectura es más antigua: se descarta
          if (!cancelled && seq === postSeqRef.current) setSynced(Number(smashes));
        })
        .catch(() => {
          // Sin servidor: se mantiene el último valor y sigue funcionando en local
        });
    };

    fetchTotal();
    // Polling: solo con la pestaña visible, y al volver a verla se refresca de inmediato
    const pollId = window.setInterval(() => {
      if (document.visibilityState === 'visible') fetchTotal();
    }, POLL_INTERVAL_MS);
    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') fetchTotal();
    };
    document.addEventListener('visibilitychange', refreshOnVisible);

    // Al cerrar o ocultar la pestaña, envía lo pendiente para no perder golpes
    const sendPendingBeacon = () => {
      if (document.visibilityState !== 'hidden' || unsentRef.current === 0) return;
      const body = new Blob([JSON.stringify({ amount: unsentRef.current })], { type: 'application/json' });
      if (navigator.sendBeacon('/api/forge-counter', body)) unsentRef.current = 0;
    };
    document.addEventListener('visibilitychange', sendPendingBeacon);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', sendPendingBeacon);
      document.removeEventListener('visibilitychange', refreshOnVisible);
      window.clearInterval(pollId);
      window.clearTimeout(flushTimerRef.current);
    };
  }, []);

  const thresholds = useMemo(
    () => (levelThresholds && levelThresholds.length === 6 ? levelThresholds : DEFAULT_LEVEL_THRESHOLDS),
    [levelThresholds]
  );

  const progress = useMemo(() => calculateLevelProgress(total, thresholds), [total, thresholds]);

  const currentPower = useMemo(() => {
    const config = hitPower ?? DEFAULT_HIT_POWER;
    if (Array.isArray(config)) {
      const idx = Math.min(Math.max(1, progress.level), config.length) - 1;
      const p = config[idx];
      return typeof p === 'number' && p > 0 ? p : 1;
    }
    return typeof config === 'number' && config > 0 ? config : 1;
  }, [hitPower, progress.level]);

  const hammerRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const totalDisplayRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { playThud } = useHammerSound();

  const mover = (x: number, y: number) => {
    if (!hammerRef.current) return;
    hammerRef.current.style.display = 'block';
    hammerRef.current.style.left = `${x}px`;
    hammerRef.current.style.top = `${y}px`;
  };

  const golpear = (x: number, y: number, isTouchOrKey = false) => {
    mover(x, y);

    // Animación del martillo
    if (hammerRef.current) {
      hammerRef.current.classList.remove(CLS_GOLPE);
      void hammerRef.current.offsetWidth; // reinicia la animación en clics rápidos
      hammerRef.current.classList.add(CLS_GOLPE);
    }

    // Acumular el golpe y programar el envío cuando pare de golpear
    unsentRef.current += currentPower;
    setUnsynced((u) => u + currentPower);
    window.clearTimeout(flushTimerRef.current);
    flushTimerRef.current = window.setTimeout(() => flushRef.current(), FLUSH_DELAY_MS);

    // Destello de impacto en el contador total
    if (totalDisplayRef.current) {
      totalDisplayRef.current.classList.remove(CLS_POP_TOTAL);
      void totalDisplayRef.current.offsetWidth;
      totalDisplayRef.current.classList.add(CLS_POP_TOTAL);
    }

    // Destello de impacto en la barra de progreso
    if (fillRef.current) {
      fillRef.current.classList.remove(CLS_POP_BAR);
      void fillRef.current.offsetWidth;
      fillRef.current.classList.add(CLS_POP_BAR);
    }

    // Efecto visual de golpe en el botón
    if (btnRef.current) {
      btnRef.current.classList.add('hit');
      setTimeout(() => {
        btnRef.current?.classList.remove('hit');
      }, 90);
    }

    // +X flotante con el poder del golpe
    if (overlayRef.current) {
      const mas = document.createElement('div');
      mas.className = CLS_MAS;
      mas.textContent = `+${formatHits(currentPower)}`;
      mas.style.left = `${x}px`;
      mas.style.top = `${y - 24}px`;
      overlayRef.current.appendChild(mas);
      setTimeout(() => {
        mas.remove();
      }, 850);

      // Chispas
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduceMotion) {
        for (let i = 0; i < 6; i++) {
          const chispa = document.createElement('div');
          chispa.className = CLS_CHISPA;
          const angle = Math.random() * Math.PI * 2;
          const dist = 22 + Math.random() * 26;
          chispa.style.left = `${x}px`;
          chispa.style.top = `${y}px`;
          chispa.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
          chispa.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
          overlayRef.current.appendChild(chispa);
          setTimeout(() => {
            chispa.remove();
          }, 500);
        }
      }
    }

    // Sonido de impacto
    playThud();

    // En pantallas táctiles o teclado, ocultar el martillo tras el golpe
    if (isTouchOrKey) {
      setTimeout(() => {
        if (hammerRef.current) {
          hammerRef.current.style.display = 'none';
        }
      }, 300);
    }
  };

  // Guardamos la referencia de la función golpear más reciente para los listeners globales
  const golpearRef = useRef(golpear);
  golpearRef.current = golpear;

  useEffect(() => {
    const hideHammer = () => {
      if (hammerRef.current) hammerRef.current.style.display = 'none';
    };

    /**
     * Determina si el cursor debe ocultar el martillo en la posición (x, y).
     * Excepciones: el logo
     */
    const isOverInteractive = (x: number, y: number): boolean => {
      const el = document.elementFromPoint(x, y) as HTMLElement | null;
      if (!el) return false;
      return !!(
        (el.closest('a') && !el.closest('.logo')) ||
        (el.closest('button') && !el.closest('.anvil-button')) ||
        el.closest('.socials') ||
        el.closest('.sound-button')
      );
    };

    const handleGlobalPointerMove = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (isOverInteractive(e.clientX, e.clientY)) {
        hideHammer();
        return;
      }
      mover(e.clientX, e.clientY);
    };

    const handleGlobalPointerLeave = () => {
      hideHammer();
    };

    const handleGlobalPointerDown = (e: globalThis.PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (isOverInteractive(e.clientX, e.clientY)) return;

      golpearRef.current(e.clientX, e.clientY, e.pointerType !== 'mouse');
    };

    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: true });
    window.addEventListener('pointerdown', handleGlobalPointerDown);
    document.addEventListener('mouseleave', handleGlobalPointerLeave);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerdown', handleGlobalPointerDown);
      document.removeEventListener('mouseleave', handleGlobalPointerLeave);
      hideHammer();
    };
  }, []);

  const handleButtonKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!btnRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      golpear(rect.left + rect.width / 2, rect.top + rect.height / 2, true);
    }
  };

  return (
    <>
      <section
        className={`relative w-full max-w-200 flex-1 flex flex-col items-center px-4 py-2.5 text-center overflow-visible select-none touch-manipulation my-24 mx-auto [@media(hover:none)_and_(pointer:coarse)]:my-4 ${className}`}
        aria-label="Zona de forja con martillo"
      >
        <button
          ref={btnRef}
          className="anvil-button group inline-flex flex-col items-center justify-center gap-3 px-4 py-2 bg-transparent border-0 cursor-none mt-1 mx-auto transition-transform duration-75 ease-in-out [-webkit-tap-highlight-color:transparent] outline-none"
          type="button"
          aria-label={progress.isMax ? '¡Sigue golpeando!' : '¡Golpea!'}
          onKeyDown={handleButtonKeyDown}
        >
          <img
            src="/assets/anvil.svg"
            alt="Yunque"
            className="w-[clamp(19vh,21vh,25vh)] h-auto aspect-square block select-none [-webkit-user-drag:none] pointer-events-none [filter:drop-shadow(0_10px_18px_rgba(0,0,0,0.7))_drop-shadow(0_0_12px_rgba(200,85,61,0.25))] transition-[filter,transform] duration-150 ease-in-out group-hover:[filter:drop-shadow(0_12px_22px_rgba(0,0,0,0.8))_drop-shadow(0_0_20px_rgba(242,183,5,0.5))] group-active:[filter:drop-shadow(0_4px_8px_rgba(0,0,0,0.8))_drop-shadow(0_0_26px_rgba(242,183,5,0.95))_brightness(1.2)] group-[.hit]:[filter:drop-shadow(0_4px_8px_rgba(0,0,0,0.8))_drop-shadow(0_0_26px_rgba(242,183,5,0.95))_brightness(1.2)]"
            draggable={false}
          />
        </button>
        <div className="w-full mb-1.5">
          {/* Barra de progreso */}
          <div
            className="relative flex items-center justify-start w-full h-1.5 mb-4.5 overflow-visible rounded-full border border-white/14 bg-black/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
            role="progressbar"
            aria-valuenow={Math.round(progress.progressPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progreso del nivel ${progress.level}: ${Math.round(progress.progressPercent)}%`}
          >
            <div
              ref={fillRef}
              className="relative h-full rounded-full bg-[linear-gradient(90deg,#c8553d_0%,#e56a4e_50%,#f2b705_100%)] shadow-[0_0_14px_rgba(242,183,5,0.6)] transition-[width] duration-150 ease-out"
              style={{ width: `${progress.progressPercent}%` }}
            >
              <FireFlame particleQty={50} />
            </div>
            {/* <span className="hammer-progress-v2__text">
              {progress.isMax ? '100%' : `${Math.round(progress.progressPercent)}%`}
            </span> */}
          </div>
          <div className="inline-flex items-center gap-1.5 w-auto mb-4 px-2.5 py-1 text-[0.82rem] rounded-full border border-white/12 bg-white/5 shadow-[0_2px_6px_rgba(0,0,0,0.2)]" title={`Total acumulado: ${total.toLocaleString()} golpes`}>
            <span ref={totalDisplayRef} className="inline-block font-extrabold tabular-nums text-gold [text-shadow:0_0_8px_rgba(242,183,5,0.4)] transition-transform duration-100">
              {formatHits(total)} Golpes al yunque
            </span>
          </div>
        </div>



        <p className="mt-[25px] mb-0 text-[0.82rem] text-muted opacity-75"></p>


      </section>

      {/* Martillo que sigue el cursor y capa de partículas montados en body para no afectar el scroll */}
      {typeof document !== 'undefined' &&
        createPortal(
          <>
            <HammerCursor
              ref={hammerRef}
              src={`/assets/hammer/h${Math.min(6, Math.max(1, progress.level))}.svg`}
            />
            <div ref={overlayRef} className="fixed inset-0 pointer-events-none z-9998 overflow-hidden" aria-hidden="true" />
          </>,
          document.body
        )}
    </>
  );
}

export default HammerCounter;
