import { AJUSTES } from '../config/ajustes';

/**
 * El idioma visual de los dos dibujos del taller, escrito como funciones para
 * que lo hable todo lo demas: contorno de tinta, grano de suciedad, filo de
 * luz frio en los cantos de arriba y oscurecido de los bordes.
 *
 * Todo esto es caro, asi que **solo se usa dentro de los canvas de cache**:
 * se pinta una vez por tamano de pantalla y por frame solo se copia. Nada de
 * lo que hay aqui debe llamarse en el bucle de dibujo.
 */

/**
 * Numeros pseudoaleatorios reproducibles. El grano tiene que caer siempre en
 * el mismo sitio: si cambiara al repintar, girar el movil "moveria" la
 * suciedad del asfalto y se notaria.
 */
export function sembrar(semilla: number): () => number {
  let s = semilla >>> 0 || 1;
  return () => {
    // xorshift32: barato, sin dependencias y de sobra para unas motas
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/**
 * Motas de suciedad sobre una zona ya pintada. La cantidad sale del area, no
 * de un numero fijo, para que una tableta no quede mas limpia que un movil.
 *
 * @param densidad  Motas por cada 10 000 px de area.
 */
export function granular(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  colores: readonly string[],
  densidad: number,
  semilla: number,
): void {
  const { motasMaximas, motaMinima, motaMaxima } = AJUSTES.estilo.grano;
  const cuantas = Math.min(motasMaximas, Math.round(((ancho * alto) / 10000) * densidad));
  if (cuantas <= 0 || colores.length === 0) return;
  const azar = sembrar(semilla);
  for (let i = 0; i < cuantas; i++) {
    const color = colores[i % colores.length] as string;
    ctx.fillStyle = color;
    const tamano = motaMinima + azar() * (motaMaxima - motaMinima);
    ctx.fillRect(x + azar() * ancho, y + azar() * alto, tamano, tamano);
  }
}

/**
 * Contorno de tinta de una silueta. Es lo que mas pesa en el parecido con los
 * dibujos: sin el, una forma plana sigue pareciendo un recorte.
 *
 * No se traza la ruta: una silueta hecha de partes solapadas tiene bordes
 * **por dentro**, y trazarla dibujaria tambien esos, que es una cadena de
 * anillos y no un contorno. Lo que se hace es rellenar la misma forma varias
 * veces alrededor y meterla por detras de lo ya pintado, asi que solo asoma
 * por fuera de la silueta entera. Es un pegatinado, no un trazo.
 */
export function entintar(
  ctx: CanvasRenderingContext2D,
  forma: Path2D,
  color: string,
  grosor: number,
): void {
  const pasos = AJUSTES.estilo.pasosContorno;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = color;
  for (let i = 0; i < pasos; i++) {
    const angulo = (i / pasos) * Math.PI * 2;
    ctx.save();
    ctx.translate(Math.cos(angulo) * grosor, Math.sin(angulo) * grosor);
    ctx.fill(forma);
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Filo de luz por dentro del canto de arriba. Mismo problema que el contorno,
 * asi que misma solucion sin trazos: se recorta la silueta, se pinta la luz
 * encima de todo y se vuelve a tapar con la propia silueta bajada unos
 * pixeles. Lo unico que queda al descubierto es el canto de arriba.
 *
 * @param arriba  `y` donde el filo esta a plena luz.
 * @param abajo   `y` donde ya se ha apagado del todo.
 * @param tapar   Con que volver a tapar la silueta: el relleno del cuerpo.
 */
export function filoDeLuz(
  ctx: CanvasRenderingContext2D,
  forma: Path2D,
  caja: { x: number; y: number; ancho: number; alto: number },
  arriba: number,
  abajo: number,
  color: string,
  colorSuave: string,
  grosor: number,
  tapar: string | CanvasGradient,
): void {
  const luz = ctx.createLinearGradient(0, arriba, 0, abajo);
  luz.addColorStop(0, color);
  luz.addColorStop(1, colorSuave);
  ctx.save();
  ctx.clip(forma);
  ctx.fillStyle = luz;
  ctx.fillRect(caja.x, caja.y, caja.ancho, caja.alto);
  ctx.translate(0, grosor);
  ctx.fillStyle = tapar;
  ctx.fill(forma);
  ctx.restore();
}

/** Oscurecido de los bordes de una zona rectangular, como un cuadro. */
export function vinetear(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  color: string,
  colorSuave: string,
): void {
  const { vinetaDentro } = AJUSTES.estilo;
  const centroX = ancho / 2;
  const centroY = alto / 2;
  const radio = Math.hypot(centroX, centroY);
  const velo = ctx.createRadialGradient(
    centroX,
    centroY,
    radio * vinetaDentro,
    centroX,
    centroY,
    radio,
  );
  velo.addColorStop(0, colorSuave);
  velo.addColorStop(1, color);
  ctx.fillStyle = velo;
  ctx.fillRect(0, 0, ancho, alto);
}
