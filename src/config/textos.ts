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
  },

  pausa: {
    titulo: 'En pausa',
    reanudar: 'Seguir jugando',
    reiniciar: 'Empezar de nuevo',
  },

  victoria: {
    titulo: 'Coche salvado',
    cuerpo: 'Has aguantado hasta el final: ni un mordisco a la chapa.',
    accion: 'Jugar otra vez',
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
