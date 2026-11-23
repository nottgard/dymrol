import { useEffect, useRef } from 'react';
import './NightSky.css';
import { startNightSky } from './starEngine';

export default function NightSky() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        return startNightSky(canvas);
        }, []);

        return (
        <>
            <canvas ref={canvasRef} className="nightSky-bg__canvas" aria-hidden="true" />
        </>
        );
}