import { AJUSTES } from '../config/ajustes';
import { lienzoCache } from '../motor/lienzo';
import cocheUrl from '../assets/coche.webp';
import { estampar } from './emblema';

/**
 * El coche: el dibujo del taller, visto por detras.
 *
 * La imagen viene a 1040 px y en pantalla se ve a 200 y pico. Reducirla en
 * cada frame es caro —el navegador vuelve a filtrarla entera cada vez—, asi
 * que se reduce una sola vez a un canvas del tamano bueno y por frame solo se
 * copia. De paso el filtrado sale mejor, porque se hace una vez y con calma.
 *
 * En ese mismo paso se le pone encima el emblema propio, tapando la marca del
 * fabricante que trae la foto. Va aqui y no en el archivo de la imagen para no
 * volver a codificarla: el dibujo original se queda como esta y el parche se
 * pinta al vuelo, una vez por tamano de pantalla.
 */

/**
 * Donde cae el emblema sobre el dibujo del coche, en fraccion de su tamano.
 * Medido sobre la chapa del porton; un pelo mayor que la marca que tapa.
 */
const EMBLEMA = { x: 0.4981, y: 0.4535, ancho: 0.0577, alto: 0.0791 };
export class Coche {
  private readonly imagen = new Image();
  private listo = false;
  private cache: HTMLCanvasElement | null = null;
  private ancho = 0;
  private alto = 0;
  private dpr = 1;

  constructor() {
    this.imagen.decoding = 'async';
    this.imagen.src = cocheUrl;
    void this.imagen
      .decode()
      .then(() => {
        this.listo = true;
        this.pintar();
      })
      .catch(() => {
        // Si el navegador no la descodifica, el juego sigue sin el coche
        // antes que caerse entero.
        this.listo = false;
      });
  }

  rehacer(ancho: number, dpr: number): void {
    this.ancho = ancho;
    this.alto = ancho * AJUSTES.coche.razonAlto;
    this.dpr = dpr;
    this.pintar();
  }

  private pintar(): void {
    if (!this.listo || this.ancho <= 0) return;
    const { canvas, ctx } = lienzoCache(this.ancho, this.alto, this.dpr);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.imagen, 0, 0, this.ancho, this.alto);
    estampar(ctx, EMBLEMA, this.ancho, this.alto, this.dpr);
    this.cache = canvas;
  }

  /** `x` es el eje del coche y `base` la linea del suelo. */
  dibujar(ctx: CanvasRenderingContext2D, x: number, base: number): void {
    if (!this.cache) return;
    ctx.drawImage(this.cache, x - this.ancho / 2, base - this.alto, this.ancho, this.alto);
  }
}
