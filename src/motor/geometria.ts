import { AJUSTES } from '../config/ajustes';
import type { Colocacion } from '../arte/interior';
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

// --------------------------------------------------------------- conduccion

/**
 * Medidas del nivel que se juega desde dentro del coche. No hereda de
 * `Geometria` a proposito: alli el coche esta abajo y quieto, y aqui el
 * coche es la camara. Lo unico que comparten es la curva de la proyeccion.
 */
export interface GeometriaConduccion {
  ancho: number;
  alto: number;
  /** Franja de pantalla por la que se ve la calzada. */
  ventana: { arriba: number; abajo: number };
  horizonte: number;
  /** Altura a la que pasa por delante del capo lo que llega con avance 1. */
  yFinal: number;
  /** Punto de fuga de la calzada. */
  fugaX: number;
  /** Media calzada en pixeles cuando ya esta encima del parabrisas. */
  mediaCalzada: number;
  escalaMaxima: number;
}

export function calcularGeometriaConduccion(
  colocacion: Colocacion,
  ancho: number,
  alto: number,
): GeometriaConduccion {
  // Solo cuenta el trozo de parabrisas que se ve: en apaisado la mitad de
  // arriba se sale de la pantalla, y si el horizonte se calculara sobre el
  // hueco entero acabaria fuera y no habria cielo.
  const ventana = {
    arriba: Math.max(0, colocacion.ventana.arriba),
    abajo: Math.min(alto, colocacion.ventana.abajo),
  };
  const fondo = ventana.abajo - ventana.arriba;
  const horizonte = ventana.arriba + fondo * AJUSTES.conduccion.horizonteEnVentana;
  // Lo que llega se sale por debajo del parabrisas: al atropellarlo ya esta
  // tapado por el capo, que es justo lo que se ve desde el asiento.
  const yFinal = ventana.abajo + fondo * AJUSTES.conduccion.finBajoElCapo;
  const profundidad = yFinal - horizonte;

  return {
    ancho,
    alto,
    ventana,
    horizonte,
    yFinal,
    fugaX: colocacion.fugaX,
    mediaCalzada: ancho * AJUSTES.conduccion.mediaCalzada,
    escalaMaxima: (profundidad * AJUSTES.conduccion.altoMonstruo) / MONSTRUO_ALTO,
  };
}

/**
 * Sitio y tamano de algo que esta en la calzada. `avance` va de 0 (horizonte)
 * a 1 (a la altura del parachoques) y `u` es la posicion a lo ancho de la
 * calzada, de -1 (arcen izquierdo) a 1 (derecho).
 */
export function proyectarConduccion(
  g: GeometriaConduccion,
  avance: number,
  u: number,
  cocheU: number,
  destino: Proyeccion,
): Proyeccion {
  const { curva, escalaMinima } = AJUSTES.proyeccion;
  const q = Math.pow(Math.max(0, avance), curva);
  const k = escalaMinima + (1 - escalaMinima) * q;
  destino.x = g.fugaX + (u - cocheU) * g.mediaCalzada * k;
  destino.y = g.horizonte + (g.yFinal - g.horizonte) * q;
  destino.escala = g.escalaMaxima * k;
  return destino;
}
