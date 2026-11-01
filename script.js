// Растягиваем большое слово на всю ширину блока, но не выше лимита по высоте экрана
function fitBigWord() {
  document.querySelectorAll('.fit').forEach((line) => {
    const width = line.parentElement.clientWidth;
    const maxSize = window.innerHeight * 0.95;
    line.style.fontSize = '100px';
    const size = Math.min((100 * width) / line.scrollWidth, maxSize);
    line.style.fontSize = size + 'px';
  });
}

// Сцена появляется, когда шрифты готовы, — чтобы EVENT не прыгал при подгонке размера
document.fonts.ready.then(() => {
  fitBigWord();
  document.documentElement.classList.add('is-ready');
});
window.addEventListener('resize', fitBigWord);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hero = document.getElementById('hero');

// Параллакс: прожектор, EVENT и фото чуть смещаются за курсором — сцена «дышит»
if (!reduceMotion) {
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 2 - 1).toFixed(3));
    hero.style.setProperty('--my', ((e.clientY - r.top) / r.height * 2 - 1).toFixed(3));
  });
}

// Пылинки в луче прожектора: медленно всплывают и мерцают
const dust = document.getElementById('heroDust');
const ctx = dust.getContext('2d');
let motes = [];

function resizeDust() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  dust.width = hero.clientWidth * ratio;
  dust.height = hero.clientHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const count = hero.clientWidth < 760 ? 35 : 70;
  motes = Array.from({ length: count }, () => newMote(true));
}

// пылинки рождаются внутри конуса света: чем ниже, тем шире луч
function newMote(anywhere) {
  const w = hero.clientWidth;
  const h = hero.clientHeight;
  const y = anywhere ? Math.random() * h : h + 10;
  const spread = 0.08 + 0.32 * (y / h);
  return {
    x: w / 2 + (Math.random() * 2 - 1) * spread * w,
    y,
    r: Math.random() * 1.6 + 0.4,
    speed: Math.random() * 0.25 + 0.08,
    drift: Math.random() * 0.3 - 0.15,
    phase: Math.random() * Math.PI * 2,
  };
}

function drawDust(t) {
  ctx.clearRect(0, 0, hero.clientWidth, hero.clientHeight);
  motes.forEach((m, i) => {
    m.y -= m.speed;
    m.x += m.drift + Math.sin(t / 2000 + m.phase) * 0.15;
    if (m.y < -10) motes[i] = newMote(false);
    const alpha = 0.25 + 0.35 * Math.sin(t / 900 + m.phase) ** 2;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 224, 190, ${alpha})`;
    ctx.fill();
  });
  requestAnimationFrame(drawDust);
}

if (!reduceMotion) {
  resizeDust();
  window.addEventListener('resize', resizeDust);
  requestAnimationFrame(drawDust);
}

// Карусель живых фото: стрелки, полоса прогресса и перетаскивание мышью
const track = document.getElementById('galleryTrack');
const bar = document.getElementById('galleryBar');

function updateBar() {
  const max = track.scrollWidth - track.clientWidth;
  const visible = track.clientWidth / track.scrollWidth;
  const done = max > 0 ? track.scrollLeft / max : 1;
  bar.style.width = (visible + (1 - visible) * done) * 100 + '%';
}

document.querySelectorAll('.gallery__btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    track.scrollBy({ left: track.clientWidth * 0.6 * Number(btn.dataset.dir), behavior: 'smooth' });
  });
});

let dragStartX = 0;
let dragStartScroll = 0;
track.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse') return; // на телефоне листаем пальцем как обычно
  track.classList.add('is-dragging');
  dragStartX = e.clientX;
  dragStartScroll = track.scrollLeft;
});
window.addEventListener('pointermove', (e) => {
  if (!track.classList.contains('is-dragging')) return;
  track.scrollLeft = dragStartScroll - (e.clientX - dragStartX);
});
window.addEventListener('pointerup', () => track.classList.remove('is-dragging'));

track.addEventListener('scroll', updateBar, { passive: true });
window.addEventListener('resize', updateBar);
track.querySelectorAll('img').forEach((img) => img.addEventListener('load', updateBar));
updateBar();
