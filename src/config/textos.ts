/**
 * Todos los textos visibles del juego, en un solo sitio.
 * Los de cada nivel viven en su definicion, no aqui.
 *
 * **El juego se muestra en danes.** Los comentarios y la documentacion siguen
 * en espanol, como el resto del taller: lo que se traduce es lo que lee quien
 * juega, no lo que lee quien programa. Si algun dia hay que volver a tener dos
 * idiomas, este archivo y las tres cadenas de cada nivel (`nombre`,
 * `descripcion`) son todo lo que hay que duplicar; no hay ni un texto suelto
 * en el resto del codigo.
 */

export const TEXTOS = {
  titulo: 'Red bilen',

  inicio: {
    accion: 'Spil',
    nivelAnterior: 'Forrige bane',
    nivelSiguiente: 'Næste bane',
  },

  hud: {
    pausa: 'Pause',
    etiquetaPausa: 'Sæt spillet på pause',
    // Lleva los dos puntos porque se pega delante del numero: «Mål: 100».
    objetivo: 'Mål:',
    infinito: 'Endeløs tilstand',
  },

  pausa: {
    titulo: 'På pause',
    reanudar: 'Spil videre',
    reiniciar: 'Start forfra',
  },

  /** Vuelta a la portada, que es donde se elige el nivel. */
  salir: 'Tilbage til start',

  victoria: {
    titulo: 'Bilen er reddet',
    cuerpo: 'Du holdt stand til det sidste — ikke en eneste bid i lakken.',
    infinito: 'Endeløs tilstand',
    avisoInfinito:
      'Endeløs tilstand: intet mål og ingen grænse. De kommer flere og flere, og hurtigere og hurtigere.',
  },

  derrota: {
    titulo: 'De åd din bil',
    accion: 'Prøv igen',
  },

  /** Se montan asi: «5 monstre nedlagt ud af 100». */
  marcador: {
    abatidoUno: 'monster nedlagt',
    abatidosVarios: 'monstre nedlagt',
    de: 'ud af',
    mejor: 'Bedste resultat',
  },
} as const;
