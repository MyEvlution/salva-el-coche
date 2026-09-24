import { AJUSTES } from '../config/ajustes';
import { COLOR } from '../config/tema';
import type { Geometria } from '../motor/geometria';
import { TAU, conAlfa } from './formas';

/**
 * Aviso de que un monstruo esta a punto de llegar al coche: un halo que
 * parpadea alrededor del culpable y un borde rojo en la pantalla que aprieta
 * segun se acerca. Con `prefers-reduced-motion` el parpadeo se queda fijo.
 */
export class Aviso {
  private borde: CanvasGradient | null = null;

  rehacer(ctx: CanvasRenderingContext2D, g: Geometria): void {
    const centroX = g.ancho / 2;
    const centroY = g.alto / 2;
    const radio = Math.hypot(centroX, centroY);
    const grad = ctx.createRadialGradient(centroX, centroY, radio * 0.52, centroX, centroY, radio);
    grad.addColorStop(0, conAlfa(COLOR.efectos.aviso, 0));
    grad.addColorStop(1, conAlfa(COLOR.efectos.aviso, 1));
    this.borde = grad;
  }

  /** 0 = sin peligro; 1 = lo tienes encima. */
  static intensidad(avance: number): number {
    const { umbral } = AJUSTES.aviso;
    if (avance <= umbral) return 0;
    return Math.min(1, (avance - umbral) / (1 - umbral));
  }

  /** Latido comun a todos los avisos, para que parpadeen a la vez. */
  static latido(reloj: number, quieto: boolean): number {
    if (quieto) return 0.72;
    return 0.5 + 0.5 * Math.sin(reloj * TAU * AJUSTES.aviso.parpadeo);
  }

  halo(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radioX: number,
    radioY: number,
    intensidad: number,
    latido: number,
  ): void {
    const alfa = (0.35 + 0.5 * latido) * intensidad;
    ctx.strokeStyle = conAlfa(COLOR.efectos.aviso, alfa);
    ctx.lineWidth = AJUSTES.aviso.grosorHalo;
    ctx.beginPath();
    ctx.ellipse(x, y, radioX * (1.06 + 0.06 * latido), radioY * (1.06 + 0.06 * latido), 0, 0, TAU);
    ctx.stroke();
  }

  bordePantalla(ctx: CanvasRenderingContext2D, g: Geometria, intensidad: number, latido: number): void {
    if (intensidad <= 0 || !this.borde) return;
    ctx.globalAlpha = AJUSTES.aviso.alfaBorde * intensidad * (0.45 + 0.55 * latido);
    ctx.fillStyle = this.borde;
    ctx.fillRect(0, 0, g.ancho, g.alto);
    ctx.globalAlpha = 1;
  }
}
