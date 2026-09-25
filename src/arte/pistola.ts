import { AJUSTES } from '../config/ajustes';
import { lienzoCache } from '../motor/lienzo';
import pistolaUrl from '../assets/pistola.webp';
import { TAU } from './formas';

/**
 * La pistola de aire, en primera persona: el dibujo del taller con la mano
 * enguantada y la manguera ya puestos.
 *
 * Al ser una imagen, la perspectiva viene dada y no hay que fingirla: el
 * escorzo que antes se calculaba esta pintado. Lo unico que hace este modulo
 * es colocarla, girarla un poco hacia donde se toca y decir donde cae la
 * punta del canon, que es de donde salen el fogonazo y el trazador.
 *
 * Coordenadas locales = pixeles del dibujo. Como el coche, se reduce una sola
 * vez a un canvas del tamano bueno: filtrar una imagen de 900 px en cada
 * frame cuesta mas que todo lo demas junto.
 */

const DIBUJO = { ancho: 900, alto: 1023 };

/** Punta del canon, medida sobre el propio dibujo. */
const PUNTA = { x: 4, y: 116 };

/** Punto de agarre: el centro del puno, y el eje del giro. */
const PIVOTE = { x: 375, y: 605 };

/** Vector del agarre a la punta. Da el eje del canon y su largo. */
const CANON = { x: PUNTA.x - PIVOTE.x, y: PUNTA.y - PIVOTE.y };
const CANON_LARGO = Math.hypot(CANON.x, CANON.y);
const CANON_ANGULO = Math.atan2(CANON.y, CANON.x);

/**
 * La imagen ya viene en su postura, asi que el reposo es no girarla nada:
 * el angulo que maneja el juego es cuanto se desvia de ella.
 */
export const ANGULO_REPOSO = 0;

/** Limites del giro, para que la muneca no acabe en una postura imposible. */
const ANGULO_MINIMO = -0.42;
const ANGULO_MAXIMO = 0.42;

export interface PuntaPistola {
  /** Punta del canon, de donde sale el disparo. */
  x: number;
  y: number;
  /** Punto de agarre en pantalla. */
  px: number;
  py: number;
}

export class Pistola {
  private readonly imagen = new Image();
  private listo = false;
  private cache: HTMLCanvasElement | null = null;
  private escala = 0.2;
  private dpr = 1;
  private pivoteX = 0;
  private pivoteY = 0;

  constructor() {
    this.imagen.decoding = 'async';
    this.imagen.src = pistolaUrl;
    void this.imagen
      .decode()
      .then(() => {
        this.listo = true;
        this.pintar();
      })
      .catch(() => {
        this.listo = false;
      });
  }

  rehacer(ancho: number, alto: number, dpr: number): void {
    const p = AJUSTES.pistola;
    this.escala = Math.min(
      (ancho * p.anchoRelativo) / DIBUJO.ancho,
      (alto * p.altoRelativo) / DIBUJO.alto,
    );
    // La esquina de abajo a la derecha se sale un poco de la pantalla: en
    // primera persona la mano tiene que entrar por el borde, no flotar.
    this.pivoteX = ancho * p.anclaX - (DIBUJO.ancho - PIVOTE.x) * this.escala;
    this.pivoteY = alto * p.anclaY - (DIBUJO.alto - PIVOTE.y) * this.escala;
    this.dpr = dpr;
    this.pintar();
  }

  private pintar(): void {
    if (!this.listo || this.escala <= 0) return;
    const ancho = DIBUJO.ancho * this.escala;
    const alto = DIBUJO.alto * this.escala;
    const { canvas, ctx } = lienzoCache(ancho, alto, this.dpr);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.imagen, 0, 0, ancho, alto);
    this.cache = canvas;
  }

  /** Posicion de la punta del canon para un angulo y un retroceso dados. */
  punta(angulo: number, retroceso: number, destino: PuntaPistola): PuntaPistola {
    const cos = Math.cos(angulo);
    const sin = Math.sin(angulo);
    const e = this.escala;
    // El retroceso empuja la pistola hacia atras por el eje del canon
    const atras = (retroceso * AJUSTES.pistola.retroceso * e) / CANON_LARGO;
    const px = this.pivoteX - (CANON.x * cos - CANON.y * sin) * atras;
    const py = this.pivoteY - (CANON.x * sin + CANON.y * cos) * atras;
    destino.px = px;
    destino.py = py;
    destino.x = px + (CANON.x * cos - CANON.y * sin) * e;
    destino.y = py + (CANON.x * sin + CANON.y * cos) * e;
    return destino;
  }

  /** Cuanto hay que girar el dibujo para que el canon mire al punto tocado. */
  anguloHacia(x: number, y: number, auxiliar: PuntaPistola): number {
    let angulo = ANGULO_REPOSO;
    for (let i = 0; i < 2; i++) {
      const t = this.punta(angulo, 0, auxiliar);
      let giro = Math.atan2(y - t.py, x - t.px) - CANON_ANGULO;
      while (giro > Math.PI) giro -= TAU;
      while (giro < -Math.PI) giro += TAU;
      angulo = Math.max(ANGULO_MINIMO, Math.min(ANGULO_MAXIMO, giro));
    }
    return angulo;
  }

  dibujar(
    ctx: CanvasRenderingContext2D,
    angulo: number,
    retroceso: number,
    desplazX: number,
    desplazY: number,
    auxiliar: PuntaPistola,
  ): void {
    if (!this.cache) return;
    const t = this.punta(angulo, retroceso, auxiliar);
    const e = this.escala;
    ctx.save();
    ctx.translate(t.px + desplazX, t.py + desplazY);
    ctx.rotate(angulo);
    ctx.drawImage(
      this.cache,
      -PIVOTE.x * e,
      -PIVOTE.y * e,
      DIBUJO.ancho * e,
      DIBUJO.alto * e,
    );
    ctx.restore();
  }
}
