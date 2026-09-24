import './ui/estilos.css';

import { TEXTOS } from './config/textos';
import { Audio } from './motor/audio';
import { Bucle } from './motor/bucle';
import { Entrada } from './motor/entrada';
import { Juego, type DatosPartida } from './motor/juego';
import { Lienzo } from './motor/lienzo';
import { PRIMER_NIVEL } from './niveles/indice';
import type { Escena } from './motor/tipos';
import { Hud } from './ui/hud';
import { Pantallas } from './ui/pantallas';

const contenedor = document.getElementById('juego');
const canvas = document.getElementById('lienzo');
if (!(contenedor instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Falta el contenedor del juego en el HTML');
}

const nivel = PRIMER_NIVEL;
const lienzo = new Lienzo(canvas);
const audio = new Audio();
const pantallas = new Pantallas(contenedor);

let juego: Juego;

const hud = new Hud(contenedor, () => juego.alternarPausa());

juego = new Juego(lienzo, nivel, audio, {
  alCambiarEscena: (escena, datos) => mostrarEscena(escena, datos),
  alPuntuar: (datos) => hud.actualizar(datos, true),
});

new Entrada(canvas, {
  toque: (x, y) => juego.tocar(x, y),
  alternarPausa: () => juego.alternarPausa(),
  reiniciar: () => {
    if (juego.escenaActual !== 'jugando') juego.reiniciar();
  },
});

const bucle = new Bucle(
  (dt) => {
    juego.actualizar(dt);
    juego.dibujar();
  },
  () => lienzo.bajarCalidad(),
  () => {
    if (juego.escenaActual === 'jugando') juego.alternarPausa();
  },
);

// El navegador no deja sonar nada hasta que el usuario toca algo.
const desbloquear = (): void => audio.desbloquear();
window.addEventListener('pointerdown', desbloquear);
window.addEventListener('keydown', desbloquear);

function mostrarEscena(escena: Escena, datos: DatosPartida): void {
  hud.actualizar(datos, false);
  hud.visible(escena === 'jugando' || escena === 'pausa');

  switch (escena) {
    case 'jugando':
      pantallas.ocultar();
      break;

    case 'inicio':
      pantallas.mostrar({
        titulo: TEXTOS.titulo,
        cuerpo: nivel.descripcion,
        detalle: TEXTOS.inicio.ayuda,
        acciones: [{ texto: TEXTOS.inicio.accion, alPulsar: () => juego.empezar() }],
      });
      break;

    case 'pausa':
      pantallas.mostrar({
        titulo: TEXTOS.pausa.titulo,
        cuerpo: marcadorTexto(datos),
        acciones: [
          { texto: TEXTOS.pausa.reanudar, alPulsar: () => juego.reanudar() },
          { texto: TEXTOS.pausa.reiniciar, alPulsar: () => juego.empezar(), secundaria: true },
        ],
      });
      break;

    case 'victoria':
      pantallas.mostrar({
        titulo: TEXTOS.victoria.titulo,
        cuerpo: TEXTOS.victoria.cuerpo,
        detalle: mejorTexto(datos),
        acciones: [{ texto: TEXTOS.victoria.accion, alPulsar: () => juego.empezar() }],
      });
      break;

    case 'derrota':
      pantallas.mostrar({
        titulo: TEXTOS.derrota.titulo,
        cuerpo: marcadorTexto(datos),
        detalle: mejorTexto(datos),
        acciones: [{ texto: TEXTOS.derrota.accion, alPulsar: () => juego.empezar() }],
      });
      break;
  }
}

function marcadorTexto(datos: DatosPartida): string {
  const nombre = datos.puntos === 1 ? TEXTOS.marcador.abatidoUno : TEXTOS.marcador.abatidosVarios;
  return `${datos.puntos} ${nombre} ${TEXTOS.marcador.de} ${datos.objetivo}`;
}

function mejorTexto(datos: DatosPartida): string {
  return datos.mejor > 0 ? `${TEXTOS.marcador.mejor}: ${datos.mejor}` : '';
}

mostrarEscena(juego.escenaActual, juego.datos);
bucle.arrancar();
