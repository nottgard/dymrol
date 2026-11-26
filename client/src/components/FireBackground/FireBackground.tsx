import { useEffect, useRef } from 'react';
import { startFire } from './fireEngine.ts';

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
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full block pointer-events-none" aria-hidden="true" />
      <div className="fixed inset-0 pointer-events-none mix-blend-screen animate-flicker bg-[linear-gradient(to_top,rgba(255,85,10,0.28),rgba(255,60,0,0.2)_10%,transparent_65%)]" aria-hidden="true" />
    </>
  );
}
