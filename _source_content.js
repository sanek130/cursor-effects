(function () {
  if (window.__CE_LOADED__) return;
  window.__CE_LOADED__ = true;

  if (
    window.location.protocol === 'file:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    return;
  }

  const EFFECTS = {
    'Party Confetti': {
      name: 'Party Confetti',
      colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00'],
      shape: 'square',
      text: '01',
      config: { gravity: 0.1, spread: 1, speed: 5, decay: 0.02, friction: 0.99, count: 8, size: { min: 4, max: 8 } },
    },
    'Fireworks': {
      name: 'Fireworks',
      colors: ['#ff0000', '#ffd700'],
      shape: 'circle',
      text: '01',
      config: { gravity: 0.05, speed: 10, decay: 0.03, friction: 0.92, count: 30, size: { min: 2, max: 4 } },
    },
    'Matrix Code': {
      name: 'Matrix Code',
      colors: ['#00ff00'],
      shape: 'text',
      text: '01',
      config: { gravity: 0.2, speed: 0, decay: 0.02, friction: 0.99, count: 8, size: { min: 2, max: 4 } },
    },
    'Soft Snow': {
      name: 'Soft Snow',
      colors: ['#ffffff'],
      shape: 'circle',
      text: '01',
      config: { gravity: 0.02, speed: 1, decay: 0.02, friction: 0.99, count: 8, size: { min: 2, max: 4 } },
    },
  };

  const COLORS = [
    { name: 'Red', val: ['#ff4d4d', '#ff0000'] },
    { name: 'Orange', val: ['#ff9f43', '#ff6b6b'] },
    { name: 'Yellow', val: ['#feca57', '#ff9f43'] },
    { name: 'Green', val: ['#1dd1a1', '#10ac84'] },
    { name: 'Cyan', val: ['#00d2d3', '#01a3a4'] },
    { name: 'Blue', val: ['#54a0ff', '#2e86de'] },
    { name: 'Purple', val: ['#5f27cd', '#341f97'] },
    { name: 'Pink', val: ['#ff9ff3', '#f368e0'] },
    { name: 'White', val: ['#ffffff', '#c8d6e5'] },
    { name: 'Dark', val: ['#576574', '#222f3e'] },
    { name: 'Neon', val: ['#00ff00', '#ff00ff'] },
    { name: 'Gold', val: ['#ffd700', '#ffa500'] },
  ];
  const SHAPES = [
    { name: 'Circle', type: 'circle' },
    { name: 'Square', type: 'square' },
    { name: 'Triangle', type: 'triangle' },
    { name: 'Star', type: 'star' },
    { name: 'Heart', type: 'heart' },
  ];
  const BEHAVIORS = [
    { name: 'Gravity', config: { gravity: 0.15, vy: -3, friction: 0.99 } },
    { name: 'Float', config: { gravity: -0.05, vy: 1, friction: 0.98 } },
    { name: 'Explode', config: { gravity: 0.05, speed: 8, friction: 0.92 } },
    { name: 'Swarm', config: { gravity: 0, speed: 2, friction: 1, wander: 0.5 } },
  ];

  function buildGeneratedEffect(name) {
    const parts = String(name).split(' ').filter(Boolean);
    if (parts.length < 3) return null;

    const colorName = parts[0];
    const shapeName = parts[1];
    const behaviorName = parts.slice(2).join(' ');

    const col = COLORS.find((c) => c.name === colorName);
    const shape = SHAPES.find((s) => s.name === shapeName);
    const beh = BEHAVIORS.find((b) => b.name === behaviorName);
    if (!col || !shape || !beh) return null;

    const cfg = { ...beh.config };
    return {
      name,
      colors: col.val,
      shape: shape.type,
      text: '01',
      config: {
        gravity: cfg.gravity !== undefined ? cfg.gravity : 0.15,
        speed: cfg.speed !== undefined ? cfg.speed : 5,
        decay: cfg.decay !== undefined ? cfg.decay : 0.02,
        friction: cfg.friction !== undefined ? cfg.friction : 0.99,
        count: cfg.count !== undefined ? cfg.count : 8,
        size: cfg.size || { min: 2, max: 4 },
      },
    };
  }

  const canvas = document.createElement('canvas');
  canvas.id = '__ce_ext_particles';
  canvas.style.cssText = `
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none; z-index: 2147483640;
    visibility: hidden;
  `;
  document.documentElement.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let particles = [];
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  function getBrightness(hex) {
    if (!hex || hex.length < 7) return 0;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  }

  function getAdaptedConfig(effect) {
    let finalColors = effect.colors || (isDark ? ['#ffffff'] : ['#000000']);
    if (isDark && finalColors.every((c) => getBrightness(c) < 128)) finalColors = ['#ffffff'];
    if (!isDark && finalColors.every((c) => getBrightness(c) >= 128)) finalColors = ['#000000'];

    return {
      count: effect.config?.count || 8,
      speed: effect.config?.speed || 5,
      gravity: effect.config?.gravity !== undefined ? effect.config.gravity : 0.15,
      decay: effect.config?.decay || 0.02,
      friction: effect.config?.friction || 0.99,
      sizeMin: effect.config?.size?.min || 2,
      sizeMax: effect.config?.size?.max || 4,
      shape: effect.shape || 'circle',
      text: effect.text || '01',
      colors: finalColors,
    };
  }

  let currentConfig = null;

  function resolveEffectByName(name) {
    if (!name) return null;
    if (EFFECTS[name]) return EFFECTS[name];
    const generated = buildGeneratedEffect(name);
    if (generated) return generated;
    return null;
  }

  function setFromStoredName() {
    if (typeof chrome === 'undefined' || !chrome.storage) return;
    chrome.storage.local.get(['ce_effect_name'], (result) => {
      const name = result.ce_effect_name;
      const effect = resolveEffectByName(name);
      if (effect) {
        currentConfig = getAdaptedConfig(effect);
      } else {
        currentConfig = getAdaptedConfig({
          name: 'Классические частицы',
          colors: ['#ffffff'],
          shape: 'circle',
          text: '01',
          config: { gravity: 0.15, speed: 5, decay: 0.02, friction: 0.99, count: 8, size: { min: 2, max: 4 } },
        });
      }
    });
  }

  if (typeof chrome !== 'undefined' && chrome.storage) {
    setFromStoredName();

    chrome.storage.onChanged.addListener((changes) => {
      if (changes.ce_effect_name) {
        setFromStoredName();
      }
    });
  }

  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || !currentConfig) return;
    canvas.style.visibility = 'visible';

    for (let i = 0; i < currentConfig.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * currentConfig.speed + 1;

      particles.push({
        x: e.clientX,
        y: e.clientY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: currentConfig.decay,
        size: Math.random() * (currentConfig.sizeMax - currentConfig.sizeMin) + currentConfig.sizeMin,
        color: currentConfig.colors[Math.floor(Math.random() * currentConfig.colors.length)],
        gravity: currentConfig.gravity,
        friction: currentConfig.friction,
        shape: currentConfig.shape,
        text: currentConfig.text,
      });
    }
  });

  function animate() {
    if (particles.length > 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.life -= p.decay;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        alive = true;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();

        if (p.shape === 'square') {
          ctx.rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        } else if (p.shape === 'triangle') {
          ctx.moveTo(p.x, p.y - p.size);
          ctx.lineTo(p.x + p.size, p.y + p.size);
          ctx.lineTo(p.x - p.size, p.y + p.size);
          ctx.closePath();
        } else if (p.shape === 'star') {
          const spikes = 5;
          const outerRadius = p.size;
          const innerRadius = p.size / 2;
          let rot = (Math.PI / 2) * 3;
          ctx.moveTo(p.x, p.y - outerRadius);
          for (let j = 0; j < spikes; j++) {
            const x1 = p.x + Math.cos(rot) * outerRadius;
            const y1 = p.y + Math.sin(rot) * outerRadius;
            ctx.lineTo(x1, y1);
            rot += Math.PI / spikes;
            const x2 = p.x + Math.cos(rot) * innerRadius;
            const y2 = p.y + Math.sin(rot) * innerRadius;
            ctx.lineTo(x2, y2);
            rot += Math.PI / spikes;
          }
          ctx.lineTo(p.x, p.y - outerRadius);
          ctx.closePath();
        } else if (p.shape === 'text') {
          ctx.font = `${p.size * 4}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.text, p.x, p.y);
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      if (!alive) canvas.style.visibility = 'hidden';
    }
    requestAnimationFrame(animate);
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  animate();
})();
