import type { NivelDefensa } from '../motor/tipos';

/**
 * Nivel 1 — La carretera.
 *
 * Solo datos: el motor los lee y monta la partida. Para anadir un nivel nuevo
 * se copia este archivo, se cambian los numeros y se registra en `indice.ts`.
 */
export const NIVEL_01: NivelDefensa = {
  id: 'nivel-01',
  nombre: 'Landevejen',
  descripcion: 'Rustmonstrene vil æde din bil. Ét skud, ét monster.',

  modo: 'defensa',
  fondo: 'carretera',
  protegido: 'coche',
  enemigo: 'monstruo',

  objetivo: { tipo: 'puntos', cantidad: 100 },
  derrota: { tipo: 'alcanzaObjetivoProtegido' },

  // La dificultad sube con cada monstruo abatido, no con el reloj: no hay
  // cuenta atras ni limite de tiempo, la partida acaba al llegar a 100.
  //
  // Los numeros salen de resolver la integral del tiempo, no de probar a ojo:
  // una partida seguida dura unos 70 segundos, con 30 monstruos en la primera
  // mitad y los 70 restantes en la segunda. La subida es continua, sin
  // escalones: de 0.46 apariciones por segundo se pasa a 2.15, que con la
  // aparicion doble son unos 2.9 monstruos por segundo en el tramo final.
  // Ademas cruzan cada vez mas rapido: de 5.5 segundos a 2.4.
  //
  // En modo infinito estas rampas se extrapolan mas alla de `fin`, asi que
  // estos numeros marcan tambien el ritmo al que sigue subiendo despues.
  dificultad: {
    recorrido: { inicio: 5.5, fin: 2.4 },
    ritmo: { inicio: 0.46, fin: 2.15 },
    simultaneos: { inicio: 4, fin: 10 },
    aparicionDoble: { inicio: 0, fin: 0.35 },
    variacion: 0.22,
    suavizado: 0.75,
    respiroInicial: 0.8,
  },

  // Por la derecha del todo no asoman: ahi esta la mano con la pistola.
  franjaAparicion: { min: 0.06, max: 0.8 },
};
