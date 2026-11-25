import { useCallback, useRef } from 'react';
import { isSoundOn } from '../../audio/soundState.ts';

const HAMMER_SOUNDS_PATH = '/assets/hammer/sounds/';
export const HAMMER_SOUND_FILES: string[] = ['hammer1.mp3', 'hammer2.mp3', 'hammer3.mp3', 'hammer4.mp3'];

export function useHammerSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  // undefined = sin cargar · Promise = cargando · AudioBuffer = listo · null = no disponible
  const buffersRef = useRef(new Map<string, AudioBuffer | null | Promise<void>>());
  const lastFileRef = useRef<string | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }, []);

  // Descarga y decodifica un fichero una sola vez
  const load = useCallback((ctx: AudioContext, file: string) => {
    const buffers = buffersRef.current;
    if (buffers.has(file)) return;
    const promise = fetch(HAMMER_SOUNDS_PATH + file)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.arrayBuffer();
      })
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => {
        buffers.set(file, buffer);
      })
      .catch(() => {
        buffers.set(file, null); // falta o está corrupto: se usará el sonido sintético
      });
    buffers.set(file, promise);
  }, []);

  // Sonido sintético de respaldo (mientras carga un fichero o si no existe)
  const playSynthThud = useCallback((ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(170, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  }, []);

  // Elige un fichero al azar, evitando repetir el anterior
  const pickFile = useCallback((): string | null => {
    const candidates =
      HAMMER_SOUND_FILES.length > 1
        ? HAMMER_SOUND_FILES.filter((f) => f !== lastFileRef.current)
        : HAMMER_SOUND_FILES;
    const file = candidates[Math.floor(Math.random() * candidates.length)] ?? null;
    lastFileRef.current = file;
    return file;
  }, []);

  const playThud = useCallback(() => {
    if (!isSoundOn()) return; // silenciado desde SoundToggle
    try {
      const ctx = getCtx();
      if (!ctx) return;

      // Precarga todos los ficheros la primera vez que se golpea
      HAMMER_SOUND_FILES.forEach((f) => load(ctx, f));

      const file = pickFile();
      const entry = file ? buffersRef.current.get(file) : null;

      if (entry instanceof AudioBuffer) {
        const source = ctx.createBufferSource();
        source.buffer = entry;
        source.connect(ctx.destination);
        source.start();
      } else {
        playSynthThud(ctx);
      }
    } catch {
      // Ignorar si el navegador bloquea audio o falla
    }
  }, [getCtx, load, pickFile, playSynthThud]);

  return { playThud };
}
