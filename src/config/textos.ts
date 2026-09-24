/**
 * Todos los textos visibles del juego, en un solo sitio.
 * Los de cada nivel viven en su definicion, no aqui.
 */

export const TEXTOS = {
  titulo: 'Salva el coche',

  inicio: {
    accion: 'Jugar',
    ayuda: 'Toca un monstruo para dispararle',
  },

  hud: {
    pausa: 'Pausa',
    etiquetaPausa: 'Pausar la partida',
    objetivo: 'Objetivo',
    infinito: 'Modo infinito',
  },

  pausa: {
    titulo: 'En pausa',
    reanudar: 'Seguir jugando',
    reiniciar: 'Empezar de nuevo',
  },

  victoria: {
    titulo: 'Coche salvado',
    cuerpo: 'Has aguantado hasta el final: ni un mordisco a la chapa.',
    salir: 'Salir al inicio',
    infinito: 'Modo infinito',
    avisoInfinito: 'Modo infinito: sin objetivo y sin techo, vienen cada vez mas y mas rapido.',
  },

  derrota: {
    titulo: 'Se comieron tu coche',
    accion: 'Reintentar',
  },

  /** Rotulos que van pintados dentro del dibujo, no en la interfaz. */
  arte: {
    cocheDistintivo: '1.0',
    pistolaMarca: 'ANTI',
    pistolaModelo: 'OXIDO',
  },

  marcador: {
    abatidoUno: 'monstruo abatido',
    abatidosVarios: 'monstruos abatidos',
    de: 'de',
    mejor: 'Mejor marca',
  },
} as const;
