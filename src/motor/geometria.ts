import { AJUSTES } from '../config/ajustes';
import type { Enemigo2D, Proyeccion } from './tipos';

/**
 * Medidas del escenario para un tamano de pantalla dado. Se recalculan solo
 * al redimensionar, nunca por frame.
 */
export interface Geometria {
  ancho: number;
  alto: number;
  horizonte: number;
  coche: { x: number; base: number; ancho: number; alto: number };
  /** Altura de pantalla a la que llega un enemigo con avance 1. */
  yFinal: number;
  /** Escala del enemigo cuando ya esta encima del coche. */
  escalaMaxima: number;
}

/** Unidades locales del monstruo: alto y ancho de referencia del dibujo. */
const MONSTRUO_ALTO = 238;
const MONSTRUO_ANCHO = 220;

export function calcularGeometria(ancho: number, alto: number): Geometria {
  const horizonte = alto * AJUSTES.horizonte;

  const izquierda = ancho * AJUSTES.coche.izquierda;
  const derecha = ancho * AJUSTES.coche.derecha;
  const cajaAlto = Math.min(ancho * 0.49, alto * 0.45);
  const razon = AJUSTES.coche.razonAlto;
  const cocheAncho = Math.min(derecha - izquierda, cajaAlto / razon, AJUSTES.coche.anchoMaximo);
  const cocheAlto = cocheAncho * razon;
  const cocheX = (izquierda + derecha) / 2;
  const base = alto;
  const yFinal = base - cocheAlto + cocheAlto * 0.32;

  const escalaMaxima = Math.min(
    (ancho * 0.64) / MONSTRUO_ANCHO,
    (cocheAncho * 1.25) / MONSTRUO_ANCHO,
    (yFinal - alto * 0.05) / MONSTRUO_ALTO,
  );

  return {
    ancho,
    alto,
    horizonte,
    coche: { x: cocheX, base, ancho: cocheAncho, alto: cocheAlto },
    yFinal,
    escalaMaxima,
  };
}

/**
 * Convierte el avance de un enemigo (0 en el horizonte, 1 encima del coche)
 * en posicion y tamano de pantalla. La curva hace que de lejos parezca que
 * avanzan despacio y de cerca se echen encima de golpe.
 */
export function proyectar(g: Geometria, enemigo: Enemigo2D, destino: Proyeccion): Proyeccion {
  const { curva, convergencia, escalaMinima } = AJUSTES.proyeccion;
  const q = Math.pow(enemigo.avance, curva);
  destino.x = g.coche.x + (enemigo.x0 - g.coche.x) * (1 - convergencia * q);
  destino.y = g.horizonte + (g.yFinal - g.horizonte) * q;
  destino.escala = g.escalaMaxima * (escalaMinima + (1 - escalaMinima) * q);
  return destino;
}
