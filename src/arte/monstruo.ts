import { AJUSTES } from '../config/ajustes';
import { COLOR } from '../config/tema';
import { lienzoCache } from '../motor/lienzo';
import { TAU } from './formas';
import { entintar, filoDeLuz, granular } from './estilo';

/**
 * El monstruo del oxido: una mancha negra con bultos, dos ojos con tallos y
 * una boca naranja llena de dientes.
 *
 * La silueta es la misma de siempre —el calculo de aciertos depende de ella—,
 * pero ya no es una mancha plana: lleva volumen, contorno de tinta, un filo de
 * luz frio en el lomo y grano, igual que el guante del dibujo de la pistola.
 * Ese filo no es un adorno: es lo que le separa del asfalto ahora que el
 * suelo tambien es oscuro.
 *
 * El cuerpo (la parte cara: una bezier grande, doce circulos, el grano y el
 * contorno) se cachea a su tamano maximo y luego solo se reduce, asi que
 * nunca pierde nitidez y no cuesta nada por frame. Ojos, patas y boca se
 * pintan en vivo porque se mueven, y por eso ahi no hay ni un degradado:
 * crearlos por frame y por monstruo seria el gasto mas tonto del juego.
 */

/** Medidas en unidades locales del dibujo, para el calculo de aciertos. */
export const MONSTRUO_LOCAL = { radioX: 105, radioY: 125, centroY: -105 };

/** Un poco mas ancha que la silueta: el contorno y el filo se salen de ella. */
const CACHE = { x: -126, y: -202, ancho: 252, alto: 224 };

/** Referencia para los grosores de tinta, en unidades locales. */
const TAMANO = 210;

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
  /** Tamano del que esta encima del coche: la referencia del nivel de detalle. */
  private escalaMaxima = 1;

  rehacer(escalaMaxima: number, dpr: number): void {
    this.escalaMaxima = Math.max(0.01, escalaMaxima);
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
    // Los de lejos se pintan sin remates: a ese tamano no se distinguen y
    // son los que mas se juntan en pantalla.
    const detalle = escala >= this.escalaMaxima * AJUSTES.estilo.detalle;
    const t = reloj * 7 + fase;
    const brinco = anda * Math.abs(Math.sin(t)) * 8;
    const achata = 1 + anda * 0.035 * Math.sin(t * 2);

    // Sombra de contacto: dos elipses, la de dentro mas cerrada. Una sola
    // queda como una pegatina gris; asi se agarra al suelo.
    ctx.fillStyle = COLOR.escenario.sombra;
    ctx.beginPath();
    ctx.ellipse(x, y + 3 * escala, 88 * escala, 13 * escala, 0, 0, TAU);
    ctx.fill();
    if (detalle) {
      ctx.beginPath();
      ctx.ellipse(x, y + 2 * escala, 52 * escala, 8 * escala, 0, 0, TAU);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(x, y - brinco * escala);
    ctx.scale(escala * (2 - achata), escala * achata);

    // Tallos con ojos
    const vaiven1 = Math.sin(reloj * 3 + fase) * 7;
    const vaiven2 = Math.sin(reloj * 3.4 + fase + 2) * 7;
    ctx.lineCap = 'round';
    for (const paso of detalle ? [0, 1] : [0]) {
      // Dos pasadas: la tinta gorda debajo y el tallo un poco mas claro
      // encima, desplazado. Es el volumen mas barato que hay.
      ctx.strokeStyle = paso === 0 ? COLOR.monstruo.contorno : COLOR.monstruo.cuerpoAlto;
      ctx.lineWidth = paso === 0 ? 9 : 3;
      const dx = paso === 0 ? 0 : -1.6;
      ctx.beginPath();
      ctx.moveTo(-30 + dx, -160);
      ctx.quadraticCurveTo(-56 + vaiven1 + dx, -186, -62 + vaiven1 * 1.4 + dx, -212);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(30 + dx, -160);
      ctx.quadraticCurveTo(54 + vaiven2 + dx, -190, 60 + vaiven2 * 1.4 + dx, -218);
      ctx.stroke();
    }
    pintarOjo(ctx, -62 + vaiven1 * 1.4, -214, detalle);
    pintarOjo(ctx, 60 + vaiven2 * 1.4, -220, detalle);

    // Patas
    const izquierda = anda * Math.max(0, Math.sin(t)) * 7;
    const derecha = anda * Math.max(0, Math.sin(t + Math.PI)) * 7;
    pintarPata(ctx, -40, -izquierda, detalle);
    pintarPata(ctx, 40, -derecha, detalle);

    if (this.cache) {
      ctx.drawImage(this.cache, CACHE.x, CACHE.y, CACHE.ancho, CACHE.alto);
    }

    pintarBoca(ctx, apertura, detalle);
    ctx.restore();
  }
}

/** Vaiven de la boca cuando el monstruo solo camina. */
export function aperturaNormal(reloj: number, fase: number): number {
  return 12 + 24 * (0.5 + 0.5 * Math.sin(reloj * 5 + fase * 1.7));
}

/** La silueta, como ruta reutilizable: se rellena, se recorta y se entinta. */
function siluetaCuerpo(): Path2D {
  const forma = new Path2D();
  forma.moveTo(-88, -6);
  forma.bezierCurveTo(-98, -70, -84, -150, -30, -172);
  forma.bezierCurveTo(-8, -180, 18, -180, 40, -172);
  forma.bezierCurveTo(88, -150, 100, -70, 88, -6);
  forma.quadraticCurveTo(0, 10, -88, -6);
  forma.closePath();
  for (const [x, y, radio] of BULTOS) {
    forma.moveTo(x + radio, y);
    forma.arc(x, y, radio, 0, TAU);
  }
  return forma;
}

function pintarCuerpo(ctx: CanvasRenderingContext2D): void {
  const c = COLOR.monstruo;
  const forma = siluetaCuerpo();

  // Volumen: claro arriba, negro abajo
  const cuerpo = ctx.createLinearGradient(0, -190, 0, 10);
  cuerpo.addColorStop(0, c.cuerpoAlto);
  cuerpo.addColorStop(0.42, c.cuerpo);
  cuerpo.addColorStop(1, c.cuerpoBajo);
  ctx.fillStyle = cuerpo;
  ctx.fill(forma);

  // Filo frio en el lomo: es lo que le separa del asfalto, que ahora tambien
  // es oscuro. Se tapa con el mismo relleno del cuerpo, asi que no ensucia.
  filoDeLuz(ctx, forma, CACHE, -196, -74, c.filo, c.filoSuave, TAMANO * AJUSTES.estilo.filo, cuerpo);

  ctx.save();
  ctx.clip(forma);

  // Lustre de piel mojada, arriba a la izquierda, como el guante
  const lustre = ctx.createRadialGradient(-38, -150, 4, -38, -150, 110);
  lustre.addColorStop(0, c.lustre);
  lustre.addColorStop(1, c.lustreSuave);
  ctx.fillStyle = lustre;
  ctx.fillRect(CACHE.x, CACHE.y, CACHE.ancho, CACHE.alto);

  granular(ctx, -110, -190, 220, 200, [c.grano], AJUSTES.estilo.grano.densidadMonstruo, 0x2f9b11);
  ctx.restore();

  entintar(ctx, forma, c.contorno, TAMANO * AJUSTES.estilo.contorno);
}

function pintarPata(ctx: CanvasRenderingContext2D, x: number, y: number, detalle: boolean): void {
  const c = COLOR.monstruo;
  ctx.fillStyle = c.contorno;
  ctx.beginPath();
  ctx.ellipse(x, y, 24, 10, 0, 0, TAU);
  ctx.fill();
  if (!detalle) return;
  ctx.fillStyle = c.cuerpoAlto;
  ctx.beginPath();
  ctx.ellipse(x - 1, y - 2.5, 17, 4, 0, 0, TAU);
  ctx.fill();
}

function pintarOjo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  detalle: boolean,
): void {
  const c = COLOR.monstruo;
  // Globo negro con su tinta
  ctx.fillStyle = c.contorno;
  ctx.beginPath();
  ctx.arc(x, y, 17, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, TAU);
  ctx.clip();
  // Iris naranja con un canto mas claro por arriba
  ctx.fillStyle = c.iris;
  ctx.beginPath();
  ctx.arc(x + 6, y + 3, 12, 0, TAU);
  ctx.fill();
  if (detalle) {
    ctx.fillStyle = c.irisClaro;
    ctx.beginPath();
    ctx.arc(x + 5, y + 1, 12, Math.PI * 1.1, Math.PI * 1.9);
    ctx.fill();
  }
  ctx.fillStyle = c.pupila;
  ctx.beginPath();
  ctx.arc(x + 1, y + 1, 12, 0, TAU);
  ctx.fill();
  ctx.restore();

  // Los dos destellos del ojo humedo: el grande arriba, la chispa abajo
  ctx.fillStyle = c.destello;
  ctx.beginPath();
  ctx.ellipse(x - 5, y - 7, 5, 3.4, -0.5, 0, TAU);
  ctx.fill();
  if (!detalle) return;
  ctx.beginPath();
  ctx.arc(x + 7, y + 7, 1.8, 0, TAU);
  ctx.fill();
}

function pintarBoca(ctx: CanvasRenderingContext2D, apertura: number, detalle: boolean): void {
  const c = COLOR.monstruo;
  const cy = -82;
  const rx = 58;
  const ry = apertura;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, cy, rx, ry, 0, 0, TAU);
  ctx.clip();
  // Tres capas planas hacen el tunel: encia, garganta y fondo
  // La luz entra por arriba: encia clara solo en el borde de arriba y la
  // garganta hundida hacia abajo. Elipses centradas una dentro de otra
  // harian una diana, asi que todo lo de dentro va desplazado hacia abajo.
  ctx.fillStyle = c.boca;
  ctx.fillRect(-rx, cy - ry, rx * 2, ry * 2);
  ctx.fillStyle = c.bocaClara;
  ctx.beginPath();
  ctx.ellipse(0, cy - ry * 0.72, rx * 0.86, ry * 0.5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = c.garganta;
  ctx.beginPath();
  ctx.ellipse(0, cy + ry * 0.62, rx * 0.62, ry * 0.68, 0, 0, TAU);
  ctx.fill();
  if (detalle) {
    ctx.fillStyle = c.gargantaFondo;
    ctx.beginPath();
    ctx.ellipse(0, cy + ry * 0.9, rx * 0.34, ry * 0.42, 0, 0, TAU);
    ctx.fill();
  }

  const dientes = 7;
  for (let i = 0; i < dientes; i++) {
    const tx = -rx + (i + 0.5) * ((rx * 2) / dientes);
    const k = Math.sqrt(Math.max(0, 1 - (tx / rx) * (tx / rx))) * ry;
    pintarDiente(ctx, tx, cy - k - 4, cy - k + 15, detalle);
    pintarDiente(ctx, tx, cy + k + 4, cy + k - 15, detalle);
  }
  ctx.restore();
}

/** Un colmillo con su lado en sombra: de la base `base` a la punta `punta`. */
function pintarDiente(
  ctx: CanvasRenderingContext2D,
  x: number,
  base: number,
  punta: number,
  detalle: boolean,
): void {
  ctx.fillStyle = COLOR.monstruo.diente;
  ctx.beginPath();
  ctx.moveTo(x - 8, base);
  ctx.lineTo(x + 8, base);
  ctx.lineTo(x, punta);
  ctx.closePath();
  ctx.fill();
  if (!detalle) return;
  ctx.fillStyle = COLOR.monstruo.dienteSombra;
  ctx.beginPath();
  ctx.moveTo(x + 2, base);
  ctx.lineTo(x + 8, base);
  ctx.lineTo(x, punta);
  ctx.closePath();
  ctx.fill();
}
