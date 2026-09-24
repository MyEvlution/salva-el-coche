import { TEXTOS } from '../config/textos';
import { COLOR, TIPOGRAFIA } from '../config/tema';
import { lienzoCache } from '../motor/lienzo';
import { TAU, rectRedondeado } from './formas';

/**
 * El coche: un utilitario rojo visto por detras, con sus pegatinas naranjas
 * de taller y los dos ojitos pegados en el paragolpes.
 *
 * Son mas de cien operaciones vectoriales, asi que se pinta una sola vez en
 * un canvas aparte y por frame solo se copia esa imagen. Se rehace nada mas
 * cuando cambia el tamano de la pantalla.
 */
export class Coche {
  private cache: HTMLCanvasElement | null = null;
  private anchoCache = 0;
  private altoCache = 0;

  rehacer(ancho: number, dpr: number): void {
    const margen = ancho * 0.02;
    this.anchoCache = ancho + margen * 2;
    this.altoCache = ancho * 0.665 + margen;

    const { canvas, ctx } = lienzoCache(this.anchoCache, this.altoCache, dpr);
    ctx.save();
    ctx.translate(this.anchoCache / 2, this.altoCache);
    pintarCoche(ctx, ancho);
    ctx.restore();
    this.cache = canvas;
  }

  /** `x` es el eje del coche y `base` la linea del suelo. */
  dibujar(ctx: CanvasRenderingContext2D, x: number, base: number): void {
    if (!this.cache) return;
    ctx.drawImage(
      this.cache,
      x - this.anchoCache / 2,
      base - this.altoCache,
      this.anchoCache,
      this.altoCache,
    );
  }
}

/** Dibuja el coche con el origen en el centro de su linea de suelo. */
function pintarCoche(ctx: CanvasRenderingContext2D, ancho: number): void {
  const c = COLOR.coche;
  ctx.save();
  ctx.scale(ancho, ancho); // a partir de aqui, 1 unidad = ancho del coche
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Silueta de la carroceria
  const carroceria = new Path2D();
  carroceria.moveTo(-0.47, 0);
  carroceria.lineTo(-0.49, -0.22);
  carroceria.bezierCurveTo(-0.5, -0.4, -0.44, -0.56, -0.33, -0.64);
  carroceria.quadraticCurveTo(-0.28, -0.665, -0.2, -0.665);
  carroceria.lineTo(0.2, -0.665);
  carroceria.quadraticCurveTo(0.28, -0.665, 0.33, -0.64);
  carroceria.bezierCurveTo(0.44, -0.56, 0.5, -0.4, 0.49, -0.22);
  carroceria.lineTo(0.47, 0);
  carroceria.closePath();

  const chapa = ctx.createLinearGradient(0, -0.665, 0, 0);
  chapa.addColorStop(0, c.chapaAlta);
  chapa.addColorStop(0.55, c.chapaMedia);
  chapa.addColorStop(1, c.chapaBaja);
  ctx.fillStyle = chapa;
  ctx.fill(carroceria);

  // Todo lo que va pintado sobre la chapa, recortado a la silueta
  ctx.save();
  ctx.clip(carroceria);

  // Cantos oscuros: es lo que hace que la chapa parezca curva y no plana
  const cantos = ctx.createLinearGradient(-0.5, 0, 0.5, 0);
  cantos.addColorStop(0, c.cantos);
  cantos.addColorStop(0.18, c.cantosSuave);
  cantos.addColorStop(0.82, c.cantosSuave);
  cantos.addColorStop(1, c.cantos);
  ctx.fillStyle = cantos;
  ctx.fillRect(-0.5, -0.67, 1, 0.67);

  // Sombra de los bajos
  const bajos = ctx.createLinearGradient(0, -0.16, 0, 0);
  bajos.addColorStop(0, c.bajosSuave);
  bajos.addColorStop(1, c.bajos);
  ctx.fillStyle = bajos;
  ctx.fillRect(-0.5, -0.16, 1, 0.16);

  // Brillo del techo y reflejo largo del hombro
  ctx.fillStyle = c.brilloTecho;
  ctx.beginPath();
  ctx.moveTo(-0.19, -0.665);
  ctx.lineTo(0.19, -0.665);
  ctx.lineTo(0.21, -0.645);
  ctx.lineTo(-0.21, -0.645);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c.brilloHombro;
  ctx.beginPath();
  ctx.moveTo(-0.44, -0.545);
  ctx.quadraticCurveTo(-0.36, -0.63, -0.26, -0.652);
  ctx.lineTo(-0.26, -0.634);
  ctx.quadraticCurveTo(-0.35, -0.614, -0.425, -0.535);
  ctx.closePath();
  ctx.fill();

  // Pilotos: carcasa oscura, lente rojo, ambar, marcha atras y un destello
  for (const lado of [-1, 1]) {
    const x = lado < 0 ? -0.5 : 0.365;
    ctx.fillStyle = c.pilotoCarcasa;
    rectRedondeado(ctx, x, -0.578, 0.138, 0.268, 0.042);
    ctx.fill();
    ctx.fillStyle = c.pilotoLente;
    rectRedondeado(ctx, x + 0.009, -0.569, 0.12, 0.132, 0.034);
    ctx.fill();
    ctx.fillStyle = c.pilotoAmbar;
    rectRedondeado(ctx, x + 0.009, -0.432, 0.12, 0.072, 0.028);
    ctx.fill();
    ctx.fillStyle = c.pilotoBlanco;
    rectRedondeado(ctx, x + (lado < 0 ? 0.052 : 0.009), -0.352, 0.077, 0.03, 0.014);
    ctx.fill();
    ctx.fillStyle = c.pilotoBrillo;
    rectRedondeado(ctx, x + 0.022, -0.556, 0.036, 0.104, 0.018);
    ctx.fill();
  }

  // Junta del porton: el hueco por donde se abre
  ctx.strokeStyle = c.junta;
  ctx.lineWidth = 0.006;
  for (const lado of [-1, 1]) {
    const x = 0.349 * lado;
    ctx.beginPath();
    ctx.moveTo(x, -0.62);
    ctx.lineTo(x, -0.225);
    ctx.stroke();
  }

  ctx.restore();

  // Aletas negras de los bajos
  ctx.fillStyle = c.aleta;
  rectRedondeado(ctx, -0.475, -0.115, 0.135, 0.115, 0.04);
  ctx.fill();
  rectRedondeado(ctx, 0.34, -0.115, 0.135, 0.115, 0.04);
  ctx.fill();

  // Luneta trasera
  const luneta = new Path2D();
  luneta.moveTo(-0.36, -0.29);
  luneta.lineTo(-0.325, -0.55);
  luneta.quadraticCurveTo(-0.315, -0.59, -0.27, -0.59);
  luneta.lineTo(0.27, -0.59);
  luneta.quadraticCurveTo(0.315, -0.59, 0.325, -0.55);
  luneta.lineTo(0.36, -0.29);
  luneta.quadraticCurveTo(0, -0.27, -0.36, -0.29);
  luneta.closePath();

  const cristal = ctx.createLinearGradient(-0.3, -0.59, 0.3, -0.29);
  cristal.addColorStop(0, c.lunetaAlta);
  cristal.addColorStop(0.55, c.lunetaMedia);
  cristal.addColorStop(1, c.lunetaBaja);
  ctx.fillStyle = cristal;
  ctx.fill(luneta);

  ctx.save();
  ctx.clip(luneta);
  // Lineas del desempanador
  ctx.strokeStyle = c.desempanador;
  ctx.lineWidth = 0.007;
  for (let i = 0; i < 6; i++) {
    const y = -0.555 + i * 0.048;
    ctx.beginPath();
    ctx.moveTo(-0.36, y);
    ctx.lineTo(0.36, y);
    ctx.stroke();
  }
  // Reflejos del cristal
  ctx.fillStyle = c.reflejoFuerte;
  ctx.beginPath();
  ctx.moveTo(-0.28, -0.59);
  ctx.lineTo(-0.14, -0.59);
  ctx.lineTo(-0.24, -0.29);
  ctx.lineTo(-0.36, -0.29);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c.reflejoSuave;
  ctx.beginPath();
  ctx.moveTo(0.02, -0.59);
  ctx.lineTo(0.09, -0.59);
  ctx.lineTo(-0.01, -0.29);
  ctx.lineTo(-0.08, -0.29);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Goma que sujeta la luneta
  ctx.strokeStyle = c.goma;
  ctx.lineWidth = 0.016;
  ctx.stroke(luneta);

  // Limpiaparabrisas trasero, con su pivote
  ctx.strokeStyle = c.limpia;
  ctx.lineWidth = 0.014;
  ctx.beginPath();
  ctx.moveTo(-0.09, -0.315);
  ctx.quadraticCurveTo(0.05, -0.375, 0.22, -0.345);
  ctx.stroke();
  ctx.fillStyle = c.limpia;
  ctx.beginPath();
  ctx.ellipse(-0.092, -0.312, 0.022, 0.018, 0, 0, TAU);
  ctx.fill();

  // Emblema
  ctx.fillStyle = c.emblema;
  ctx.beginPath();
  ctx.ellipse(0, -0.3, 0.022, 0.026, 0, 0, TAU);
  ctx.fill();

  // Pegatina naranja de taller en la luneta
  ctx.fillStyle = c.pegatina;
  rectRedondeado(ctx, -0.345, -0.375, 0.22, 0.06, 0.03);
  ctx.fill();
  ctx.fillStyle = c.pegatinaTinta;
  rectRedondeado(ctx, -0.29, -0.35, 0.1, 0.014, 0.007);
  ctx.fill();

  // Alerones del techo y tercera luz de freno
  ctx.fillStyle = c.aleron;
  rectRedondeado(ctx, -0.325, -0.63, 0.07, 0.085, 0.025);
  ctx.fill();
  rectRedondeado(ctx, 0.255, -0.63, 0.07, 0.085, 0.025);
  ctx.fill();
  ctx.fillStyle = c.frenoBase;
  rectRedondeado(ctx, -0.09, -0.635, 0.18, 0.022, 0.011);
  ctx.fill();
  ctx.fillStyle = c.frenoLuz;
  rectRedondeado(ctx, -0.085, -0.632, 0.17, 0.008, 0.004);
  ctx.fill();

  // Pegatina alargada sobre el paragolpes
  ctx.fillStyle = c.pegatina;
  rectRedondeado(ctx, -0.24, -0.258, 0.51, 0.036, 0.018);
  ctx.fill();
  ctx.fillStyle = c.pegatinaTinta;
  rectRedondeado(ctx, -0.2, -0.243, 0.2, 0.008, 0.004);
  ctx.fill();
  rectRedondeado(ctx, 0.12, -0.245, 0.1, 0.012, 0.006);
  ctx.fill();

  // Paragolpes: la junta con la chapa, el plastico y su brillo de arriba
  ctx.fillStyle = c.paragolpesJunta;
  rectRedondeado(ctx, -0.483, -0.217, 0.966, 0.127, 0.052);
  ctx.fill();
  const plastico = ctx.createLinearGradient(0, -0.21, 0, -0.09);
  plastico.addColorStop(0, c.paragolpes);
  plastico.addColorStop(1, c.paragolpesBajo);
  ctx.fillStyle = plastico;
  rectRedondeado(ctx, -0.48, -0.21, 0.96, 0.12, 0.05);
  ctx.fill();
  ctx.fillStyle = c.paragolpesBrillo;
  rectRedondeado(ctx, -0.47, -0.207, 0.94, 0.014, 0.007);
  ctx.fill();
  ctx.fillStyle = c.catadioptrico;
  rectRedondeado(ctx, -0.43, -0.165, 0.07, 0.02, 0.008);
  ctx.fill();
  rectRedondeado(ctx, 0.36, -0.165, 0.07, 0.02, 0.008);
  ctx.fill();

  // Matricula, hundida en su hueco
  ctx.fillStyle = c.matriculaReceso;
  rectRedondeado(ctx, -0.181, -0.089, 0.362, 0.088, 0.012);
  ctx.fill();
  ctx.fillStyle = c.matricula;
  rectRedondeado(ctx, -0.17, -0.078, 0.34, 0.066, 0.008);
  ctx.fill();
  ctx.fillStyle = c.matriculaBanda;
  rectRedondeado(ctx, -0.17, -0.078, 0.026, 0.066, 0.008);
  ctx.fill();
  ctx.fillStyle = c.matriculaTinta;
  for (let i = 0; i < 7; i++) {
    rectRedondeado(ctx, -0.122 + i * 0.036 + (i >= 2 ? 0.012 : 0), -0.062, 0.024, 0.034, 0.004);
    ctx.fill();
  }

  // Los dos ojitos de monstruo pegados en el paragolpes
  for (const ex of [0.24, 0.3]) {
    const ey = -0.05;
    ctx.strokeStyle = COLOR.monstruo.cuerpo;
    ctx.lineWidth = 0.008;
    ctx.beginPath();
    ctx.moveTo(ex, ey + 0.02);
    ctx.lineTo(ex, -0.008);
    ctx.stroke();
    ctx.fillStyle = COLOR.monstruo.cuerpo;
    ctx.beginPath();
    ctx.arc(ex, ey, 0.026, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(ex, ey, 0.023, 0, TAU);
    ctx.clip();
    ctx.fillStyle = COLOR.monstruo.iris;
    ctx.beginPath();
    ctx.arc(ex + 0.009, ey + 0.005, 0.018, 0, TAU);
    ctx.fill();
    ctx.fillStyle = COLOR.monstruo.cuerpo;
    ctx.beginPath();
    ctx.arc(ex + 0.002, ey + 0.001, 0.018, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();

  // Distintivo de la luneta, en pixeles reales para que no se deforme
  ctx.fillStyle = c.rotulo;
  ctx.font = `700 ${Math.max(8, Math.round(ancho * 0.036))}px ${TIPOGRAFIA}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(TEXTOS.arte.cocheDistintivo, 0.27 * ancho, -0.31 * ancho);
}
