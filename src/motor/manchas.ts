import { AJUSTES } from '../config/ajustes';
import { COLOR } from '../config/tema';
import { conAlfa } from '../arte/formas';

interface Mancha {
  x: number;
  y: number;
  radio: number;
  vida: number;
  /** Cuatro borrones (x, y, radio) que le dan forma irregular. */
  borrones: Float32Array;
}

const BORRONES = 4;

/**
 * El rastro que deja un monstruo abatido: una mancha de producto en el suelo
 * que se va secando. Deposito fijo, como las particulas.
 */
export class Manchas {
  private readonly deposito: Mancha[] = [];
  private activas = 0;

  constructor(maximo: number = AJUSTES.manchas.maximo) {
    for (let i = 0; i < maximo; i++) {
      this.deposito.push({ x: 0, y: 0, radio: 0, vida: 0, borrones: new Float32Array(BORRONES * 3) });
    }
  }

  limpiar(): void {
    this.activas = 0;
  }

  /** `y` es la linea del suelo donde estaba el monstruo. */
  emitir(x: number, y: number, radio: number): void {
    // Si el deposito esta lleno se reutiliza la mancha mas vieja.
    let m: Mancha;
    if (this.activas < this.deposito.length) {
      m = this.deposito[this.activas] as Mancha;
      this.activas++;
    } else {
      m = this.deposito[0] as Mancha;
      for (let i = 1; i < this.activas; i++) {
        const otra = this.deposito[i] as Mancha;
        if (otra.vida > m.vida) m = otra;
      }
    }
    m.x = x;
    m.y = y;
    m.radio = radio;
    m.vida = 0;
    for (let i = 0; i < BORRONES; i++) {
      m.borrones[i * 3] = (Math.random() - 0.5) * 1.1;
      m.borrones[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      m.borrones[i * 3 + 2] = 0.42 + Math.random() * 0.45;
    }
  }

  actualizar(dt: number): void {
    for (let i = 0; i < this.activas; i++) {
      const m = this.deposito[i] as Mancha;
      m.vida += dt;
      if (m.vida >= AJUSTES.manchas.duracion) {
        this.activas--;
        this.deposito[i] = this.deposito[this.activas] as Mancha;
        this.deposito[this.activas] = m;
        i--;
      }
    }
  }

  dibujar(ctx: CanvasRenderingContext2D): void {
    if (this.activas === 0) return;
    for (let i = 0; i < this.activas; i++) {
      const m = this.deposito[i] as Mancha;
      // Se queda opaca un momento y luego se seca.
      const t = m.vida / AJUSTES.manchas.duracion;
      const alfa = AJUSTES.manchas.alfa * (1 - t * t);
      ctx.fillStyle = conAlfa(COLOR.efectos.mancha, alfa);
      for (let b = 0; b < BORRONES; b++) {
        const rx = (m.borrones[b * 3 + 2] as number) * m.radio;
        ctx.beginPath();
        ctx.ellipse(
          m.x + (m.borrones[b * 3] as number) * m.radio,
          m.y + (m.borrones[b * 3 + 1] as number) * m.radio * 0.3,
          rx,
          rx * 0.3,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
  }
}
