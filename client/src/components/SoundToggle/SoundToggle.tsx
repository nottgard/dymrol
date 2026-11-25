import { useEffect } from 'react';
import { setSoundOn, syncAudioElements, useSoundOn } from '../../audio/soundState.ts';

export default function SoundToggle() {
  const on = useSoundOn();

  // Silencia/activa todas las etiquetas <audio> de la página (las del martillo se controlan en useHammerSound)
  useEffect(() => syncAudioElements(), []);

  function toggle() {
    setSoundOn(!on);
  }

  return (
    <button
      className="group fixed z-2 right-[calc(1rem+env(safe-area-inset-right,0px))] top-[calc(1rem+env(safe-area-inset-bottom,0px))] size-11 p-0 grid place-items-center bg-transparent border-0 cursor-pointer text-white/70 [filter:drop-shadow(0_0_6px_rgba(0,0,0,0.6))] transition-[color,transform] duration-200 ease-in-out [-webkit-tap-highlight-color:transparent] hover:text-white hover:scale-[1.08] focus-visible:outline-2 focus-visible:outline-white/70 focus-visible:outline-offset-2 focus-visible:rounded-md"
      type="button"
      aria-pressed={on}
      aria-label={on ? 'Silenciar sonido' : 'Activar sonido'}
      onClick={toggle}
    >
      <svg
        className="size-6.5 hidden group-aria-pressed:block"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 9v6h4l5 4V5L7 9H3z" fill="currentColor" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
      <svg
        className="size-6.5 block group-aria-pressed:hidden"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 9v6h4l5 4V5L7 9H3z" fill="currentColor" />
        <path d="M3 3l18 18" />
      </svg>
    </button>
  );
}
