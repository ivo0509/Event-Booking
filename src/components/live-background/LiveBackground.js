import './LiveBackground.css';

const PALETTE = ['#7c5cff', '#5b8cff', '#34e5ff', '#ff5cc8'];

const ICON_TYPES = [
  'ticket',
  'calendar',
  'note',
  'pin',
  'star',
  'barChart',
  'lineChart',
];

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/* ---------- Icon drawing (centered at origin, unit ~ size) ---------- */

function drawTicket(ctx, s) {
  const w = s * 1.6;
  const h = s;
  const r = s * 0.18;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + r, -h / 2);
  ctx.lineTo(w / 2 - r, -h / 2);
  ctx.arc(w / 2, 0, r, -Math.PI / 2, Math.PI / 2, false);
  ctx.lineTo(-w / 2 + r, h / 2);
  ctx.arc(-w / 2, 0, r, Math.PI / 2, -Math.PI / 2, false);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.setLineDash([s * 0.12, s * 0.12]);
  ctx.moveTo(w * 0.16, -h / 2);
  ctx.lineTo(w * 0.16, h / 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawCalendar(ctx, s) {
  const w = s * 1.3;
  const h = s * 1.2;
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2 + h * 0.28);
  ctx.lineTo(w / 2, -h / 2 + h * 0.28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-w * 0.22, -h / 2 - s * 0.14);
  ctx.lineTo(-w * 0.22, -h / 2 + s * 0.1);
  ctx.moveTo(w * 0.22, -h / 2 - s * 0.14);
  ctx.lineTo(w * 0.22, -h / 2 + s * 0.1);
  ctx.stroke();
}

function drawNote(ctx, s) {
  ctx.beginPath();
  ctx.arc(-s * 0.35, s * 0.45, s * 0.28, 0, Math.PI * 2);
  ctx.moveTo(-s * 0.35 + s * 0.28, s * 0.45);
  ctx.lineTo(-s * 0.07, -s * 0.55);
  ctx.lineTo(s * 0.55, -s * 0.75);
  ctx.lineTo(s * 0.55, s * 0.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(s * 0.27, s * 0.15, s * 0.28, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPin(ctx, s) {
  ctx.beginPath();
  ctx.arc(0, -s * 0.1, s * 0.5, Math.PI * 0.15, Math.PI * 0.85, true);
  ctx.lineTo(0, s * 0.7);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -s * 0.1, s * 0.18, 0, Math.PI * 2);
  ctx.stroke();
}

function drawStar(ctx, s) {
  const spikes = 5;
  const outer = s * 0.6;
  const inner = s * 0.26;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / spikes) * i - Math.PI / 2;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawBarChart(ctx, s, t) {
  const bars = 4;
  const gap = s * 0.12;
  const barW = (s * 1.3 - gap * (bars - 1)) / bars;
  const baseX = -(s * 1.3) / 2;
  const baseY = s * 0.6;
  for (let i = 0; i < bars; i += 1) {
    const wave = (Math.sin(t * 0.002 + i * 0.9) + 1) / 2;
    const barH = s * 0.35 + wave * s * 0.75;
    const x = baseX + i * (barW + gap);
    ctx.strokeRect(x, baseY - barH, barW, barH);
  }
}

function drawLineChart(ctx, s, t) {
  const points = 6;
  const width = s * 1.5;
  const step = width / (points - 1);
  const startX = -width / 2;
  ctx.beginPath();
  for (let i = 0; i < points; i += 1) {
    const x = startX + i * step;
    const y = Math.sin(t * 0.0022 + i * 0.8) * s * 0.42;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  const headX = startX + width;
  const headY = Math.sin(t * 0.0022 + (points - 1) * 0.8) * s * 0.42;
  ctx.beginPath();
  ctx.arc(headX - step * 0, headY, s * 0.12, 0, Math.PI * 2);
  ctx.stroke();
}

function drawIcon(ctx, type, s, t) {
  switch (type) {
    case 'ticket':
      return drawTicket(ctx, s);
    case 'calendar':
      return drawCalendar(ctx, s);
    case 'note':
      return drawNote(ctx, s);
    case 'pin':
      return drawPin(ctx, s);
    case 'star':
      return drawStar(ctx, s);
    case 'barChart':
      return drawBarChart(ctx, s, t);
    case 'lineChart':
      return drawLineChart(ctx, s, t);
    default:
      return undefined;
  }
}

export function mountLiveBackground(container) {
  const wrapper = document.createElement('div');
  wrapper.className = 'eb-live-bg';
  wrapper.setAttribute('aria-hidden', 'true');
  wrapper.innerHTML = `
    <span class="eb-live-bg__orb eb-live-bg__orb--1"></span>
    <span class="eb-live-bg__orb eb-live-bg__orb--2"></span>
    <span class="eb-live-bg__orb eb-live-bg__orb--3"></span>
    <div class="eb-live-bg__grid"></div>
    <canvas class="eb-live-bg__canvas"></canvas>
    <div class="eb-live-bg__veil"></div>
  `;
  container.prepend(wrapper);

  const canvas = wrapper.querySelector('.eb-live-bg__canvas');
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let icons = [];
  let rafId = null;
  let running = true;

  function createParticles() {
    const count = Math.round(Math.min(90, Math.max(36, (width * height) / 26000)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: random(-0.25, 0.25),
      vy: random(-0.25, 0.25),
      r: random(0.6, 2.1),
    }));
  }

  function createIcons() {
    const count = Math.round(Math.min(22, Math.max(9, (width * height) / 105000)));
    icons = Array.from({ length: count }, () => ({
      type: pick(ICON_TYPES),
      x: Math.random() * width,
      y: Math.random() * height,
      vx: random(-0.16, 0.16),
      vy: random(-0.16, 0.16),
      size: random(20, 42),
      rot: random(0, Math.PI * 2),
      rotSpeed: random(-0.003, 0.003),
      color: pick(PALETTE),
      alpha: random(0.22, 0.5),
    }));
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = wrapper.clientWidth;
    height = wrapper.clientHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createParticles();
    createIcons();
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(180, 200, 255, 0.55)';
      ctx.fill();
    }

    const linkDist = 130;
    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < linkDist) {
          const opacity = (1 - dist / linkDist) * 0.28;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(124, 150, 255, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }

  function drawIcons(t) {
    for (let i = 0; i < icons.length; i += 1) {
      const icon = icons[i];
      icon.x += icon.vx;
      icon.y += icon.vy;
      icon.rot += icon.rotSpeed;

      const margin = 60;
      if (icon.x < -margin) icon.x = width + margin;
      if (icon.x > width + margin) icon.x = -margin;
      if (icon.y < -margin) icon.y = height + margin;
      if (icon.y > height + margin) icon.y = -margin;

      const pulse = 0.5 + 0.5 * Math.sin(t * 0.0015 + i);

      ctx.save();
      ctx.translate(icon.x, icon.y);
      ctx.rotate(icon.rot);
      ctx.globalAlpha = icon.alpha * (0.6 + pulse * 0.4);
      ctx.strokeStyle = icon.color;
      ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = icon.color;
      ctx.shadowBlur = 12;
      drawIcon(ctx, icon.type, icon.size, t);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function frame(t) {
    if (!running) return;
    ctx.clearRect(0, 0, width, height);
    drawParticles();
    drawIcons(t);
    rafId = window.requestAnimationFrame(frame);
  }

  function renderStaticFrame() {
    ctx.clearRect(0, 0, width, height);
    drawParticles();
    drawIcons(0);
  }

  const handleVisibility = () => {
    if (document.hidden) {
      running = false;
      if (rafId) window.cancelAnimationFrame(rafId);
    } else if (!reduceMotion) {
      running = true;
      rafId = window.requestAnimationFrame(frame);
    }
  };

  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (reduceMotion) renderStaticFrame();
  });

  resize();
  resizeObserver.observe(wrapper);
  document.addEventListener('visibilitychange', handleVisibility);

  if (reduceMotion) {
    renderStaticFrame();
  } else {
    rafId = window.requestAnimationFrame(frame);
  }

  return function destroy() {
    running = false;
    if (rafId) window.cancelAnimationFrame(rafId);
    resizeObserver.disconnect();
    document.removeEventListener('visibilitychange', handleVisibility);
    wrapper.remove();
  };
}
