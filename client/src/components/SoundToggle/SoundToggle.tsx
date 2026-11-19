import { useState } from 'react';
import './SoundToggle.css';

export default function SoundToggle() {
  const [on, setOn] = useState(false);

  // TODO: poner audio de ambiente. Reproducir/pausar aquí según el nuevo estado.
  function toggle() {
    setOn((prev) => !prev);
  }

  return (
    <button
      className="sound"
      type="button"
      aria-pressed={on}
      aria-label={on ? 'Desactivar música de fondo' : 'Activar música de fondo'}
      onClick={toggle}
    >
      <svg
        className="on"
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
        className="off"
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
