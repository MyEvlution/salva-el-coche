import { AJUSTES } from '../config/ajustes';
import { lienzoCache } from '../motor/lienzo';
import cocheUrl from '../assets/coche.webp';

/**
 * El coche: el dibujo del taller, visto por detras.
 *
 * La imagen viene a 1040 px y en pantalla se ve a 200 y pico. Reducirla en
 * cada frame es caro —el navegador vuelve a filtrarla entera cada vez—, asi
 * que se reduce una sola vez a un canvas del tamano bueno y por frame solo se
 * copia. De paso el filtrado sale mejor, porque se hace una vez y con calma.
 */
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
    this.cache = canvas;
  }

  /** `x` es el eje del coche y `base` la linea del suelo. */
  dibujar(ctx: CanvasRenderingContext2D, x: number, base: number): void {
    if (!this.cache) return;
    ctx.drawImage(this.cache, x - this.ancho / 2, base - this.alto, this.ancho, this.alto);
  }
}
