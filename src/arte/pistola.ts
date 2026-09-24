import { AJUSTES } from '../config/ajustes';
import { TEXTOS } from '../config/textos';
import { COLOR, TIPOGRAFIA_ESTRECHA } from '../config/tema';
import { lienzoCache } from '../motor/lienzo';
import { TAU, rectRedondeado } from './formas';

/**
 * La pistola de aire del taller, en primera persona y con el guante puesto.
 *
 * El volumen se hace como en el coche: silueta rellena con degradado, y
 * encima los cantos, los brillos y las sombras recortados a esa silueta.
 *
 * Todo lo que no se mueve —pistola, guante y dorso de la mano— se pinta una
 * sola vez en un canvas aparte y por frame solo se gira y se copia. En vivo
 * quedan nada mas el antebrazo y la manguera, porque cuelgan hasta el borde
 * de la pantalla y su largo depende del tamano del movil.
 *
 * Sistema local: el canon apunta a -X con el eje en y = 0, y la punta, de
 * donde sale el disparo, esta en el origen. `escorzo` comprime el dibujo a lo
 * largo de ese eje, asi que la pistola no se ve de perfil sino apuntando
 * hacia dentro de la pantalla.
 */

/** Punto de agarre, en coordenadas locales del dibujo. */
const PIVOTE = { x: 880, y: 250 };

/**
 * Angulo de reposo. Con el escorzo aplicado la empunadura queda casi
 * vertical: la postura con la que se sujeta una pistola de verdad.
 */
export const ANGULO_REPOSO = 0.36;

/** Limites de giro para que la muneca no acabe en una postura imposible. */
const ANGULO_MINIMO = 0.05;
const ANGULO_MAXIMO = 0.95;

/** Puntos extremos de la pistola que deben caber en su zona de la pantalla. */
const EXTREMOS: ReadonlyArray<readonly [number, number]> = [
  [0, -30],
  [0, 30],
  [158, -40],
  [158, 40],
  [660, -224],
  [830, -224],
  [880, -152],
  [1106, -52],
  [1106, 48],
  [1014, 462],
  [828, 552],
  [882, 598],
];

/** Region cacheada, en coordenadas locales. Cabe la pistola y la mano. */
const CACHE = { x: -80, y: -300, ancho: 1500, alto: 1060 };

/** Arranque del antebrazo, que se pinta en vivo por detras de la mano. */
const ANTEBRAZO = { x: 1250, y: 540, hacia: 1180 };

export interface PuntaPistola {
  /** Punta del canon, de donde sale el disparo. */
  x: number;
  y: number;
  /** Punto de agarre en pantalla. */
  px: number;
  py: number;
}

export class Pistola {
  private ganancia = 0.2;
  private pivoteX = 0;
  private pivoteY = 0;
  private cache: HTMLCanvasElement | null = null;

  rehacer(ancho: number, alto: number, dpr: number): void {
    const cos = Math.cos(ANGULO_REPOSO);
    const sin = Math.sin(ANGULO_REPOSO);
    const escorzo = AJUSTES.pistola.escorzo;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [ex, ey] of EXTREMOS) {
      const rx = (ex - PIVOTE.x) * escorzo;
      const ry = ey - PIVOTE.y;
      const wx = rx * cos - ry * sin;
      const wy = rx * sin + ry * cos;
      minX = Math.min(minX, wx);
      maxX = Math.max(maxX, wx);
      minY = Math.min(minY, wy);
      maxY = Math.max(maxY, wy);
    }

    const izquierda = ancho * AJUSTES.pistola.izquierda;
    const derecha = ancho * AJUSTES.pistola.derecha;
    const cajaAlto = Math.min(ancho * 0.52, alto * AJUSTES.pistola.altoMaximo);
    this.ganancia = Math.min((derecha - izquierda) / (maxX - minX), cajaAlto / (maxY - minY));
    this.pivoteX = derecha - maxX * this.ganancia;
    this.pivoteY = alto - cajaAlto - minY * this.ganancia;

    const { canvas, ctx } = lienzoCache(CACHE.ancho, CACHE.alto, this.ganancia * dpr);
    ctx.translate(-CACHE.x, -CACHE.y);
    pintarPistola(ctx);
    this.cache = canvas;
  }

  /** Posicion de la punta del canon para un angulo y un retroceso dados. */
  punta(angulo: number, retroceso: number, destino: PuntaPistola): PuntaPistola {
    const haciaAtrasX = Math.cos(angulo);
    const haciaAtrasY = Math.sin(angulo);
    const px = this.pivoteX + haciaAtrasX * retroceso * 30 * this.ganancia;
    const py = this.pivoteY + haciaAtrasY * retroceso * 30 * this.ganancia;
    const rx = -PIVOTE.x * this.ganancia * AJUSTES.pistola.escorzo;
    const ry = -PIVOTE.y * this.ganancia;
    destino.px = px;
    destino.py = py;
    destino.x = px + rx * haciaAtrasX - ry * haciaAtrasY;
    destino.y = py + rx * haciaAtrasY + ry * haciaAtrasX;
    return destino;
  }

  /** Angulo con el que la pistola apunta al punto tocado. */
  anguloHacia(x: number, y: number, auxiliar: PuntaPistola): number {
    let angulo = ANGULO_REPOSO;
    for (let i = 0; i < 2; i++) {
      const t = this.punta(angulo, 0, auxiliar);
      angulo = Math.atan2(-(y - t.y), -(x - t.x));
      angulo = Math.max(ANGULO_MINIMO, Math.min(ANGULO_MAXIMO, angulo));
    }
    return angulo;
  }

  dibujar(
    ctx: CanvasRenderingContext2D,
    angulo: number,
    retroceso: number,
    desplazX: number,
    desplazY: number,
    ancho: number,
    alto: number,
    auxiliar: PuntaPistola,
  ): void {
    const p = COLOR.pistola;
    const t = this.punta(angulo, retroceso, auxiliar);
    const ox = t.px + desplazX;
    const oy = t.py + desplazY;
    const cos = Math.cos(angulo);
    const sin = Math.sin(angulo);
    const g = this.ganancia;
    const gx = g * AJUSTES.pistola.escorzo;

    // Manguera azul en espiral: sale del racor y cuelga hasta el borde
    const lx = (882 - PIVOTE.x) * gx;
    const ly = (596 - PIVOTE.y) * g;
    const hx = ox + lx * cos - ly * sin;
    const hy = oy + lx * sin + ly * cos;
    ctx.lineCap = 'round';
    ctx.strokeStyle = p.mangueraBaja;
    ctx.lineWidth = 36 * g;
    trazarManguera(ctx, hx, hy, ancho, alto);
    ctx.strokeStyle = p.manguera;
    ctx.lineWidth = 27 * g;
    trazarManguera(ctx, hx, hy, ancho, alto);
    // La espiral: brillo interrumpido, no un rayado gris de lado a lado
    ctx.strokeStyle = p.mangueraAlta;
    ctx.lineWidth = 6 * g;
    ctx.setLineDash([6 * g, 17 * g]);
    trazarManguera(ctx, hx - 5 * g, hy, ancho, alto);
    ctx.setLineDash([]);
    // Muelle protector, solo donde la manguera sale del racor
    ctx.strokeStyle = p.muelle;
    ctx.lineWidth = 34 * g;
    ctx.lineCap = 'butt';
    ctx.setLineDash([6 * g, 12 * g]);
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + 6 * g, hy + alto * 0.1);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineCap = 'round';

    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(angulo);
    ctx.scale(gx, g);
    ctx.translate(-PIVOTE.x, -PIVOTE.y);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Antebrazo: se va de la pantalla, asi que su largo depende del movil y
    // no puede cachearse. Queda por detras de la mano, que si esta cacheada.
    ctx.strokeStyle = p.guanteMedio;
    ctx.lineWidth = 430;
    ctx.beginPath();
    ctx.moveTo(ANTEBRAZO.x, ANTEBRAZO.y);
    ctx.lineTo(ANTEBRAZO.x + ANTEBRAZO.hacia * 0.55, ANTEBRAZO.y + ANTEBRAZO.hacia * 0.87);
    ctx.stroke();
    ctx.strokeStyle = p.guanteBrillo;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(ANTEBRAZO.x - 178, ANTEBRAZO.y + 114);
    ctx.lineTo(ANTEBRAZO.x - 178 + ANTEBRAZO.hacia * 0.55, ANTEBRAZO.y + 114 + ANTEBRAZO.hacia * 0.87);
    ctx.stroke();

    if (this.cache) {
      ctx.drawImage(this.cache, CACHE.x, CACHE.y, CACHE.ancho, CACHE.alto);
    }
    ctx.restore();
  }
}

function trazarManguera(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ancho: number,
  alto: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x, y + alto * 0.1, x + ancho * 0.03, y + alto * 0.2, x + ancho * 0.05, alto + 40);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Utiles de dibujo
// ---------------------------------------------------------------------------

/** Rectangulo redondeado con degradado vertical: finge una pieza cilindrica. */
function cilindro(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  radio: number,
  claro: string,
  medio: string,
  oscuro: string,
): void {
  const grad = ctx.createLinearGradient(0, y, 0, y + alto);
  grad.addColorStop(0, medio);
  grad.addColorStop(0.24, claro);
  grad.addColorStop(0.6, medio);
  grad.addColorStop(1, oscuro);
  ctx.fillStyle = grad;
  rectRedondeado(ctx, x, y, ancho, alto, radio);
  ctx.fill();
}

/** Moleteado de una pieza girada a mano: surco oscuro y arista clara. */
function moleteado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  paso: number,
): void {
  const p = COLOR.pistola;
  ctx.lineCap = 'butt';
  ctx.lineWidth = 2.5;
  for (let k = paso; k < ancho; k += paso) {
    ctx.strokeStyle = p.moleteadoOscuro;
    ctx.beginPath();
    ctx.moveTo(x + k, y + 5);
    ctx.lineTo(x + k, y + alto - 5);
    ctx.stroke();
    ctx.strokeStyle = p.moleteadoClaro;
    ctx.beginPath();
    ctx.moveTo(x + k + 3, y + 5);
    ctx.lineTo(x + k + 3, y + alto - 5);
    ctx.stroke();
  }
  ctx.lineCap = 'round';
}

/**
 * Un dedo enguantado: una cresta curva que rodea el puno. El volumen sale de
 * cuatro trazos superpuestos —valle, cuerpo, lomo y reflejo— porque un trazo
 * plano de nitrilo negro no se distingue del de al lado.
 */
function pintarDedo(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  grosor: number,
  salida: number,
): void {
  const p = COLOR.pistola;
  const x1 = bx - salida;
  const y1 = by + 24;
  const cx = bx + 92;
  const cy = by - 34;
  const x2 = bx + 236;
  const y2 = by - 20;
  const cresta = (ancho: number, color: string, dy: number): void => {
    ctx.strokeStyle = color;
    ctx.lineWidth = ancho;
    ctx.beginPath();
    ctx.moveTo(x1, y1 + dy);
    ctx.quadraticCurveTo(cx, cy + dy, x2, y2 + dy);
    ctx.stroke();
  };
  cresta(grosor + 13, p.guanteBajo, 0); // valle con el dedo de al lado
  cresta(grosor, p.guanteMedio, 0);
  cresta(grosor * 0.44, p.guanteAlto, -grosor * 0.24);

  // Reflejo corto del nitrilo, sobre el lomo y nada mas
  ctx.strokeStyle = p.guanteReflejo;
  ctx.lineWidth = grosor * 0.1;
  ctx.beginPath();
  ctx.moveTo(x1 + 30, y1 - grosor * 0.36);
  ctx.quadraticCurveTo(bx + 6, by - grosor * 0.6, bx + 74, by - grosor * 0.52);
  ctx.stroke();

  // Pliegue de la falange
  ctx.strokeStyle = p.guantePliegue;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(bx + 34, by - grosor * 0.42);
  ctx.lineTo(bx + 26, by + grosor * 0.36);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// El dibujo, que se pinta una sola vez
// ---------------------------------------------------------------------------

function pintarPistola(ctx: CanvasRenderingContext2D): void {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  pintarDorso(ctx);
  pintarCanon(ctx);
  pintarCuerpo(ctx);
  pintarEmpunadura(ctx);
  pintarDedos(ctx);
  pintarGatillo(ctx);
  pintarPulgar(ctx);
}

/** Dorso de la mano enguantada: la masa que hay detras de la empunadura. */
function pintarDorso(ctx: CanvasRenderingContext2D): void {
  const p = COLOR.pistola;
  const mano = new Path2D();
  mano.ellipse(1214, 366, 208, 328, 0.3, 0, TAU);

  const carne = ctx.createLinearGradient(1030, 80, 1380, 680);
  carne.addColorStop(0, p.guanteAlto);
  carne.addColorStop(0.45, p.guanteMedio);
  carne.addColorStop(1, p.guanteBajo);
  ctx.fillStyle = carne;
  ctx.fill(mano);

  ctx.save();
  ctx.clip(mano);
  // Luz de borde por el lado que mira a la ventana del taller
  const filo = ctx.createLinearGradient(1040, 130, 1180, 330);
  filo.addColorStop(0, p.guanteBrillo);
  filo.addColorStop(1, p.guanteBrilloSuave);
  ctx.fillStyle = filo;
  ctx.fillRect(1000, 40, 440, 680);
  // Nudillos: los bultos donde arrancan los dedos
  ctx.fillStyle = p.guanteBrillo;
  for (const [x, y, r] of [
    [1096, 190, 42],
    [1122, 262, 46],
    [1146, 336, 42],
    [1168, 402, 36],
  ] as ReadonlyArray<readonly [number, number, number]>) {
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.6, -0.34, 0, TAU);
    ctx.fill();
  }
  // Pliegue de la muneca
  ctx.strokeStyle = p.guantePliegue;
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(1110, 574);
  ctx.quadraticCurveTo(1230, 614, 1362, 574);
  ctx.stroke();
  ctx.restore();
}

/** Boquilla de acero, anillo rojo y tuerca de union. */
function pintarCanon(ctx: CanvasRenderingContext2D): void {
  const p = COLOR.pistola;

  // Salida del aire
  cilindro(ctx, -6, -24, 26, 48, 6, p.negroAlto, p.negroMedio, p.negroBajo);
  // Punta moleteada
  cilindro(ctx, 14, -30, 84, 60, 10, p.aceroAlto, p.aceroMedio, p.aceroBajo);
  moleteado(ctx, 14, -30, 84, 60, 12);
  // Escalon
  cilindro(ctx, 92, -34, 34, 68, 6, p.aceroAlto, p.aceroMedio, p.aceroBajo);
  // Anillo rojo de identificacion
  cilindro(ctx, 122, -40, 38, 80, 6, p.anilloAlto, p.anilloMedio, p.anilloBajo);
  // Tubo
  cilindro(ctx, 156, -36, 134, 72, 8, p.aceroAlto, p.aceroMedio, p.aceroBajo);
  ctx.strokeStyle = p.aceroSombra;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(240, -34);
  ctx.lineTo(240, 34);
  ctx.stroke();
  // Casquillo hexagonal para la llave
  cilindro(ctx, 282, -48, 58, 96, 8, p.aceroAlto, p.aceroMedio, p.aceroBajo);
  // Tuerca de union, negra y grande
  cilindro(ctx, 330, -58, 78, 116, 12, p.negroAlto, p.negroMedio, p.negroBajo);
  moleteado(ctx, 330, -58, 78, 116, 16);
  // Sombra de contacto con el cuerpo
  ctx.fillStyle = p.ocluido;
  ctx.fillRect(396, -52, 16, 118);
}

/** Cuerpo de fundicion: silueta, cantos, brillos, mandos y grabado. */
function pintarCuerpo(ctx: CanvasRenderingContext2D): void {
  const p = COLOR.pistola;

  // Gancho de colgar, por detras del cuerpo
  ctx.strokeStyle = p.verdeBajo;
  ctx.lineWidth = 40;
  ctx.beginPath();
  ctx.moveTo(636, -70);
  ctx.lineTo(660, -206);
  ctx.quadraticCurveTo(666, -226, 692, -224);
  ctx.lineTo(806, -224);
  ctx.quadraticCurveTo(830, -222, 830, -196);
  ctx.lineTo(830, -168);
  ctx.stroke();
  ctx.strokeStyle = p.verdeMedio;
  ctx.lineWidth = 28;
  ctx.stroke();
  ctx.strokeStyle = p.verdeArista;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(650, -80);
  ctx.lineTo(672, -204);
  ctx.quadraticCurveTo(678, -214, 700, -213);
  ctx.lineTo(800, -213);
  ctx.stroke();

  const cuerpo = new Path2D();
  cuerpo.moveTo(396, -52);
  cuerpo.quadraticCurveTo(398, -86, 436, -86);
  cuerpo.lineTo(944, -86);
  cuerpo.quadraticCurveTo(1000, -86, 1002, -44);
  cuerpo.lineTo(1002, 30);
  cuerpo.quadraticCurveTo(1002, 74, 952, 74);
  cuerpo.lineTo(436, 74);
  cuerpo.quadraticCurveTo(398, 74, 396, 44);
  cuerpo.closePath();

  const fundicion = ctx.createLinearGradient(0, -86, 0, 74);
  fundicion.addColorStop(0, p.verdeMedio);
  fundicion.addColorStop(0.2, p.verdeAlto);
  fundicion.addColorStop(0.62, p.verdeMedio);
  fundicion.addColorStop(1, p.verdeBajo);
  ctx.fillStyle = fundicion;
  ctx.fill(cuerpo);

  ctx.save();
  ctx.clip(cuerpo);

  // Cantos: lo que hace que la fundicion parezca redonda y no un recorte
  const cantos = ctx.createLinearGradient(396, 0, 1002, 0);
  cantos.addColorStop(0, p.verdeCanto);
  cantos.addColorStop(0.14, p.verdeCantoSuave);
  cantos.addColorStop(0.88, p.verdeCantoSuave);
  cantos.addColorStop(1, p.verdeCanto);
  ctx.fillStyle = cantos;
  ctx.fillRect(396, -90, 610, 170);

  // Arista de luz del lomo
  ctx.fillStyle = p.verdeArista;
  rectRedondeado(ctx, 426, -80, 540, 16, 8);
  ctx.fill();

  // Junta de las dos mitades de la fundicion
  ctx.strokeStyle = p.verdeJunta;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(400, -4);
  ctx.lineTo(1000, -10);
  ctx.stroke();

  // Grasa del taller, como en la foto: un brillo aceitoso sobre el lomo
  ctx.fillStyle = p.aceite;
  ctx.beginPath();
  ctx.ellipse(548, -46, 88, 20, -0.06, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(474, -24, 26, 32, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = p.aceiteBrillo;
  ctx.beginPath();
  ctx.ellipse(542, -56, 46, 5, -0.06, 0, TAU);
  ctx.fill();

  // Grabado de fundicion: hueco oscuro y arista iluminada
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 54px ${TIPOGRAFIA_ESTRECHA}`;
  ctx.fillStyle = p.grabadoHueco;
  ctx.fillText(TEXTOS.arte.pistolaMarca, 730, 14);
  ctx.fillStyle = p.grabado;
  ctx.fillText(TEXTOS.arte.pistolaMarca, 730, 11);
  ctx.font = `700 30px ${TIPOGRAFIA_ESTRECHA}`;
  ctx.fillStyle = p.grabadoHueco;
  ctx.fillText(TEXTOS.arte.pistolaModelo, 730, 51);
  ctx.fillStyle = p.grabado;
  ctx.fillText(TEXTOS.arte.pistolaModelo, 730, 48);

  ctx.restore();

  // Mando moleteado de arriba
  ctx.fillStyle = p.ocluido;
  rectRedondeado(ctx, 856, -96, 74, 24, 8);
  ctx.fill();
  cilindro(ctx, 852, -152, 70, 66, 8, p.aceroAlto, p.aceroMedio, p.aceroBajo);
  moleteado(ctx, 852, -152, 70, 66, 11);

  // Regulador trasero: casquillo de laton y volante de acero
  cilindro(ctx, 996, -34, 38, 66, 6, p.latonAlto, p.latonMedio, p.latonBajo);
  cilindro(ctx, 1028, -52, 78, 100, 12, p.aceroAlto, p.aceroMedio, p.aceroBajo);
  moleteado(ctx, 1028, -52, 78, 100, 12);
}

/** Empunadura de fundicion y racor de laton con su enchufe rapido. */
function pintarEmpunadura(ctx: CanvasRenderingContext2D): void {
  const p = COLOR.pistola;

  const puno = new Path2D();
  puno.moveTo(706, 56);
  puno.lineTo(902, 46);
  puno.lineTo(1040, 420);
  puno.quadraticCurveTo(1052, 456, 1014, 462);
  puno.lineTo(884, 464);
  puno.quadraticCurveTo(848, 462, 840, 428);
  puno.closePath();

  // La luz entra por delante: el degradado va de cara a cara, no de arriba abajo
  const chapa = ctx.createLinearGradient(706, 56, 946, 30);
  chapa.addColorStop(0, p.verdeAlto);
  chapa.addColorStop(0.5, p.verdeMedio);
  chapa.addColorStop(1, p.verdeBajo);
  ctx.fillStyle = chapa;
  ctx.fill(puno);

  ctx.save();
  ctx.clip(puno);
  ctx.strokeStyle = p.verdeArista;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(716, 74);
  ctx.lineTo(852, 432);
  ctx.stroke();
  // Sombra que proyecta el cuerpo sobre el puno
  ctx.fillStyle = p.ocluido;
  ctx.fillRect(700, 46, 360, 22);
  ctx.restore();

  // Racor: cuello de fundicion, tuerca de laton y enchufe rapido
  cilindro(ctx, 838, 448, 90, 44, 8, p.verdeAlto, p.verdeMedio, p.verdeBajo);
  cilindro(ctx, 828, 488, 108, 64, 8, p.latonAlto, p.latonMedio, p.latonBajo);
  ctx.fillStyle = p.latonBajo;
  ctx.fillRect(828, 516, 108, 5);
  cilindro(ctx, 842, 550, 80, 48, 8, p.aceroAlto, p.aceroMedio, p.aceroBajo);
  moleteado(ctx, 842, 550, 80, 48, 11);
}

/** Los cuatro dedos rodeando la empunadura, del menique al indice. */
function pintarDedos(ctx: CanvasRenderingContext2D): void {
  // Repartidos sobre el borde delantero del puno, de (706, 56) a (840, 428)
  // Cada uno asoma lo suyo por delante del puno: cuatro dedos identicos
  // parecerian el muelle de la manguera, no una mano.
  const dedos: ReadonlyArray<readonly [number, number, number]> = [
    [0.92, 64, 48],
    [0.73, 76, 66],
    [0.54, 84, 76],
    [0.35, 80, 70],
  ];
  for (const [t, grosor, salida] of dedos) {
    pintarDedo(ctx, 706 + 134 * t, 56 + 372 * t, grosor, salida);
  }
}

/** Gatillo negro: cuelga por delante del puno, por encima del indice. */
function pintarGatillo(ctx: CanvasRenderingContext2D): void {
  const p = COLOR.pistola;

  const hoja = new Path2D();
  hoja.moveTo(668, 20);
  hoja.bezierCurveTo(646, 94, 656, 156, 700, 212);
  hoja.lineTo(766, 176);
  hoja.bezierCurveTo(722, 128, 712, 78, 730, 24);
  hoja.closePath();

  const acabado = ctx.createLinearGradient(640, 0, 760, 120);
  acabado.addColorStop(0, p.negroAlto);
  acabado.addColorStop(0.55, p.negroMedio);
  acabado.addColorStop(1, p.negroBajo);
  ctx.fillStyle = acabado;
  ctx.fill(hoja);

  ctx.save();
  ctx.clip(hoja);
  ctx.strokeStyle = p.guanteBrillo;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(660, 56);
  ctx.bezierCurveTo(652, 116, 666, 162, 706, 206);
  ctx.stroke();
  ctx.restore();

  // Eje del gatillo
  cilindro(ctx, 676, 2, 38, 38, 19, p.aceroAlto, p.aceroMedio, p.aceroBajo);
  ctx.strokeStyle = p.tornillo;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(684, 26);
  ctx.lineTo(706, 16);
  ctx.stroke();
}

/** Pulgar, que sube por el lado cercano del cuerpo hasta apoyarse en el. */
function pintarPulgar(ctx: CanvasRenderingContext2D): void {
  const p = COLOR.pistola;
  const cresta = (ancho: number, color: string, dx: number): void => {
    ctx.strokeStyle = color;
    ctx.lineWidth = ancho;
    ctx.beginPath();
    ctx.moveTo(1024 + dx, 22);
    ctx.quadraticCurveTo(1090 + dx, 148, 1186 + dx, 266);
    ctx.stroke();
  };
  cresta(118, p.guanteBajo, 0);
  cresta(104, p.guanteMedio, 0);
  cresta(38, p.guanteAlto, -28);
  ctx.strokeStyle = p.guanteReflejo;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(1002, 62);
  ctx.quadraticCurveTo(1050, 144, 1104, 212);
  ctx.stroke();
  // Nudillo del pulgar
  ctx.strokeStyle = p.guantePliegue;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(1062, 104);
  ctx.lineTo(1122, 74);
  ctx.stroke();
}
