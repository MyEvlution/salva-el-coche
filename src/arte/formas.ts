export const TAU = Math.PI * 2;

/** Rectangulo de esquinas redondeadas, sin depender de `roundRect`. */
export function rectRedondeado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  radio: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radio, y);
  ctx.arcTo(x + ancho, y, x + ancho, y + alto, radio);
  ctx.arcTo(x + ancho, y + alto, x, y + alto, radio);
  ctx.arcTo(x, y + alto, x, y, radio);
  ctx.arcTo(x, y, x + ancho, y, radio);
  ctx.closePath();
}

/** Color `rgba()` a partir de un triplete "r, g, b" del tema y un alfa. */
export function conAlfa(rgb: string, alfa: number): string {
  return `rgba(${rgb}, ${alfa})`;
}
