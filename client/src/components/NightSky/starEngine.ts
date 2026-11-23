interface Star {
  x: number;
  y: number;
  size: number;
  maxBrightness: number;
  twinkleDepth: number;
  twinkleSpeed: number;
  twinklePhase: number;
  sprite: HTMLCanvasElement;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Sprite con degradado radial: se dibuja una vez y se reutiliza para todas las estrellas
function createStarSprite(rgbColor: string): HTMLCanvasElement {
  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = spriteCanvas.height = 64;
  const spriteContext = spriteCanvas.getContext('2d');
  if (!spriteContext) return spriteCanvas;

  const gradient = spriteContext.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, `rgba(${rgbColor},1)`);
  gradient.addColorStop(0.15, `rgba(${rgbColor},.7)`);
  gradient.addColorStop(0.4, `rgba(${rgbColor},.15)`);
  gradient.addColorStop(1, `rgba(${rgbColor},0)`);
  spriteContext.fillStyle = gradient;
  spriteContext.fillRect(0, 0, 64, 64);
  return spriteCanvas;
}

export function startNightSky(canvas: HTMLCanvasElement): () => void {
  const context = canvas.getContext('2d');
  if (!context) return () => {};

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let stars: Star[] = [];
  let animationFrameId = 0;

  const whiteStar = createStarSprite('255,255,255');
  const blueStar = createStarSprite('170,200,255');
  const yellowStar = createStarSprite('255,235,180');

  function createStar(): Star {
    // Pocas estrellas brillantes y muchas tenues: el brillo se reparte de forma desigual
    const brightnessLevel = Math.pow(Math.random(), 2.5);
    const colorRoll = Math.random();
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size: 2 + brightnessLevel * 9,
      maxBrightness: 0.25 + brightnessLevel * 0.75,
      twinkleDepth: randomBetween(0.3, 0.8),
      twinkleSpeed: randomBetween(0.6, 2.2),
      twinklePhase: randomBetween(0, Math.PI * 2),
      sprite: colorRoll < 0.65 ? whiteStar : colorRoll < 0.85 ? blueStar : yellowStar,
    };
  }

  function resizeCanvas(): void {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    context!.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const starCount = Math.round(Math.max(80, Math.min(400, (width * height) / 4500)));
    stars = [];
    for (let i = 0; i < starCount; i++) stars.push(createStar());
  }

  function drawFrame(timestamp: number): void {
    const ctx = context!;
    const seconds = timestamp / 1000;

    // Fondo: degradado del azul muy oscuro al azul noche
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#02030a');
    sky.addColorStop(0.7, '#070b1c');
    sky.addColorStop(1, '#0d1230');
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'lighter';
    for (const star of stars) {
      // Oscilación suave entre (1 - twinkleDepth) y 1 del brillo máximo
      const wave = 0.5 + 0.5 * Math.sin(seconds * star.twinkleSpeed + star.twinklePhase);
      const twinkle = 1 - star.twinkleDepth * wave;
      const alpha = prefersReducedMotion ? star.maxBrightness : star.maxBrightness * twinkle;
      const size = star.size * (0.9 + 0.1 * twinkle);

      ctx.globalAlpha = alpha;
      ctx.drawImage(star.sprite, star.x - size, star.y - size, size * 2, size * 2);
    }
    ctx.globalAlpha = 1;

    if (!prefersReducedMotion) {
      animationFrameId = requestAnimationFrame(drawFrame);
    }
  }

  function handleResize(): void {
    resizeCanvas();
    if (prefersReducedMotion) drawFrame(0);
  }

  window.addEventListener('resize', handleResize);
  resizeCanvas();
  animationFrameId = requestAnimationFrame(drawFrame);

  // Limpieza
  return () => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', handleResize);
  };
}