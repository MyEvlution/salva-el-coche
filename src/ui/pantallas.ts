/**
 * Las pantallas del juego (inicio, pausa, victoria y derrota) comparten una
 * sola tarjeta: cambia el contenido, no la estructura.
 */
export interface AccionPantalla {
  texto: string;
  alPulsar: () => void;
  secundaria?: boolean;
}

/**
 * Selector de nivel: una caja del tamano de un boton con una flecha a cada
 * lado. La flecha que no lleva a ningun sitio no se dibuja, pero deja su
 * hueco, para que el nombre del nivel no se descoloque.
 */
export interface SelectorPantalla {
  etiqueta: string;
  etiquetaAnterior: string;
  etiquetaSiguiente: string;
  alAnterior: (() => void) | null;
  alSiguiente: (() => void) | null;
}

export interface ContenidoPantalla {
  titulo: string;
  cuerpo?: string;
  detalle?: string;
  acciones: AccionPantalla[];
  selector?: SelectorPantalla;
  /** `portada` deja ver el escenario: velo suave y tarjeta arriba. */
  variante?: 'portada';
}

export class Pantallas {
  private readonly velo: HTMLDivElement;
  private readonly tarjeta: HTMLDivElement;
  private readonly titulo: HTMLHeadingElement;
  private readonly cuerpo: HTMLParagraphElement;
  private readonly detalle: HTMLParagraphElement;
  private readonly botonera: HTMLDivElement;

  constructor(contenedor: HTMLElement) {
    this.velo = document.createElement('div');
    this.velo.className = 'velo';

    this.tarjeta = document.createElement('div');
    this.tarjeta.className = 'tarjeta';
    this.tarjeta.setAttribute('role', 'dialog');
    this.tarjeta.setAttribute('aria-modal', 'false');

    this.titulo = document.createElement('h1');
    this.titulo.className = 'tarjeta__titulo';

    this.cuerpo = document.createElement('p');
    this.cuerpo.className = 'tarjeta__cuerpo';

    this.detalle = document.createElement('p');
    this.detalle.className = 'tarjeta__detalle';

    this.botonera = document.createElement('div');
    this.botonera.className = 'tarjeta__botonera';

    this.tarjeta.append(this.titulo, this.cuerpo, this.detalle, this.botonera);
    this.velo.appendChild(this.tarjeta);
    contenedor.appendChild(this.velo);
  }

  mostrar(contenido: ContenidoPantalla): void {
    this.titulo.textContent = contenido.titulo;

    this.cuerpo.textContent = contenido.cuerpo ?? '';
    this.cuerpo.hidden = !contenido.cuerpo;

    this.detalle.textContent = contenido.detalle ?? '';
    this.detalle.hidden = !contenido.detalle;

    this.botonera.replaceChildren();
    for (const accion of contenido.acciones) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = accion.secundaria ? 'boton boton--secundario' : 'boton';
      boton.textContent = accion.texto;
      boton.addEventListener('click', accion.alPulsar);
      this.botonera.appendChild(boton);
    }
    if (contenido.selector) this.botonera.appendChild(crearSelector(contenido.selector));

    this.velo.classList.toggle('velo--portada', contenido.variante === 'portada');
    this.velo.classList.add('velo--visible');
    const primero = this.botonera.firstElementChild;
    if (primero instanceof HTMLElement) primero.focus({ preventScroll: true });
  }

  ocultar(): void {
    this.velo.classList.remove('velo--visible');
  }
}

function crearSelector(selector: SelectorPantalla): HTMLDivElement {
  const caja = document.createElement('div');
  caja.className = 'selector';

  const flecha = (signo: string, etiqueta: string, alPulsar: (() => void) | null): HTMLElement => {
    if (!alPulsar) {
      const hueco = document.createElement('span');
      hueco.className = 'selector__hueco';
      hueco.setAttribute('aria-hidden', 'true');
      return hueco;
    }
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'selector__flecha';
    boton.textContent = signo;
    boton.setAttribute('aria-label', etiqueta);
    boton.addEventListener('click', alPulsar);
    return boton;
  };

  const nombre = document.createElement('span');
  nombre.className = 'selector__nivel';
  nombre.textContent = selector.etiqueta;

  caja.append(
    flecha('\u2039', selector.etiquetaAnterior, selector.alAnterior),
    nombre,
    flecha('\u203A', selector.etiquetaSiguiente, selector.alSiguiente),
  );
  return caja;
}
