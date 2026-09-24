import { AJUSTES } from '../config/ajustes';

/**
 * Bucle de animacion con delta time. Se detiene solo cuando la pestana deja
 * de verse (asi no se gasta bateria ni se acumula tiempo a ciegas) y mide
 * cuanto tarda cada frame para poder bajar la calidad si hace falta.
 */
export class Bucle {
  /** Media movil del coste de un frame, en milisegundos. */
  msPorFrame = 16.7;

  private id = 0;
  private ultimo = 0;
  private corriendo = false;
  private framesLentos = 0;

  constructor(
    private readonly paso: (dt: number) => void,
    /** Se llama cuando el aparato no llega al presupuesto de frame. */
    private readonly alIrLento: () => void,
    /** Se llama cuando el juego pasa a segundo plano. */
    private readonly alOcultarse: () => void,
  ) {
    document.addEventListener('visibilitychange', this.alCambiarVisibilidad);
  }

  arrancar(): void {
    if (this.corriendo) return;
    this.corriendo = true;
    this.ultimo = performance.now();
    this.id = requestAnimationFrame(this.frame);
  }

  parar(): void {
    this.corriendo = false;
    if (this.id) cancelAnimationFrame(this.id);
    this.id = 0;
  }

  destruir(): void {
    this.parar();
    document.removeEventListener('visibilitychange', this.alCambiarVisibilidad);
  }

  private readonly alCambiarVisibilidad = (): void => {
    if (document.hidden) {
      this.alOcultarse();
      this.parar();
    } else {
      this.arrancar();
    }
  };

  private readonly frame = (ahora: number): void => {
    if (!this.corriendo) return;
    const crudo = (ahora - this.ultimo) / 1000;
    this.ultimo = ahora;

    this.msPorFrame += (Math.min(crudo * 1000, 200) - this.msPorFrame) * 0.08;
    if (this.msPorFrame > AJUSTES.presupuestoFrame) {
      if (++this.framesLentos >= AJUSTES.framesParaBajar) {
        this.framesLentos = 0;
        this.alIrLento();
      }
    } else if (this.framesLentos > 0) {
      this.framesLentos--;
    }

    this.paso(Math.min(AJUSTES.dtMaximo, crudo));
    this.id = requestAnimationFrame(this.frame);
  };
}
