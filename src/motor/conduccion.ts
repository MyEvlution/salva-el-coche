import { AJUSTES } from '../config/ajustes';
import { COLOR } from '../config/tema';
import { Carretera } from '../arte/carretera';
import { Interior, colocar, type Colocacion } from '../arte/interior';
import { TAU } from '../arte/formas';
import { MONSTRUO_LOCAL, type Monstruo, aperturaNormal } from '../arte/monstruo';
import { calcularGeometriaConduccion, proyectarConduccion, type GeometriaConduccion } from './geometria';
import type { Particulas } from './particulas';
import type { NivelConduccion, Proyeccion, Rampa } from './tipos';

/**
 * El nivel que se juega desde dentro del coche.
 *
 * Todo lo del nivel 2 vive aqui: el gesto del volante, la velocidad, la
 * calzada y los monstruos que hay que llevarse por delante. `Juego` no sabe
 * como funciona nada de esto; solo le dice cuando empezar, cuanto tiempo ha
 * pasado y donde esta el dedo, y le pide que se pinte.
 *
 * El coche no acelera ni frena a mano: arranca parado y va cogiendo
 * velocidad solo. Lo unico que hace el jugador es dirigir, y por eso el giro
 * depende de la velocidad —un coche parado no se mueve por girar el
 * volante— y la dificultad sube con el reloj y no con los aciertos.
 */

/** Un monstruo en la calzada. `u` es su sitio a lo ancho, de -1 a 1. */
interface Bicho {
  u: number;
  avance: number;
  fase: number;
  vivo: boolean;
}

const MAX_BICHOS = 14;

export class Conduccion {
  readonly interior = new Interior();
  private readonly carretera = new Carretera();
  private readonly bichos: Bicho[] = [];
  private readonly ordenados: Bicho[] = [];
  private readonly proyeccion: Proyeccion = { x: 0, y: 0, escala: 0 };

  private colocacion: Colocacion | null = null;
  private geometria: GeometriaConduccion | null = null;

  /** Posicion del coche a lo ancho de la calzada, de -1 a 1. */
  private u = 0;
  private velocidad = 0;
  private recorrido = 0;
  private tiempo = 0;
  private cuentaAtras = 0;

  private angulo = 0;
  private anguloObjetivo = 0;
  private agarre: { referencia: number; base: number } | null = null;

  private golpe = 0;
  private temblorX = 0;
  private temblorY = 0;

  constructor(
    private nivel: NivelConduccion,
    private readonly monstruo: Monstruo,
    private readonly particulas: Particulas,
    private readonly movimientoReducido: boolean,
    /** Aviso a `Juego` de que uno ha caido bajo las ruedas. */
    private readonly alAtropellar: () => void,
  ) {
    for (let i = 0; i < MAX_BICHOS; i++) {
      this.bichos.push({ u: 0, avance: 0, fase: 0, vivo: false });
    }
  }

  cambiarNivel(nivel: NivelConduccion): void {
    this.nivel = nivel;
  }

  // ------------------------------------------------------------ redimension

  rehacer(ancho: number, alto: number, dpr: number): void {
    const colocacion = colocar(ancho, alto);
    const g = calcularGeometriaConduccion(colocacion, ancho, alto);
    this.colocacion = colocacion;
    this.geometria = g;
    this.interior.rehacer(colocacion, dpr);
    this.carretera.rehacer(g, dpr);
    this.monstruo.rehacer(g.escalaMaxima, dpr);
  }

  reiniciar(): void {
    this.u = 0;
    this.velocidad = 0;
    this.recorrido = 0;
    this.tiempo = 0;
    this.angulo = 0;
    this.anguloObjetivo = 0;
    this.agarre = null;
    this.golpe = 0;
    this.temblorX = 0;
    this.temblorY = 0;
    this.cuentaAtras = this.nivel.conduccion.respiroInicial;
    for (const b of this.bichos) b.vivo = false;
  }

  // ---------------------------------------------------------------- volante

  /**
   * El gesto es el de un volante de verdad: se agarra donde sea y lo que
   * cuenta es cuanto gira el dedo alrededor del eje, no cuanto se desplaza.
   * Asi da igual tener el pulgar en el centro o en el borde.
   */
  tocar(x: number, y: number): void {
    const c = this.colocacion;
    if (!c) return;
    this.agarre = { referencia: Math.atan2(y - c.ejeY, x - c.ejeX), base: this.anguloObjetivo };
  }

  arrastrar(x: number, y: number): void {
    const c = this.colocacion;
    const agarre = this.agarre;
    if (!c || !agarre) return;
    const dx = x - c.ejeX;
    const dy = y - c.ejeY;
    const v = AJUSTES.conduccion.volante;
    const referencia = Math.atan2(dy, dx);
    if (Math.hypot(dx, dy) < c.radio * v.zonaMuerta) {
      // Dentro de la zona muerta se vuelve a tomar la referencia, para que
      // al salir de ella el volante no pegue un salto.
      agarre.referencia = referencia;
      agarre.base = this.anguloObjetivo;
      return;
    }
    let giro = referencia - agarre.referencia;
    while (giro > Math.PI) giro -= TAU;
    while (giro < -Math.PI) giro += TAU;
    const tope = v.anguloMaximo;
    this.anguloObjetivo = Math.max(-tope, Math.min(tope, agarre.base + giro));
  }

  soltar(): void {
    this.agarre = null;
  }

  // ------------------------------------------------------------- dificultad

  /** 0 al empezar y 1 al final de la rampa; en infinito sigue subiendo. */
  private progreso(infinito: boolean): number {
    const c = this.nivel.conduccion;
    const t = this.tiempo / c.rampaDificultad;
    return Math.pow(infinito ? t : Math.min(1, t), c.suavizado);
  }

  private rampa(r: Rampa, progreso: number): number {
    return r.inicio + (r.fin - r.inicio) * progreso;
  }

  private variar(valor: number): number {
    const v = this.nivel.conduccion.variacion;
    return valor * (1 - v + Math.random() * v * 2);
  }

  private get vivos(): number {
    let n = 0;
    for (const b of this.bichos) if (b.vivo) n++;
    return n;
  }

  private aparecer(): void {
    const { min, max } = this.nivel.franjaAparicion;
    // La franja viene en 0..1 sobre la calzada; dentro se trabaja en -1..1.
    let u = 0;
    for (let intento = 0; intento < 4; intento++) {
      u = (min + Math.random() * (max - min)) * 2 - 1;
      let libre = true;
      for (const b of this.bichos) {
        if (b.vivo && b.avance < 0.25 && Math.abs(b.u - u) < 0.22) {
          libre = false;
          break;
        }
      }
      if (libre) break;
    }
    for (const b of this.bichos) {
      if (b.vivo) continue;
      b.u = u;
      b.avance = 0;
      b.fase = Math.random() * TAU;
      b.vivo = true;
      return;
    }
  }

  // ------------------------------------------------------------- actualizar

  actualizar(dt: number, infinito: boolean): void {
    const g = this.geometria;
    if (!g) return;
    const c = this.nivel.conduccion;
    this.tiempo += dt;

    // Arranca parado y va cogiendo velocidad sola. En modo infinito sigue
    // subiendo por encima de la de crucero, pero con techo.
    const marcha = this.tiempo / c.rampaVelocidad;
    const tope = infinito ? AJUSTES.infinito.marchaMaxima : 1;
    this.velocidad = c.velocidadMaxima * Math.min(tope, marcha);

    // El volante: al soltarlo vuelve al centro, como el de verdad.
    const v = AJUSTES.conduccion.volante;
    if (!this.agarre) this.anguloObjetivo *= Math.exp(-dt * v.autocentrado);
    this.angulo += (this.anguloObjetivo - this.angulo) * (1 - Math.exp(-dt * v.suavizado));

    // Girar mueve el coche a lo ancho, y tanto mas cuanto mas rapido va.
    const mando = this.angulo / v.anguloMaximo;
    const paso = (this.velocidad / c.velocidadMaxima) * AJUSTES.conduccion.giro;
    this.u = Math.max(-1, Math.min(1, this.u + mando * paso * dt));

    this.recorrido += this.velocidad * dt;

    const progreso = this.progreso(infinito);
    this.cuentaAtras -= dt;
    const simultaneos = Math.min(MAX_BICHOS, Math.round(this.rampa(c.simultaneos, progreso)));
    if (this.cuentaAtras <= 0 && this.vivos < simultaneos) {
      this.aparecer();
      this.cuentaAtras = this.variar(1 / this.rampa(c.ritmo, progreso));
    }

    for (const b of this.bichos) {
      if (!b.vivo) continue;
      b.avance += this.velocidad * dt;
      if (b.avance < 1) continue;
      b.vivo = false;
      if (Math.abs(b.u - this.u) <= AJUSTES.conduccion.margenAtropello) this.atropellar(b);
    }

    if (this.golpe > 0) {
      this.golpe -= dt * AJUSTES.conduccion.golpe.amortiguacion;
      const fuerza = Math.max(0, this.golpe) * AJUSTES.conduccion.golpe.fuerza;
      this.temblorX = this.movimientoReducido ? 0 : (Math.random() - 0.5) * fuerza;
      this.temblorY = this.movimientoReducido ? 0 : (Math.random() - 0.5) * fuerza;
    } else {
      this.temblorX = 0;
      this.temblorY = 0;
    }
  }

  private atropellar(b: Bicho): void {
    const g = this.geometria;
    if (!g) return;
    const pr = proyectarConduccion(g, 1, b.u, this.u, this.proyeccion);
    const cx = pr.x;
    const cy = g.ventana.abajo;
    const cuantas = this.movimientoReducido
      ? Math.round(AJUSTES.particulas.porMuerte / 2)
      : AJUSTES.particulas.porMuerte;

    // Salpica hacia arriba y hacia los lados: lo que se ve por el parabrisas.
    for (let i = 0; i < cuantas; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const vel = 260 + Math.random() * 420;
      this.particulas.emitir(
        cx + (Math.random() - 0.5) * pr.escala * 80,
        cy,
        Math.cos(a) * vel,
        Math.sin(a) * vel,
        4 + Math.random() * 10,
        0.45 + Math.random() * 0.35,
        COLOR.monstruo.cuerpo,
      );
    }
    for (let i = 0; i < AJUSTES.particulas.naranjasPorMuerte; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const vel = 220 + Math.random() * 380;
      this.particulas.emitir(cx, cy, Math.cos(a) * vel, Math.sin(a) * vel, 2.5 + Math.random() * 4, 0.4 + Math.random() * 0.3, COLOR.monstruo.boca);
    }
    this.golpe = 1;
    this.alAtropellar();
  }

  // ---------------------------------------------------------------- dibujar

  dibujar(ctx: CanvasRenderingContext2D, reloj: number, anda: number): void {
    const g = this.geometria;
    if (!g) return;

    ctx.save();
    ctx.translate(this.temblorX, this.temblorY);
    this.carretera.dibujar(ctx, g, this.u, this.recorrido);

    // De lejos a cerca, para que los de delante tapen a los de detras.
    const lista = this.ordenados;
    lista.length = 0;
    for (const b of this.bichos) {
      if (!b.vivo) continue;
      let i = lista.length;
      while (i > 0 && (lista[i - 1] as Bicho).avance > b.avance) {
        lista[i] = lista[i - 1] as Bicho;
        i--;
      }
      lista[i] = b;
    }
    for (const b of lista) {
      const pr = proyectarConduccion(g, b.avance, b.u, this.u, this.proyeccion);
      // Los que ya se han quedado atras o van muy fuera no se pintan.
      const margen = pr.escala * MONSTRUO_LOCAL.radioX * 2;
      if (pr.x < -margen || pr.x > g.ancho + margen) continue;
      this.monstruo.dibujar(ctx, pr.x, pr.y, pr.escala, b.fase, aperturaNormal(reloj, b.fase), anda, reloj);
    }

    this.particulas.dibujar(ctx);
    ctx.restore();

    // El coche va por delante de todo: primero el salpicadero, que tapa la
    // calzada salvo por el parabrisas, y encima el volante girado.
    this.interior.dibujarSalpicadero(ctx);
    this.interior.dibujarVolante(ctx, this.angulo);
  }
}
