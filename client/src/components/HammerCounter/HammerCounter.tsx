import { useEffect, useMemo, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import HammerCursor from './HammerCursor.tsx';
import { useHammerSound } from './useHammerSound.ts';
import './HammerCounter.css';

/**
 * ============================================================================
 * LÍMITES DE GOLPES POR NIVEL (6 niveles en total)
 * ============================================================================
 * Modifica estos 6 números para decidir el límite de golpes de cada nivel.
 * Cada valor representa los golpes necesarios para completar ese nivel y
 * avanzar al siguiente:
 *
 *   Nivel 1 -> DEFAULT_LEVEL_THRESHOLDS[0] golpes
 *   Nivel 2 -> DEFAULT_LEVEL_THRESHOLDS[1] golpes
 *   Nivel 3 -> DEFAULT_LEVEL_THRESHOLDS[2] golpes
 *   Nivel 4 -> DEFAULT_LEVEL_THRESHOLDS[3] golpes
 *   Nivel 5 -> DEFAULT_LEVEL_THRESHOLDS[4] golpes
 *   Nivel 6 -> DEFAULT_LEVEL_THRESHOLDS[5] golpes (Nivel final / máximo)
 * ============================================================================
 */
export const DEFAULT_LEVEL_THRESHOLDS: number[] = [10, 25, 50, 100, 200, 500];

/**
 * ============================================================================
 * PODER DEL MARTILLO (golpes sumados por cada clic)
 * ============================================================================
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
    const target = thresholds[i] > 0 ? thresholds[i] : 1;
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

  const handlePointerMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse') {
      mover(e.clientX, e.clientY);
    }
  };

  const handlePointerLeave = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' && hammerRef.current) {
      hammerRef.current.style.display = 'none';
    }
  };

  const handlePointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.target === resetRef.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    golpear(e.clientX, e.clientY, e.pointerType !== 'mouse');
  };

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

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (hammerRef.current) {
        hammerRef.current.style.display = 'none';
      }
    };
  }, []);

  return (
    <>
      <section
        className={`hammer-zone ${className}`}
        aria-label="Zona de forja con martillo"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
      >
        {/* Cabecera con título y contador de golpes totales independiente */}
        <div className="hammer-header">
          {/* Indicadores visuales de los 6 niveles */}
          <div className="hammer-progress__steps" aria-hidden="true">
            {thresholds.map((_, idx) => {
              const stepLevel = idx + 1;
              const isCompleted =
                stepLevel < progress.level || (stepLevel === progress.level && progress.isMax);
              const isActive = stepLevel === progress.level && !progress.isMax;

              let stepClass = 'hammer-progress__step';
              if (isCompleted) stepClass += ' hammer-progress__step--completed';
              else if (isActive) stepClass += ' hammer-progress__step--active';
              else stepClass += ' hammer-progress__step--locked';

              return (
                <div key={stepLevel} className={stepClass} title={`Nivel ${stepLevel}`}>
                  <span className="hammer-progress__step-num">Nivel {stepLevel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contenedor de la barra de progreso de 6 niveles */}
        <div className="hammer-progress">
          {/* <div className="hammer-progress__header">
            <span className="hammer-progress__badge">
              Nivel {progress.level} de {thresholds.length}
            </span>
            <span className="hammer-progress__counter">
              {progress.isMax
                ? '¡Nivel Máximo!'
                : `${formatHits(progress.currentHits)} / ${formatHits(progress.targetHits)} golpes`}
            </span>
          </div> */}



          {/* Barra de progreso */}
          <div
            className="hammer-progress__track"
            role="progressbar"
            aria-valuenow={Math.round(progress.progressPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progreso del nivel ${progress.level}: ${Math.round(progress.progressPercent)}%`}
          >
            <div
              ref={fillRef}
              className="hammer-progress__fill"
              style={{ width: `${progress.progressPercent}%` }}
            />
            <span className="hammer-progress__text">
              {progress.isMax ? '100%' : `${Math.round(progress.progressPercent)}%`}
            </span>
          </div>
        </div>

        <button
          ref={btnRef}
          className="hammer-zone__btn"
          type="button"
          onKeyDown={handleButtonKeyDown}
        >
          {progress.isMax
            ? '¡Sigue golpeando!'
            : '¡Golpea!'}
        </button>

        <p className="hammer-zone__hint">
          {/* {progress.isMax
            ? '¡Nivel máximo alcanzado! Sigue sumando golpes totales'
            : currentPower > 1
              ? `Poder del martillo: +${formatHits(currentPower)} por golpe`
              : 'Golpea para avanzar al siguiente nivel'} */}
        </p>

        {/* <button
          ref={resetRef}
          className="hammer-zone__reset"
          type="button"
          onClick={handleReset}
        >
          Reiniciar progreso
        </button> */}
        <div
          className="hammer-total-badge"
          title={`Total acumulado: ${total.toLocaleString()} golpes`}
        >
          <span className="hammer-total-badge__label">Golpes totales:</span>
          <span ref={totalDisplayRef} className="hammer-total-badge__value">
            {formatHits(total)}
          </span>
        </div>
      </section>

      {/* Martillo que sigue el cursor, adaptado automáticamente al nivel actual (h1.svg a h6.svg) */}
      <HammerCursor
        ref={hammerRef}
        src={`/assets/hammer/h${Math.min(6, Math.max(1, progress.level))}.svg`}
      />

      {/* Capa de partículas (+1 y chispas) */}
      <div ref={overlayRef} className="hammer-effects-overlay" aria-hidden="true" />
    </>
  );
}

export default HammerCounter;
