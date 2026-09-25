# Salva el coche

Juego 2D para navegador, pensado para jugar con el pulgar en el movil. Dos
niveles, dos formas de jugar:

- **Nivel 1 — La carretera.** Los monstruos del oxido avanzan hacia tu coche
  desde el horizonte y tu los paras con la pistola de producto antioxido: **un
  toque, un disparo, un monstruo**. Se gana al abatir **100**; se pierde si uno
  llega al coche.
- **Nivel 2 — Al volante.** Ahora vas dentro. El coche arranca parado y coge
  velocidad solo; tu unico mando es el volante, que se gira arrastrando el
  dedo. Se gana al **atropellar 40 monstruos**. No se pierde: los que se
  escapan, se escapan.

- **El juego se muestra en danes**; el codigo y esta documentacion siguen en
  espanol. Todo lo que lee quien juega esta en `src/config/textos.ts` y en el
  `nombre` y la `descripcion` de cada nivel: no hay ni un texto suelto en el
  resto del codigo.
- HTML + CSS + TypeScript + Canvas 2D, empaquetado con Vite.
- **Cero dependencias en tiempo de ejecucion** y cero ficheros de sonido: el
  sonido esta sintetizado. De imagen solo hay las cuatro piezas que dibujo el
  autor —coche, pistola e interior—; el monstruo, el escenario y el taller son
  vectores.
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

## Como se publica

`.github/workflows/paginas.yml` compila y publica en **GitHub Pages** en cada
push a `main`. No hay nada que configurar en el codigo: `vite.config.ts` usa
`base: './'`, asi que el sitio sirve igual en la raiz de un dominio que en un
subdirectorio como `/salva-el-coche/`.

Lo unico que no hace el flujo de trabajo es **encender Pages**: eso se hace una
vez en los ajustes del repositorio, eligiendo *GitHub Actions* como origen.

> [!warning] Publicar el sitio lo hace publico de verdad
> GitHub Pages sirve el sitio **a cualquiera con el enlace**, aunque el
> repositorio sea privado. Y los dibujos llevan marcas de terceros —ver la
> ultima decision de la lista de abajo—. Antes de encenderlo conviene tenerlo
> decidido.

## Como se juega

Los textos de la tabla salen en danes; aqui van en espanol para que se
entienda el codigo.

| Accion | Movil | Escritorio |
| --- | --- | --- |
| Disparar (nivel 1) | tocar el monstruo | clic |
| Girar el volante (nivel 2) | arrastrar el dedo alrededor del volante | arrastrar con el raton |
| Pausa | boton ❚❚ | `Esc` o `P` |
| Reintentar | boton de la pantalla | `R` |

El volante se agarra donde sea: lo que cuenta es **cuanto gira el dedo
alrededor del eje**, no cuanto se desplaza, asi que da igual tener el pulgar
en el borde o en el centro. Al soltarlo vuelve solo al centro.

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
│   ├── conduccion.ts el nivel 2 entero: volante, velocidad y atropellos
│   ├── geometria.ts medidas de los dos modos y proyeccion pseudo-3D
│   ├── juego.ts     estado de la partida, disparos y dibujo
│   ├── lienzo.ts    canvas, pixel ratio y redimensiones
│   ├── particulas.ts deposito fijo de particulas
│   └── tipos.ts     los contratos, incluido `DefinicionNivel`
├── arte/            dibujo procedural, cacheado en canvas aparte
│   ├── assets/   coche.webp  pistola.webp  interior  volante
│   ├── carretera.ts la calzada del nivel 2, que se mueve
│   ├── coche.ts  estilo.ts  fondo.ts  formas.ts
│   ├── garaje.ts  interior.ts  monstruo.ts  pistola.ts
├── niveles/         los niveles, que son datos
│   ├── indice.ts    registro de niveles
│   ├── nivel-01.ts  nivel 1, modo defensa
│   └── nivel-02.ts  nivel 2, modo conduccion
└── ui/              HUD y pantallas, en HTML
    ├── estilos.css  hud.ts  pantallas.ts
```

## Como se anade un nivel nuevo

Un nivel es un objeto de datos. **No hay que tocar el motor.**

1. Elige el **modo**: `defensa` (como el nivel 1) o `conduccion` (como el 2).
   Es lo primero, porque decide que numeros lleva el nivel: los de `defensa`
   van en `dificultad` y los de `conduccion` en `conduccion`.
2. Copia el archivo del nivel que mas se parezca y cambia los numeros: `id`,
   `nombre`, `descripcion`, el `objetivo`, la curva y la franja por la que
   aparecen los enemigos.
3. Registralo en `src/niveles/indice.ts`, dentro de `NIVELES`.

```ts
export const NIVELES: readonly DefinicionNivel[] = [NIVEL_01, NIVEL_02];
```

La curva de dificultad se interpola entre `inicio` y `fin` segun lo cerca que
estes del objetivo: **cada monstruo abatido aprieta un poco mas**. `suavizado`
por encima de 1 deja la primera mitad tranquila; por debajo, aprieta antes.

`DefinicionNivel` es una **union discriminada por `modo`**: un nivel de
conduccion no puede declarar una curva de defensa ni al reves, y si se anade
un modo nuevo el compilador senala todos los sitios que hay que atender.

Si un nivel futuro necesita una mecanica que el motor todavia no tiene, se
anade al motor como capacidad opcional y la definicion decide si la usa. Lo que
nunca se hace es meter en el motor una constante de un nivel. Un **modo**
nuevo, en cambio, no es un nivel: es un motor pequeno mas, como
`motor/conduccion.ts`.

## Decisiones del nivel 2

- **El dibujo del interior viene en una pieza y se usa en dos.** La ilustracion
  original trae el volante pintado dentro del salpicadero, y un volante pintado
  no gira. Un script de autoria lo separo: el salpicadero por un lado —con el
  hueco del volante rellenado por difusion, de modo que el cuadro de mandos,
  los mandos de la columna y el resto siguen ahi— y el volante por otro,
  recortado y centrado en su eje. Girar el segundo sobre el primero es todo el
  truco. La mascara del volante no se dibujo a mano: se hizo creciendo una
  region desde el centro del airbag, que separa sola la llanta y los radios de
  los tres huecos.
- **El filo exterior de la llanta no gira.** Un anillo es igual gire lo que
  gire, asi que los ultimos pixeles del borde se quedan en el salpicadero y el
  volante se desvanece contra ellos. Asi no hay ni costura ni halo, por mucho
  que falle el recorte un pixel arriba o abajo.
- **Cada dibujo con transparencia va en dos archivos**: el color en JPEG y el
  recorte en PNG de solo alfa. Juntos pesan 434 kB; el mismo par en PNG con
  alfa pesaba 3,1 MB. `arte/interior.ts` los une al cargar con
  `destination-in`. El alfa se redondea a 0 o 255 antes de guardarlo: venia con
  ruido de un valor o dos, y ese ruido por si solo cuadruplicaba el PNG.
- **Solo se carga el nivel que se juega.** El interior se descarga cuando se
  elige el nivel 2 en la portada, no al abrir el juego: quien solo juegue al
  nivel 1 no paga esos 434 kB.
- **La ventana es el hueco del propio dibujo.** No hay recorte ni mascara en el
  motor: se pinta la carretera a pantalla completa y encima el salpicadero, que
  tapa todo menos su parte transparente. El borde de abajo del parabrisas que
  usan las medidas es **el del centro del cristal**, no el mas bajo del hueco:
  mas a la izquierda el hueco sigue hasta la ventanilla, pero por ahi no viene
  nadie, y tomar aquel dejaba la salpicadura del atropello escondida detras del
  salpicadero.
- **El dibujo cubre siempre la pantalla.** En vertical entra casi justo. En
  apaisado sobra dibujo a lo alto y manda `AJUSTES.interior.ejeEnPantalla`, que
  pasa de 1 a proposito: el eje del volante se va por debajo del borde y queda
  a la vista la carretera y el arco de arriba del volante. Ademas, para el
  horizonte solo cuenta **el trozo de parabrisas que se ve**; con el hueco
  entero, en apaisado el horizonte caia fuera de la pantalla y no habia cielo.
- **El volante se agarra por el angulo, no por el desplazamiento.** El gesto
  mide cuanto gira el dedo alrededor del eje desde que se apoyo, asi que
  funciona igual en el borde que cerca del centro. Pegado al eje un milimetro
  serian treinta grados, asi que hay una zona muerta
  (`AJUSTES.conduccion.volante.zonaMuerta`) en la que el gesto no se lee sino
  que se vuelve a tomar la referencia: al salir de ella el volante no pega un
  salto.
- **Parado no se gira.** El desplazamiento a lo ancho es proporcional a la
  velocidad, como en un coche de verdad. Es lo que hace que los primeros
  segundos, con el coche arrancando, se sientan pesados.
- **La dificultad va con el reloj, al reves que en el nivel 1.** Aqui lo que
  aprieta es la velocidad, y la velocidad no la decide el jugador: sube sola.
  Atar la dificultad a los aciertos hubiera premiado fallar.
- **En infinito la velocidad tiene techo** (`AJUSTES.infinito.marchaMaxima`).
  Sin el, la rampa extrapolada acaba cruzando la calzada en una decima de
  segundo: eso no es dificil, es que no se ve.
- **Las rodadas del asfalto se apagan en este nivel** (`pintarCalle`, ultimo
  parametro). Van pintadas en el cache, y una calzada que se desplaza al girar
  el volante con unas rodadas clavadas en su sitio se nota al instante. Su
  papel lo hacen las marcas viales, que si se mueven y son lo unico que se
  pinta por frame de la calzada.
- **Las rayas se reparten en avance, no en pantalla.** Repartidas en avance, la
  perspectiva las junta sola al fondo; repartidas en pantalla quedarian igual
  de separadas cerca y lejos, y la carretera dejaria de tener profundidad.
- **Este nivel no se pierde.** Es lo que se pidio: aparecen monstruos y se
  atropellan. Ponerle una derrota —que se escapen cueste algo, que haya un
  limite de tiempo— seria inventarse una mecanica, asi que `derrota` es
  `ninguna` y el tipo lo admite explicitamente.

## Decisiones que conviene conocer

- **La dificultad depende de los puntos, no del reloj**: quien juega despacio
  no sale castigado. No hay cuenta atras ni limite de tiempo; la partida
  termina al llegar al objetivo. Los numeros del nivel 1 estan calculados para
  que una partida seguida dure unos 70 segundos —30 monstruos en la primera
  mitad y los 70 restantes en la segunda—, subiendo poco a poco: mas
  apariciones por segundo y monstruos que cruzan cada vez mas rapido.
- **Todo el juego habla el idioma de los dos dibujos** (`arte/estilo.ts`):
  contorno de tinta alrededor de la silueta, volumen por degradado, filo de
  luz frio en el canto de arriba, grano de suciedad encima y los bordes de la
  pantalla cerrados por una vineta. Los numeros estan en `AJUSTES.estilo` y
  los colores, por piezas —claro / base / oscuro—, en `config/tema.ts`.
  **Nada de eso se pinta por frame**: todo vive dentro de los canvas de cache,
  que se rehacen solo al cambiar el tamano de la pantalla. Rehacerlos todos de
  golpe cuesta menos de un frame (pico de 18 ms al redimensionar).
- **El contorno no es un trazo**. Una silueta hecha de partes solapadas —el
  monstruo son una bezier y doce circulos— tiene bordes *por dentro*, y
  trazarla dibuja tambien esos: sale una cadena de anillos. Se rellena la
  misma forma doce veces alrededor y se mete por detras de lo pintado
  (`destination-over`), asi que solo asoma por fuera. El filo de luz tiene el
  mismo problema y la misma solucion: se recorta la silueta, se pinta la luz y
  se vuelve a tapar con la propia silueta bajada unos pixeles.
- **Los monstruos de lejos van sin remates** (`AJUSTES.estilo.detalle`): la
  sombra de cada colmillo, el brillo del iris o la segunda sombra de contacto
  no se distinguen a ese tamano, y de lejos es cuando mas hay en pantalla.
- **El grano cae siempre en el mismo sitio**: sale de un xorshift con semilla
  fija (`sembrar`). Con `Math.random` la suciedad del asfalto se movería al
  girar el movil, que es justo lo que delata que esta pintada.
- **El coche y la pistola son imagenes**, no vectores: los dibujos del taller
  (`src/assets/`). Salen de dos PNG de 1448x1086 recortados a su contenido,
  reducidos y pasados a **WebP**: 306 kB los dos, frente a 2,45 MB en PNG.
  El monstruo, el escenario y el taller siguen siendo vectores, pintados con
  el mismo acabado para que no se note la costura.
- **Las dos imagenes se reducen una sola vez** a un canvas del tamano bueno y
  por frame solo se copian. Filtrar una imagen de 1000 px en cada frame
  disparaba el p95 de 17 a 93 ms; cacheada vuelve a 21.
- **La pistola se ancla por su esquina inferior derecha**, y lo que se sale
  de la pantalla se mide en fraccion del propio dibujo (`desbordeX`,
  `desbordeY`), no de la pantalla: en fraccion de pantalla asomaba lo justo
  en un movil y se iba casi entera en una pantalla ancha.
- **La pistola ya no finge el escorzo**: la perspectiva viene en el dibujo.
  El modulo solo la coloca, la gira un poco hacia donde se toca y dice donde
  cae la punta del canon (`PUNTA`), que es de donde salen el fogonazo y el
  trazador. `PIVOTE` es el centro del puno, y el eje del giro.
- **La portada es el taller**, no la partida: el mismo coche rojo aparcado
  dentro del garaje (`arte/garaje.ts`). Es una pantalla entera cacheada, asi
  que se suelta al salir de la portada y se rehace al volver: guardarla
  mientras se juega seria memoria tirada.
- **Al darle a jugar sube el porton** (`AJUSTES.apertura`): dos segundos en
  los que se ve la calle por el hueco —el mismo cielo y el mismo asfalto del
  nivel— mientras la pantalla se va a negro. La puerta acaba antes que el paso
  (`fraccionPuerta`) para que de tiempo a verla llegar arriba, y el negro tapa
  el corte; la partida arranca a oscuras y se aclara sola. La hoja del porton
  va en su propio canvas, que es lo unico que se mueve del taller.
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
- **El juego esta en danes y el codigo en espanol**, a proposito: se traduce lo
  que lee quien juega, no lo que lee quien programa. Volver a tener dos idiomas
  seria duplicar `config/textos.ts` y dos cadenas por nivel, y elegir cual se
  carga; hoy no hace falta y no se ha montado nada para ello.
- **Los dibujos llevan marcas reales.** El coche, la pistola y el interior
  salen de fotografias e ilustraciones aportadas por el autor, y en ellas se
  leen un logotipo de Peugeot, un distintivo «107», el rotulo de un taller con
  su telefono y un «SLIM COMBAT» en la pistola. Para jugar en local da igual;
  **antes de publicar el juego hay que decidir que se hace con ellos**, porque
  no son marcas propias.
