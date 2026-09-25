/**
 * Entrada normalizada. El dedo manda; el raton y el teclado existen para
 * poder probar en el escritorio.
 *
 * Un solo puntero a la vez: apoyar dos dedos no dispara dos veces.
 *
 * Hay dos gestos porque hay dos niveles: el toque suelto, que dispara, y el
 * arrastre, que gira el volante. El nivel que no usa uno de los dos lo
 * ignora; aqui no se sabe cual es cual.
 */
export interface ManejadoresEntrada {
  toque(x: number, y: number): void;
  arrastrar(x: number, y: number): void;
  soltar(): void;
  alternarPausa(): void;
  reiniciar(): void;
}

export class Entrada {
  private punteroActivo: number | null = null;

  constructor(
    private readonly elemento: HTMLElement,
    private readonly manejadores: ManejadoresEntrada,
  ) {
    elemento.addEventListener('pointerdown', this.alPulsar, { passive: false });
    elemento.addEventListener('pointermove', this.alMover, { passive: false });
    elemento.addEventListener('pointerup', this.alSoltar);
    elemento.addEventListener('pointercancel', this.alSoltar);
    elemento.addEventListener('contextmenu', this.evitar);
    window.addEventListener('keydown', this.alTeclear);
  }

  destruir(): void {
    this.elemento.removeEventListener('pointerdown', this.alPulsar);
    this.elemento.removeEventListener('pointermove', this.alMover);
    this.elemento.removeEventListener('pointerup', this.alSoltar);
    this.elemento.removeEventListener('pointercancel', this.alSoltar);
    this.elemento.removeEventListener('contextmenu', this.evitar);
    window.removeEventListener('keydown', this.alTeclear);
  }

  private readonly evitar = (e: Event): void => e.preventDefault();

  private readonly alPulsar = (e: PointerEvent): void => {
    e.preventDefault();
    if (this.punteroActivo !== null) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    this.punteroActivo = e.pointerId;
    // Con captura el arrastre sigue llegando aunque el dedo se salga del
    // lienzo: sin esto, girar el volante hasta el borde lo deja colgado.
    try {
      this.elemento.setPointerCapture(e.pointerId);
    } catch {
      /* si el navegador no deja capturar, el gesto sigue funcionando dentro */
    }
    const rect = this.elemento.getBoundingClientRect();
    this.manejadores.toque(e.clientX - rect.left, e.clientY - rect.top);
  };

  private readonly alMover = (e: PointerEvent): void => {
    if (this.punteroActivo !== e.pointerId) return;
    e.preventDefault();
    const rect = this.elemento.getBoundingClientRect();
    this.manejadores.arrastrar(e.clientX - rect.left, e.clientY - rect.top);
  };

  private readonly alSoltar = (e: PointerEvent): void => {
    if (this.punteroActivo !== e.pointerId) return;
    this.punteroActivo = null;
    this.manejadores.soltar();
  };

  private readonly alTeclear = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    const tecla = e.key.toLowerCase();
    if (tecla === 'escape' || tecla === 'p') {
      e.preventDefault();
      this.manejadores.alternarPausa();
    } else if (tecla === 'r') {
      e.preventDefault();
      this.manejadores.reiniciar();
    }
  };
}
