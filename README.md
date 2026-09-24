# Salva el coche

Juego 2D para navegador, pensado para jugar con el pulgar en el movil. Los
monstruos del oxido avanzan hacia tu coche desde el horizonte y tu los paras
con la pistola de producto antioxido: **un toque, un disparo, un monstruo**.

Se gana el nivel 1 al abatir **100 monstruos**. Se pierde si uno llega al coche.

- HTML + CSS + TypeScript + Canvas 2D, empaquetado con Vite.
- **Cero dependencias en tiempo de ejecucion** y cero ficheros de imagen o de
  sonido: todo el dibujo es vectorial y el sonido esta sintetizado.
- Sitio estatico: `npm run build` deja en `dist/` algo que se puede publicar
  tal cual.

## Como ejecutarlo en local

```bash
npm install
npm run dev     # http://localhost:5177
```

En este taller el servidor tambien se arranca por su nombre desde
`.claude/launch.json`: **Salva el coche (Vite dev)**.

```bash
npm run build       # tsc --noEmit y despues la compilacion
npm run comprobar   # solo los tipos
npm run preview     # sirve dist/ para comprobar la version compilada
```

`npm run build` falla si fallan los tipos. No lo esquives.

## Como se juega

| Accion | Movil | Escritorio |
| --- | --- | --- |
| Disparar | tocar el monstruo | clic |
| Pausa | boton ❚❚ | `Esc` o `P` |
| Reintentar | boton de la pantalla | `R` |

## Estructura

```
src/
├── main.ts          arranca el motor y conecta la interfaz
├── config/          los numeros y los textos que se tocan a mano
│   ├── ajustes.ts   constantes del motor (calidad, punteria, efectos)
│   ├── tema.ts      paleta y tipografia
│   └── textos.ts    todos los textos visibles, en espanol
├── motor/           el motor, que no sabe nada de ningun nivel concreto
│   ├── audio.ts     sonido sintetizado con WebAudio
│   ├── bucle.ts     requestAnimationFrame, delta time y calidad adaptativa
│   ├── entrada.ts   puntero, tacto y teclado normalizados
│   ├── geometria.ts medidas del escenario y proyeccion pseudo-3D
│   ├── juego.ts     estado de la partida, disparos y dibujo
│   ├── lienzo.ts    canvas, pixel ratio y redimensiones
│   ├── particulas.ts deposito fijo de particulas
│   └── tipos.ts     los contratos, incluido `DefinicionNivel`
├── arte/            dibujo procedural, cacheado en canvas aparte
│   ├── coche.ts  fondo.ts  formas.ts  monstruo.ts  pistola.ts
├── niveles/         los niveles, que son datos
│   ├── indice.ts    registro de niveles
│   └── nivel-01.ts  nivel 1
└── ui/              HUD y pantallas, en HTML
    ├── estilos.css  hud.ts  pantallas.ts
```

## Como se anade un nivel nuevo

Un nivel es un objeto de datos. **No hay que tocar el motor.**

1. Copia `src/niveles/nivel-01.ts` a `src/niveles/nivel-02.ts` y cambia los
   numeros: `id`, `nombre`, `descripcion`, el `objetivo`, la curva de
   `dificultad` y la franja por la que aparecen los enemigos.
2. Registralo en `src/niveles/indice.ts`, dentro de `NIVELES`.

```ts
export const NIVELES: readonly DefinicionNivel[] = [NIVEL_01, NIVEL_02];
```

La curva de dificultad se interpola entre `inicio` y `fin` segun lo cerca que
estes del objetivo: **cada monstruo abatido aprieta un poco mas**. `suavizado`
por encima de 1 deja la primera mitad tranquila; por debajo, aprieta antes.

Si un nivel futuro necesita una mecanica que el motor todavia no tiene, se
anade al motor como capacidad opcional y la definicion decide si la usa. Lo que
nunca se hace es meter en el motor una constante de un nivel.

## Decisiones que conviene conocer

- **La dificultad depende de los puntos, no del reloj**: quien juega despacio
  no sale castigado.
- **Margen de perdon al disparar** (`AJUSTES.disparo.gracia`): si el toque no
  cae dentro del monstruo pero se queda cerca, cuenta. Con el pulgar, exigir
  precision de raton es lo que hace que un juego se sienta injusto.
- **El coche, el monstruo y la pistola se pintan una vez** en canvas aparte y
  luego solo se copian: es de donde sale el margen para ir a 60 fps en un
  movil modesto.
- **Las particulas salen de un deposito fijo**: nada de reservar y tirar
  memoria mientras se juega.
- **El juego se pausa solo** al pasar a segundo plano, y baja la resolucion si
  los frames se alargan.
- La mejor marca se guarda en `localStorage`; si el navegador no deja, el juego
  sigue funcionando sin ella.
- El coche y la pistola estan inspirados en fotografias reales, pero los
  rotulos son genericos a proposito: no se usa ninguna marca de terceros.
