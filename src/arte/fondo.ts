import { COLOR } from '../config/tema';
import type { Geometria } from '../motor/geometria';

/**
 * Cielo y suelo. Son dos rectangulos, pero el degradado se crea una sola vez
 * por tamano de pantalla: crearlo por frame es caro y no se nota en nada.
 */
export class Fondo {
  private degradado: CanvasGradient | null = null;

  rehacer(ctx: CanvasRenderingContext2D, g: Geometria): void {
    const grad = ctx.createLinearGradient(0, g.horizonte, 0, g.alto);
    grad.addColorStop(0, COLOR.escenario.sueloAlto);
    grad.addColorStop(1, COLOR.escenario.sueloBajo);
    this.degradado = grad;
  }

  dibujar(ctx: CanvasRenderingContext2D, g: Geometria): void {
    ctx.fillStyle = COLOR.escenario.cielo;
    ctx.fillRect(0, 0, g.ancho, g.horizonte);
    ctx.fillStyle = this.degradado ?? COLOR.escenario.sueloBajo;
    ctx.fillRect(0, g.horizonte, g.ancho, g.alto - g.horizonte);
  }
}
