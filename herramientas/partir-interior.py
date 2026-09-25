#!/usr/bin/env python3
"""
Parte el dibujo del interior del coche en las dos piezas que usa el nivel 2.

    python3 herramientas/partir-interior.py <interior.png> [destino/]

Entra un PNG de 1024x1536 con el hueco del parabrisas ya transparente y el
volante pintado dentro del salpicadero. Salen cuatro archivos:

    interior.jpg + interior-mascara.png   el salpicadero, sin volante
    volante.jpg  + volante-mascara.png    el volante, centrado en su eje

Por que dos archivos por pieza: el color en JPEG y el recorte en un PNG de
solo alfa pesan la sexta parte que un PNG con transparencia, y el juego los
vuelve a unir de una sola vez al cargar (`src/arte/interior.ts`).

Por que hay que quitar el volante del salpicadero: un volante pintado dentro
del dibujo no puede girar. El hueco que deja se rellena por difusion, asi que
el cuadro de mandos, los mandos de la columna y el resto del salpicadero
siguen en su sitio; lo que se pierde es solo lo que tapaba el volante, que
casi siempre vuelve a estar tapado por el volante.

La mascara del volante no esta dibujada a mano: se hace creciendo una region
desde el centro del airbag, que separa sola la llanta y los radios de los tres
huecos, mas un anillo geometrico que garantiza la llanta entera.

No necesita instalar nada: lee y escribe PNG con `zlib` y `struct`. El paso a
JPEG lo hace `sips`, que viene en macOS. Tarda medio minuto.
"""

import math
import os
import struct
import subprocess
import sys
import zlib
from collections import deque

# ------------------------------------------------ medidas sobre el dibujo

W, H = 1024, 1536
#: Eje de giro del volante.
CX, CY = 456.0, 832.0
#: Borde exterior de la llanta, con holgura.
R_EXT = 272.0
#: Radio a partir del cual se da la llanta por segura.
R_ANILLO = 232.0
#: Hasta donde el recorte del volante es opaco, y donde acaba de desvanecerse.
R_LLENO, R_DESVANECE = 254.0, 268.0
#: Puntos de arranque del crecimiento, todos sobre el airbag o los radios.
SEMILLAS = [(350, 900), (560, 900), (456, 880), (300, 860), (620, 860),
            (456, 1000), (250, 845), (660, 845), (400, 950), (520, 950),
            (456, 1080), (440, 1050), (456, 600)]
#: Rectangulo en el que se trabaja el relleno: el volante y un margen.
CAJA = (140, 510, 780, 1170)
#: Calidad del JPEG.
CALIDAD = 80


# --------------------------------------------------- PNG a mano

def leer(ruta):
    datos = open(ruta, 'rb').read()
    assert datos[:8] == b'\x89PNG\r\n\x1a\n'
    i = 8
    idat = b''
    ancho = alto = prof = tipo = 0
    paleta = None
    while i < len(datos):
        largo = struct.unpack('>I', datos[i:i+4])[0]
        etiq = datos[i+4:i+8]
        cuerpo = datos[i+8:i+8+largo]
        if etiq == b'IHDR':
            ancho, alto, prof, tipo, _, _, entrelazado = struct.unpack('>IIBBBBB', cuerpo)
            assert prof == 8 and entrelazado == 0, (prof, entrelazado)
        elif etiq == b'PLTE':
            paleta = cuerpo
        elif etiq == b'IDAT':
            idat += cuerpo
        elif etiq == b'IEND':
            break
        i += 12 + largo
    canales = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[tipo]
    crudo = zlib.decompress(idat)
    paso = canales
    fila = ancho * canales
    salida = bytearray(alto * fila)
    anterior = bytearray(fila)
    p = 0
    for y in range(alto):
        filtro = crudo[p]; p += 1
        linea = bytearray(crudo[p:p+fila]); p += fila
        if filtro == 1:
            for x in range(paso, fila):
                linea[x] = (linea[x] + linea[x-paso]) & 255
        elif filtro == 2:
            for x in range(fila):
                linea[x] = (linea[x] + anterior[x]) & 255
        elif filtro == 3:
            for x in range(fila):
                izq = linea[x-paso] if x >= paso else 0
                linea[x] = (linea[x] + ((izq + anterior[x]) >> 1)) & 255
        elif filtro == 4:
            for x in range(fila):
                a = linea[x-paso] if x >= paso else 0
                b = anterior[x]
                c = anterior[x-paso] if x >= paso else 0
                pa = abs(b - c); pb = abs(a - c); pc = abs(a + b - 2*c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                linea[x] = (linea[x] + pr) & 255
        salida[y*fila:(y+1)*fila] = linea
        anterior = linea
    # normalizar a RGBA
    rgba = bytearray(ancho * alto * 4)
    for n in range(ancho * alto):
        if tipo == 6:
            rgba[n*4:n*4+4] = salida[n*4:n*4+4]
        elif tipo == 2:
            rgba[n*4:n*4+3] = salida[n*3:n*3+3]; rgba[n*4+3] = 255
        elif tipo == 0:
            v = salida[n]; rgba[n*4:n*4+3] = bytes([v,v,v]); rgba[n*4+3] = 255
        elif tipo == 4:
            v = salida[n*2]; rgba[n*4:n*4+3] = bytes([v,v,v]); rgba[n*4+3] = salida[n*2+1]
        elif tipo == 3:
            k = salida[n]; rgba[n*4:n*4+3] = paleta[k*3:k*3+3]; rgba[n*4+3] = 255
    return ancho, alto, rgba

def escribir(ruta, ancho, alto, rgba):
    fila = ancho * 4
    crudo = bytearray()
    for y in range(alto):
        crudo.append(0)
        crudo += rgba[y*fila:(y+1)*fila]
    def trozo(etiq, cuerpo):
        return struct.pack('>I', len(cuerpo)) + etiq + cuerpo + struct.pack('>I', zlib.crc32(etiq + cuerpo) & 0xffffffff)
    with open(ruta, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(trozo(b'IHDR', struct.pack('>IIBBBBB', ancho, alto, 8, 6, 0, 0, 0)))
        f.write(trozo(b'IDAT', zlib.compress(bytes(crudo), 9)))
        f.write(trozo(b'IEND', b''))

def escribir_alfa(ruta, ancho, alto, rgba):
    """Solo el canal alfa, como gris+alfa (tipo 4) con filtro adaptativo."""
    crudo = bytearray()
    anterior = bytearray(ancho*2)
    for y in range(alto):
        linea = bytearray(ancho*2)
        for x in range(ancho):
            linea[x*2] = 0
            linea[x*2+1] = rgba[(y*ancho+x)*4+3]
        sin = sum(abs(v-128) for v in linea)
        arriba = bytearray((linea[i]-anterior[i]) & 255 for i in range(len(linea)))
        coste = sum(min(v, 256-v) for v in arriba)
        if coste < sin:
            crudo.append(2); crudo += arriba
        else:
            crudo.append(0); crudo += linea
        anterior = linea
    import struct, zlib
    def trozo(etiq, cuerpo):
        return struct.pack('>I', len(cuerpo)) + etiq + cuerpo + struct.pack('>I', zlib.crc32(etiq+cuerpo) & 0xffffffff)
    with open(ruta,'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(trozo(b'IHDR', struct.pack('>IIBBBBB', ancho, alto, 8, 4, 0, 0, 0)))
        f.write(trozo(b'IDAT', zlib.compress(bytes(crudo), 9)))
        f.write(trozo(b'IEND', b''))


# ------------------------------------------- mascara del volante


def lum(d,i):
    return 0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2]

def crecer(d, semillas, salto=13, banda=(30,150)):
    m = bytearray(W*H)
    x0,x1 = int(CX-R_EXT-2), int(CX+R_EXT+3)
    y0,y1 = int(CY-R_EXT-2), int(CY+R_EXT+3)
    cola = deque()
    for (sx,sy) in semillas:
        i=sy*W+sx
        if not m[i]: m[i]=1; cola.append((sx,sy))
    while cola:
        x,y = cola.popleft()
        l = lum(d, y*W+x)
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx,ny = x+dx, y+dy
            if not (x0<=nx<x1 and y0<=ny<y1): continue
            i = ny*W+nx
            if m[i]: continue
            if math.hypot(nx-CX, ny-CY) > R_EXT: continue
            nl = lum(d,i)
            if abs(nl-l) > salto or not (banda[0] <= nl <= banda[1]): continue
            m[i]=1; cola.append((nx,ny))
    # la llanta, entera, pase lo que pase
    for y in range(y0,y1):
        for x in range(x0,x1):
            r = math.hypot(x-CX,y-CY)
            if R_ANILLO <= r <= R_EXT: m[y*W+x]=1
    return m

def tapar_agujeros(m, area_maxima=9000):
    """Rellena los huecos pequenos de dentro (el leon, los brillos, el texto)."""
    x0,x1 = int(CX-R_EXT-2), int(CX+R_EXT+3)
    y0,y1 = int(CY-R_EXT-2), int(CY+R_EXT+3)
    visto = bytearray(W*H)
    tapados = 0
    for sy in range(y0,y1):
        for sx in range(x0,x1):
            i0=sy*W+sx
            if m[i0] or visto[i0]: continue
            if math.hypot(sx-CX,sy-CY) > R_EXT: continue
            grupo=[]; cola=deque([(sx,sy)]); visto[i0]=1; toca_borde=False
            while cola:
                x,y=cola.popleft(); grupo.append(y*W+x)
                for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    nx,ny=x+dx,y+dy
                    i=ny*W+nx
                    if math.hypot(nx-CX,ny-CY) > R_EXT: toca_borde=True; continue
                    if m[i] or visto[i]: continue
                    visto[i]=1; cola.append((nx,ny))
            if not toca_borde and len(grupo) <= area_maxima:
                for i in grupo: m[i]=1
                tapados += 1
    return tapados


# ----------------------------------- relleno del hueco por difusion


def dilatar(m, r):
    tmp = bytearray(W*H)
    for y in range(H):
        f=y*W; fila=m[f:f+W]
        if 1 not in fila: continue
        for x in range(W):
            if fila[x]:
                for k in range(max(0,x-r), min(W,x+r+1)): tmp[f+k]=1
    out = bytearray(W*H)
    for x in range(W):
        col=[tmp[y*W+x] for y in range(H)]
        if 1 not in col: continue
        for y in range(H):
            if col[y]:
                for k in range(max(0,y-r), min(H,y+r+1)): out[k*W+x]=1
    return out

def reducir(canales, conocido, w, h):
    """Mitad de tamano, promediando solo lo conocido."""
    w2,h2 = (w+1)//2, (h+1)//2
    c2 = [[0.0]*(w2*h2) for _ in canales]
    k2 = bytearray(w2*h2)
    for y in range(h2):
        for x in range(w2):
            s=[0.0]*len(canales); n=0
            for dy in (0,1):
                for dx in (0,1):
                    sx,sy = x*2+dx, y*2+dy
                    if sx>=w or sy>=h: continue
                    i=sy*w+sx
                    if not conocido[i]: continue
                    n+=1
                    for c in range(len(canales)): s[c]+=canales[c][i]
            if n:
                k2[y*w2+x]=1
                for c in range(len(canales)): c2[c][y*w2+x]=s[c]/n
    return c2, k2, w2, h2

def ampliar(canales, w, h, w2, h2):
    out=[[0.0]*(w2*h2) for _ in canales]
    for y in range(h2):
        sy=min(h-1, y//2)
        for x in range(w2):
            sx=min(w-1, x//2)
            i=sy*w+sx; j=y*w2+x
            for c in range(len(canales)): out[c][j]=canales[c][i]
    return out

def difundir(canales, conocido, w, h, vueltas):
    for _ in range(vueltas):
        for c in canales:
            nuevo = c[:]
            for y in range(h):
                f=y*w
                for x in range(w):
                    i=f+x
                    if conocido[i]: continue
                    s=0.0; n=0
                    if x>0: s+=c[i-1]; n+=1
                    if x<w-1: s+=c[i+1]; n+=1
                    if y>0: s+=c[i-w]; n+=1
                    if y<h-1: s+=c[i+w]; n+=1
                    if n: nuevo[i]=s/n
            c[:] = nuevo

def inpaint(canales, conocido, w, h, nivel=0):
    """Piramide: resuelve en pequeno y refina al subir."""
    if w <= 12 or h <= 12 or all(conocido):
        difundir(canales, conocido, w, h, 60)
        return
    c2, k2, w2, h2 = reducir(canales, conocido, w, h)
    inpaint(c2, k2, w2, h2, nivel+1)
    grande = ampliar(c2, w2, h2, w, h)
    for c, g in zip(canales, grande):
        for i in range(w*h):
            if not conocido[i]: c[i]=g[i]
    difundir(canales, conocido, w, h, 4 if nivel==0 else 8)


# ------------------------------------------------------------- lo que hace

def a_jpeg(origen, destino):
    """El color, sin alfa. `sips` no escribe WebP, asi que JPEG."""
    subprocess.run(['cp', origen, destino], check=True)
    subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions',
                    str(CALIDAD), destino], check=True, stdout=subprocess.DEVNULL)


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    origen = sys.argv[1]
    destino = sys.argv[2] if len(sys.argv) > 2 else '.'
    os.makedirs(destino, exist_ok=True)
    ancho, alto, d = leer(origen)
    if (ancho, alto) != (W, H):
        print('El dibujo tiene que ser de %dx%d y es de %dx%d' % (W, H, ancho, alto))
        return 1

    semillas = [s for s in SEMILLAS
                if (s[0] - CX) ** 2 + (s[1] - CY) ** 2 < (R_EXT - 4) ** 2]
    m = crecer(d, semillas, salto=14, banda=(16, 158))
    tapar_agujeros(m, area_maxima=22000)

    # lo que se borra del salpicadero: la mascara, un poco crecida y sin el filo
    borrar = dilatar(m, 2)
    for y in range(H):
        for x in range(W):
            if borrar[y * W + x] and math.hypot(x - CX, y - CY) > R_LLENO:
                borrar[y * W + x] = 0

    # relleno del hueco que deja el volante
    x0, y0, x1, y1 = CAJA
    cw, ch = x1 - x0, y1 - y0
    canales = [[0.0] * (cw * ch) for _ in range(3)]
    conocido = bytearray(cw * ch)
    for y in range(ch):
        for x in range(cw):
            s = ((y + y0) * W + (x + x0)) * 4
            j = y * cw + x
            for c in range(3):
                canales[c][j] = float(d[s + c])
            conocido[j] = 0 if borrar[(y + y0) * W + (x + x0)] else 1
    inpaint(canales, conocido, cw, ch)

    fijo = bytearray(d)
    for y in range(ch):
        for x in range(cw):
            j = y * cw + x
            if conocido[j]:
                continue
            s = ((y + y0) * W + (x + x0)) * 4
            for c in range(3):
                fijo[s + c] = max(0, min(255, int(canales[c][j])))
            fijo[s + 3] = 255

    # el alfa venia con ruido de un valor o dos; redondearlo cuadruplica la
    # compresion del PNG de la mascara
    for i in range(W * H):
        a = fijo[i * 4 + 3]
        fijo[i * 4 + 3] = 0 if a < 8 else (255 if a > 247 else a)

    # el color se estira por debajo de lo transparente: un borde duro contra
    # el negro deja flecos de JPEG justo en el canto del montante
    canales = [[float(fijo[i * 4 + c]) for i in range(W * H)] for c in range(3)]
    conocido = bytearray(1 if fijo[i * 4 + 3] else 0 for i in range(W * H))
    inpaint(canales, conocido, W, H)
    color = bytearray(W * H * 4)
    for i in range(W * H):
        for c in range(3):
            color[i * 4 + c] = max(0, min(255, int(canales[c][i])))
        color[i * 4 + 3] = 255

    tmp = os.path.join(destino, 'interior-color.png')
    escribir(tmp, W, H, color)
    a_jpeg(tmp, os.path.join(destino, 'interior.jpg'))
    os.remove(tmp)
    escribir_alfa(os.path.join(destino, 'interior-mascara.png'), W, H, fijo)

    # el volante, recortado y centrado en su eje
    lado = int(R_EXT * 2) + 8
    ox, oy = int(round(CX - lado / 2)), int(round(CY - lado / 2))
    vcol = bytearray(lado * lado * 4)
    vmas = bytearray(lado * lado * 4)
    for y in range(lado):
        for x in range(lado):
            sx, sy = ox + x, oy + y
            if not (0 <= sx < W and 0 <= sy < H):
                continue
            j = (y * lado + x) * 4
            s = (sy * W + sx) * 4
            a = 0
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    nx, ny = sx + dx, sy + dy
                    if 0 <= nx < W and 0 <= ny < H and m[ny * W + nx]:
                        a += 1
            a = a / 9
            r = math.hypot(sx - CX, sy - CY)
            if r > R_LLENO:
                # el filo exterior de la llanta se queda en el salpicadero: un
                # anillo es igual gire lo que gire, y asi no hay costura
                a *= max(0.0, (R_DESVANECE - r) / (R_DESVANECE - R_LLENO))
            vcol[j:j + 3] = d[s:s + 3]
            vcol[j + 3] = 255
            vmas[j + 3] = round(a * 255)

    tmp = os.path.join(destino, 'volante-color.png')
    escribir(tmp, lado, lado, vcol)
    a_jpeg(tmp, os.path.join(destino, 'volante.jpg'))
    os.remove(tmp)
    escribir_alfa(os.path.join(destino, 'volante-mascara.png'), lado, lado, vmas)

    print('Listo. El eje del volante cae en (%.0f, %.0f) de un recorte de %d px.'
          % (CX - ox, CY - oy, lado))
    print('Si cambia, hay que cambiarlo tambien en src/arte/interior.ts.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
