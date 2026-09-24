import { AJUSTES } from '../config/ajustes';

/**
 * El canvas y su tamano. Se encarga del pixel ratio, de las reorganizaciones
 * (rotar el movil, la barra del navegador que aparece y desaparece) y de
 * bajar la resolucion si el aparato no da para mas.
 */
export class Lienzo {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  /** Medidas en pixeles CSS. El dibujo siempre trabaja en estas unidades. */
  ancho = 0;
  alto = 0;
  dpr = 1;

  /** 1 = maxima calidad; el motor la baja si los frames se alargan. */
  private calidad = 1;
  private pendiente = 0;
  private readonly oyentes: Array<() => void> = [];
  private readonly observador: ResizeObserver;
  private readonly alRedimensionar = () => this.programarAjuste();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Este navegador no soporta canvas 2D');
    this.ctx = ctx;

    this.observador = new ResizeObserver(() => this.programarAjuste());
    this.observador.observe(canvas);
    window.addEventListener('resize', this.alRedimensionar);
    window.addEventListener('orientationchange', this.alRedimensionar);
    window.visualViewport?.addEventListener('resize', this.alRedimensionar);

    this.ajustar();
  }

  /** Se avisa cuando cambia el tamano para rehacer cachés y geometria. */
  alCambiar(oyente: () => void): void {
    this.oyentes.push(oyente);
  }

  bajarCalidad(): boolean {
    const dprBase = Math.min(window.devicePixelRatio || 1, AJUSTES.dprMaximo);
    if (dprBase * this.calidad <= AJUSTES.dprMinimo) return false;
    this.calidad = Math.max(AJUSTES.dprMinimo / dprBase, this.calidad - 0.25);
    this.ajustar();
    return true;
  }

  private programarAjuste(): void {
    if (this.pendiente) return;
    this.pendiente = requestAnimationFrame(() => {
      this.pendiente = 0;
      this.ajustar();
    });
  }

  private ajustar(): void {
    const rect = this.canvas.getBoundingClientRect();
    const ancho = Math.max(1, Math.round(rect.width || window.innerWidth));
    const alto = Math.max(1, Math.round(rect.height || window.innerHeight));
    const dpr = Math.min(window.devicePixelRatio || 1, AJUSTES.dprMaximo) * this.calidad;

    const igual = ancho === this.ancho && alto === this.alto && dpr === this.dpr;
    if (igual) return;

    this.ancho = ancho;
    this.alto = alto;
    this.dpr = dpr;
    this.canvas.width = Math.round(ancho * dpr);
    this.canvas.height = Math.round(alto * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    for (const oyente of this.oyentes) oyente();
  }

  destruir(): void {
    if (this.pendiente) cancelAnimationFrame(this.pendiente);
    this.observador.disconnect();
    window.removeEventListener('resize', this.alRedimensionar);
    window.removeEventListener('orientationchange', this.alRedimensionar);
    window.visualViewport?.removeEventListener('resize', this.alRedimensionar);
    this.oyentes.length = 0;
  }
}

/** Crea un canvas fuera de pantalla para cachear dibujos que no cambian. */
export function lienzoCache(
  ancho: number,
  alto: number,
  dpr: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(ancho * dpr));
  canvas.height = Math.max(1, Math.ceil(alto * dpr));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear el canvas de cache');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { canvas, ctx };
}
