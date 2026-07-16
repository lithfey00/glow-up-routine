const CONFETTI_COLORS = [
  '#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#fb923c', '#f87171', '#c084fc',
];

export function triggerConfetti(count = 50) {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const size = Math.random() * 8 + 6;
    const left = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const duration = Math.random() * 1.5 + 2;
    const isCircle = Math.random() > 0.5;

    piece.style.cssText = `position:absolute;left:${left}%;top:-20px;width:${size}px;height:${size}px;background:${color};border-radius:${isCircle ? '50%' : '2px'};animation:confetti-fall ${duration}s linear ${delay}s forwards;`;
    container.appendChild(piece);
  }

  setTimeout(() => {
    container.remove();
  }, 4000);
}
