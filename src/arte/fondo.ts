import { AJUSTES } from '../config/ajustes';
import { COLOR } from '../config/tema';
import { lienzoCache } from '../motor/lienzo';
import type { Geometria } from '../motor/geometria';
import { granular, vinetear } from './estilo';

/**
 * La carretera de la que salen los monstruos. Antes eran dos rectangulos
 * planos; ahora es el mismo tipo de dibujo que el coche y la pistola: cielo
 * degradado con bruma en el horizonte, asfalto gastado con grano y rodadas,
 * y los bordes cerrados por una vineta.
 *
 * Nada de eso cambia mientras se juega, asi que la escena entera se pinta una
 * vez por tamano de pantalla en un canvas aparte. Por frame es **una sola
 * copia**: sale mas barato que los dos rellenos y el degradado de antes.
 */
export class Fondo {
  private cache: HTMLCanvasElement | null = null;
  private ancho = 0;
  private alto = 0;

  rehacer(g: Geometria, dpr: number): void {
    const { canvas, ctx } = lienzoCache(g.ancho, g.alto, dpr);
    pintarEscenario(ctx, g);
    this.cache = canvas;
    this.ancho = g.ancho;
    this.alto = g.alto;
  }

  dibujar(ctx: CanvasRenderingContext2D): void {
    if (!this.cache) return;
    ctx.drawImage(this.cache, 0, 0, this.ancho, this.alto);
  }
}

/**
 * El cielo y el asfalto de un nivel, en la caja que se le diga. Lo usa el
 * fondo de la partida, el hueco del porton del taller —para que lo que se ve
 * al abrirse sea exactamente la calle que viene despues— y la carretera del
 * nivel 2.
 *
 * `conRodadas` se apaga cuando la calzada se mueve: las rodadas van pintadas
 * en el cache, y una calzada que se desplaza al girar el volante con unas
 * rodadas clavadas en su sitio se nota al instante.
 */
export function pintarCalle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  horizonte: number,
  conRodadas = true,
): void {
  const c = COLOR.escenario;

  const cielo = ctx.createLinearGradient(0, y, 0, horizonte);
  cielo.addColorStop(0, c.cieloAlto);
  cielo.addColorStop(0.62, c.cieloMedio);
  cielo.addColorStop(1, c.cieloBajo);
  ctx.fillStyle = cielo;
  ctx.fillRect(x, y, ancho, horizonte - y);

  // Bruma: la distancia se hace con esto, no con mas detalle
  const altoBruma = (horizonte - y) * 0.32;
  if (altoBruma > 0) {
    const bruma = ctx.createLinearGradient(0, horizonte - altoBruma, 0, horizonte);
    bruma.addColorStop(0, 'rgba(194, 207, 214, 0)');
    bruma.addColorStop(1, c.bruma);
    ctx.fillStyle = bruma;
    ctx.fillRect(x, horizonte - altoBruma, ancho, altoBruma);
  }

  const fondo = y + alto - horizonte;
  const asfalto = ctx.createLinearGradient(0, horizonte, 0, y + alto);
  asfalto.addColorStop(0, c.asfaltoLejos);
  asfalto.addColorStop(0.45, c.asfaltoMedio);
  asfalto.addColorStop(1, c.asfaltoCerca);
  ctx.fillStyle = asfalto;
  ctx.fillRect(x, horizonte, ancho, fondo);

  // Rodadas: dos bandas gastadas que se juntan en el horizonte. Es lo que
  // hace que el suelo se lea como una calzada y no como una pared tumbada.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, horizonte, ancho, fondo);
  ctx.clip();
  // Van desvanecidas: si llegan enteras al horizonte parecen focos de luz.
  if (conRodadas) {
    const gastado = ctx.createLinearGradient(0, horizonte, 0, y + alto);
    gastado.addColorStop(0, c.rodadaSuave);
    gastado.addColorStop(1, c.rodada);
    ctx.fillStyle = gastado;
    const centro = x + ancho / 2;
    for (const lado of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(centro + lado * ancho * 0.015, horizonte);
      ctx.lineTo(centro + lado * ancho * 0.04, horizonte);
      ctx.lineTo(centro + lado * ancho * 0.5, y + alto);
      ctx.lineTo(centro + lado * ancho * 0.28, y + alto);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Grano: gravilla clara y picadura oscura, siempre en el mismo sitio
  const gr = AJUSTES.estilo.grano;
  granular(
    ctx,
    x,
    horizonte,
    ancho,
    fondo,
    [c.granoClaro, c.granoOscuro, c.granoOscuro],
    gr.densidadAsfalto,
    0x5a1ce7,
  );
  ctx.restore();

  // La linea del horizonte, de tinta: separa los dos mundos de un tajo
  ctx.fillStyle = c.horizonte;
  ctx.fillRect(x, horizonte - 1, ancho, Math.max(1.5, alto * 0.003));
}

function pintarEscenario(ctx: CanvasRenderingContext2D, g: Geometria): void {
  pintarCalle(ctx, 0, 0, g.ancho, g.alto, g.horizonte);
  vinetear(ctx, g.ancho, g.alto, COLOR.escenario.vineta, COLOR.escenario.vinetaSuave);
}
