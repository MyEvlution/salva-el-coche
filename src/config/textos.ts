/**
 * Todos los textos visibles del juego, en un solo sitio.
 * Los de cada nivel viven en su definicion, no aqui.
 */

export const TEXTOS = {
  titulo: 'Salva el coche',

  inicio: {
    accion: 'Jugar',
    nivelAnterior: 'Nivel anterior',
    nivelSiguiente: 'Nivel siguiente',
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

  /** Vuelta a la portada, que es donde se elige el nivel. */
  salir: 'Salir al inicio',

  victoria: {
    titulo: 'Coche salvado',
    cuerpo: 'Has aguantado hasta el final: ni un mordisco a la chapa.',
    infinito: 'Modo infinito',
    avisoInfinito: 'Modo infinito: sin objetivo y sin techo, vienen cada vez mas y mas rapido.',
  },

  derrota: {
    titulo: 'Se comieron tu coche',
    accion: 'Reintentar',
  },

  marcador: {
    abatidoUno: 'monstruo abatido',
    abatidosVarios: 'monstruos abatidos',
    de: 'de',
    mejor: 'Mejor marca',
  },
} as const;
