import type { NivelConduccion } from '../motor/tipos';

/**
 * Nivel 2 — Al volante.
 *
 * Solo datos, como el nivel 1. Lo que cambia es el modo: aqui no se dispara,
 * se conduce. El coche arranca parado y coge velocidad solo; lo unico que
 * hace el jugador es girar el volante con el dedo y llevarse por delante a
 * los monstruos que van apareciendo en la calzada.
 *
 * La dificultad sube con el reloj y no con los aciertos, porque lo que
 * aprieta es la velocidad: en doce segundos el coche esta a tope y los
 * monstruos pasan de tardar una eternidad a echarse encima en dos segundos
 * y medio, asi que hay que decidir a cual ir mucho antes de tenerlo delante.
 * Al minuto salen casi dos por segundo y puede haber ocho en la calzada.
 *
 * No hay derrota. Esta partida no se pierde: los que se escapan se escapan,
 * y el nivel acaba al llegar a 40. Si algun dia se quiere que fallar cueste
 * algo, ese es un cambio de mecanica y se decide aparte, no aqui.
 */
export const NIVEL_02: NivelConduccion = {
  id: 'nivel-02',
  nombre: 'Al volante',
  descripcion:
    'Ya no los esperas: vas a por ellos. Arrastra el dedo para girar el volante y atropellalos.',

  modo: 'conduccion',
  fondo: 'carretera',
  enemigo: 'monstruo',

  objetivo: { tipo: 'puntos', cantidad: 40 },
  derrota: { tipo: 'ninguna' },

  conduccion: {
    velocidadMaxima: 0.4,
    rampaVelocidad: 12,
    rampaDificultad: 55,
    ritmo: { inicio: 0.55, fin: 1.9 },
    simultaneos: { inicio: 3, fin: 8 },
    variacion: 0.22,
    suavizado: 0.8,
    respiroInicial: 1.2,
  },

  // Nadie aparece pisando el arcen: ahi no se puede atropellar a nadie.
  franjaAparicion: { min: 0.1, max: 0.9 },
};
