"""アイコン（icons/*.png）とOGP画像（icons/ogp.png）を作り直すスクリプト。
使い方: python3 tools/make_icons.py   ※ Pillow と Noto Sans CJK フォントが必要
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'icons')
FONT_DIR = '/usr/share/fonts/opentype/noto'

def mix(c, a=0.3):
    return tuple(int(c[i] + (255 - c[i]) * a) for i in range(3)) + (255,)

def card(size, color, angle, shadow=False):
    w, h = size
    im = Image.new('RGBA', (w * 2, h * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x0, y0 = w // 2, h // 2
    d.rounded_rectangle([x0, y0, x0 + w, y0 + h], radius=int(w * 0.1), fill=color)
    if not shadow:
        m = int(w * .09)
        d.rounded_rectangle([x0 + m, y0 + m, x0 + w - m, y0 + m + int(h * .1)], radius=int(w * .05), fill=mix(color))
    return im.rotate(angle, resample=Image.BICUBIC, expand=False)

def paste_center(base, im, cx, cy):
    base.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))

YELLOW = (0xF2, 0xC2, 0x00, 255)
RED = (0xE3, 0x26, 0x3C, 255)

def icon(S, rounded=True):
    k = 4; N = S * k; u = N / 512
    im = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    bg = Image.new('RGBA', (N, N), (0x2F, 0x8A, 0x4C, 255))
    d = ImageDraw.Draw(bg)
    for i in range(3):
        y = int(u * (128 + 128 * i))
        d.rectangle([0, y, N, y + int(64 * u)], fill=(0x2A, 0x80, 0x46, 255))
    mask = Image.new('L', (N, N), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, N - 1, N - 1], radius=int(112 * u) if rounded else 0, fill=255)
    im.paste(bg, (0, 0), mask)
    paste_center(im, card((int(150 * u), int(214 * u)), RED, -12), 307 * u, 239 * u)
    sh = card((int(160 * u), int(228 * u)), (0, 0, 0, 56), 10, True).filter(ImageFilter.GaussianBlur(6 * u))
    paste_center(im, sh, 230 * u, 276 * u)
    paste_center(im, card((int(160 * u), int(228 * u)), YELLOW, 10), 220 * u, 264 * u)
    return im.resize((S, S), Image.LANCZOS)

def ogp():
    W, H, k = 1200, 630, 2
    im = Image.new('RGBA', (W * k, H * k), (0x2F, 0x8A, 0x4C, 255))
    d = ImageDraw.Draw(im)
    for i in range(0, H * k, 80 * k):
        d.rectangle([0, i + 40 * k, W * k, i + 80 * k], fill=(0x2A, 0x80, 0x46, 255))
    lw = 4 * k
    d.rectangle([W * k - 330 * k, -10, W * k + 10, 330 * k], outline=(242, 247, 240, 255), width=lw)
    d.rectangle([W * k - 170 * k, -10, W * k + 10, 140 * k], outline=(242, 247, 240, 255), width=lw)
    paste_center(im, card((210 * k, 300 * k), RED, -14), 975 * k, 300 * k)
    sh = card((230 * k, 330 * k), (0, 0, 0, 60), 8, True).filter(ImageFilter.GaussianBlur(10 * k))
    paste_center(im, sh, 880 * k, 345 * k)
    paste_center(im, card((230 * k, 330 * k), YELLOW, 9), 870 * k, 330 * k)
    fT = ImageFont.truetype(os.path.join(FONT_DIR, 'NotoSansCJK-Black.ttc'), 96 * k, index=0)
    fS = ImageFont.truetype(os.path.join(FONT_DIR, 'NotoSansCJK-Bold.ttc'), 40 * k, index=0)
    fM = ImageFont.truetype(os.path.join(FONT_DIR, 'NotoSansCJK-Bold.ttc'), 28 * k, index=0)
    d = ImageDraw.Draw(im)
    x = 72 * k
    d.text((x, 96 * k), 'サッカー観戦をはじめたあなたへ', font=fM, fill=(255, 255, 255, 230))
    d.text((x, 150 * k), 'サッカー', font=fT, fill=(255, 255, 255, 255))
    d.text((x, 270 * k), '審判道場', font=fT, fill=(255, 255, 255, 255))
    d.text((x, 410 * k), '審判の目で、試合を見よう。', font=fS, fill=(255, 255, 255, 255))
    tag = '2026/27 競技規則対応 ・ 37の場面'
    tb = d.textbbox((0, 0), tag, font=fM)
    d.rounded_rectangle([x, 490 * k, x + tb[2] + 40 * k, 490 * k + tb[3] + 26 * k], radius=10 * k, fill=(15, 26, 20, 235))
    d.text((x + 20 * k, 500 * k), tag, font=fM, fill=YELLOW)
    return im.resize((W, H), Image.LANCZOS).convert('RGB')

if __name__ == '__main__':
    icon(192).save(os.path.join(OUT, 'icon-192.png'))
    icon(512).save(os.path.join(OUT, 'icon-512.png'))
    icon(180, rounded=False).convert('RGB').save(os.path.join(OUT, 'apple-touch-icon.png'))
    ogp().save(os.path.join(OUT, 'ogp.png'), optimize=True)
    print('icons written to', OUT)
