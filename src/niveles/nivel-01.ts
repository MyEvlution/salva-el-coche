import type { DefinicionNivel } from '../motor/tipos';

/**
 * Nivel 1 — La carretera.
 *
 * Solo datos: el motor los lee y monta la partida. Para anadir un nivel nuevo
 * se copia este archivo, se cambian los numeros y se registra en `indice.ts`.
 */
export const NIVEL_01: DefinicionNivel = {
  id: 'nivel-01',
  nombre: 'La carretera',
  descripcion: 'Los monstruos del oxido quieren comerse tu coche. Un disparo, un monstruo.',

  fondo: 'carretera',
  protegido: 'coche',
  enemigo: 'monstruo',

  objetivo: { tipo: 'puntos', cantidad: 100 },
  derrota: { tipo: 'alcanzaObjetivoProtegido' },

  // La dificultad sube con cada monstruo abatido, no con el reloj: no hay
  // cuenta atras ni limite de tiempo, la partida acaba al llegar a 100.
  //
  // Los numeros estan calculados para que una partida seguida dure unos 40
  // segundos: 30 monstruos en los primeros 20 segundos y los 70 restantes en
  // los otros 20, subiendo poco a poco y sin escalones. De 0.8 apariciones
  // por segundo al empezar se pasa a 3.75, y con la probabilidad de aparicion
  // doble eso son algo mas de 5 monstruos por segundo al final. Ademas cruzan
  // cada vez mas rapido: de 5 segundos a 1.8.
  dificultad: {
    recorrido: { inicio: 5, fin: 1.8 },
    ritmo: { inicio: 0.8, fin: 3.75 },
    simultaneos: { inicio: 5, fin: 14 },
    aparicionDoble: { inicio: 0, fin: 0.35 },
    variacion: 0.22,
    suavizado: 0.75,
    respiroInicial: 0.8,
  },

  // Por la derecha del todo no asoman: ahi esta la mano con la pistola.
  franjaAparicion: { min: 0.06, max: 0.8 },
};
