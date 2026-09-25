import { AJUSTES } from '../config/ajustes';
import { COLOR } from '../config/tema';
import { lienzoCache } from '../motor/lienzo';
import type { GeometriaConduccion } from '../motor/geometria';
import { pintarCalle } from './fondo';

/**
 * La calzada vista desde el asiento del conductor. Es la misma calle del
 * nivel 1 —el mismo cielo, el mismo asfalto y el mismo grano— con dos
 * diferencias: se mueve y se desplaza al girar el volante.
 *
 * Lo que no cambia (cielo, asfalto, grano, linea del horizonte) va en un
 * cache y se copia de una vez. Lo unico que se pinta por frame son las
 * marcas viales, que son cuatro trapecios y un punado de rayas: es lo que
 * lleva toda la sensacion de velocidad y de direccion, y sale casi gratis.
 */
export class Carretera {
  private cache: HTMLCanvasElement | null = null;
  private ancho = 0;
  private alto = 0;

  rehacer(g: GeometriaConduccion, dpr: number): void {
    const { canvas, ctx } = lienzoCache(g.ancho, g.alto, dpr);
    // Sin rodadas: van clavadas en el cache y aqui la calzada se mueve.
    pintarCalle(ctx, 0, 0, g.ancho, g.alto, g.horizonte, false);
    this.cache = canvas;
    this.ancho = g.ancho;
    this.alto = g.alto;
  }

  /**
   * @param cocheU    Posicion del coche a lo ancho de la calzada.
   * @param recorrido Distancia recorrida, en avances. Solo cuenta su parte
   *                  decimal: es lo que hace que las rayas corran.
   */
  dibujar(
    ctx: CanvasRenderingContext2D,
    g: GeometriaConduccion,
    cocheU: number,
    recorrido: number,
  ): void {
    if (this.cache) ctx.drawImage(this.cache, 0, 0, this.ancho, this.alto);

    const m = AJUSTES.conduccion.marcas;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, g.horizonte, g.ancho, g.alto - g.horizonte);
    ctx.clip();

    // Los arcenes: dos bandas continuas que se juntan en el horizonte.
    ctx.fillStyle = COLOR.conduccion.arcen;
    for (const lado of [-1, 1]) {
      banda(ctx, g, cocheU, lado, m.anchoArcen, m.desdeElHorizonte, 1);
    }

    // La discontinua del centro. Las rayas van repartidas en avance, no en
    // pantalla: asi la perspectiva las junta sola al fondo, que es lo que
    // hace que se lea la velocidad.
    ctx.fillStyle = COLOR.conduccion.linea;
    const paso = 1 / m.tramos;
    const fase = recorrido % paso;
    for (let i = 0; i < m.tramos; i++) {
      const a0 = m.desdeElHorizonte + i * paso + fase;
      const a1 = a0 + paso * m.largoRaya;
      if (a0 >= 1) continue;
      banda(ctx, g, cocheU, 0, m.anchoLinea, a0, Math.min(1, a1));
    }
    ctx.restore();
  }
}

/**
 * Un trapecio pegado a la calzada entre dos avances. Se calcula a mano y no
 * con `proyectarConduccion` porque hacen falta los dos bordes, y llamar dos
 * veces por esquina seria el doble de trabajo por raya.
 */
function banda(
  ctx: CanvasRenderingContext2D,
  g: GeometriaConduccion,
  cocheU: number,
  u: number,
  semiancho: number,
  a0: number,
  a1: number,
): void {
  const { curva, escalaMinima } = AJUSTES.proyeccion;
  const q0 = Math.pow(a0, curva);
  const q1 = Math.pow(a1, curva);
  const k0 = escalaMinima + (1 - escalaMinima) * q0;
  const k1 = escalaMinima + (1 - escalaMinima) * q1;
  const y0 = g.horizonte + (g.yFinal - g.horizonte) * q0;
  const y1 = g.horizonte + (g.yFinal - g.horizonte) * q1;
  const c0 = g.fugaX + (u - cocheU) * g.mediaCalzada * k0;
  const c1 = g.fugaX + (u - cocheU) * g.mediaCalzada * k1;
  const s0 = semiancho * g.mediaCalzada * k0;
  const s1 = semiancho * g.mediaCalzada * k1;

  ctx.beginPath();
  ctx.moveTo(c0 - s0, y0);
  ctx.lineTo(c0 + s0, y0);
  ctx.lineTo(c1 + s1, y1);
  ctx.lineTo(c1 - s1, y1);
  ctx.closePath();
  ctx.fill();
}
