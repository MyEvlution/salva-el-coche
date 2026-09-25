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

  /**
   * Estilo: los numeros del acabado pintado que comparten el escenario, el
   * monstruo y el taller. Todo esto se aplica dentro de los canvas de cache,
   * una vez por tamano de pantalla, nunca por frame.
   */
  estilo: {
    grano: {
      /** Motas por cada 10 000 px de area. */
      densidadAsfalto: 85,
      densidadPared: 70,
      densidadMonstruo: 40,
      /** Tope duro: una pantalla grande no debe costar un pintado eterno. */
      motasMaximas: 6000,
      motaMinima: 0.5,
      motaMaxima: 1.4,
    },
    /** Grosor del contorno de tinta, en fraccion del tamano del dibujo. */
    contorno: 0.022,
    /** Ancho del filo de luz del lomo, en las mismas unidades. */
    filo: 0.016,
    /** Rellenos alrededor con los que se construye el contorno. */
    pasosContorno: 12,
    /**
     * A partir de que tamano —en fraccion del maximo— un monstruo se pinta
     * con todos los remates. Los de lejos son diminutos y salen muchos a la
     * vez: pintarles la sombra de cada colmillo es gasto que nadie ve.
     */
    detalle: 0.45,
    /** Donde empieza a cerrarse la vineta, en fraccion del radio. */
    vinetaDentro: 0.45,
  },

  /** Escenario */
  horizonte: 0.4, // fraccion de la altura
  /** Caja del coche: abajo a la izquierda. */
  coche: {
    izquierda: 0.02,
    derecha: 0.55,
    anchoMaximo: 520,
    /** Alto / ancho del dibujo del coche. La geometria cuadra con esto. */
    razonAlto: 0.827,
  },
  /**
   * La pistola va abajo a la derecha, lejos del pulgar izquierdo. El dibujo
   * se ancla por su esquina inferior derecha, un poco fuera de pantalla: en
   * primera persona la mano entra por el borde, no flota en el aire.
   */
  pistola: {
    /** Parte del ancho de la pantalla que ocupa el dibujo... */
    anchoRelativo: 0.476,
    /** ...y del alto, que es lo que manda en apaisado. */
    altoRelativo: 0.51,
    /**
     * Cuanto se sale el dibujo por la derecha y por abajo, en fraccion del
     * propio dibujo y no de la pantalla: asi asoma igual en un movil
     * estrecho que en una pantalla ancha.
     */
    desbordeX: 0.17,
    desbordeY: 0.2,
    /** Cuanto se inclina la pistola hacia el punto tocado: 1 = apunta del todo. */
    seguimiento: 0.55,
    /** Pixeles de retroceso al disparar, en unidades del dibujo. */
    retroceso: 34,
  },

  /**
   * Nivel 2: el interior del coche. El dibujo se coloca cubriendo la
   * pantalla y de el salen todas las medidas del nivel, asi que estos dos
   * numeros mandan sobre la partida entera.
   */
  interior: {
    /**
     * A que altura de la pantalla cae el eje del volante cuando sobra
     * dibujo. En vertical el dibujo entra casi justo y esto no llega a
     * aplicarse; en apaisado manda, y por eso pasa de 1: el eje se va por
     * debajo del borde y queda a la vista la carretera y el arco de arriba
     * del volante, que es lo que se mira y lo que se toca.
     */
    ejeEnPantalla: 1.02,
  },

  /** Nivel 2: llevar el coche. */
  conduccion: {
    /** Donde cae el horizonte dentro del hueco del parabrisas. */
    horizonteEnVentana: 0.42,
    /**
     * Cuanto baja del parabrisas el punto de avance 1, en fraccion del
     * hueco. Lo que llega ahi ya esta tapado por el capo, que es justo lo
     * que se ve desde el asiento al atropellar algo.
     */
    finBajoElCapo: 0.28,
    /** Media calzada, en fraccion del ancho de pantalla, al llegar delante. */
    mediaCalzada: 0.92,
    /**
     * Alto del monstruo al pasar por delante, en fraccion de la calzada
     * vista. Por encima de esto uno solo tapa el parabrisas entero y deja
     * de verse a cual conviene ir.
     */
    altoMonstruo: 0.62,

    /** Marcas viales: lo unico que se pinta por frame en la calzada. */
    marcas: {
      /** Rayas de la discontinua repartidas entre el horizonte y el coche. */
      tramos: 12,
      /** Parte de cada tramo que esta pintada. */
      largoRaya: 0.42,
      /** Semianchos, en fraccion de la media calzada. */
      anchoLinea: 0.026,
      anchoArcen: 0.032,
      /** Las marcas no llegan al horizonte: ahi ya no se distinguen. */
      desdeElHorizonte: 0.012,
    },

    /** El volante: gesto, limites y vuelta al centro. */
    volante: {
      /** Giro maximo a cada lado, en radianes. */
      anguloMaximo: 0.95,
      /**
       * Zona muerta alrededor del eje, en fraccion del radio. Con el dedo
       * pegado al eje, un milimetro son treinta grados: ahi el gesto no se
       * lee, se vuelve a tomar la referencia.
       */
      zonaMuerta: 0.22,
      /** Vuelta al centro al soltar, en veces por segundo. */
      autocentrado: 4.5,
      /** Suavizado del giro: quita el temblor del dedo sin dar retraso. */
      suavizado: 22,
    },

    /**
     * Cuanto se desplaza el coche a lo ancho de la calzada por segundo, a
     * tope de giro y a tope de velocidad. Parado no gira: el volante de un
     * coche quieto tampoco lo mueve.
     */
    giro: 1.05,
    /** Medio ancho del parachoques, en unidades de calzada. */
    margenAtropello: 0.16,
    /** Sacudida del atropello: fuerza en pixeles y cuanto tarda en pasarse. */
    golpe: { fuerza: 16, amortiguacion: 9 },
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
  infinito: {
    recorridoMinimo: 1.2,
    /**
     * Techo de la velocidad en conduccion, en veces la del nivel. Sin el,
     * la rampa extrapolada acaba cruzando la calzada en una decima: eso ya
     * no es dificil, es que no se ve.
     */
    marchaMaxima: 2.4,
  },

  /**
   * Apertura del porton al darle a jugar: el taller se abre y la pantalla se
   * va a negro mientras sube la hoja. Al acabar arranca la partida.
   */
  apertura: {
    /** Segundos que dura el paso entero. */
    duracion: 2,
    /**
     * En que parte del paso acaba de subir el porton. Menos de 1 para que
     * de tiempo a verlo llegar arriba antes de que la pantalla se apague.
     */
    fraccionPuerta: 0.78,
    /** En que parte del paso empieza el fundido a negro. */
    inicioFundido: 0.5,
    /** Exponente del fundido: por encima de 1 entra despacio. */
    curvaFundido: 1.6,
    /** Segundos que tarda la partida en aclararse al arrancar. */
    entrada: 0.45,
  },

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
