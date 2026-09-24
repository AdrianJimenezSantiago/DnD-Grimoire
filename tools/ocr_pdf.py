"""Convierte un PDF escaneado (solo imágenes) en un PDF con capa de texto que la app puede importar.

Cada página se lee con Tesseract (español) y cada palabra se escribe como texto invisible en su sitio exacto,
encima de una versión ligera de la imagen. La app separa las columnas por posición, así que basta con que
las palabras estén donde están en la página.

Uso:  python3 tools/ocr_pdf.py entrada.pdf salida.pdf [--titulo "Manual de Monstruos (2025)"] [--dpi 300] [--desde 1 --hasta N]
Necesita: pymupdf (pip install pymupdf) y tesseract-ocr con el idioma spa.
El resultado es para el dispositivo del usuario: no se sube al repositorio.
"""
import argparse, csv, io, os, subprocess, sys, tempfile, time
from concurrent.futures import ProcessPoolExecutor
import pymupdf

def ocr_pagina(args):
    ruta, n, dpi = args
    doc = pymupdf.open(ruta)
    pix = doc[n].get_pixmap(dpi=dpi, colorspace=pymupdf.csGRAY)
    with tempfile.TemporaryDirectory() as tmp:
        png = os.path.join(tmp, 'p.png'); pix.save(png)
        # un hilo por proceso: con varios procesos, los hilos de Tesseract se pisan y todo va decenas de veces más lento
        tsv = subprocess.run(['tesseract', png, 'stdout', '-l', 'spa', '--psm', '1', 'tsv'], capture_output=True, text=True, env={**os.environ, 'OMP_THREAD_LIMIT': '1'}).stdout
    # líneas de Tesseract (bloque, párrafo, línea) con su caja: se escribe una línea de texto por cada una
    lineas = {}
    for f in csv.DictReader(io.StringIO(tsv), delimiter='\t', quoting=csv.QUOTE_NONE):
        clave = (f['block_num'], f['par_num'], f['line_num'])
        if f.get('level') == '4': lineas[clave] = {'caja': (int(f['left']), int(f['top']), int(f['width']), int(f['height'])), 'palabras': []}
        t = (f.get('text') or '').strip()
        if f.get('level') != '5' or not t or clave not in lineas: continue
        if float(f.get('conf') or -1) < 10 and len(t) <= 2: continue   # manchas de la ilustración
        lineas[clave]['palabras'].append((t, int(f['left']), int(f['width'])))
    palabras = [(' '.join(w[0] for w in L['palabras']), L['caja'], L['palabras']) for L in lineas.values() if L['palabras']]
    return n, pix.width, pix.height, palabras

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('entrada'); ap.add_argument('salida')
    ap.add_argument('--titulo', default=''); ap.add_argument('--dpi', type=int, default=300)
    ap.add_argument('--img-dpi', type=int, default=90, help='resolución de la imagen de fondo (0 = sin imagen)')
    ap.add_argument('--desde', type=int, default=1); ap.add_argument('--hasta', type=int, default=0)
    ap.add_argument('--procesos', type=int, default=os.cpu_count() or 2)
    a = ap.parse_args()
    src = pymupdf.open(a.entrada)
    hasta = a.hasta or src.page_count
    out = pymupdf.open()
    fuente = pymupdf.Font('helv')
    t0 = time.time()
    trabajos = [(a.entrada, n, a.dpi) for n in range(a.desde - 1, hasta)]
    with ProcessPoolExecutor(a.procesos) as ex:
        for n, pw, ph, palabras in ex.map(ocr_pagina, trabajos):
            sp = src[n]; r = sp.rect
            pg = out.new_page(width=r.width, height=r.height)
            if a.img_dpi:
                fondo = sp.get_pixmap(dpi=a.img_dpi, colorspace=pymupdf.csGRAY)
                pg.insert_image(r, stream=fondo.tobytes('jpeg', jpg_quality=55))
            k = r.width / pw   # píxeles del OCR → puntos de la página
            for texto, (lx, ly, lw, lh), ws in palabras:
                # altura de letra según la línea y ancho ajustado a la caja real con una escala horizontal;
                # los tramos separados por un hueco grande (columnas de una tabla) se escriben aparte
                tramos, act = [], [ws[0]]
                for w in ws[1:]:
                    fin = act[-1][1] + act[-1][2]
                    if w[1] - fin > lh * 1.4: tramos.append(act); act = [w]
                    else: act.append(w)
                tramos.append(act)
                fs = max(4.0, lh * k * 0.78)
                for tr in tramos:
                    t = ' '.join(w[0] for w in tr); x0 = tr[0][1]; x1 = tr[-1][1] + tr[-1][2]
                    base = pymupdf.Point(x0 * k, (ly + lh * 0.8) * k)
                    ancho = fuente.text_length(t, fontsize=fs) or 1
                    tw = pymupdf.TextWriter(pg.rect)
                    tw.append(base, t, font=fuente, fontsize=fs)
                    tw.write_text(pg, render_mode=3, morph=(base, pymupdf.Matrix(max(0.2, min(4, (x1 - x0) * k / ancho)), 1)))
            hechas = n - a.desde + 2
            if hechas % 10 == 0 or n == hasta - 1:
                print(f'página {hechas}/{hasta - a.desde + 1} · {time.time() - t0:.0f} s', flush=True)
    if a.titulo: out.set_metadata({'title': a.titulo})
    out.save(a.salida, garbage=4, deflate=True)
    print('guardado', a.salida, f'{os.path.getsize(a.salida) / 1e6:.1f} MB')

if __name__ == '__main__':
    main()
