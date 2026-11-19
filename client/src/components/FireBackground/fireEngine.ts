interface Flame {
  x: number;
  progress: number; // 0 = recién nacida, 1 = se apaga
  speed: number;
  size: number;
  riseDistance: number;
  swaySpeed: number;
  swayPhase: number;
}

interface Ember {
  baseX: number;
  y: number;
  riseSpeed: number;
  swayWidth: number;
  swayPhase: number;
  radius: number;
}

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

// Crea un sprite circular con degradado radial (centro brillante, bordes transparentes)
function createGlowSprite(rgbColor: string): HTMLCanvasElement {
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 64;
  const ctx = sprite.getContext('2d')!;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, `rgba(${rgbColor},.8)`);
  gradient.addColorStop(0.4, `rgba(${rgbColor},.5)`);
  gradient.addColorStop(1, `rgba(${rgbColor},0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return sprite;
}

/**
 * Anima fuego y ascuas sobre el canvas. Devuelve una función para detenerlo.
 */
export function startFire(canvas: HTMLCanvasElement, prefersReducedMotion: boolean): () => void {
  const context = canvas.getContext('2d')!;

  const hotGlow = createGlowSprite('255,225,140'); // amarillo claro (base de la llama)
  const mediumGlow = createGlowSprite('255,120,20'); // naranja (zona media)
  const coolGlow = createGlowSprite('190,30,5'); // rojo oscuro (punta de la llama)

  let width = 0;
  let height = 0;
  let flames: Flame[] = [];
  let embers: Ember[] = [];
  let lastTimestamp = 0;
  let frameId = 0;

  function createFlame(isInitial: boolean): Flame {
    return {
      x: Math.random() * width,
      progress: isInitial ? Math.random() : 0,
      speed: randomBetween(0.25, 0.6),
      size: randomBetween(80, 190) * Math.min(1.4, Math.max(0.7, height / 800)),
      riseDistance: randomBetween(0.18, 0.4) * height,
      swaySpeed: randomBetween(0.6, 1.4),
      swayPhase: randomBetween(0, 6.28),
    };
  }

  function createEmber(isInitial: boolean): Ember {
    return {
      baseX: randomBetween(0, width),
      y: isInitial ? randomBetween(height * 0.4, height) : height + 10,
      riseSpeed: randomBetween(25, 70),
      swayWidth: randomBetween(8, 30),
      swayPhase: randomBetween(0, 6.28),
      radius: randomBetween(1, 2.4),
    };
  }

  function resizeCanvas() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    // NOTA: tal como estaba en el HTML original, Math.min(0, ...) hace que siempre sea 0
    // (no se dibujan llamas, solo resplandor y ascuas). Cambia a Math.min(<máx>, ...) para activarlas.
    const flameCount = Math.round(Math.min(0, Math.max(2, width / 12)));
    flames = Array.from({ length: flameCount }, () => createFlame(true));
    embers = Array.from({ length: 40 }, () => createEmber(true));
  }

  function drawFrame(timestamp: number) {
    const deltaSeconds = Math.min((timestamp - lastTimestamp) / 1000 || 0, 0.05);
    lastTimestamp = timestamp;

    // Fondo negro
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'lighter';

    // Resplandor base
    const flicker = 0.25 + 0.15 * Math.sin(timestamp / 130) * Math.sin(timestamp / 370 + 1);
    context.globalAlpha = 1;

    const radialGlow = context.createRadialGradient(
      width / 2,
      height * 1.05,
      0,
      width / 2,
      height * 1.05,
      Math.max(width, height) * 0.8,
    );
    radialGlow.addColorStop(0, `rgba(255,110,20,${0.5 * flicker})`);
    radialGlow.addColorStop(0.4, `rgba(190,45,10,${0.25 * flicker})`);
    radialGlow.addColorStop(1, 'rgba(120,10,0,0)');
    context.fillStyle = radialGlow;
    context.fillRect(0, 0, width, height);

    const bottomGlow = context.createLinearGradient(0, height, 0, height * 0.6);
    bottomGlow.addColorStop(0, `rgba(255,90,10,${0.35 * flicker})`);
    bottomGlow.addColorStop(1, 'rgba(255,60,0,0)');
    context.fillStyle = bottomGlow;
    context.fillRect(0, height * 0.6, width, height * 0.4);

    // Llamas
    for (const flame of flames) {
      if (!prefersReducedMotion) flame.progress += deltaSeconds * flame.speed;
      if (flame.progress >= 1) Object.assign(flame, createFlame(false));

      const progress = flame.progress;
      const flameX =
        flame.x + Math.sin((timestamp / 600) * flame.swaySpeed + flame.swayPhase) * 22 * progress;
      const flameY = height + 10 - progress * flame.riseDistance;
      const flameSize = flame.size * (1 - 0.55 * progress);
      const flameAlpha =
        (progress < 0.15 ? progress / 0.15 : 1 - (progress - 0.15) / 0.85) * 0.32 * flicker;

      context.globalAlpha = Math.max(0, flameAlpha);
      const sprite = progress < 0.3 ? hotGlow : progress < 0.65 ? mediumGlow : coolGlow;
      context.drawImage(
        sprite,
        flameX - flameSize / 2,
        flameY - flameSize * 0.75,
        flameSize,
        flameSize * 1.5,
      );
    }

    // Ascuas
    for (const ember of embers) {
      if (!prefersReducedMotion) ember.y -= ember.riseSpeed * deltaSeconds;
      if (ember.y < -10) Object.assign(ember, createEmber(false));

      const emberX =
        ember.baseX + Math.sin((timestamp / 1000) * 1.2 + ember.swayPhase) * ember.swayWidth;
      context.globalAlpha = Math.max(0, ember.y / height - 0.1) * 0.9;
      context.drawImage(
        mediumGlow,
        emberX - ember.radius * 5,
        ember.y - ember.radius * 5,
        ember.radius * 10,
        ember.radius * 10,
      );
      context.drawImage(
        hotGlow,
        emberX - ember.radius,
        ember.y - ember.radius,
        ember.radius * 2,
        ember.radius * 2,
      );
    }

    context.globalAlpha = 1;
    if (!prefersReducedMotion) frameId = requestAnimationFrame(drawFrame);
  }

  function handleResize() {
    resizeCanvas();
    if (prefersReducedMotion) drawFrame(0);
  }

  window.addEventListener('resize', handleResize);
  resizeCanvas();
  frameId = requestAnimationFrame(drawFrame);

  return () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener('resize', handleResize);
  };
}
