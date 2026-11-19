import { useEffect, useRef } from 'react';
import { startFire } from './fireEngine.ts';
import './FireBackground.css';

export default function FireBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return startFire(canvas, reduced);
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="fire-bg__canvas" aria-hidden="true" />
      <div className="fire-bg__heat" aria-hidden="true" />
    </>
  );
}
