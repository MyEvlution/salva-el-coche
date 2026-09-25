import { AJUSTES } from '../config/ajustes';
import { COLOR } from '../config/tema';
import { Aviso } from '../arte/aviso';
import { Garaje, cocheEnGaraje } from '../arte/garaje';
import { Coche } from '../arte/coche';
import { Fondo } from '../arte/fondo';
import { MONSTRUO_LOCAL, Monstruo, aperturaNormal } from '../arte/monstruo';
import { ANGULO_REPOSO, Pistola, type PuntaPistola } from '../arte/pistola';
import { TAU, conAlfa } from '../arte/formas';
import { Audio } from './audio';
import { Conduccion } from './conduccion';
import { Lienzo } from './lienzo';
import { Manchas } from './manchas';
import { Particulas } from './particulas';
import { calcularGeometria, proyectar, type Geometria } from './geometria';
import type {
  CurvaDificultad,
  DefinicionNivel,
  Enemigo2D,
  Escena,
  Proyeccion,
  Rampa,
} from './tipos';

/** Lo que el juego le cuenta a la interfaz. */
export interface OyentesJuego {
  alCambiarEscena(escena: Escena, datos: DatosPartida): void;
  alPuntuar(datos: DatosPartida): void;
}

export interface DatosPartida {
  puntos: number;
  objetivo: number;
  mejor: number;
  /** En modo infinito el objetivo ya esta pasado y no hay final. */
  infinito: boolean;
}

interface Trazador {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  t: number;
  activo: boolean;
}

interface Anillo {
  x: number;
  y: number;
  t: number;
  acierto: boolean;
  activo: boolean;
}

const MAX_ENEMIGOS = 16;

/**
 * Curva de relleno para cuando el nivel no es de defensa. No llega a usarse
 * —en conduccion la dificultad la lleva `Conduccion`, con su propio reloj—,
 * pero deja que los calculos del modo defensa no tengan que preguntar por el
 * modo en cada linea.
 */
const SIN_CURVA: CurvaDificultad = {
  recorrido: { inicio: 1, fin: 1 },
  ritmo: { inicio: 1, fin: 1 },
  simultaneos: { inicio: 0, fin: 0 },
  aparicionDoble: { inicio: 0, fin: 0 },
  variacion: 0,
  suavizado: 1,
  respiroInicial: 0,
};
const MAX_TRAZADORES = 8;
const MAX_ANILLOS = 12;

export class Juego {
  private readonly ctx: CanvasRenderingContext2D;
  private geometria: Geometria;

  private readonly fondo = new Fondo();
  private readonly coche = new Coche();
  private readonly monstruo = new Monstruo();
  private readonly pistola = new Pistola();
  private readonly particulas = new Particulas();
  private readonly manchas = new Manchas();
  private readonly aviso = new Aviso();
  private readonly garaje = new Garaje();

  private readonly enemigos: Enemigo2D[] = [];
  private readonly trazadores: Trazador[] = [];
  private readonly anillos: Anillo[] = [];
  private readonly ordenados: Enemigo2D[] = [];

  /** Objetos reutilizados por frame para no generar basura. */
  private readonly proyeccion: Proyeccion = { x: 0, y: 0, escala: 0 };
  private readonly punta: PuntaPistola = { x: 0, y: 0, px: 0, py: 0 };

  private escena: Escena = 'inicio';
  private puntos = 0;
  private infinito = false;
  /** 0 a 1 mientras sube el porton del taller. */
  private apertura = 0;
  /** Negro que queda por delante de la partida al arrancar. */
  private fundido = 0;
  private mejor = 0;
  private reloj = 0;
  private cuentaAtrasAparicion = 0;
  private desdeDisparo = 99;
  private congelado = 0;
  private tiempoDerrota = 0;
  private tiempoVictoria = 0;
  private avisadoFinal = false;

  private devorador: Enemigo2D | null = null;
  private temblorX = 0;
  private temblorY = 0;

  private anguloPistola = ANGULO_REPOSO;
  private retroceso = 0;
  private sujecion = 0;
  private fogonazo = 0;
  private fogonazoX = 0;
  private fogonazoY = 0;

  private readonly movimientoReducido: boolean;
  /** El nivel 2 se juega desde dentro del coche y lo lleva este. */
  private conduccion: Conduccion | null = null;

  constructor(
    private readonly lienzo: Lienzo,
    private nivel: DefinicionNivel,
    private readonly audio: Audio,
    private readonly oyentes: OyentesJuego,
  ) {
    this.ctx = lienzo.ctx;
    this.geometria = calcularGeometria(lienzo.ancho, lienzo.alto);
    this.movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    for (let i = 0; i < MAX_ENEMIGOS; i++) {
      this.enemigos.push({ x0: 0, avance: 0, recorrido: 1, fase: 0, vivo: false });
    }
    for (let i = 0; i < MAX_TRAZADORES; i++) {
      this.trazadores.push({ x1: 0, y1: 0, x2: 0, y2: 0, t: 0, activo: false });
    }
    for (let i = 0; i < MAX_ANILLOS; i++) {
      this.anillos.push({ x: 0, y: 0, t: 0, acierto: false, activo: false });
    }

    this.mejor = leerMejorMarca();
    this.montarModo();
    lienzo.alCambiar(() => this.rehacer());
    this.rehacer();
  }

  get datos(): DatosPartida {
    return {
      puntos: this.puntos,
      objetivo: this.nivel.objetivo.cantidad,
      mejor: this.mejor,
      infinito: this.infinito,
    };
  }

  get escenaActual(): Escena {
    return this.escena;
  }

  /** Numeros del modo defensa. En conduccion no se consultan. */
  private get curva(): CurvaDificultad {
    return this.nivel.modo === 'defensa' ? this.nivel.dificultad : SIN_CURVA;
  }

  /**
   * Prepara el modo del nivel. Solo hay uno vivo a la vez: el nivel 2 ocupa
   * una pantalla entera de dibujos y no tiene sentido tenerlo cargado
   * mientras se juega al 1.
   */
  private montarModo(): void {
    if (this.nivel.modo !== 'conduccion') {
      this.conduccion = null;
      return;
    }
    if (this.conduccion) {
      this.conduccion.cambiarNivel(this.nivel);
      return;
    }
    this.conduccion = new Conduccion(
      this.nivel,
      this.monstruo,
      this.particulas,
      this.movimientoReducido,
      () => this.sumarAtropello(),
    );
  }

  // ---------------------------------------------------------------- escenas

  empezar(): void {
    // Desde la portada se sale abriendo el porton. Desde la pausa o la
    // derrota no: ahi ya no estamos en el taller, se reanuda y punto.
    const desdeElTaller = this.escena === 'inicio';
    this.reiniciarEstado();
    if (desdeElTaller) {
      this.apertura = 0;
      this.cambiarEscena('abriendo');
      return;
    }
    this.fundido = 0;
    this.cambiarEscena('jugando');
  }

  /**
   * Vuelve a la portada, que es donde se elige el nivel. La marca ya se
   * guardo al ganar o al perder.
   */
  salirAlInicio(): void {
    this.reiniciarEstado();
    this.cambiarEscena('inicio');
  }

  /** Cambia de nivel. Solo desde la portada: a medias no significa nada. */
  seleccionarNivel(nivel: DefinicionNivel): void {
    if (this.escena !== 'inicio' || nivel === this.nivel) return;
    this.nivel = nivel;
    this.montarModo();
    this.rehacer();
    this.cambiarEscena('inicio');
  }

  /**
   * Sigue jugando pasado el objetivo. El progreso deja de topar en 1, asi que
   * las rampas se extrapolan y la dificultad no para de subir.
   */
  seguirSinLimite(): void {
    if (this.escena !== 'victoria') return;
    this.infinito = true;
    this.tiempoVictoria = 0;
    this.avisadoFinal = false;
    // Pantalla limpia: la pausa de la victoria corta el ritmo, y reanudar con
    // un monstruo a un palmo del coche seria una derrota regalada.
    for (const e of this.enemigos) e.vivo = false;
    this.cuentaAtrasAparicion = this.curva.respiroInicial;
    this.cambiarEscena('jugando');
  }

  private reiniciarEstado(): void {
    this.puntos = 0;
    this.infinito = false;
    this.reloj = 0;
    this.desdeDisparo = 99;
    this.congelado = 0;
    this.tiempoDerrota = 0;
    this.tiempoVictoria = 0;
    this.avisadoFinal = false;
    this.devorador = null;
    this.temblorX = 0;
    this.temblorY = 0;
    this.anguloPistola = ANGULO_REPOSO;
    this.retroceso = 0;
    this.sujecion = 0;
    this.fogonazo = 0;
    this.cuentaAtrasAparicion = this.curva.respiroInicial;
    this.conduccion?.reiniciar();
    this.particulas.limpiar();
    this.manchas.limpiar();
    for (const e of this.enemigos) e.vivo = false;
    for (const t of this.trazadores) t.activo = false;
    for (const a of this.anillos) a.activo = false;
  }

  alternarPausa(): void {
    if (this.escena === 'jugando') this.cambiarEscena('pausa');
    else if (this.escena === 'pausa') this.cambiarEscena('jugando');
  }

  reanudar(): void {
    if (this.escena === 'pausa') this.cambiarEscena('jugando');
  }

  /** Reinicia desde cualquier pantalla que lo permita. */
  reiniciar(): void {
    if (this.escena === 'abriendo') return;
    if (this.escena === 'derrota' && this.tiempoDerrota < AJUSTES.esperaTrasDerrota) return;
    this.empezar();
  }

  /** El taller se ve en la portada y mientras se abre el porton. */
  private get enElTaller(): boolean {
    return this.escena === 'inicio' || this.escena === 'abriendo';
  }

  private cambiarEscena(escena: Escena): void {
    const estaba = this.enElTaller;
    this.escena = escena;
    // Ocupa una pantalla entera: se rehace al entrar y se suelta al salir.
    if (this.enElTaller && !estaba) this.garaje.rehacer(this.geometria, this.lienzo.dpr);
    else if (!this.enElTaller && estaba) this.garaje.liberar();
    this.oyentes.alCambiarEscena(escena, this.datos);
  }

  // ------------------------------------------------------------- redimension

  private rehacer(): void {
    this.geometria = calcularGeometria(this.lienzo.ancho, this.lienzo.alto);
    const { dpr } = this.lienzo;
    this.aviso.rehacer(this.ctx, this.geometria);
    this.coche.rehacer(this.geometria.coche.ancho, dpr);
    if (this.enElTaller) this.garaje.rehacer(this.geometria, dpr);

    // Cada modo rehace lo suyo, y el monstruo se cachea al tamano del que
    // este en juego: los dos niveles lo ven de tamanos muy distintos.
    if (this.conduccion) {
      this.conduccion.rehacer(this.geometria.ancho, this.geometria.alto, dpr);
      return;
    }
    this.fondo.rehacer(this.geometria, dpr);
    this.monstruo.rehacer(this.geometria.escalaMaxima, dpr);
    this.pistola.rehacer(this.geometria.ancho, this.geometria.alto, dpr);
  }

  // ------------------------------------------------------------ dificultad

  /**
   * 0 al empezar el nivel, 1 al alcanzar el objetivo. En modo infinito no se
   * queda en 1: sigue creciendo y las rampas se extrapolan mas alla de `fin`.
   */
  private get progreso(): number {
    const t = Math.max(0, this.puntos / this.nivel.objetivo.cantidad);
    return Math.pow(this.infinito ? t : Math.min(1, t), this.curva.suavizado);
  }

  private rampa(r: Rampa): number {
    return r.inicio + (r.fin - r.inicio) * this.progreso;
  }

  /** Segundos de recorrido, con el suelo que el modo infinito necesita. */
  private get recorrido(): number {
    return Math.max(
      AJUSTES.infinito.recorridoMinimo,
      this.rampa(this.curva.recorrido),
    );
  }

  /** Monstruos permitidos a la vez, sin pasarse del deposito. */
  private get simultaneos(): number {
    return Math.min(MAX_ENEMIGOS, Math.round(this.rampa(this.curva.simultaneos)));
  }

  private variar(valor: number): number {
    const v = this.curva.variacion;
    return valor * (1 - v + Math.random() * v * 2);
  }

  // ---------------------------------------------------------------- enemigos

  private get vivos(): number {
    let n = 0;
    for (const e of this.enemigos) if (e.vivo) n++;
    return n;
  }

  private despertar(x0: number, avance: number, recorrido: number, fase: number): void {
    for (const e of this.enemigos) {
      if (e.vivo) continue;
      e.x0 = x0;
      e.avance = avance;
      e.recorrido = recorrido;
      e.fase = fase;
      e.vivo = true;
      return;
    }
  }

  private aparecer(): void {
    const { min, max } = this.nivel.franjaAparicion;
    const ancho = this.geometria.ancho;
    let x0 = 0;
    // Hasta cuatro intentos de no salir pegado a otro que acabe de aparecer.
    for (let intento = 0; intento < 4; intento++) {
      x0 = ancho * (min + Math.random() * (max - min));
      let libre = true;
      for (const e of this.enemigos) {
        if (e.vivo && e.avance < 0.3 && Math.abs(e.x0 - x0) < ancho * 0.1) {
          libre = false;
          break;
        }
      }
      if (libre) break;
    }
    this.despertar(x0, 0, this.variar(this.recorrido), Math.random() * TAU);
  }

  // ---------------------------------------------------------------- disparo

  tocar(x: number, y: number): void {
    if (this.escena !== 'jugando') return;
    // En el nivel 2 el dedo no dispara: agarra el volante.
    if (this.conduccion) {
      this.conduccion.tocar(x, y);
      return;
    }
    if (this.desdeDisparo < AJUSTES.disparo.cadencia) return;
    this.desdeDisparo = 0;

    const apuntado = this.pistola.anguloHacia(x, y, this.punta);
    this.anguloPistola = ANGULO_REPOSO + (apuntado - ANGULO_REPOSO) * AJUSTES.pistola.seguimiento;
    this.sujecion = 0.14;
    this.retroceso = 1;

    const punta = this.pistola.punta(this.anguloPistola, 0, this.punta);
    this.fogonazo = AJUSTES.duracionFogonazo;
    this.fogonazoX = punta.x;
    this.fogonazoY = punta.y;
    for (const t of this.trazadores) {
      if (t.activo) continue;
      t.x1 = punta.x;
      t.y1 = punta.y;
      t.x2 = x;
      t.y2 = y;
      t.t = 0;
      t.activo = true;
      break;
    }
    this.audio.disparo();

    const objetivo = this.buscarObjetivo(x, y);
    this.anillo(x, y, objetivo !== null);
    if (objetivo) this.abatir(objetivo);
  }

  /** Arrastre del dedo. Solo lo usa el nivel 2, para girar el volante. */
  arrastrar(x: number, y: number): void {
    if (this.escena !== 'jugando') return;
    this.conduccion?.arrastrar(x, y);
  }

  soltar(): void {
    this.conduccion?.soltar();
  }

  /** Uno menos, atropellado. El equivalente de `abatir` en el nivel 2. */
  private sumarAtropello(): void {
    this.puntos++;
    this.audio.acierto();
    vibrar(AJUSTES.vibracion.acierto);
    this.oyentes.alPuntuar(this.datos);
    if (!this.infinito && this.puntos >= this.nivel.objetivo.cantidad) this.ganar();
  }

  private anillo(x: number, y: number, acierto: boolean): void {
    for (const a of this.anillos) {
      if (a.activo) continue;
      a.x = x;
      a.y = y;
      a.t = 0;
      a.acierto = acierto;
      a.activo = true;
      return;
    }
  }

  /**
   * Busca a quien le toca. Si no hay acierto limpio se acepta el mas cercano
   * dentro del margen de perdon: con el pulgar, exigir precision de raton es
   * lo que hace que un juego se sienta injusto.
   */
  private buscarObjetivo(x: number, y: number): Enemigo2D | null {
    let directo: Enemigo2D | null = null;
    let avanceDirecto = -1;
    let cercano: Enemigo2D | null = null;
    let distanciaCercano = Infinity;

    for (const e of this.enemigos) {
      if (!e.vivo) continue;
      const pr = proyectar(this.geometria, e, this.proyeccion);
      const rx = Math.max(pr.escala * MONSTRUO_LOCAL.radioX, AJUSTES.disparo.radioMinimoX);
      const ry = Math.max(pr.escala * MONSTRUO_LOCAL.radioY, AJUSTES.disparo.radioMinimoY);
      const dx = (x - pr.x) / rx;
      const dy = (y - (pr.y + MONSTRUO_LOCAL.centroY * pr.escala)) / ry;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= 1) {
        if (e.avance > avanceDirecto) {
          avanceDirecto = e.avance;
          directo = e;
        }
      } else if (d <= AJUSTES.disparo.gracia && d < distanciaCercano) {
        distanciaCercano = d;
        cercano = e;
      }
    }
    return directo ?? cercano;
  }

  private abatir(enemigo: Enemigo2D): void {
    const pr = proyectar(this.geometria, enemigo, this.proyeccion);
    const cx = pr.x;
    const cy = pr.y - pr.escala * 100;
    const k = 0.5 + pr.escala / this.geometria.escalaMaxima;
    const cuantas = this.movimientoReducido
      ? Math.round(AJUSTES.particulas.porMuerte / 2)
      : AJUSTES.particulas.porMuerte;

    for (let i = 0; i < cuantas; i++) {
      const a = Math.random() * TAU;
      const v = (120 + Math.random() * 240) * k;
      this.particulas.emitir(
        cx,
        cy,
        Math.cos(a) * v,
        Math.sin(a) * v - 80,
        (4 + Math.random() * 9) * k,
        0.5 + Math.random() * 0.4,
        COLOR.monstruo.cuerpo,
      );
    }
    for (let i = 0; i < AJUSTES.particulas.naranjasPorMuerte; i++) {
      const a = Math.random() * TAU;
      const v = (100 + Math.random() * 200) * k;
      this.particulas.emitir(
        cx,
        cy,
        Math.cos(a) * v,
        Math.sin(a) * v - 60,
        (2.5 + Math.random() * 3.5) * k,
        0.4 + Math.random() * 0.3,
        COLOR.monstruo.boca,
      );
    }

    this.manchas.emitir(pr.x, pr.y, pr.escala * AJUSTES.manchas.radio);
    enemigo.vivo = false;
    this.puntos++;
    this.congelado = AJUSTES.golpeSeco;
    this.audio.acierto();
    vibrar(AJUSTES.vibracion.acierto);
    this.oyentes.alPuntuar(this.datos);

    if (!this.infinito && this.puntos >= this.nivel.objetivo.cantidad) this.ganar();
  }

  private ganar(): void {
    this.guardarMejorMarca();
    this.tiempoVictoria = 0;
    this.avisadoFinal = false;
    this.escena = 'victoria';
    this.audio.victoria();
  }

  private perder(enemigo: Enemigo2D): void {
    this.guardarMejorMarca();
    this.devorador = enemigo;
    enemigo.avance = 1;
    this.tiempoDerrota = 0;
    this.avisadoFinal = false;
    this.escena = 'derrota';
    this.audio.derrota();
    vibrar(AJUSTES.vibracion.derrota);
  }

  private guardarMejorMarca(): void {
    if (this.puntos > this.mejor) {
      this.mejor = this.puntos;
      escribirMejorMarca(this.mejor);
    }
  }

  // ------------------------------------------------------------ actualizar

  actualizar(dt: number): void {
    if (this.escena === 'pausa') return;

    if (this.escena === 'abriendo') {
      this.apertura += dt / AJUSTES.apertura.duracion;
      if (this.apertura < 1) return;
      this.apertura = 1;
      // Se entra a oscuras y la partida se aclara sola: asi el corte entre
      // el taller y la carretera no se ve.
      this.fundido = 1;
      this.cambiarEscena('jugando');
      return;
    }
    if (this.fundido > 0) this.fundido = Math.max(0, this.fundido - dt / AJUSTES.apertura.entrada);

    if (this.congelado > 0) {
      this.congelado -= dt;
      return;
    }

    this.reloj += dt;
    this.desdeDisparo += dt;

    if (this.escena === 'jugando' && this.conduccion) {
      this.conduccion.actualizar(dt, this.infinito);
    } else if (this.escena === 'jugando') {
      this.cuentaAtrasAparicion -= dt;
      const simultaneos = this.simultaneos;
      if (this.cuentaAtrasAparicion <= 0 && this.vivos < simultaneos) {
        this.aparecer();
        if (Math.random() < this.rampa(this.curva.aparicionDoble) && this.vivos < simultaneos) {
          this.aparecer();
        }
        this.cuentaAtrasAparicion = this.variar(1 / this.rampa(this.curva.ritmo));
      }

      for (const e of this.enemigos) {
        if (!e.vivo) continue;
        e.avance += dt / e.recorrido;
        if (e.avance >= 1) {
          this.perder(e);
          break;
        }
      }
    } else if (this.escena === 'derrota') {
      this.tiempoDerrota += dt;
      const decae = Math.exp(-this.tiempoDerrota * AJUSTES.temblor.amortiguacion);
      if (this.movimientoReducido) {
        this.temblorX = 0;
        this.temblorY = 0;
      } else {
        this.temblorX = (Math.random() - 0.5) * AJUSTES.temblor.fuerza * decae;
        this.temblorY = (Math.random() - 0.5) * AJUSTES.temblor.fuerza * 0.66 * decae;
      }
      if (!this.avisadoFinal && this.tiempoDerrota > AJUSTES.esperaTrasDerrota) {
        this.avisadoFinal = true;
        this.cambiarEscena('derrota');
      }
    } else if (this.escena === 'victoria') {
      this.tiempoVictoria += dt;
      if (!this.avisadoFinal && this.tiempoVictoria > 0.5) {
        this.avisadoFinal = true;
        this.cambiarEscena('victoria');
      }
    }

    this.particulas.actualizar(dt);
    this.manchas.actualizar(dt);

    for (const t of this.trazadores) {
      if (!t.activo) continue;
      t.t += dt;
      if (t.t >= AJUSTES.duracionTrazador) t.activo = false;
    }
    for (const a of this.anillos) {
      if (!a.activo) continue;
      a.t += dt;
      if (a.t >= AJUSTES.duracionAnillo) a.activo = false;
    }
    if (this.fogonazo > 0) this.fogonazo -= dt;

    if (this.sujecion > 0) {
      this.sujecion -= dt;
    } else {
      this.anguloPistola += (ANGULO_REPOSO - this.anguloPistola) * (1 - Math.exp(-dt * 8));
    }
    this.retroceso *= Math.exp(-dt * 14);
  }

  // --------------------------------------------------------------- dibujar

  dibujar(): void {
    if (this.escena === 'pausa') return;
    const ctx = this.ctx;
    const g = this.geometria;

    // La portada no es la partida: es el coche aparcado en el taller.
    if (this.enElTaller) {
      const a = AJUSTES.apertura;
      const t = this.escena === 'abriendo' ? this.apertura : 0;
      // La puerta acaba antes que el paso, para que de tiempo a verla llegar
      // arriba; el negro entra despues y tapa el corte.
      const puerta = Math.min(1, t / a.fraccionPuerta);
      this.garaje.dibujar(ctx, puerta * puerta * (3 - 2 * puerta));
      const sitio = cocheEnGaraje(g);
      this.coche.dibujar(ctx, sitio.x, sitio.base);
      if (t > a.inicioFundido) {
        this.oscurecer(ctx, g, Math.pow((t - a.inicioFundido) / (1 - a.inicioFundido), a.curvaFundido));
      }
      return;
    }

    // El nivel 2 se pinta entero desde dentro del coche: calzada, monstruos,
    // salpicadero y volante. Nada de lo de abajo le vale.
    if (this.conduccion) {
      this.conduccion.dibujar(ctx, this.reloj, 1);
      if (this.fundido > 0) this.oscurecer(ctx, g, this.fundido);
      return;
    }

    this.fondo.dibujar(ctx);
    this.manchas.dibujar(ctx);

    // De lejos a cerca, para que los de delante tapen a los de detras.
    const lista = this.ordenados;
    lista.length = 0;
    for (const e of this.enemigos) {
      if (!e.vivo || e === this.devorador) continue;
      let i = lista.length;
      while (i > 0 && (lista[i - 1] as Enemigo2D).avance > e.avance) {
        lista[i] = lista[i - 1] as Enemigo2D;
        i--;
      }
      lista[i] = e;
    }

    const anda = this.escena === 'derrota' ? 0 : 1;
    for (const e of lista) {
      const pr = proyectar(g, e, this.proyeccion);
      this.monstruo.dibujar(
        ctx,
        pr.x,
        pr.y,
        pr.escala,
        e.fase,
        aperturaNormal(this.reloj, e.fase),
        anda,
        this.reloj,
      );
    }

    // Aviso: el que esta a punto de llegar se marca, y la pantalla avisa
    let peligro = 0;
    if (this.escena === 'jugando') {
      const latido = Aviso.latido(this.reloj, this.movimientoReducido);
      for (const e of lista) {
        const intensidad = Aviso.intensidad(e.avance);
        if (intensidad <= 0) continue;
        peligro = Math.max(peligro, intensidad);
        const pr = proyectar(g, e, this.proyeccion);
        this.aviso.halo(
          ctx,
          pr.x,
          pr.y + MONSTRUO_LOCAL.centroY * pr.escala,
          pr.escala * MONSTRUO_LOCAL.radioX,
          pr.escala * MONSTRUO_LOCAL.radioY,
          intensidad,
          latido,
        );
      }
    }

    const enDerrota = this.escena === 'derrota';
    this.coche.dibujar(
      ctx,
      g.coche.x + (enDerrota ? this.temblorX : 0),
      g.coche.base + (enDerrota ? this.temblorY : 0),
    );

    // El que llega se abalanza sobre el coche.
    if (this.devorador) {
      const pr = proyectar(g, this.devorador, this.proyeccion);
      const k = Math.min(1, this.tiempoDerrota / 0.35);
      const suave = 1 - Math.pow(1 - k, 3);
      const apertura = 22 + 26 * Math.abs(Math.sin(this.tiempoDerrota * 16));
      this.monstruo.dibujar(
        ctx,
        pr.x + this.temblorX * 0.4,
        pr.y + g.coche.alto * 0.42 * suave,
        pr.escala * (1 + 0.1 * suave),
        this.devorador.fase,
        apertura,
        0,
        this.reloj,
      );
    }

    this.pistola.dibujar(
      ctx,
      this.anguloPistola,
      this.retroceso,
      enDerrota ? this.temblorX * 0.5 : 0,
      enDerrota ? this.temblorY * 0.5 : 0,
      this.punta,
    );

    this.particulas.dibujar(ctx);
    this.dibujarDisparos(ctx);

    if (peligro > 0) {
      this.aviso.bordePantalla(ctx, g, peligro, Aviso.latido(this.reloj, this.movimientoReducido));
    }

    // Lo ultimo de todo: el negro con el que se entra desde el taller
    if (this.fundido > 0) this.oscurecer(ctx, g, this.fundido);
  }

  /** Velo negro a pantalla completa, para los cortes entre escenas. */
  private oscurecer(ctx: CanvasRenderingContext2D, g: Geometria, alfa: number): void {
    if (alfa <= 0) return;
    ctx.fillStyle = conAlfa(COLOR.efectos.fundido, Math.min(1, alfa));
    ctx.fillRect(0, 0, g.ancho, g.alto);
  }

  private dibujarDisparos(ctx: CanvasRenderingContext2D): void {
    ctx.lineCap = 'round';
    for (const t of this.trazadores) {
      if (!t.activo) continue;
      const a = 1 - t.t / AJUSTES.duracionTrazador;
      ctx.strokeStyle = conAlfa(COLOR.efectos.trazador, a * 0.4);
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(t.x1, t.y1);
      ctx.lineTo(t.x2, t.y2);
      ctx.stroke();
      ctx.strokeStyle = conAlfa(COLOR.efectos.fogonazo, a);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(t.x1, t.y1);
      ctx.lineTo(t.x2, t.y2);
      ctx.stroke();
    }

    for (const a of this.anillos) {
      if (!a.activo) continue;
      const k = a.t / AJUSTES.duracionAnillo;
      ctx.strokeStyle = a.acierto
        ? conAlfa(COLOR.efectos.acierto, 1 - k)
        : conAlfa(COLOR.efectos.fallo, 0.9 * (1 - k));
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(a.x, a.y, 8 + k * 22, 0, TAU);
      ctx.stroke();
    }

    if (this.fogonazo > 0) {
      const a = this.fogonazo / AJUSTES.duracionFogonazo;
      ctx.fillStyle = conAlfa(COLOR.efectos.fogonazo, a);
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * TAU;
        const radio = i % 2 ? 9 : 26;
        const px = this.fogonazoX + Math.cos(ang) * radio;
        const py = this.fogonazoY + Math.sin(ang) * radio;
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
}

function vibrar(ms: number): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* hay navegadores que no vibran y no pasa nada */
  }
}

function leerMejorMarca(): number {
  try {
    const guardado = window.localStorage.getItem(AJUSTES.claveMejorMarca);
    const valor = guardado === null ? 0 : Number.parseInt(guardado, 10);
    return Number.isFinite(valor) && valor > 0 ? valor : 0;
  } catch {
    return 0;
  }
}

function escribirMejorMarca(valor: number): void {
  try {
    window.localStorage.setItem(AJUSTES.claveMejorMarca, String(valor));
  } catch {
    /* navegacion privada o almacenamiento lleno: la marca solo dura la sesion */
  }
}
