---
descripcion: "De dónde sale este juego, dónde está la beta original, de dónde salen sus dibujos y qué falta por decidir"
tags: [memoria, salva-el-coche]
---

# Salva el coche nace de una beta que no se toca

Este proyecto es la reescritura de una beta de un solo archivo HTML que vive
**fuera del taller**, en `~/Desktop/salva-el-coche.html`. Esa beta es
**referencia de sólo lectura**: no se modifica, no se mueve y no se borra. De
ella salen la mecánica (un toque, un disparo, un monstruo), la ambientación y
todo el dibujo vectorial, que aquí está portado y cacheado.

Estado el 2026-09-25:

- Repositorio propio **`MyEvlution/salva-el-coche`, privado**. Está en el
  `.gitignore` del taller: se trabaja entrando en su carpeta.
- **No está desplegado, y es a propósito.** El usuario publicará el sitio él
  mismo cuando quiera; no configures Vercel ni GitHub Pages sin que lo pida.
- Dev server: **puerto 5177**, por nombre desde `.claude/launch.json`
  («Salva el coche (Vite dev)»). Ver [[Node 22 y los dev servers]].
- **Hay dos niveles y dos modos** (`DefinicionNivel` es una unión discriminada
  por `modo`): `defensa` —el nivel 1, 100 monstruos a tiros— y `conduccion` —el
  nivel 2, 40 atropellados desde dentro del coche—. Del tercero en adelante,
  igual que siempre: **los especifica el usuario, no se inventan**.
- **Los dibujos los aporta el usuario**, y son la fuente de todo lo demás:
  - coche y pistola → `~/Desktop/9F4D3788-…png` y `~/Desktop/24607bd7-…png`
  - interior del coche (nivel 2) → `~/Desktop/F4459D77-A9FD-4313-8FBA-F8476FB4EFB3.png`

  Esos PNG **no están en el repositorio** (pesan 1-2 MB cada uno) y tienen
  nombre de UUID: si se borran del escritorio, no hay forma de rehacer los
  assets. El del interior se parte con
  `herramientas/partir-interior.py`, que es reproducible byte a byte.
- **Los dibujos llevan marcas reales** (logotipo de Peugeot, distintivo «107»,
  el rótulo y el teléfono de un taller, «SLIM COMBAT»). Para jugar en local da
  igual; **antes de publicar hay que decidir qué se hace con ellas**.

**Why:** la beta es el original del que salió todo y no tiene copia en ningún
repositorio; y el juego se parece lo bastante a los otros proyectos del taller
como para que sea fácil suponer que también se despliega solo al hacer push.

**How to apply:** antes de tocar nada, lee la beta si necesitas la referencia,
pero escribe siempre en `Proyectos/Salva-El-Coche/`. Si hace falta un nivel
nuevo, pregunta qué debe pasar en él y en qué modo: si encaja en `defensa` o en
`conduccion` sólo hay que crear un archivo en `src/niveles/` y registrarlo; si
no encaja en ninguno, lo que hace falta es un modo nuevo —un módulo como
`motor/conduccion.ts`—, y eso ya no es un nivel.

Relacionado: [[Indice de memoria]], [[Estructura del taller]]
