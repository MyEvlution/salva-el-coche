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

  /**
   * La pistola de aire del taller: fundicion verde militar, acero, laton y
   * un guante de nitrilo negro. Cada pieza tiene claro / medio / oscuro
   * porque el volumen se hace con degradados, igual que en el coche.
   */
  /**
   * El taller de la portada: azulejo, porton azul, suelo de hormigon y la
   * rejilla del foso. Mismo lenguaje que el resto: plano, con degradados
   * para el volumen.
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
    zocalo: '#44555F',
    zocaloCanto: '#566A76',
    porton: '#2E6FA8',
    portonClaro: '#3F8CCB',
    portonOscuro: '#1D4C76',
    portonJunta: 'rgba(10, 26, 42, 0.45)',
    portonTirador: '#16222C',
    marco: '#252D34',
    sueloAlto: '#94A0AA',
    sueloBajo: '#6E7984',
    sueloMancha: 'rgba(26, 20, 14, 0.15)',
    rejillaHueco: '#2C333A',
    rejillaBarra: '#79838D',
    rejillaCanto: '#4F5962',
    sombra: 'rgba(10, 14, 18, 0.45)',
    sombraSuave: 'rgba(10, 14, 18, 0)',
    neumatico: '#191D21',
    llanta: '#8A939B',
    cajonera: '#B23A2E',
    cajoneraCanto: '#7E241B',
    tirador: '#D9DEE3',
    manguera: '#2F7BD0',
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
