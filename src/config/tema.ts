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

  pistola: {
    verde: '#3E4A34',
    verdeClaro: '#57664A',
    verdeOscuro: '#252C20',
    verdeGatillo: '#46533C',
    acero: '#B9BEC2',
    aceroMedio: '#A5ABB1',
    aceroOscuro: '#7E848A',
    aceroClaro: '#DDE1E4',
    tornillo: '#5C6166',
    laton: '#C9A24A',
    latonClaro: '#E6C872',
    latonOscuro: '#8F6F2C',
    guante: '#111316',
    guanteBrillo: '#2B3036',
    manguera: '#2F7BD0',
    muelle: '#6E7378',
    anilloRojo: '#D3342B',
    anilloRojoClaro: '#E8574D',
    boquillaOscura: '#15181B',
    producto: '#6B4A1E',
    productoBrillo: 'rgba(224, 170, 90, 0.75)',
    grabado: 'rgba(207, 214, 190, 0.9)',
    brillo: 'rgba(255, 255, 255, 0.14)',
    brilloGuante: 'rgba(255, 255, 255, 0.07)',
    sombra: 'rgba(0, 0, 0, 0.25)',
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
