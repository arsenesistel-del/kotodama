"""Version pixel des créatures pour le combat de profil.

Part des peintures détourées de la v4 (src/assets/combat/<id>.webp) et les ramène à la taille
d'un ennemi de vieux Final Fantasy, dans la palette du pack Ninja Adventure : une rampe d'encre
(noir du contour, gris, os) et un seul accent vermillon.

    python3 tools/pixelize.py            # toutes les créatures
    python3 tools/pixelize.py kake ou    # quelques-unes

Sortie : src/assets/combat/px/<id>.png (PNG indexé, transparent).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'src/assets/combat'
OUT = SRC / 'px'

# Rampe d'encre prise dans le pack (contour, ombres, gris, os) et le vermillon du jeu.
INK = ['#141b1b', '#2b2a33', '#4e484a', '#8e8a8c', '#d2c9c9', '#f2eaf1']
RED = ['#681f14', '#9e2919', '#d4412b']

# Hauteur du sprite, en pixels du jeu. Le roi est plus grand ; l'effondrement, large, un peu moins haut.
SIZE = {'kake': 66, 'kuzure': 62, 'yuragi': 68, 'tsutae': 66, 'wake': 70, 'ou': 84, 'tsubu': 62, 'mayoi': 70, 'kiri': 86}

BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16 - 0.5


def hexrgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def pixelize(name):
    im = Image.open(SRC / f'{name}.webp').convert('RGBA')
    im = im.crop(im.getchannel('A').getbbox())
    h = SIZE[name]
    w = max(1, round(im.width * h / im.height))
    # Réduction sur couleurs prémultipliées, pour ne pas baver de noir sur les bords.
    a = np.asarray(im, dtype=np.float32) / 255
    pm = a.copy()
    pm[..., :3] *= pm[..., 3:4]
    small = Image.fromarray((pm * 255).astype(np.uint8), 'RGBA').resize((w, h), Image.LANCZOS)
    s = np.asarray(small, dtype=np.float32) / 255
    alpha = s[..., 3]
    rgb = np.where(alpha[..., None] > 0.01, s[..., :3] / np.maximum(alpha[..., None], 0.01), 0).clip(0, 1)

    solid = alpha > 0.45
    # Petits bouts isolés (éclaboussures d'un pixel) : on garde ceux qui touchent la silhouette.
    lum = rgb @ np.array([0.3, 0.59, 0.11])
    red = (rgb[..., 0] - np.maximum(rgb[..., 1], rgb[..., 2]) > 0.12) & (rgb[..., 0] > 0.28)

    # Lissage léger de la luminosité avant de quantifier : moins de bruit de pinceau.
    lum_img = Image.fromarray((lum * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(3))
    lum = np.asarray(lum_img, dtype=np.float32) / 255
    # Contraste : l'encre des peintures est très claire ou très sombre, on écarte les deux.
    lum = np.clip((lum - 0.1) / 0.75, 0, 1)
    lum = lum * lum * (3 - 2 * lum)  # courbe en S : moins de gris moyen

    yy, xx = np.mgrid[0:h, 0:w]
    n = len(INK) - 1  # le noir du contour n'est pas dans la rampe du corps
    d = lum * (n - 1) + 1 + BAYER[yy % 4, xx % 4] * 0.45
    idx = np.clip(np.rint(d), 1, n).astype(int)

    # Index final : 0 transparent, 1..len(INK) encre, puis le vermillon.
    out = np.zeros((h, w), dtype=np.uint8)
    out[solid] = idx[solid] + 1
    rl = np.clip(np.rint(0.8 + lum * 2.5), 0, 2).astype(int)
    rmask = solid & red
    rl[: int(h * 0.3)] = 2  # les yeux, en haut : toujours le vermillon vif
    out[rmask] = len(INK) + 1 + rl[rmask]

    # Nettoyage : un pixel seul de sa valeur au milieu de voisins tous pareils prend leur valeur.
    o = out.copy()
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            nb = [out[y - 1, x], out[y + 1, x], out[y, x - 1], out[y, x + 1]]
            if out[y, x] and nb.count(nb[0]) == 4 and nb[0] and nb[0] != out[y, x] and out[y, x] <= len(INK):
                o[y, x] = nb[0]
    out = o

    # Contour d'un pixel, noir d'encre, autour de la silhouette (ajoute une marge d'un pixel).
    out = np.pad(out, 1)
    filled = out > 0
    edge = np.zeros_like(filled)
    edge[1:, :] |= filled[:-1, :]
    edge[:-1, :] |= filled[1:, :]
    edge[:, 1:] |= filled[:, :-1]
    edge[:, :-1] |= filled[:, 1:]
    out[edge & ~filled] = 1

    pal = [(0, 0, 0)] + [hexrgb(c) for c in INK] + [hexrgb(c) for c in RED]
    img = Image.fromarray(out, 'P')
    flat = [v for c in pal for v in c]
    img.putpalette(flat + [0] * (768 - len(flat)))
    img.info['transparency'] = 0
    OUT.mkdir(exist_ok=True)
    img.save(OUT / f'{name}.png', transparency=0, optimize=True)
    return img.size


if __name__ == '__main__':
    names = sys.argv[1:] or list(SIZE)
    for n in names:
        print(n, pixelize(n))
