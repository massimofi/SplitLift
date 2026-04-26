// Throws a quick burst of confetti from the bottom of the given element.
// Uses CSS animation defined in index.css under .confetti-stage / .confetti-piece.

export function fireConfetti(target) {
  if (!target) return;
  const colors = ['#5B5BFF','#9B5BFF','#C09BFF','#8C8CFF','#19B6FF','#FF6BD6'];
  const stage = document.createElement('div');
  stage.className = 'confetti-stage';
  target.appendChild(stage);
  const n = 60;
  for (let i = 0; i < n; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const angle = -Math.PI/2 + (Math.random() - 0.5) * Math.PI * 0.7;
    const v = 220 + Math.random() * 200;
    const dx = Math.cos(angle) * v;
    piece.style.left = (40 + Math.random()*20) + '%';
    piece.style.top = '60%';
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty('--dx', dx + 'px');
    piece.style.setProperty('--rot', (Math.random()*720 - 360) + 'deg');
    piece.style.animationDelay = (Math.random() * 200) + 'ms';
    piece.style.animationDuration = (1400 + Math.random()*900) + 'ms';
    piece.style.width = (6 + Math.random()*6) + 'px';
    piece.style.height = (10 + Math.random()*10) + 'px';
    stage.appendChild(piece);
  }
  setTimeout(() => stage.remove(), 2400);
}
