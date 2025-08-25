import type { Enemy } from '../hooks/useEnemies'

export function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  if (enemy.isBoss) {
    drawBoss(ctx, enemy);
    return;
  }
  ctx.save();
  // Triángulo equilátero
  const x = enemy.x + enemy.size / 2;
  const y = enemy.y + enemy.size / 2;
  const r = enemy.size / 2;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI / 2) + (i * (2 * Math.PI / 3));
    const px = x + r * Math.cos(angle);
    const py = y + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#ff7043'; // Naranja
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#b71c1c'; // Rojo oscuro
  ctx.stroke();

  // Ojo grande
  ctx.beginPath();
  ctx.arc(x, y, r * 0.45, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#222';
  ctx.stroke();

  // Pupila
  ctx.beginPath();
  ctx.arc(x, y, r * 0.20, 0, 2 * Math.PI);
  ctx.fillStyle = '#222';
  ctx.fill();

  ctx.restore();
}

function drawBoss(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  ctx.save();
  
  const x = enemy.x + enemy.size / 2;
  const y = enemy.y + enemy.size / 2;
  const r = enemy.size / 2;
  
  // Aura de poder
  ctx.beginPath();
  ctx.arc(x, y, r * 1.2, 0, 2 * Math.PI);
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 6;
  ctx.setLineDash([10, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Cuerpo principal del boss (hexágono)
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 6) + (i * (2 * Math.PI / 6));
    const px = x + r * Math.cos(angle);
    const py = y + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#8b0000'; // Rojo muy oscuro
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ff0000'; // Rojo brillante
  ctx.stroke();
  
  // Ojos múltiples
  const eyePositions = [
    { x: x - r * 0.3, y: y - r * 0.3 },
    { x: x + r * 0.3, y: y - r * 0.3 },
    { x: x, y: y + r * 0.4 }
  ];
  
  eyePositions.forEach((pos) => {
    // Ojo
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r * 0.15, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.stroke();
    
    // Pupila
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r * 0.08, 0, 2 * Math.PI);
    ctx.fillStyle = '#000';
    ctx.fill();
  });
  
  // Efecto de energía
  ctx.beginPath();
  ctx.arc(x, y, r * 0.8, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  ctx.restore();
} 