/**
 * Sonido sintetizado: ni un solo fichero de audio. Se crea al primer toque,
 * porque los navegadores no dejan sonar nada antes de que el usuario toque.
 */
export class Audio {
  private ctx: AudioContext | null = null;
  private maestro: GainNode | null = null;

  /** Se llama en el primer gesto del usuario. */
  desbloquear(): void {
    try {
      if (!this.ctx) {
        const Constructor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Constructor) return;
        this.ctx = new Constructor();
        this.maestro = this.ctx.createGain();
        this.maestro.gain.value = 0.9;
        this.maestro.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  disparo(): void {
    this.tono('square', 1100, 140, 0.09, 0.045);
  }

  acierto(): void {
    this.tono('sine', 240, 50, 0.2, 0.13);
  }

  derrota(): void {
    this.tono('sawtooth', 320, 50, 0.7, 0.09);
  }

  victoria(): void {
    this.tono('triangle', 520, 780, 0.18, 0.09);
    window.setTimeout(() => this.tono('triangle', 780, 1180, 0.32, 0.08), 150);
  }

  private tono(
    tipo: OscillatorType,
    desde: number,
    hasta: number,
    duracion: number,
    volumen: number,
  ): void {
    const ctx = this.ctx;
    const maestro = this.maestro;
    if (!ctx || !maestro || ctx.state !== 'running') return;
    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gan = ctx.createGain();
      osc.type = tipo;
      osc.frequency.setValueAtTime(desde, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, hasta), t + duracion);
      gan.gain.setValueAtTime(volumen, t);
      gan.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
      osc.connect(gan);
      gan.connect(maestro);
      osc.start(t);
      osc.stop(t + duracion + 0.03);
      osc.onended = () => {
        osc.disconnect();
        gan.disconnect();
      };
    } catch {
      /* si el navegador se queja, el juego sigue sin sonido */
    }
  }
}
