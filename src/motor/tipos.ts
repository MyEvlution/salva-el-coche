/**
 * Contratos del motor. Un nivel es un objeto de datos que cumple
 * `DefinicionNivel`: el motor no sabe nada de ningun nivel concreto.
 */

/** Par de valores que se interpolan segun lo avanzado que va el nivel. */
export interface Rampa {
  inicio: number;
  fin: number;
}

export interface CurvaDificultad {
  /** Segundos que tarda un monstruo en cruzar desde el horizonte. */
  recorrido: Rampa;
  /**
   * Apariciones por segundo. Se interpola la frecuencia y no el intervalo
   * entre apariciones: interpolar el intervalo hace que la mitad de la
   * partida vaya mucho mas lenta de lo que dicen `inicio` y `fin`.
   */
  ritmo: Rampa;
  /** Monstruos permitidos a la vez. */
  simultaneos: Rampa;
  /** Probabilidad (0-1) de que una aparicion traiga dos monstruos. */
  aparicionDoble: Rampa;
  /** Variacion aleatoria aplicada a tiempos: 0.2 = mas o menos un 20 %. */
  variacion: number;
  /**
   * Forma de la subida de dificultad. 1 = lineal; por encima de 1 el nivel
   * se mantiene amable al principio y aprieta al final; por debajo de 1
   * aprieta antes y luego sube mas despacio.
   */
  suavizado: number;
  /** Segundos de margen antes de la primera aparicion. */
  respiroInicial: number;
}

/** Condicion de victoria. Nuevas formas de ganar se anaden aqui. */
export type Objetivo = { tipo: 'puntos'; cantidad: number };

/**
 * Condicion de derrota. `ninguna` no es un descuido: hay niveles que solo se
 * ganan o se siguen jugando, y ponerles una derrota inventada seria peor que
 * no tenerla.
 */
export type Derrota = { tipo: 'alcanzaObjetivoProtegido' } | { tipo: 'ninguna' };

/** Piezas de arte que el nivel escoge. Cada valor tiene su modulo en `arte/`. */
export type Fondo = 'carretera';
export type Protegido = 'coche';
export type Enemigo = 'monstruo';

/**
 * Como se juega el nivel. `defensa` es el nivel 1: el coche esta delante y
 * se defiende a tiros. `conduccion` es el nivel 2: se va dentro del coche y
 * los monstruos se atropellan.
 *
 * Es lo primero que se mira al montar la partida, asi que un nivel nuevo
 * empieza por elegir uno de los dos; inventarse un tercero es escribir un
 * motor nuevo, no un nivel.
 */
export type Modo = 'defensa' | 'conduccion';

/** Numeros del modo conduccion. La dificultad sube con el reloj, no con los puntos. */
export interface AjustesConduccion {
  /** Velocidad de crucero, en avances por segundo. */
  velocidadMaxima: number;
  /** Segundos desde parado hasta la velocidad de crucero. */
  rampaVelocidad: number;
  /** Segundos en los que las rampas van de `inicio` a `fin`. */
  rampaDificultad: number;
  /** Apariciones por segundo. */
  ritmo: Rampa;
  /** Monstruos en la calzada a la vez. */
  simultaneos: Rampa;
  /** Variacion aleatoria aplicada a los tiempos. */
  variacion: number;
  /** Forma de la subida, como en `CurvaDificultad`. */
  suavizado: number;
  /** Segundos de margen antes del primer monstruo. */
  respiroInicial: number;
}

interface NivelBase {
  id: string;
  nombre: string;
  /** Una linea de contexto que se muestra antes de empezar. */
  descripcion: string;
  fondo: Fondo;
  enemigo: Enemigo;
  objetivo: Objetivo;
  derrota: Derrota;
  /**
   * Franja por donde asoman los enemigos. En `defensa`, en fraccion del
   * ancho de la pantalla; en `conduccion`, de la calzada: 0 es el arcen
   * izquierdo y 1 el derecho.
   */
  franjaAparicion: { min: number; max: number };
}

export interface NivelDefensa extends NivelBase {
  modo: 'defensa';
  protegido: Protegido;
  dificultad: CurvaDificultad;
}

export interface NivelConduccion extends NivelBase {
  modo: 'conduccion';
  conduccion: AjustesConduccion;
}

export type DefinicionNivel = NivelDefensa | NivelConduccion;

/** Estados posibles de la partida. */
/**
 * `abriendo` es el paso de la portada a la partida: sube el porton del taller
 * y la pantalla se va a negro. No se juega ni se puede pausar.
 */
export type Escena = 'inicio' | 'abriendo' | 'jugando' | 'pausa' | 'victoria' | 'derrota';

/** Un enemigo vivo. `avance` va de 0 (horizonte) a 1 (encima del coche). */
export interface Enemigo2D {
  x0: number;
  avance: number;
  /** Segundos que tarda en recorrer todo el camino. */
  recorrido: number;
  /** Desfase de animacion para que no anden todos igual. */
  fase: number;
  vivo: boolean;
}

/** Resultado de proyectar un enemigo a la pantalla. */
export interface Proyeccion {
  x: number;
  y: number;
  escala: number;
}
