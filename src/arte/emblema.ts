import { COLOR } from '../config/tema';
import { lienzoCache } from '../motor/lienzo';
import { TAU } from './formas';
import { entintar, filoDeLuz } from './estilo';

/**
 * El emblema del coche.
 *
 * Los dibujos que aporto el autor son fotografias de un coche de verdad y
 * llevan puesta la marca del fabricante. El juego se publica, asi que ese
 * emblema se tapa con uno propio: un escudo cromado con la silueta del
 * monstruo del juego dentro. Del mismo tamano y en el mismo sitio, para que
 * se siga leyendo como lo que es —la chapa de una marca en el porton, en el
 * centro del volante y en el salpicadero— sin ser la de nadie.
 *
 * Esta pintado con el mismo vocabulario que el resto (`arte/estilo.ts`):
 * contorno de tinta, volumen por degradado y filo de luz arriba. Por eso no
 * parece una pegatina encima de una foto.
 *
 * Se pinta en su propio canvas y no directamente encima del dibujo porque
 * `entintar` mete la tinta por detras (`destination-over`): sobre un canvas
 * que ya tiene una foto, la tinta acabaria debajo de la foto y no se veria.
 */

/** Unidades locales: el escudo mide 100 x 120 y esta centrado en el origen. */
const ANCHO = 100;
const ALTO = 120;

/** Un poco mayor que el escudo: el contorno y el filo se salen de el. */
const CAJA = { x: -60, y: -70, ancho: 120, alto: 140 };

const GROSOR_TINTA = 3.5;
const GROSOR_FILO = 5;

function escudo(): Path2D {
  const f = new Path2D();
  const r = 16;
  f.moveTo(-50 + r, -60);
  f.lineTo(50 - r, -60);
  f.quadraticCurveTo(50, -60, 50, -60 + r);
  f.lineTo(50, 8);
  // La punta de abajo, redondeada: un escudo acabado en pico se ve como un
  // triangulo a los treinta pixeles que mide esto en pantalla.
  f.bezierCurveTo(50, 40, 26, 56, 0, 60);
  f.bezierCurveTo(-26, 56, -50, 40, -50, 8);
  f.lineTo(-50, -60 + r);
  f.quadraticCurveTo(-50, -60, -50 + r, -60);
  f.closePath();
  return f;
}

/** El monstruo del juego, reducido a lo que se distingue a este tamano. */
function figura(): Path2D {
  const f = new Path2D();
  // El cuerpo: un bulto con el borde mordido, como el grande
  f.moveTo(-26, 30);
  f.bezierCurveTo(-30, 4, -20, -12, 0, -12);
  f.bezierCurveTo(20, -12, 30, 4, 26, 30);
  f.closePath();
  for (const [x, y, radio] of [
    [-24, 8, 9],
    [-15, -6, 10],
    [0, -12, 11],
    [15, -6, 10],
    [24, 8, 9],
  ] as ReadonlyArray<readonly [number, number, number]>) {
    f.moveTo(x + radio, y);
    f.arc(x, y, radio, 0, TAU);
  }
  // Los dos tallos con sus ojos
  for (const lado of [-1, 1]) {
    f.moveTo(lado * 7, -6);
    f.lineTo(lado * 12, -34);
    f.lineTo(lado * 19, -32);
    f.lineTo(lado * 13, -6);
    f.closePath();
    f.moveTo(lado * 20 + 8, -38);
    f.arc(lado * 20, -38, 8, 0, TAU);
  }
  return f;
}

/** Sitio del emblema sobre un dibujo, en fraccion de su ancho y de su alto. */
export interface SitioEmblema {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/**
 * Pega el emblema encima de un dibujo ya pintado. `ancho` y `alto` son los
 * del dibujo, y `sitio` va en fraccion de ellos: asi la misma medida vale
 * para cualquier tamano de pantalla.
 */
export function estampar(
  ctx: CanvasRenderingContext2D,
  sitio: SitioEmblema,
  ancho: number,
  alto: number,
  dpr: number,
): void {
  const w = sitio.ancho * ancho;
  const h = sitio.alto * alto;
  if (w < 1 || h < 1) return;
  // A la resolucion real del cache, para que no salga borroso.
  const emblema = crearEmblema(w, h, dpr);
  ctx.drawImage(emblema, sitio.x * ancho - w / 2, sitio.y * alto - h / 2, w, h);
}

/**
 * Devuelve el emblema ya pintado al tamano que se le pida, listo para copiarlo
 * encima del dibujo que toque.
 */
function crearEmblema(ancho: number, alto: number, dpr: number): HTMLCanvasElement {
  const c = COLOR.emblema;
  const { canvas, ctx } = lienzoCache(ancho, alto, dpr);
  ctx.translate(ancho / 2, alto / 2);
  ctx.scale(ancho / ANCHO, alto / ALTO);

  const forma = escudo();
  const metal = ctx.createLinearGradient(0, -60, 0, 60);
  metal.addColorStop(0, c.alto);
  metal.addColorStop(0.45, c.medio);
  metal.addColorStop(1, c.bajo);
  ctx.fillStyle = metal;
  ctx.fill(forma);
  filoDeLuz(ctx, forma, CAJA, -62, -18, c.filo, c.filoSuave, GROSOR_FILO, metal);

  ctx.save();
  ctx.clip(forma);
  const bicho = figura();
  const relleno = ctx.createLinearGradient(0, -46, 0, 40);
  relleno.addColorStop(0, c.figuraAlta);
  relleno.addColorStop(1, c.figura);
  ctx.fillStyle = relleno;
  ctx.fill(bicho);
  ctx.restore();

  entintar(ctx, forma, c.contorno, GROSOR_TINTA);
  return canvas;
}
