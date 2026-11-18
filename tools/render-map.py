# Rendu d'une carte en pixel (voir render-map.mjs) : lit le JSON des tuiles, compose l'image avec Pillow.
import json, sys
from PIL import Image, ImageDraw

data = json.load(open(sys.argv[1]))
root, out = sys.argv[2], sys.argv[3]
W, H, S = data['w'], data['h'], data['scale']
sheets = []
for s in data['sheets']:
    im = Image.open(f"{root}/tiles/{s['name']}.png").convert('RGBA')
    sheets.append((s['first'], s['cols'], im))


def tile(g):
    for first, cols, im in reversed(sheets):
        if g >= first:
            i = g - first
            x, y = (i % cols) * 16, (i // cols) * 16
            return im.crop((x, y, x + 16, y + 16))
    return None


img = Image.new('RGBA', (W * 16, H * 16), (20, 27, 27, 255))
grass_col = (74, 127, 75, 255)
for layer in ['ground', 'detail', 'below', 'deco']:
    g = data['grids'][layer]
    for y in range(H):
        for x in range(W):
            if g[y][x]:
                t = tile(g[y][x])
                if t:
                    img.alpha_composite(t, (x * 16, y * 16))
# Herbes hautes : un aplat sombre (la scène les peint par le code).
d = ImageDraw.Draw(img)
for i, v in enumerate(data['grass']):
    if v:
        x, y = (i % W) * 16, (i // W) * 16
        d.rectangle([x + 1, y + 3, x + 14, y + 15], fill=grass_col)
import os
d = ImageDraw.Draw(img)
# Sols et murs des intérieurs, peints par le jeu (paint.ts) : ici des aplats de la même couleur.
PAINT = {'F': (189, 121, 89), 'M': (168, 161, 41), 'E': (129, 104, 85), 'K': (150, 83, 64), 'W': (238, 207, 155), 'X': (20, 27, 27), '_': (20, 27, 27)}
for y, row in enumerate(data['paint']):
    for x, c in enumerate(row):
        if c:
            d.rectangle([x * 16, y * 16, x * 16 + 15, y * 16 + 15], fill=PAINT.get(c, (0, 0, 0)))
for s in data['sprites']:
    f = f"{root}/{s['key']}.png"
    if not os.path.exists(f):
        # Objet peint par le jeu : un cadre à sa place (les captures du jeu montrent le vrai rendu).
        d.rectangle([s['x'], s['y'], s['x'] + s['fw'] - 1, s['y'] + s['fh'] - 1], outline=(212, 65, 43, 255))
        continue
    im = Image.open(f).convert('RGBA').crop((0, 0, s['fw'], s['fh']))
    img.alpha_composite(im, (s['x'], s['y']))
for n in data['npcs']:
    im = Image.open(f"{root}/{n['sprite']}.png").convert('RGBA').crop((0, 0, 16, 16))
    img.alpha_composite(im, (int(n['x'] - 8), int(n['y'] - 16)))
g = data['grids']['above']
for y in range(H):
    for x in range(W):
        if g[y][x]:
            t = tile(g[y][x])
            if t:
                img.alpha_composite(t, (x * 16, y * 16))
d = ImageDraw.Draw(img)
for r in data['readables']:
    for x, y in r['cells']:
        d.rectangle([x * 16, y * 16, x * 16 + 15, y * 16 + 15], outline=(212, 65, 43, 255))
for cells in data['doors']:
    for x, y in cells:
        d.rectangle([x * 16 + 1, y * 16 + 1, x * 16 + 14, y * 16 + 14], outline=(60, 140, 230, 255))
# Repères tous les 4 cases.
big = img.resize((W * 16 * S, H * 16 * S), Image.NEAREST)
d = ImageDraw.Draw(big)
for x in range(0, W, 4):
    d.text((x * 16 * S + 2, 2), str(x), fill=(255, 255, 0, 255))
for y in range(0, H, 4):
    d.text((2, y * 16 * S + 2), str(y), fill=(255, 255, 0, 255))
big.convert('RGB').save(out)
