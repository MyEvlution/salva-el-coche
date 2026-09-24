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

/** Condicion de derrota. */
export type Derrota = { tipo: 'alcanzaObjetivoProtegido' };

/** Piezas de arte que el nivel escoge. Cada valor tiene su modulo en `arte/`. */
export type Fondo = 'carretera';
export type Protegido = 'coche';
export type Enemigo = 'monstruo';

export interface DefinicionNivel {
  id: string;
  nombre: string;
  /** Una linea de contexto que se muestra antes de empezar. */
  descripcion: string;
  fondo: Fondo;
  protegido: Protegido;
  enemigo: Enemigo;
  objetivo: Objetivo;
  derrota: Derrota;
  dificultad: CurvaDificultad;
  /** Franja horizontal por donde asoman los enemigos, en fraccion del ancho. */
  franjaAparicion: { min: number; max: number };
}

/** Estados posibles de la partida. */
export type Escena = 'inicio' | 'jugando' | 'pausa' | 'victoria' | 'derrota';

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
