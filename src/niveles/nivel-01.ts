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

  // La dificultad sube con cada monstruo abatido, no con el reloj: el que
  // juega despacio no sale castigado. `suavizado` por encima de 1 deja la
  // primera mitad tranquila y apreta cerca del final.
  dificultad: {
    recorrido: { inicio: 9, fin: 4.6 },
    aparicion: { inicio: 2.3, fin: 0.85 },
    simultaneos: { inicio: 3, fin: 7 },
    aparicionDoble: { inicio: 0, fin: 0.35 },
    variacion: 0.22,
    suavizado: 1.15,
    respiroInicial: 0.8,
  },

  // Por la derecha del todo no asoman: ahi esta la mano con la pistola.
  franjaAparicion: { min: 0.06, max: 0.8 },
};
