import { AJUSTES } from '../config/ajustes';
import { TEXTOS } from '../config/textos';
import { COLOR, TIPOGRAFIA_ESTRECHA } from '../config/tema';
import { lienzoCache } from '../motor/lienzo';
import { TAU, rectRedondeado } from './formas';

/**
 * La pistola de producto antioxido, en primera persona y con el guante puesto.
 *
 * El dibujo se cachea entero (es la pieza mas cara del juego) y por frame solo
 * se gira y se copia. Lo unico que se pinta en vivo es el antebrazo y la
 * manguera, porque cuelgan hasta el borde de la pantalla.
 */

/** Punto de agarre, en coordenadas locales del dibujo. */
const PIVOTE = { x: 880, y: 230 };

/**
 * Angulo de reposo. Con el escorzo aplicado, la empunadura queda casi
 * vertical: la postura con la que se sujeta una pistola de verdad, no
 * ladeada.
 */
export const ANGULO_REPOSO = 0.36;

/** Limites de giro para que la muneca no acabe en una postura imposible. */
const ANGULO_MINIMO = 0.05;
const ANGULO_MAXIMO = 0.95;

/** Puntos extremos que deben caber en la zona reservada a la pistola. */
const EXTREMOS: ReadonlyArray<readonly [number, number]> = [
  [0, -46],
  [0, 46],
  [820, -240],
  [850, -168],
  [1107, -40],
  [1107, 40],
  [1050, 545],
  [890, 495],
  [644, 150],
  [744, 415],
  [430, 400],
];

/** Region cacheada, en coordenadas locales. */
const CACHE = { x: -60, y: -290, ancho: 1300, alto: 930 };

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
    const t = this.punta(angulo, retroceso, auxiliar);
    const ox = t.px + desplazX;
    const oy = t.py + desplazY;
    const cos = Math.cos(angulo);
    const sin = Math.sin(angulo);
    const g = this.ganancia;

    // Manguera azul con muelle: sale del racor y cuelga hasta el borde
    const lx = (443 - PIVOTE.x) * g * AJUSTES.pistola.escorzo;
    const ly = (520 - PIVOTE.y) * g;
    const hx = ox + lx * cos - ly * sin;
    const hy = oy + lx * sin + ly * cos;
    ctx.lineCap = 'round';
    ctx.strokeStyle = COLOR.pistola.manguera;
    ctx.lineWidth = 34 * g;
    trazarManguera(ctx, hx, hy, ancho, alto);
    ctx.strokeStyle = COLOR.pistola.muelle;
    ctx.lineWidth = 30 * g;
    ctx.lineCap = 'butt';
    ctx.setLineDash([9 * g, 13 * g]);
    trazarManguera(ctx, hx, hy, ancho, alto);
    ctx.setLineDash([]);
    ctx.lineCap = 'round';

    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(angulo);
    // El escorzo comprime el dibujo a lo largo del canon: la pistola deja de
    // verse de perfil y parece que apunta hacia dentro de la pantalla.
    ctx.scale(g * AJUSTES.pistola.escorzo, g);
    ctx.translate(-PIVOTE.x, -PIVOTE.y);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Antebrazo y dorso de la mano: por detras de la pistola y hasta el borde
    ctx.strokeStyle = COLOR.pistola.guante;
    ctx.lineWidth = 400;
    ctx.beginPath();
    ctx.moveTo(1230, 480);
    ctx.lineTo(1800, 1500);
    ctx.stroke();
    ctx.fillStyle = COLOR.pistola.guante;
    ctx.beginPath();
    ctx.ellipse(1150, 330, 190, 300, 0.32, 0, TAU);
    ctx.fill();
    ctx.fillStyle = COLOR.pistola.brilloGuante;
    ctx.beginPath();
    ctx.ellipse(1115, 230, 55, 110, 0.32, 0, TAU);
    ctx.fill();

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

/** Todo el dibujo que no se mueve: se pinta una vez en el canvas de cache. */
function pintarPistola(ctx: CanvasRenderingContext2D): void {
  const p = COLOR.pistola;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const moleteado = (x: number, y: number, ancho: number, alto: number, paso: number): void => {
    ctx.strokeStyle = p.aceroOscuro;
    ctx.lineWidth = 3;
    ctx.lineCap = 'butt';
    for (let k = paso; k < ancho; k += paso) {
      ctx.beginPath();
      ctx.moveTo(x + k, y + 4);
      ctx.lineTo(x + k, y + alto - 4);
      ctx.stroke();
    }
    ctx.lineCap = 'round';
  };

  // Gancho superior
  ctx.strokeStyle = p.verde;
  ctx.lineWidth = 34;
  ctx.beginPath();
  ctx.moveTo(650, -90);
  ctx.lineTo(672, -205);
  ctx.lineTo(820, -222);
  ctx.lineTo(832, -168);
  ctx.stroke();

  // Entrada de liquido: cuello verde y racores de laton y acero
  ctx.fillStyle = p.verde;
  rectRedondeado(ctx, 410, 60, 66, 150, 20);
  ctx.fill();
  ctx.fillStyle = p.acero;
  rectRedondeado(ctx, 418, 205, 50, 28, 4);
  ctx.fill();
  ctx.fillStyle = p.laton;
  rectRedondeado(ctx, 404, 231, 78, 84, 6);
  ctx.fill();
  ctx.fillStyle = p.latonClaro;
  ctx.fillRect(408, 235, 16, 76);
  ctx.fillStyle = p.latonOscuro;
  ctx.fillRect(462, 235, 16, 76);
  ctx.fillStyle = p.laton;
  rectRedondeado(ctx, 404, 315, 78, 88, 6);
  ctx.fill();
  ctx.fillStyle = p.latonClaro;
  ctx.fillRect(408, 319, 16, 80);
  ctx.fillStyle = p.latonOscuro;
  ctx.fillRect(462, 319, 16, 80);
  ctx.fillStyle = p.acero;
  rectRedondeado(ctx, 412, 403, 62, 70, 6);
  ctx.fill();
  ctx.fillStyle = p.aceroClaro;
  ctx.fillRect(416, 407, 14, 62);
  ctx.fillStyle = p.aceroOscuro;
  rectRedondeado(ctx, 420, 473, 46, 50, 6);
  ctx.fill();

  // Punta: boquilla moleteada, anillo rojo y cuerpo hexagonal
  ctx.fillStyle = p.acero;
  rectRedondeado(ctx, 0, -46, 135, 92, 12);
  ctx.fill();
  moleteado(0, -46, 135, 92, 14);
  ctx.fillStyle = p.anilloRojo;
  ctx.fillRect(135, -52, 34, 104);
  ctx.fillStyle = p.anilloRojoClaro;
  ctx.fillRect(135, -52, 34, 14);
  ctx.fillStyle = p.aceroMedio;
  ctx.fillRect(169, -46, 140, 92);
  ctx.fillStyle = p.aceroClaro;
  ctx.fillRect(169, -46, 140, 22);
  ctx.strokeStyle = p.aceroOscuro;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(240, -46);
  ctx.lineTo(240, 46);
  ctx.stroke();
  ctx.fillStyle = p.boquillaOscura;
  rectRedondeado(ctx, 309, -66, 84, 132, 14);
  ctx.fill();

  // Cuerpo verde
  ctx.fillStyle = p.verde;
  rectRedondeado(ctx, 389, -88, 620, 156, 36);
  ctx.fill();
  ctx.fillStyle = p.brillo;
  rectRedondeado(ctx, 410, -78, 560, 22, 11);
  ctx.fill();
  ctx.fillStyle = p.sombra;
  rectRedondeado(ctx, 410, 40, 560, 20, 10);
  ctx.fill();

  // Goteron de producto sobre el cabezal
  ctx.fillStyle = p.producto;
  ctx.beginPath();
  ctx.ellipse(500, -86, 48, 16, 0, 0, TAU);
  ctx.fill();
  rectRedondeado(ctx, 480, -90, 22, 58, 11);
  ctx.fill();
  ctx.fillStyle = p.productoBrillo;
  ctx.beginPath();
  ctx.ellipse(488, -92, 20, 5, 0, 0, TAU);
  ctx.fill();

  // Empunadura inclinada
  ctx.fillStyle = p.verde;
  ctx.beginPath();
  ctx.moveTo(705, 40);
  ctx.lineTo(905, 40);
  ctx.lineTo(1050, 455);
  ctx.quadraticCurveTo(1062, 488, 1030, 492);
  ctx.lineTo(890, 492);
  ctx.quadraticCurveTo(858, 490, 852, 458);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = p.verdeClaro;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(714, 62);
  ctx.lineTo(860, 440);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = p.acero;
  rectRedondeado(ctx, 925, 490, 60, 34, 6);
  ctx.fill();
  moleteado(925, 490, 60, 34, 10);
  ctx.fillStyle = p.aceroOscuro;
  rectRedondeado(ctx, 1000, 490, 50, 50, 6);
  ctx.fill();

  // Texto grabado
  ctx.fillStyle = p.grabado;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 52px ${TIPOGRAFIA_ESTRECHA}`;
  ctx.fillText(TEXTOS.arte.pistolaMarca, 735, 8);
  ctx.font = `700 30px ${TIPOGRAFIA_ESTRECHA}`;
  ctx.fillText(TEXTOS.arte.pistolaModelo, 735, 44);

  // Gatillo. Va mas grueso de lo que parece: el escorzo lo estrecha.
  ctx.strokeStyle = p.verdeOscuro;
  ctx.lineWidth = 62;
  ctx.beginPath();
  ctx.moveTo(650, -20);
  ctx.bezierCurveTo(640, 80, 690, 180, 745, 235);
  ctx.stroke();
  ctx.strokeStyle = p.verdeGatillo;
  ctx.lineWidth = 44;
  ctx.beginPath();
  ctx.moveTo(650, -20);
  ctx.bezierCurveTo(640, 80, 690, 180, 745, 235);
  ctx.stroke();

  // Tornillo, mando superior y regulador trasero
  ctx.fillStyle = p.acero;
  ctx.beginPath();
  ctx.arc(640, -34, 26, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = p.tornillo;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(624, -28);
  ctx.lineTo(656, -40);
  ctx.stroke();
  ctx.fillStyle = p.acero;
  rectRedondeado(ctx, 800, -140, 66, 56, 6);
  ctx.fill();
  moleteado(800, -140, 66, 56, 11);
  ctx.fillStyle = p.laton;
  rectRedondeado(ctx, 1005, -24, 40, 48, 6);
  ctx.fill();
  ctx.fillStyle = p.acero;
  rectRedondeado(ctx, 1045, -40, 62, 80, 10);
  ctx.fill();
  moleteado(1045, -40, 62, 80, 10);

  // Guante: dedos alrededor de la empunadura y pulgar sobre el cuerpo
  const borde = (y: number): number => 705 + (y - 40) * 0.352;
  const dedos: ReadonlyArray<readonly [number, number]> = [
    [150, 76],
    [240, 76],
    [330, 72],
    [415, 62],
  ];
  for (const [y, grosor] of dedos) {
    const x = borde(y);
    ctx.strokeStyle = p.guante;
    ctx.lineWidth = grosor;
    ctx.beginPath();
    ctx.moveTo(x - 62, y);
    ctx.lineTo(x + 260, y - 14);
    ctx.stroke();
    ctx.strokeStyle = p.guanteBrillo;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x - 44, y - grosor * 0.28);
    ctx.lineTo(x + 120, y - grosor * 0.28 - 6);
    ctx.stroke();
  }
  ctx.strokeStyle = p.guante;
  ctx.lineWidth = 86;
  ctx.beginPath();
  ctx.moveTo(1130, 170);
  ctx.lineTo(1010, -10);
  ctx.stroke();
  ctx.strokeStyle = p.guanteBrillo;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(1092, 118);
  ctx.lineTo(1020, -14);
  ctx.stroke();
}
