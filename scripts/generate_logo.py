from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[1] / "src" / "assets" / "logo.png"
OUT.parent.mkdir(parents=True, exist_ok=True)

size = 1024
img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Background
bg = Image.new("RGBA", (size, size), (10, 10, 12, 255))
bg_draw = ImageDraw.Draw(bg)
bg_draw.rounded_rectangle((20, 20, size - 20, size - 20), radius=210, fill=(18, 24, 48, 255))

# Shadow
shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
shadow_draw = ImageDraw.Draw(shadow)
shadow_draw.polygon([(350, 70), (650, 70), (280, 440), (80, 240)], fill=(0, 0, 0, 180))
shadow_draw.polygon([(470, 430), (770, 430), (420, 780), (220, 580)], fill=(0, 0, 0, 180))
shadow = shadow.filter(ImageFilter.GaussianBlur(26))

# Mark shapes
mark = Image.new("RGBA", (size, size), (0, 0, 0, 0))
md = ImageDraw.Draw(mark)
blue = (81, 110, 255, 255)
yellow = (255, 223, 0, 255)
white = (255, 255, 255, 255)
md.polygon([(340, 150), (660, 150), (270, 540), (110, 380)], fill=blue)
md.polygon([(450, 610), (770, 610), (500, 880), (180, 560)], fill=yellow)
md.polygon([(470, 390), (710, 390), (380, 720), (260, 600)], fill=blue)
md.polygon([(360, 500), (520, 660), (360, 820), (200, 660)], fill=yellow)

# Highlights
hl = Image.new("RGBA", (size, size), (0, 0, 0, 0))
hd = ImageDraw.Draw(hl)
hd.line([(340, 150), (660, 150), (270, 540)], fill=white, width=8, joint="curve")
hd.line([(450, 610), (770, 610), (500, 880)], fill=white, width=8, joint="curve")
hd.line([(470, 390), (710, 390), (380, 720)], fill=white, width=8, joint="curve")
hd.line([(360, 500), (520, 660), (360, 820), (200, 660), (360, 500)], fill=(0, 0, 0, 0), width=0)

# Compose and soften
canvas = Image.alpha_composite(bg, shadow)
canvas = Image.alpha_composite(canvas, mark)
canvas = Image.alpha_composite(canvas, hl)
canvas = canvas.filter(ImageFilter.GaussianBlur(0.2))

canvas.save(OUT)
print(f"Wrote {OUT}")
