import { COLOR } from '../config/tema';
import { lienzoCache } from '../motor/lienzo';
import { TAU } from './formas';

/**
 * El monstruo del oxido: una mancha negra con bultos, dos ojos con tallos y
 * una boca naranja llena de dientes.
 *
 * El cuerpo (la parte cara: una bezier grande y doce circulos) se cachea a su
 * tamano maximo y luego solo se reduce, asi que nunca pierde nitidez. Ojos,
 * patas y boca se pintan en vivo porque se mueven.
 */

/** Medidas en unidades locales del dibujo, para el calculo de aciertos. */
export const MONSTRUO_LOCAL = { radioX: 105, radioY: 125, centroY: -105 };

const CACHE = { x: -120, y: -196, ancho: 240, alto: 212 };

const BULTOS: ReadonlyArray<readonly [number, number, number]> = [
  [-94, -40, 15],
  [-98, -78, 16],
  [-91, -112, 16],
  [-74, -141, 16],
  [-48, -162, 15],
  [94, -40, 15],
  [98, -78, 16],
  [91, -112, 16],
  [74, -141, 16],
  [48, -162, 15],
  [-18, -173, 14],
  [18, -173, 14],
];

export class Monstruo {
  private cache: HTMLCanvasElement | null = null;

  rehacer(escalaMaxima: number, dpr: number): void {
    const resolucion = Math.max(0.1, escalaMaxima) * dpr;
    const { canvas, ctx } = lienzoCache(CACHE.ancho, CACHE.alto, resolucion);
    ctx.translate(-CACHE.x, -CACHE.y);
    pintarCuerpo(ctx);
    this.cache = canvas;
  }

  /**
   * @param apertura  Altura de la boca abierta, en unidades locales.
   * @param anda      1 mientras camina, 0 cuando esta quieto.
   */
  dibujar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    escala: number,
    fase: number,
    apertura: number,
    anda: number,
    reloj: number,
  ): void {
    const t = reloj * 7 + fase;
    const brinco = anda * Math.abs(Math.sin(t)) * 8;
    const achata = 1 + anda * 0.035 * Math.sin(t * 2);

    ctx.fillStyle = COLOR.escenario.sombra;
    ctx.beginPath();
    ctx.ellipse(x, y + 3 * escala, 88 * escala, 13 * escala, 0, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.translate(x, y - brinco * escala);
    ctx.scale(escala * (2 - achata), escala * achata);

    // Tallos con ojos
    const vaiven1 = Math.sin(reloj * 3 + fase) * 7;
    const vaiven2 = Math.sin(reloj * 3.4 + fase + 2) * 7;
    ctx.strokeStyle = COLOR.monstruo.cuerpo;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-30, -160);
    ctx.quadraticCurveTo(-56 + vaiven1, -186, -62 + vaiven1 * 1.4, -212);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(30, -160);
    ctx.quadraticCurveTo(54 + vaiven2, -190, 60 + vaiven2 * 1.4, -218);
    ctx.stroke();
    pintarOjo(ctx, -62 + vaiven1 * 1.4, -214);
    pintarOjo(ctx, 60 + vaiven2 * 1.4, -220);

    // Patas
    const izquierda = anda * Math.max(0, Math.sin(t)) * 7;
    const derecha = anda * Math.max(0, Math.sin(t + Math.PI)) * 7;
    ctx.fillStyle = COLOR.monstruo.cuerpo;
    ctx.beginPath();
    ctx.ellipse(-40, -izquierda, 24, 10, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(40, -derecha, 24, 10, 0, 0, TAU);
    ctx.fill();

    if (this.cache) {
      ctx.drawImage(this.cache, CACHE.x, CACHE.y, CACHE.ancho, CACHE.alto);
    }

    pintarBoca(ctx, apertura);
    ctx.restore();
  }
}

/** Vaiven de la boca cuando el monstruo solo camina. */
export function aperturaNormal(reloj: number, fase: number): number {
  return 12 + 24 * (0.5 + 0.5 * Math.sin(reloj * 5 + fase * 1.7));
}

function pintarCuerpo(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = COLOR.monstruo.cuerpo;
  ctx.beginPath();
  ctx.moveTo(-88, -6);
  ctx.bezierCurveTo(-98, -70, -84, -150, -30, -172);
  ctx.bezierCurveTo(-8, -180, 18, -180, 40, -172);
  ctx.bezierCurveTo(88, -150, 100, -70, 88, -6);
  ctx.quadraticCurveTo(0, 10, -88, -6);
  ctx.closePath();
  ctx.fill();
  for (const [x, y, radio] of BULTOS) {
    ctx.beginPath();
    ctx.arc(x, y, radio, 0, TAU);
    ctx.fill();
  }
}

function pintarOjo(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = COLOR.monstruo.cuerpo;
  ctx.beginPath();
  ctx.arc(x, y, 17, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, TAU);
  ctx.clip();
  ctx.fillStyle = COLOR.monstruo.iris;
  ctx.beginPath();
  ctx.arc(x + 6, y + 3, 12, 0, TAU);
  ctx.fill();
  ctx.fillStyle = COLOR.monstruo.cuerpo;
  ctx.beginPath();
  ctx.arc(x + 1, y + 1, 12, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function pintarBoca(ctx: CanvasRenderingContext2D, apertura: number): void {
  const cy = -82;
  const rx = 58;
  const ry = apertura;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, cy, rx, ry, 0, 0, TAU);
  ctx.clip();
  ctx.fillStyle = COLOR.monstruo.boca;
  ctx.fillRect(-rx, cy - ry, rx * 2, ry * 2);
  ctx.fillStyle = COLOR.monstruo.garganta;
  ctx.beginPath();
  ctx.ellipse(0, cy + ry * 0.25, rx * 0.7, ry * 0.7, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = COLOR.monstruo.diente;
  const dientes = 7;
  for (let i = 0; i < dientes; i++) {
    const tx = -rx + (i + 0.5) * ((rx * 2) / dientes);
    const k = Math.sqrt(Math.max(0, 1 - (tx / rx) * (tx / rx))) * ry;
    ctx.beginPath();
    ctx.moveTo(tx - 8, cy - k - 4);
    ctx.lineTo(tx + 8, cy - k - 4);
    ctx.lineTo(tx, cy - k + 15);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tx - 8, cy + k + 4);
    ctx.lineTo(tx + 8, cy + k + 4);
    ctx.lineTo(tx, cy + k - 15);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
