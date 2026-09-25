/**
 * Paleta y tipografia. Todo el color del juego sale de aqui: ningun modulo
 * escribe un codigo hexadecimal a mano.
 *
 * El lenguaje visual lo marcan los dos dibujos del taller (el coche y la
 * pistola): ilustracion pintada con contorno de tinta, volumen por degradado,
 * un filo de luz frio en los cantos de arriba y grano de suciedad encima.
 * Todo lo que pinta el juego habla ese idioma, asi que la paleta esta hecha
 * por piezas —claro / base / oscuro— y no por colores sueltos.
 */

export const COLOR = {
  /**
   * La carretera de la que salen los monstruos: dia cubierto de taller, cielo
   * frio y asfalto gastado. Ni el cielo ni el suelo son planos; cada uno va
   * de un tono a otro y lleva su grano.
   */
  escenario: {
    cieloAlto: '#3F5668',
    cieloMedio: '#6F8A9C',
    cieloBajo: '#9CB2BE',
    /** Bruma justo encima del horizonte: es lo que da la distancia. */
    bruma: '#C2CFD6',
    /** Linea de tinta donde el asfalto se come el cielo. */
    horizonte: 'rgba(24, 31, 37, 0.85)',
    asfaltoLejos: '#8B949C',
    asfaltoMedio: '#6C757D',
    asfaltoCerca: '#4E555C',
    /** Motas del asfalto: gravilla clara y picadura oscura. */
    granoClaro: 'rgba(230, 236, 240, 0.28)',
    granoOscuro: 'rgba(16, 20, 24, 0.3)',
    /** Rodada gastada por donde pasan las ruedas. */
    rodada: 'rgba(22, 28, 34, 0.16)',
    rodadaSuave: 'rgba(22, 28, 34, 0)',
    /** Oscurecido de los bordes, para que la escena sea un cuadro. */
    vineta: 'rgba(10, 14, 18, 0.46)',
    vinetaSuave: 'rgba(10, 14, 18, 0)',
    sombra: 'rgba(14, 20, 28, 0.34)',
    sombraSuave: 'rgba(14, 20, 28, 0)',
  },

  /**
   * El monstruo del oxido. Deja de ser una silueta plana: mismo negro, pero
   * con volumen, filo de luz en el lomo y grano, como el guante del dibujo.
   */
  monstruo: {
    /** Negro base. Tambien es el color de las particulas que suelta. */
    cuerpo: '#14181C',
    cuerpoAlto: '#3A444E',
    cuerpoBajo: '#07090B',
    contorno: '#000000',
    /** Filo frio del lomo: lo que le separa del fondo mire donde mire. */
    filo: 'rgba(200, 218, 230, 0.8)',
    filoSuave: 'rgba(200, 218, 230, 0)',
    /** Brillo ancho de la piel mojada, arriba a la izquierda. */
    lustre: 'rgba(226, 236, 243, 0.3)',
    lustreSuave: 'rgba(226, 236, 243, 0)',
    grano: 'rgba(158, 176, 190, 0.16)',
    boca: '#E8743B',
    bocaClara: '#FFA469',
    garganta: '#8C2E11',
    gargantaFondo: '#3A1206',
    diente: '#F3EFE4',
    dienteSombra: '#B4AC9B',
    iris: '#E8743B',
    irisClaro: '#FFC37C',
    pupila: '#090B0D',
    destello: 'rgba(255, 255, 255, 0.85)',
  },

  /**
   * El taller de la portada: azulejo, porton azul, suelo de hormigon y la
   * rejilla del foso. Mismo lenguaje que el resto: volumen por degradado,
   * contorno de tinta en los trastos y grano encima.
   */
  garaje: {
    techo: '#161C22',
    techoCanto: '#0C1115',
    fluorescente: '#F6F8EC',
    fluorescenteHalo: 'rgba(246, 248, 236, 0.16)',
    fluorescenteHaloSuave: 'rgba(246, 248, 236, 0)',
    soporte: '#0F1418',
    paredAlta: '#CCD6DE',
    paredBaja: '#AEBCC6',
    junta: 'rgba(92, 110, 124, 0.3)',
    granoPared: 'rgba(60, 76, 90, 0.16)',
    zocalo: '#44555F',
    zocaloCanto: '#566A76',
    porton: '#2E6FA8',
    portonClaro: '#3F8CCB',
    portonOscuro: '#1D4C76',
    portonJunta: 'rgba(10, 26, 42, 0.45)',
    portonFilo: 'rgba(196, 226, 248, 0.5)',
    portonTirador: '#16222C',
    marco: '#252D34',
    contorno: 'rgba(8, 12, 16, 0.75)',
    sueloAlto: '#8A97A1',
    sueloBajo: '#5E6872',
    sueloMancha: 'rgba(26, 20, 14, 0.15)',
    granoSuelo: 'rgba(18, 24, 30, 0.26)',
    rejillaHueco: '#2C333A',
    rejillaBarra: '#79838D',
    rejillaCanto: '#4F5962',
    sombra: 'rgba(10, 14, 18, 0.45)',
    sombraSuave: 'rgba(10, 14, 18, 0)',
    neumatico: '#191D21',
    neumaticoFilo: 'rgba(174, 192, 206, 0.35)',
    llanta: '#8A939B',
    cajonera: '#B23A2E',
    cajoneraClara: '#D45545',
    cajoneraCanto: '#7E241B',
    tirador: '#D9DEE3',
    manguera: '#2F7BD0',
  },

  /**
   * El emblema propio con el que se tapa la marca del fabricante en los tres
   * sitios donde sale. Cromado: claro arriba, oscuro abajo, tinta alrededor.
   */
  emblema: {
    alto: '#F3F5F6',
    medio: '#B7C0C7',
    bajo: '#6C7881',
    contorno: '#0E1318',
    filo: 'rgba(255, 255, 255, 0.92)',
    filoSuave: 'rgba(255, 255, 255, 0)',
    figura: '#171C21',
    figuraAlta: '#4A555F',
  },

  /** Marcas viales del nivel 2. Pintura gastada, no blanco de rotulador. */
  conduccion: {
    linea: 'rgba(228, 233, 234, 0.72)',
    arcen: 'rgba(228, 233, 234, 0.46)',
  },

  efectos: {
    fogonazo: '255, 244, 214',
    trazador: '255, 168, 96',
    acierto: '232, 116, 59',
    fallo: '255, 255, 255',
    /** Rastro de los abatidos y aviso de peligro, en triplete para el alfa. */
    mancha: '38, 24, 16',
    /** Negro del fundido entre la portada y la partida. */
    fundido: '6, 10, 14',
    aviso: '214, 58, 44',
  },
} as const;

/**
 * Pila del sistema: cero kilobytes, sin licencias de terceros y con buen
 * aspecto en iOS, Android y escritorio.
 */
export const TIPOGRAFIA =
  '"Avenir Next", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif';
