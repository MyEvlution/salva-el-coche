/**
 * Constantes del motor. Valores de juego que no pertenecen a un nivel
 * concreto: si un numero se toca para que el juego "sienta" mejor, esta aqui.
 */

export const AJUSTES = {
  /** Bucle */
  dtMaximo: 0.05, // s: un frame nunca avanza mas que esto

  /** Calidad */
  dprMaximo: 2,
  dprMinimo: 1,
  /** Si el frame medio supera esto (ms), se baja la resolucion un escalon. */
  presupuestoFrame: 20,
  /** Frames seguidos fuera de presupuesto antes de bajar calidad. */
  framesParaBajar: 90,

  /** Escenario */
  horizonte: 0.4, // fraccion de la altura
  /** Caja del coche: abajo a la izquierda. */
  coche: { izquierda: 0.02, derecha: 0.55, anchoMaximo: 520 },
  /**
   * Caja de la pistola: abajo a la derecha, lejos del pulgar izquierdo.
   * `escorzo` comprime el dibujo a lo largo del canon para que la pistola
   * parezca que apunta hacia dentro de la pantalla y no de perfil.
   */
  pistola: {
    izquierda: 0.7,
    derecha: 0.985,
    altoMaximo: 0.52,
    escorzo: 0.62,
    /** Cuanto se inclina la pistola hacia el punto tocado: 1 = apunta del todo. */
    seguimiento: 0.55,
  },

  /** Proyeccion pseudo-3D: los monstruos convergen hacia el coche. */
  proyeccion: {
    curva: 1.7, // exponente: de lejos avanzan despacio, de cerca se echan encima
    convergencia: 0.66, // cuanto se acercan al eje del coche al avanzar
    escalaMinima: 0.11, // tamano relativo en el horizonte
  },

  /** Punteria */
  disparo: {
    /** Radio de acierto en pixeles cuando el monstruo esta lejos. */
    radioMinimoX: 34,
    radioMinimoY: 38,
    /** Margen de perdon: 1 = sin perdon, 1.45 = se acepta un 45 % de error. */
    gracia: 1.45,
    /** Segundos entre disparos: evita el ametrallamiento accidental. */
    cadencia: 0.09,
  },

  /** Rastro que deja un monstruo abatido en el suelo. */
  manchas: {
    maximo: 28,
    duracion: 6.5,
    alfa: 0.42,
    /** Radio de la mancha en unidades locales del monstruo. */
    radio: 70,
  },

  /** Aviso cuando un monstruo esta a punto de llegar al coche. */
  aviso: {
    /** Avance a partir del cual el monstruo se marca como peligro. */
    umbral: 0.78,
    /** Parpadeos por segundo. */
    parpadeo: 4.5,
    /** Opacidad maxima del borde rojo de la pantalla. */
    alfaBorde: 0.5,
    grosorHalo: 5,
  },

  /**
   * Modo infinito: la dificultad sigue subiendo sin techo, pero el motor
   * necesita un suelo. Por debajo de este recorrido el monstruo cruza antes
   * de que de tiempo a verlo, asi que no es dificultad: es una pantalla rota.
   */
  infinito: { recorridoMinimo: 1.2 },

  /** Efectos */
  particulas: {
    maximo: 220,
    porMuerte: 16,
    naranjasPorMuerte: 7,
    gravedad: 800,
  },
  temblor: { fuerza: 12, amortiguacion: 3 },
  /** Congelacion brevisima al acertar: el impacto se nota mas. */
  golpeSeco: 0.045,
  duracionTrazador: 0.14,
  duracionAnillo: 0.28,
  duracionFogonazo: 0.07,
  /** Segundos de dentellada antes de poder reintentar. */
  esperaTrasDerrota: 0.9,

  /** Vibracion del movil, en milisegundos. */
  vibracion: { acierto: 12, derrota: 220 },

  /** Donde se guarda la mejor marca. */
  claveMejorMarca: 'salva-el-coche:mejor',
} as const;
