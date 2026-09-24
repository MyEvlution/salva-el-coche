import { AJUSTES } from '../config/ajustes';

interface Particula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radio: number;
  vida: number;
  duracion: number;
  color: string;
}

/**
 * Deposito de particulas de tamano fijo: se reservan todas al arrancar y se
 * reutilizan. Asi no se crea ni se tira memoria mientras se juega, que es de
 * donde salen los tironcillos en los moviles modestos.
 */
export class Particulas {
  private readonly deposito: Particula[] = [];
  private activas = 0;

  constructor(maximo: number = AJUSTES.particulas.maximo) {
    for (let i = 0; i < maximo; i++) {
      this.deposito.push({ x: 0, y: 0, vx: 0, vy: 0, radio: 0, vida: 0, duracion: 1, color: '#000' });
    }
  }

  get cuantas(): number {
    return this.activas;
  }

  limpiar(): void {
    this.activas = 0;
  }

  emitir(
    x: number,
    y: number,
    vx: number,
    vy: number,
    radio: number,
    duracion: number,
    color: string,
  ): void {
    if (this.activas >= this.deposito.length) return;
    const p = this.deposito[this.activas] as Particula;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.radio = radio;
    p.vida = 0;
    p.duracion = duracion;
    p.color = color;
    this.activas++;
  }

  actualizar(dt: number): void {
    const g = AJUSTES.particulas.gravedad * dt;
    for (let i = 0; i < this.activas; i++) {
      const p = this.deposito[i] as Particula;
      p.vida += dt;
      if (p.vida >= p.duracion) {
        // Se cambia por la ultima activa y se acorta la lista: sin huecos.
        this.activas--;
        this.deposito[i] = this.deposito[this.activas] as Particula;
        this.deposito[this.activas] = p;
        i--;
        continue;
      }
      p.vy += g;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  dibujar(ctx: CanvasRenderingContext2D): void {
    if (this.activas === 0) return;
    for (let i = 0; i < this.activas; i++) {
      const p = this.deposito[i] as Particula;
      const alfa = 1 - p.vida / p.duracion;
      ctx.globalAlpha = alfa;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.radio * alfa), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
