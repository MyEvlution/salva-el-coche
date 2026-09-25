import { AJUSTES } from '../config/ajustes';
import { lienzoCache } from '../motor/lienzo';
import interiorColorUrl from '../assets/interior.jpg';
import interiorMascaraUrl from '../assets/interior-mascara.png';
import volanteColorUrl from '../assets/volante.jpg';
import volanteMascaraUrl from '../assets/volante-mascara.png';

/**
 * El interior del coche en primera persona: el dibujo del salpicadero, con
 * el hueco del parabrisas por donde se ve la partida, y el volante suelto
 * para poder girarlo.
 *
 * El dibujo venia en una sola pieza con el volante pintado dentro. Aqui se
 * usa ya partido en dos: el salpicadero con el hueco del volante relleno, y
 * el volante recortado y centrado en su eje. Girar el segundo sobre el
 * primero es todo el truco; no hay nada dibujado a mano.
 *
 * Cada pieza llega en dos archivos —el color en JPEG y el recorte en PNG—
 * y se unen una sola vez al cargar. Un PNG con transparencia de este tamano
 * pesaria seis veces mas, y en un movil eso es la diferencia entre entrar al
 * nivel y quedarse mirando una pantalla negra.
 */

/** Medidas del dibujo original, en sus propios pixeles. */
const DIBUJO = { ancho: 1024, alto: 1536 };

/**
 * Franja transparente del parabrisas, medida sobre el dibujo. El borde de
 * abajo es el del centro del cristal, que es por donde se juega: mas a la
 * izquierda el hueco baja hasta la ventanilla, pero por ahi no viene nadie.
 */
const VENTANA = { arriba: 59, abajo: 523 };

/** Eje de giro del volante, medido sobre el dibujo. */
const EJE = { x: 456, y: 832 };

/** Lado del recorte del volante y radio de su llanta, en pixeles del dibujo. */
const VOLANTE = { lado: 552, radio: 268 };

/** Donde cae el interior en la pantalla y que medidas deja para la partida. */
export interface Colocacion {
  escala: number;
  x: number;
  y: number;
  /** Franja de pantalla por la que se ve la carretera. */
  ventana: { arriba: number; abajo: number };
  /** Eje del volante en pantalla, que es tambien el eje del gesto. */
  ejeX: number;
  ejeY: number;
  /** Radio de la llanta en pantalla. */
  radio: number;
  /** Punto de fuga: el centro del dibujo, que es a donde mira la foto. */
  fugaX: number;
}

/**
 * Coloca el dibujo cubriendo la pantalla entera: lo que sobra se sale por
 * los lados o por abajo, nunca se ve un borde. En vertical cabe casi justo;
 * en apaisado se recorta por arriba y por abajo, y entonces manda el foco:
 * se conserva el parabrisas y la parte de arriba del volante, que es lo que
 * se mira y lo que se toca.
 */
export function colocar(ancho: number, alto: number): Colocacion {
  const escala = Math.max(ancho / DIBUJO.ancho, alto / DIBUJO.alto);
  const x = (ancho - DIBUJO.ancho * escala) / 2;
  const deseada = alto * AJUSTES.interior.ejeEnPantalla - EJE.y * escala;
  // Siempre cubriendo: ni hueco arriba ni hueco abajo.
  const y = Math.min(0, Math.max(alto - DIBUJO.alto * escala, deseada));
  return {
    escala,
    x,
    y,
    ventana: { arriba: y + VENTANA.arriba * escala, abajo: y + VENTANA.abajo * escala },
    ejeX: x + EJE.x * escala,
    ejeY: y + EJE.y * escala,
    radio: VOLANTE.radio * escala,
    fugaX: x + (DIBUJO.ancho / 2) * escala,
  };
}

export class Interior {
  private salpicadero: HTMLCanvasElement | null = null;
  private volante: HTMLCanvasElement | null = null;
  private cacheSalpicadero: HTMLCanvasElement | null = null;
  private cacheVolante: HTMLCanvasElement | null = null;
  private colocacion: Colocacion | null = null;
  private dpr = 1;
  private ladoVolante = 0;

  constructor() {
    void Promise.all([
      unir(interiorColorUrl, interiorMascaraUrl, DIBUJO.ancho, DIBUJO.alto),
      unir(volanteColorUrl, volanteMascaraUrl, VOLANTE.lado, VOLANTE.lado),
    ])
      .then(([salpicadero, volante]) => {
        this.salpicadero = salpicadero;
        this.volante = volante;
        this.pintar();
      })
      .catch(() => {
        /* sin dibujo se sigue viendo la carretera: el nivel no se cae */
      });
  }

  rehacer(colocacion: Colocacion, dpr: number): void {
    this.colocacion = colocacion;
    this.dpr = dpr;
    this.pintar();
  }

  /**
   * Las dos piezas se reducen una sola vez al tamano al que se ven. Escalar
   * un dibujo de 1024 px en cada frame cuesta mas que toda la carretera.
   */
  private pintar(): void {
    const c = this.colocacion;
    if (!c || !this.salpicadero || !this.volante) return;

    const ancho = DIBUJO.ancho * c.escala;
    const alto = DIBUJO.alto * c.escala;
    const fondo = lienzoCache(ancho, alto, this.dpr);
    fondo.ctx.imageSmoothingQuality = 'high';
    fondo.ctx.drawImage(this.salpicadero, 0, 0, ancho, alto);
    this.cacheSalpicadero = fondo.canvas;

    this.ladoVolante = VOLANTE.lado * c.escala;
    const rueda = lienzoCache(this.ladoVolante, this.ladoVolante, this.dpr);
    rueda.ctx.imageSmoothingQuality = 'high';
    rueda.ctx.drawImage(this.volante, 0, 0, this.ladoVolante, this.ladoVolante);
    this.cacheVolante = rueda.canvas;
  }

  /** El salpicadero, que tapa todo menos el hueco del parabrisas. */
  dibujarSalpicadero(ctx: CanvasRenderingContext2D): void {
    const c = this.colocacion;
    if (!c || !this.cacheSalpicadero) return;
    ctx.drawImage(this.cacheSalpicadero, c.x, c.y, DIBUJO.ancho * c.escala, DIBUJO.alto * c.escala);
  }

  /** El volante, girado sobre su eje. */
  dibujarVolante(ctx: CanvasRenderingContext2D, angulo: number): void {
    const c = this.colocacion;
    if (!c || !this.cacheVolante) return;
    const mitad = this.ladoVolante / 2;
    ctx.save();
    ctx.translate(c.ejeX, c.ejeY);
    ctx.rotate(angulo);
    ctx.drawImage(this.cacheVolante, -mitad, -mitad, this.ladoVolante, this.ladoVolante);
    ctx.restore();
  }
}

/** Junta el color y su recorte en un solo dibujo con transparencia. */
function unir(
  colorUrl: string,
  mascaraUrl: string,
  ancho: number,
  alto: number,
): Promise<HTMLCanvasElement> {
  return Promise.all([cargar(colorUrl), cargar(mascaraUrl)]).then(([color, mascara]) => {
    const { canvas, ctx } = lienzoCache(ancho, alto, 1);
    ctx.drawImage(color, 0, 0, ancho, alto);
    // La mascara es negro transparente: `destination-in` se queda con el
    // color donde ella tiene alfa y borra el resto.
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(mascara, 0, 0, ancho, alto);
    ctx.globalCompositeOperation = 'source-over';
    return canvas;
  });
}

function cargar(url: string): Promise<HTMLImageElement> {
  const imagen = new Image();
  imagen.decoding = 'async';
  imagen.src = url;
  return imagen.decode().then(() => imagen);
}
