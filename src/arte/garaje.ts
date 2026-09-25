import { AJUSTES } from '../config/ajustes';
import { COLOR } from '../config/tema';
import { lienzoCache } from '../motor/lienzo';
import type { Geometria } from '../motor/geometria';
import { TAU, rectRedondeado } from './formas';
import { entintar, granular, vinetear } from './estilo';
import { pintarCalle } from './fondo';

/**
 * El taller de la portada: el coche rojo aparcado dentro, antes de que
 * empiece la faena. Mismo lenguaje que el resto del juego —volumen por
 * degradado, contorno de tinta y grano encima— y el coche es literalmente el
 * mismo dibujo.
 *
 * La escena no se mueve, asi que se pinta una vez en un canvas aparte y por
 * frame solo se copia. Al salir de la portada se suelta: guardar una pantalla
 * entera mientras se juega es memoria tirada.
 *
 * El porton va en su propio canvas porque si se mueve: al empezar la partida
 * sube, y por detras se ve la calle de la que vienen los monstruos.
 */
export class Garaje {
  private taller: HTMLCanvasElement | null = null;
  private porton: HTMLCanvasElement | null = null;
  private hueco = { x: 0, y: 0, ancho: 0, alto: 0 };
  private ancho = 0;
  private alto = 0;

  rehacer(g: Geometria, dpr: number): void {
    const taller = lienzoCache(g.ancho, g.alto, dpr);
    pintarGaraje(taller.ctx, g);
    this.taller = taller.canvas;

    this.hueco = cajaPorton(g);
    const hoja = lienzoCache(this.hueco.ancho, this.hueco.alto, dpr);
    pintarPorton(hoja.ctx, this.hueco.ancho, this.hueco.alto);
    this.porton = hoja.canvas;

    this.ancho = g.ancho;
    this.alto = g.alto;
  }

  liberar(): void {
    this.taller = null;
    this.porton = null;
  }

  /** `abierto` va de 0 (cerrado) a 1 (subido del todo y fuera de la vista). */
  dibujar(ctx: CanvasRenderingContext2D, abierto: number): void {
    if (!this.taller) return;
    ctx.drawImage(this.taller, 0, 0, this.ancho, this.alto);
    if (!this.porton || abierto >= 1) return;
    const h = this.hueco;
    ctx.save();
    ctx.beginPath();
    ctx.rect(h.x, h.y, h.ancho, h.alto);
    ctx.clip();
    ctx.drawImage(this.porton, h.x, h.y - h.alto * abierto, h.ancho, h.alto);
    ctx.restore();
  }
}

/** Hueco del porton: lo comparten el taller y la hoja que sube. */
function cajaPorton(g: Geometria): { x: number; y: number; ancho: number; alto: number } {
  const techo = lineaTecho(g);
  const suelo = lineaSuelo(g);
  const ancho = Math.min(g.ancho * 0.62, g.coche.ancho * 1.9);
  const alto = (suelo - techo) * 0.82;
  return { x: (g.ancho - ancho) / 2, y: suelo - alto, ancho, alto };
}

/** Donde se aparca el coche en la portada: centrado, sin la pistola al lado. */
export function cocheEnGaraje(g: Geometria): { x: number; base: number } {
  return { x: g.ancho / 2, base: g.alto * 0.955 };
}

/** Linea en la que la pared del fondo se encuentra con el suelo. */
function lineaSuelo(g: Geometria): number {
  return g.alto * 0.56;
}

/** Donde acaba la banda oscura del techo. */
function lineaTecho(g: Geometria): number {
  return g.alto * 0.13;
}

/** La hoja del porton, en su propio canvas para poder subirla. */
function pintarPorton(ctx: CanvasRenderingContext2D, ancho: number, alto: number): void {
  const c = COLOR.garaje;
  const chapa = ctx.createLinearGradient(0, 0, ancho, 0);
  chapa.addColorStop(0, c.portonOscuro);
  chapa.addColorStop(0.32, c.porton);
  chapa.addColorStop(0.56, c.portonClaro);
  chapa.addColorStop(1, c.portonOscuro);
  ctx.fillStyle = chapa;
  ctx.fillRect(0, 0, ancho, alto);

  ctx.strokeStyle = c.portonJunta;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const lamas = 11;
  for (let i = 1; i < lamas; i++) {
    const y = (alto * i) / lamas;
    ctx.moveTo(0, y);
    ctx.lineTo(ancho, y);
  }
  ctx.stroke();

  // Un filo claro bajo cada junta: asi las lamas tienen canto y no son rayas
  ctx.strokeStyle = c.portonFilo;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < lamas; i++) {
    const y = (alto * i) / lamas + 1.5;
    ctx.moveTo(ancho * 0.04, y);
    ctx.lineTo(ancho * 0.96, y);
  }
  ctx.stroke();

  ctx.fillStyle = c.portonTirador;
  const tirador = ancho * 0.18;
  rectRedondeado(ctx, (ancho - tirador) / 2, alto * 0.74, tirador, Math.max(7, alto * 0.04), 5);
  ctx.fill();
}

function pintarGaraje(ctx: CanvasRenderingContext2D, g: Geometria): void {
  const c = COLOR.garaje;
  const { ancho, alto } = g;
  const techo = lineaTecho(g);
  const suelo = lineaSuelo(g);
  const fondo = alto - suelo;
  const coche = cocheEnGaraje(g);

  ctx.lineJoin = 'round';
  ctx.lineCap = 'butt';

  // --------------------------------------------------------------- pared
  const pared = ctx.createLinearGradient(0, techo, 0, suelo);
  pared.addColorStop(0, c.paredAlta);
  pared.addColorStop(1, c.paredBaja);
  ctx.fillStyle = pared;
  ctx.fillRect(0, 0, ancho, suelo);

  // Azulejo: una sola ruta con todas las juntas, un solo trazo
  const lado = Math.max(20, ancho / 16);
  ctx.strokeStyle = c.junta;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = lado; x < ancho; x += lado) {
    ctx.moveTo(x, techo);
    ctx.lineTo(x, suelo);
  }
  for (let y = techo + lado; y < suelo; y += lado) {
    ctx.moveTo(0, y);
    ctx.lineTo(ancho, y);
  }
  ctx.stroke();

  granular(ctx, 0, techo, ancho, suelo - techo, [c.granoPared], AJUSTES.estilo.grano.densidadPared, 0x7c3a1d);

  // Zocalo
  const zocalo = (suelo - techo) * 0.3;
  ctx.fillStyle = c.zocalo;
  ctx.fillRect(0, suelo - zocalo, ancho, zocalo);
  ctx.fillStyle = c.zocaloCanto;
  ctx.fillRect(0, suelo - zocalo, ancho, Math.max(3, alto * 0.005));

  // ------------------------------------------------- hueco del porton
  // Detras de la hoja esta la calle: el cielo y el asfalto del nivel, que es
  // de donde van a salir los monstruos en cuanto el porton suba.
  const hueco = cajaPorton(g);
  // Por el hueco se ve la calle de verdad: la pinta el mismo modulo que el
  // fondo de la partida, asi que lo que aparece al subir el porton es
  // exactamente el escenario que viene despues.
  ctx.save();
  ctx.beginPath();
  ctx.rect(hueco.x, hueco.y, hueco.ancho, hueco.alto);
  ctx.clip();
  pintarCalle(ctx, hueco.x, hueco.y, hueco.ancho, hueco.alto, hueco.y + hueco.alto * 0.5);
  ctx.restore();
  // Sombra del dintel, para que el hueco tenga fondo
  const dintel = ctx.createLinearGradient(0, hueco.y, 0, hueco.y + hueco.alto * 0.3);
  dintel.addColorStop(0, c.sombra);
  dintel.addColorStop(1, c.sombraSuave);
  ctx.fillStyle = dintel;
  ctx.fillRect(hueco.x, hueco.y, hueco.ancho, hueco.alto * 0.3);

  ctx.strokeStyle = c.marco;
  ctx.lineWidth = Math.max(4, ancho * 0.012);
  ctx.strokeRect(hueco.x, hueco.y, hueco.ancho, hueco.alto);

  // ---------------------------------------------------- techo y tubos
  ctx.fillStyle = c.techo;
  ctx.fillRect(0, 0, ancho, techo);
  ctx.fillStyle = c.techoCanto;
  ctx.fillRect(0, techo - Math.max(3, alto * 0.004), ancho, Math.max(3, alto * 0.004));

  for (const fx of [0.27, 0.73]) {
    const w = ancho * 0.3;
    const h = Math.max(5, techo * 0.1);
    const x = ancho * fx;
    const y = techo * 0.5;
    // La luz cae hacia abajo, no rodea al tubo como un aro
    const luz = ctx.createLinearGradient(0, y, 0, y + techo * 2.2);
    luz.addColorStop(0, c.fluorescenteHalo);
    luz.addColorStop(1, c.fluorescenteHaloSuave);
    ctx.fillStyle = luz;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.5, y);
    ctx.lineTo(x + w * 0.5, y);
    ctx.lineTo(x + w * 0.95, y + techo * 2.2);
    ctx.lineTo(x - w * 0.95, y + techo * 2.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = c.soporte;
    ctx.fillRect(x - w * 0.5, y - Math.max(3, h * 0.5), w, Math.max(3, h * 0.5));
    ctx.fillStyle = c.fluorescente;
    rectRedondeado(ctx, x - w / 2, y, w, h, h / 2);
    ctx.fill();
  }

  // --------------------------------------------------------------- suelo
  const hormigon = ctx.createLinearGradient(0, suelo, 0, alto);
  hormigon.addColorStop(0, c.sueloAlto);
  hormigon.addColorStop(1, c.sueloBajo);
  ctx.fillStyle = hormigon;
  ctx.fillRect(0, suelo, ancho, fondo);

  ctx.fillStyle = c.sueloMancha;
  for (const [fx, fy, r] of [
    [0.32, 0.4, 0.09],
    [0.66, 0.26, 0.055],
    [0.2, 0.68, 0.07],
  ] as ReadonlyArray<readonly [number, number, number]>) {
    ctx.beginPath();
    ctx.ellipse(ancho * fx, suelo + fondo * fy, ancho * r, ancho * r * 0.32, 0, 0, TAU);
    ctx.fill();
  }

  granular(ctx, 0, suelo, ancho, fondo, [c.granoSuelo, c.sueloMancha], AJUSTES.estilo.grano.densidadPared, 0x11a7f3);

  // Rejilla del foso, en perspectiva: se abre hacia el que mira
  const arriba = alto * 0.78;
  const ax = ancho * 0.19;
  const bx = ancho * 0.81;
  const cx = -ancho * 0.06;
  const dx = ancho * 1.06;
  const rejilla = new Path2D();
  rejilla.moveTo(ax, arriba);
  rejilla.lineTo(bx, arriba);
  rejilla.lineTo(dx, alto);
  rejilla.lineTo(cx, alto);
  rejilla.closePath();

  ctx.fillStyle = c.rejillaHueco;
  ctx.fill(rejilla);
  ctx.save();
  ctx.clip(rejilla);
  ctx.strokeStyle = c.rejillaBarra;
  ctx.lineWidth = Math.max(2, ancho * 0.005);
  ctx.beginPath();
  const barras = 18;
  for (let i = 0; i <= barras; i++) {
    const t = i / barras;
    ctx.moveTo(ax + (bx - ax) * t, arriba);
    ctx.lineTo(cx + (dx - cx) * t, alto);
  }
  // Travesanos: mas juntos al fondo, que es lo que da la profundidad
  for (let i = 1; i <= 5; i++) {
    const y = arriba + (alto - arriba) * Math.pow(i / 5, 1.7);
    ctx.moveTo(0, y);
    ctx.lineTo(ancho, y);
  }
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = c.rejillaCanto;
  ctx.lineWidth = Math.max(3, ancho * 0.008);
  ctx.stroke(rejilla);

  // --------------------------------------------------------------- trastos
  // Neumaticos apilados. Van solapados y sin agujero claro salvo el de
  // arriba: tres elipses identicas y separadas parecen un ocho, no una pila.
  const nx = ancho * 0.12;
  const nr = Math.min(ancho * 0.055, fondo * 0.12);
  const nBase = suelo + fondo * 0.19;
  for (let i = 0; i < 3; i++) {
    const cy = nBase - i * nr * 0.5;
    const goma = new Path2D();
    goma.ellipse(nx, cy, nr, nr * 0.58, 0, 0, TAU);
    ctx.fillStyle = c.neumatico;
    ctx.fill(goma);
    entintar(ctx, goma, c.contorno, Math.max(1.5, nr * AJUSTES.estilo.contorno * 2));
    // Filo de luz en el canto de arriba de cada cubierta
    ctx.strokeStyle = c.neumaticoFilo;
    ctx.lineWidth = Math.max(1.5, nr * 0.07);
    ctx.beginPath();
    ctx.ellipse(nx, cy, nr * 0.94, nr * 0.52, 0, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
  const nArriba = nBase - 2 * nr * 0.5;
  ctx.strokeStyle = c.llanta;
  ctx.lineWidth = Math.max(2, nr * 0.14);
  ctx.beginPath();
  ctx.ellipse(nx, nArriba, nr * 0.44, nr * 0.26, 0, 0, TAU);
  ctx.stroke();

  const jx = ancho * 0.88;
  const jAncho = Math.min(ancho * 0.15, fondo * 0.46);
  const jAlto = jAncho * 1.3;
  const jBase = suelo + fondo * 0.26;
  const chapaJ = ctx.createLinearGradient(jx - jAncho / 2, 0, jx + jAncho / 2, 0);
  chapaJ.addColorStop(0, c.cajoneraCanto);
  chapaJ.addColorStop(0.35, c.cajoneraClara);
  chapaJ.addColorStop(1, c.cajonera);
  ctx.fillStyle = chapaJ;
  rectRedondeado(ctx, jx - jAncho / 2, jBase - jAlto, jAncho, jAlto, 6);
  ctx.fill();
  ctx.strokeStyle = c.contorno;
  ctx.lineWidth = Math.max(1.5, jAncho * 0.03);
  ctx.stroke();
  ctx.fillStyle = c.cajoneraCanto;
  ctx.fillRect(jx + jAncho * 0.34, jBase - jAlto + 6, jAncho * 0.12, jAlto - 12);
  ctx.strokeStyle = c.tirador;
  ctx.lineWidth = Math.max(2, jAncho * 0.05);
  ctx.beginPath();
  for (let i = 1; i <= 3; i++) {
    const y = jBase - jAlto + (jAlto * i) / 4;
    ctx.moveTo(jx - jAncho * 0.28, y);
    ctx.lineTo(jx + jAncho * 0.22, y);
  }
  ctx.stroke();

  // Manguera colgada de un gancho. Los aros van abiertos y con cola: tres
  // circunferencias cerradas parecerian una diana.
  const mr = Math.min(ancho * 0.05, (suelo - techo) * 0.13);
  const my = suelo - zocalo - mr * 1.9;
  ctx.fillStyle = c.marco;
  rectRedondeado(ctx, jx - mr * 0.12, my - mr * 1.5, mr * 0.24, mr * 0.6, 3);
  ctx.fill();
  ctx.strokeStyle = c.manguera;
  ctx.lineWidth = Math.max(3, mr * 0.22);
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(jx, my, mr - i * mr * 0.26, 0.45, 0.45 + TAU * 0.86);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(jx + mr * 0.9, my + mr * 0.42);
  ctx.quadraticCurveTo(jx + mr * 1.5, my + mr * 1.3, jx + mr * 1.1, my + mr * 2.1);
  ctx.stroke();
  ctx.lineCap = 'butt';

  // ------------------------------------------------- sombra bajo el coche
  ctx.save();
  ctx.translate(coche.x, coche.base);
  ctx.scale(1, 0.2);
  const sombra = ctx.createRadialGradient(0, 0, g.coche.ancho * 0.12, 0, 0, g.coche.ancho * 0.62);
  sombra.addColorStop(0, c.sombra);
  sombra.addColorStop(1, c.sombraSuave);
  ctx.fillStyle = sombra;
  ctx.beginPath();
  ctx.arc(0, 0, g.coche.ancho * 0.62, 0, TAU);
  ctx.fill();
  ctx.restore();

  // Lo ultimo: cerrar los bordes, igual que en la partida
  vinetear(ctx, ancho, alto, COLOR.escenario.vineta, COLOR.escenario.vinetaSuave);
}
