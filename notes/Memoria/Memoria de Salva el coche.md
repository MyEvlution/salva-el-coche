---
descripcion: "De dónde sale este juego, dónde está la beta original y qué falta por decidir"
tags: [memoria, salva-el-coche]
---

# Salva el coche nace de una beta que no se toca

Este proyecto es la reescritura de una beta de un solo archivo HTML que vive
**fuera del taller**, en `~/Desktop/salva-el-coche.html`. Esa beta es
**referencia de sólo lectura**: no se modifica, no se mueve y no se borra. De
ella salen la mecánica (un toque, un disparo, un monstruo), la ambientación y
todo el dibujo vectorial, que aquí está portado y cacheado.

Estado el 2026-09-24:

- Repositorio propio **`MyEvlution/salva-el-coche`, privado**. Está en el
  `.gitignore` del taller: se trabaja entrando en su carpeta.
- **No está desplegado, y es a propósito.** El usuario publicará el sitio él
  mismo cuando quiera; no configures Vercel ni GitHub Pages sin que lo pida.
- Dev server: **puerto 5177**, por nombre desde `.claude/launch.json`
  («Salva el coche (Vite dev)»). Ver [[Node 22 y los dev servers]].
- **Sólo existe el nivel 1** (100 monstruos). Los siguientes los especificará
  el usuario: la estructura está preparada, pero **no inventes niveles,
  mecánicas ni textos**.

**Why:** la beta es el original del que salió todo y no tiene copia en ningún
repositorio; y el juego se parece lo bastante a los otros proyectos del taller
como para que sea fácil suponer que también se despliega solo al hacer push.

**How to apply:** antes de tocar nada, lee la beta si necesitas la referencia,
pero escribe siempre en `Proyectos/Salva-El-Coche/`. Si hace falta un nivel
nuevo, pregunta qué debe pasar en él: sólo hay que crear un archivo en
`src/niveles/` y registrarlo.

Relacionado: [[Indice de memoria]], [[Estructura del taller]]
