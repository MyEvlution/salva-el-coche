import { TEXTOS } from '../config/textos';
import type { DatosPartida } from '../motor/juego';

/**
 * Marcador, progreso hacia el objetivo y boton de pausa. Va en HTML y no en
 * el canvas: el texto queda nitido, se lee con lector de pantalla y el boton
 * es un boton de verdad.
 */
export class Hud {
  private readonly raiz: HTMLDivElement;
  private readonly marcador: HTMLParagraphElement;
  private readonly relleno: HTMLDivElement;
  private readonly meta: HTMLParagraphElement;
  private ultimoPuntaje = -1;
  private ultimoInfinito = false;

  constructor(contenedor: HTMLElement, alPulsarPausa: () => void) {
    this.raiz = document.createElement('div');
    this.raiz.className = 'hud';
    this.raiz.setAttribute('aria-live', 'polite');

    const panel = document.createElement('div');
    panel.className = 'hud__panel';

    this.marcador = document.createElement('p');
    this.marcador.className = 'hud__marcador';
    this.marcador.textContent = '0';

    const barra = document.createElement('div');
    barra.className = 'hud__barra';
    this.relleno = document.createElement('div');
    this.relleno.className = 'hud__relleno';
    barra.appendChild(this.relleno);

    this.meta = document.createElement('p');
    this.meta.className = 'hud__meta';

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'hud__pausa';
    boton.setAttribute('aria-label', TEXTOS.hud.etiquetaPausa);
    boton.textContent = '❚❚';
    boton.addEventListener('click', alPulsarPausa);

    panel.append(this.marcador, barra, this.meta);
    this.raiz.append(panel, boton);
    contenedor.appendChild(this.raiz);
  }

  visible(mostrar: boolean): void {
    this.raiz.classList.toggle('hud--visible', mostrar);
  }

  actualizar(datos: DatosPartida, animar: boolean): void {
    if (datos.puntos !== this.ultimoPuntaje || datos.infinito !== this.ultimoInfinito) {
      this.ultimoPuntaje = datos.puntos;
      this.ultimoInfinito = datos.infinito;
      // Pasado el objetivo el marcador lo ensena: 101/100, 102/100...
      this.marcador.textContent = datos.infinito
        ? `${datos.puntos}/${datos.objetivo}`
        : String(datos.puntos);
      this.marcador.classList.toggle('hud__marcador--fraccion', datos.infinito);
      this.relleno.style.transform = `scaleX(${Math.min(1, datos.puntos / datos.objetivo)})`;
      this.meta.textContent = datos.infinito
        ? TEXTOS.hud.infinito
        : `${TEXTOS.hud.objetivo} ${datos.objetivo}`;
      if (animar) {
        this.marcador.classList.remove('hud__marcador--golpe');
        // Forzar el reinicio de la animacion sin recrear el elemento.
        void this.marcador.offsetWidth;
        this.marcador.classList.add('hud__marcador--golpe');
      }
    }
  }
}
