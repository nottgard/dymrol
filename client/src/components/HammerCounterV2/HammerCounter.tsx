import { useEffect, useMemo, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import HammerCursor from './HammerCursor.tsx';
import { useHammerSound } from './useHammerSound.ts';
import './HammerCounter.css';
import { FireFlame } from '../FireFlame/FireFlame.tsx';

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
  storageKey?: string;
  levelThresholds?: number[];
  hitPower?: number | number[];
}

export function HammerCounter({
  className = '',
  storageKey = 'golpes',
  levelThresholds = DEFAULT_LEVEL_THRESHOLDS,
  hitPower = DEFAULT_HIT_POWER,
}: HammerCounterProps) {
  const [total, setTotal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

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
      hammerRef.current.classList.remove('golpe');
      void hammerRef.current.offsetWidth; // reinicia la animación en clics rápidos
      hammerRef.current.classList.add('golpe');
    }

    // Actualizar total y guardar
    setTotal((prev) => {
      const next = prev + currentPower;
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        // En caso de modo incógnito o storage deshabilitado
      }
      return next;
    });

    // Destello de impacto en el contador total
    if (totalDisplayRef.current) {
      totalDisplayRef.current.classList.remove('pop');
      void totalDisplayRef.current.offsetWidth;
      totalDisplayRef.current.classList.add('pop');
    }

    // Destello de impacto en la barra de progreso
    if (fillRef.current) {
      fillRef.current.classList.remove('pop');
      void fillRef.current.offsetWidth;
      fillRef.current.classList.add('pop');
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
      mas.className = 'mas';
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
          chispa.className = 'chispa';
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
    const handleGlobalPointerMove = (e: globalThis.PointerEvent) => {
      if (e.pointerType === 'mouse') {
        const target = e.target as HTMLElement | null;
        // Si el puntero está sobre enlaces sociales o el botón de sonido, ocultar el martillo para no pisarlos
        if (target?.closest('.socials') || target?.closest('.sound')) {
          if (hammerRef.current) {
            hammerRef.current.style.display = 'none';
          }
          return;
        }
        mover(e.clientX, e.clientY);
      }
    };

    const handleGlobalPointerLeave = () => {
      if (hammerRef.current) {
        hammerRef.current.style.display = 'none';
      }
    };

    const handleGlobalPointerDown = (e: globalThis.PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      // No golpear si se hace clic en elementos interactivos como redes sociales, botón de sonido o reset
      if (
        target?.closest('a') ||
        target?.closest('.socials') ||
        target?.closest('.sound') ||
        target?.closest('button:not(.hammer-zone-v2__btn)') ||
        target === resetRef.current
      ) {
        return;
      }

      golpearRef.current(e.clientX, e.clientY, e.pointerType !== 'mouse');
    };

    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: true });
    window.addEventListener('pointerdown', handleGlobalPointerDown);
    document.addEventListener('mouseleave', handleGlobalPointerLeave);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerdown', handleGlobalPointerDown);
      document.removeEventListener('mouseleave', handleGlobalPointerLeave);
      if (hammerRef.current) {
        hammerRef.current.style.display = 'none';
      }
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

  const handleReset = () => {
    setTotal(0);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignorar
    }
  };

  return (
    <>
      <section
        className={`hammer-zone-v2 ${className}`}
        aria-label="Zona de forja con martillo"
      >
        <button
          ref={btnRef}
          className="hammer-zone-v2__btn"
          type="button"
          aria-label={progress.isMax ? '¡Sigue golpeando!' : '¡Golpea!'}
          onKeyDown={handleButtonKeyDown}
        >
          <img
            src="/assets/anvil.svg"
            alt="Yunque"
            className="hammer-zone-v2__anvil"
            draggable={false}
          />
        </button>
        <div className="hammer-progress-v2">
          {/* Barra de progreso */}
          <div
            className="hammer-progress-v2__track"
            role="progressbar"
            aria-valuenow={Math.round(progress.progressPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progreso del nivel ${progress.level}: ${Math.round(progress.progressPercent)}%`}
          >
            <div
              ref={fillRef}
              className="hammer-progress-v2__fill"
              style={{ width: `${progress.progressPercent}%` }}
            >
              <FireFlame particleQty={50} />
            </div>
            {/* <span className="hammer-progress-v2__text">
              {progress.isMax ? '100%' : `${Math.round(progress.progressPercent)}%`}
            </span> */}
          </div>
          <div className="hammer-total-badge-v2" title={`Total acumulado: ${total.toLocaleString()} golpes`}>
            <span ref={totalDisplayRef} className="hammer-total-badge-v2__value">
              {formatHits(total)} Golpes al yunque
            </span>
          </div>
        </div>



        <p className="hammer-zone-v2__hint"></p>

        {/* <button
          ref={resetRef}
          className="hammer-zone__reset"
          type="button"
          onClick={handleReset}
        >
          Reiniciar progreso
        </button> */}

      </section>

      {/* Martillo que sigue el cursor y capa de partículas montados en body para no afectar el scroll */}
      {typeof document !== 'undefined' &&
        createPortal(
          <>
            <HammerCursor
              ref={hammerRef}
              src={`/assets/hammer/h${Math.min(6, Math.max(1, progress.level))}.svg`}
            />
            <div ref={overlayRef} className="hammer-effects-overlay" aria-hidden="true" />
          </>,
          document.body
        )}
    </>
  );
}

export default HammerCounter;
