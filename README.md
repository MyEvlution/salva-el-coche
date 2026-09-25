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
│   ├── assets/   coche.webp  pistola.webp
│   ├── coche.ts  fondo.ts  formas.ts  garaje.ts  monstruo.ts  pistola.ts
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
  no sale castigado. No hay cuenta atras ni limite de tiempo; la partida
  termina al llegar al objetivo. Los numeros del nivel 1 estan calculados para
  que una partida seguida dure unos 70 segundos —30 monstruos en la primera
  mitad y los 70 restantes en la segunda—, subiendo poco a poco: mas
  apariciones por segundo y monstruos que cruzan cada vez mas rapido.
- **El coche y la pistola son imagenes**, no vectores: los dibujos del taller
  (`src/assets/`). Salen de dos PNG de 1448x1086 recortados a su contenido,
  reducidos y pasados a **WebP**: 306 kB los dos, frente a 2,45 MB en PNG.
  El monstruo, el escenario y el taller siguen siendo vectores.
- **Las dos imagenes se reducen una sola vez** a un canvas del tamano bueno y
  por frame solo se copian. Filtrar una imagen de 1000 px en cada frame
  disparaba el p95 de 17 a 93 ms; cacheada vuelve a 21.
- **La pistola ya no finge el escorzo**: la perspectiva viene en el dibujo.
  El modulo solo la coloca, la gira un poco hacia donde se toca y dice donde
  cae la punta del canon (`PUNTA`), que es de donde salen el fogonazo y el
  trazador. `PIVOTE` es el centro del puno, y el eje del giro.
- **La portada es el taller**, no la partida: el mismo coche rojo aparcado
  dentro del garaje (`arte/garaje.ts`). Es una pantalla entera cacheada, asi
  que se suelta al salir de la portada y se rehace al volver: guardarla
  mientras se juega seria memoria tirada.
- **El selector de nivel se dibuja solo** a partir de `NIVELES`. La flecha que
  no lleva a ningun sitio no se pinta pero deja su hueco, para que el nombre
  no baile. Con un nivel no sale ninguna; en cuanto se registre el segundo,
  saldra la derecha en el primero y la izquierda en el ultimo sin tocar la
  interfaz.
- **Modo infinito**: al ganar se puede seguir jugando sin objetivo. El
  progreso deja de topar en 1, asi que las mismas rampas se extrapolan y la
  dificultad no para de subir; el marcador pasa a contar `101/100`, `102/100`.
  El motor conserva dos suelos que no son dificultad sino cordura:
  `AJUSTES.infinito.recorridoMinimo` (por debajo, el monstruo cruza antes de
  que de tiempo a verlo) y el tamano del deposito de enemigos.
- **`ritmo` son apariciones por segundo, no segundos entre apariciones.** Se
  interpola la frecuencia porque interpolar el intervalo deja la mitad de la
  partida mucho mas lenta de lo que dicen `inicio` y `fin`.
- **El que esta a punto de llegar avisa**: se le marca con un halo que
  parpadea y la pantalla se tine de rojo por los bordes, cada vez mas fuerte
  (`AJUSTES.aviso`). Con `prefers-reduced-motion` el parpadeo se queda quieto.
- **Cada monstruo abatido deja una mancha en el suelo** que se seca en unos
  segundos (`AJUSTES.manchas`): se ve por donde ha pasado la pelea.
- **La pistola se dibuja con escorzo** (`AJUSTES.pistola.escorzo`): el dibujo
  se comprime a lo largo del canon, asi que no se ve de perfil sino apuntando
  hacia dentro de la pantalla, con la empunadura vertical.
- **El volumen se hace con degradados, no con colores planos.** Cada pieza de
  la pistola tiene su claro / medio / oscuro en `COLOR.pistola`, y encima van
  los cantos, la arista de luz y la sombra recortados a la silueta: la misma
  tecnica que la chapa del coche.
- **Los dedos del guante no son cuatro trazos iguales.** Cada uno es una
  cresta curva con valle, lomo y reflejo, y asoma lo suyo por delante del
  puno; con crestas identicas la mano parecia el muelle de la manguera.
- **Margen de perdon al disparar** (`AJUSTES.disparo.gracia`): si el toque no
  cae dentro del monstruo pero se queda cerca, cuenta. Con el pulgar, exigir
  precision de raton es lo que hace que un juego se sienta injusto.
- **El coche, el monstruo y la pistola se pintan una vez** en canvas aparte y
  luego solo se copian: es de donde sale el margen para ir a 60 fps en un
  movil modesto.
- **Las particulas y las manchas salen de depositos fijos**: nada de reservar
  y tirar memoria mientras se juega.
- **El juego se pausa solo** al pasar a segundo plano, y baja la resolucion si
  los frames se alargan.
- La mejor marca se guarda en `localStorage`; si el navegador no deja, el juego
  sigue funcionando sin ella.
- El coche y la pistola estan inspirados en fotografias reales, pero los
  rotulos son genericos a proposito: no se usa ninguna marca de terceros.
