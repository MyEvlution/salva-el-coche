/**
 * Las pantallas del juego (inicio, pausa, victoria y derrota) comparten una
 * sola tarjeta: cambia el contenido, no la estructura.
 */
export interface AccionPantalla {
  texto: string;
  alPulsar: () => void;
  secundaria?: boolean;
}

export interface ContenidoPantalla {
  titulo: string;
  cuerpo?: string;
  detalle?: string;
  acciones: AccionPantalla[];
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

    this.velo.classList.add('velo--visible');
    const primero = this.botonera.firstElementChild;
    if (primero instanceof HTMLElement) primero.focus({ preventScroll: true });
  }

  ocultar(): void {
    this.velo.classList.remove('velo--visible');
  }
}
