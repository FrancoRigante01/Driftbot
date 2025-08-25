export function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, isInvulnerable: boolean = false) {
  ctx.save();
  // Círculo principal (cuerpo metálico)
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, 2 * Math.PI);
  const grad = ctx.createRadialGradient(x + size / 2, y + size / 2, size * 0.2, x + size / 2, y + size / 2, size / 2);
  grad.addColorStop(0, '#e0e0e0'); // Centro claro
  grad.addColorStop(1, '#424242'); // Borde oscuro
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#1976d2'; // Azul oscuro para el borde
  ctx.stroke();

  // Antenas laterales
  ctx.beginPath();
  ctx.moveTo(x + size * 0.15, y + size / 2);
  ctx.lineTo(x, y + size * 0.15);
  ctx.moveTo(x + size * 0.85, y + size / 2);
  ctx.lineTo(x + size, y + size * 0.15);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#90caf9';
  ctx.stroke();

  // Visor horizontal
  ctx.beginPath();
  ctx.ellipse(x + size / 2, y + size * 0.58, size * 0.28, size * 0.13, 0, 0, 2 * Math.PI);
  ctx.fillStyle = '#1976d2';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#90caf9';
  ctx.stroke();

  // Reflejo en el visor
  ctx.beginPath();
  ctx.ellipse(x + size / 2, y + size * 0.58, size * 0.12, size * 0.05, 0, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fill();

  // Efecto de invulnerabilidad
  if (isInvulnerable) {
    // Aura de invulnerabilidad
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.8, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Brillo adicional
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.6, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 107, 107, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
} 