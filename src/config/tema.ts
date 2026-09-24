/**
 * Paleta y tipografia. Todo el color del juego sale de aqui: ningun modulo
 * escribe un codigo hexadecimal a mano.
 */

export const COLOR = {
  escenario: {
    cielo: '#7393AA',
    sueloAlto: '#C6D9E8',
    sueloBajo: '#B6CBDD',
    sombra: 'rgba(25, 45, 70, 0.16)',
  },

  monstruo: {
    cuerpo: '#000000',
    boca: '#E8743B',
    garganta: '#C4571F',
    diente: '#FFFFFF',
    iris: '#E8743B',
  },

  coche: {
    chapaAlta: '#E8484A',
    chapaMedia: '#D0292F',
    chapaBaja: '#A81920',
    brilloTecho: 'rgba(255, 255, 255, 0.16)',
    brilloHombro: 'rgba(255, 255, 255, 0.1)',
    /** Oscurecido de los cantos: es lo que hace que la chapa parezca curva. */
    cantos: 'rgba(24, 6, 10, 0.34)',
    cantosSuave: 'rgba(24, 6, 10, 0)',
    bajos: 'rgba(12, 6, 8, 0.5)',
    bajosSuave: 'rgba(12, 6, 8, 0)',
    junta: 'rgba(18, 8, 10, 0.55)',
    piloto: '#C42B27',
    pilotoCarcasa: '#7C1714',
    pilotoLente: '#E2453A',
    pilotoBrillo: 'rgba(255, 255, 255, 0.4)',
    pilotoBlanco: '#C2CBD1',
    pilotoAmbar: '#F0A03C',
    aleta: '#1D2126',
    lunetaAlta: '#4E6074',
    lunetaMedia: '#2A2F38',
    lunetaBaja: '#22262D',
    reflejoFuerte: 'rgba(190, 212, 230, 0.22)',
    reflejoSuave: 'rgba(190, 212, 230, 0.12)',
    /** Goma de la luneta y lineas del desempanador. */
    goma: '#0D1014',
    desempanador: 'rgba(196, 216, 232, 0.07)',
    limpia: '#0E1013',
    emblema: '#C9CED4',
    pegatina: '#F29A55',
    pegatinaTinta: '#2A1A10',
    aleron: '#1B1E22',
    frenoBase: '#A8231C',
    frenoLuz: '#E2493B',
    paragolpes: '#2B3036',
    paragolpesBajo: '#1A1E23',
    paragolpesBrillo: '#3D444C',
    paragolpesJunta: 'rgba(10, 12, 15, 0.55)',
    catadioptrico: '#D63A2C',
    matricula: '#F1F4F6',
    matriculaBanda: '#2B57A6',
    matriculaTinta: '#20242A',
    matriculaReceso: 'rgba(0, 0, 0, 0.38)',
    rotulo: '#E9EEF2',
  },

  /**
   * La pistola de aire del taller: fundicion verde militar, acero, laton y
   * un guante de nitrilo negro. Cada pieza tiene claro / medio / oscuro
   * porque el volumen se hace con degradados, igual que en el coche.
   */
  pistola: {
    verdeAlto: '#5E6E4F',
    verdeMedio: '#414E38',
    verdeBajo: '#212819',
    /** Oscurecido de los cantos: hace que la fundicion parezca redonda. */
    verdeCanto: 'rgba(8, 12, 6, 0.45)',
    verdeCantoSuave: 'rgba(8, 12, 6, 0)',
    verdeArista: 'rgba(216, 228, 198, 0.22)',
    verdeJunta: 'rgba(8, 11, 6, 0.5)',

    aceroAlto: '#E6EAED',
    aceroMedio: '#AFB6BC',
    aceroBajo: '#6C737A',
    aceroSombra: '#474D53',
    moleteadoOscuro: 'rgba(38, 44, 50, 0.6)',
    moleteadoClaro: 'rgba(255, 255, 255, 0.26)',

    latonAlto: '#F2D687',
    latonMedio: '#C7A04A',
    latonBajo: '#7C5E22',

    anilloAlto: '#EE6B5E',
    anilloMedio: '#CE362C',
    anilloBajo: '#8A1C16',

    /** Piezas negras: tuerca de union, gatillo, boquilla. */
    negroAlto: '#343A40',
    negroMedio: '#1B1F23',
    negroBajo: '#0A0C0E',

    /** Nitrilo: casi negro, pero con un brillo frio muy marcado. */
    guanteAlto: '#2F363D',
    guanteMedio: '#171B1F',
    guanteBajo: '#07090B',
    guanteBrillo: 'rgba(202, 220, 238, 0.16)',
    guanteBrilloSuave: 'rgba(202, 220, 238, 0)',
    /** Reflejo especular: es lo que delata que el guante es de goma. */
    guanteReflejo: 'rgba(216, 232, 248, 0.26)',
    guantePliegue: 'rgba(0, 0, 0, 0.5)',

    mangueraAlta: '#5CA3E6',
    manguera: '#2F7BD0',
    mangueraBaja: '#1A4E8C',
    muelle: '#9AA1A7',

    /** Grasa de taller sobre la fundicion. */
    aceite: 'rgba(88, 66, 24, 0.45)',
    aceiteBrillo: 'rgba(240, 208, 132, 0.5)',

    grabado: 'rgba(198, 208, 180, 0.72)',
    grabadoHueco: 'rgba(0, 0, 0, 0.45)',
    tornillo: '#5C6166',
    /** Sombra de contacto entre piezas. */
    ocluido: 'rgba(0, 0, 0, 0.38)',
  },

  efectos: {
    fogonazo: '255, 244, 214',
    trazador: '255, 168, 96',
    acierto: '232, 116, 59',
    fallo: '255, 255, 255',
    /** Rastro de los abatidos y aviso de peligro, en triplete para el alfa. */
    mancha: '38, 24, 16',
    aviso: '214, 58, 44',
  },
} as const;

/**
 * Pila del sistema: cero kilobytes, sin licencias de terceros y con buen
 * aspecto en iOS, Android y escritorio.
 */
export const TIPOGRAFIA =
  '"Avenir Next", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif';

export const TIPOGRAFIA_ESTRECHA = '"Arial Narrow", Arial, sans-serif';
