"""Render the simple GetFit launcher and splash marks from geometric shapes.
Requires Pillow. Run from the repository root.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

CREAM = '#FFF8EE'
PEACH = '#FAD5C4'
CORAL = '#E69A8D'
INK = '#543C34'

def kettlebell(draw, x, y, size):
    def box(a,b,c,d):
        return (x+a*size,y+b*size,x+c*size,y+d*size)
    stroke = max(1, round(size*.025))
    draw.rounded_rectangle(box(.29,.04,.71,.43),radius=size*.17,fill=INK)
    draw.rounded_rectangle(box(.37,.12,.63,.34),radius=size*.09,fill=CREAM)
    draw.rounded_rectangle(box(.12,.29,.88,.93),radius=size*.27,fill=CORAL,outline=INK,width=stroke)
    for cx in [.38,.62]:
        draw.ellipse(box(cx-.025,.52,cx+.025,.60),fill=INK)
    draw.arc(box(.43,.57,.57,.71),0,180,fill=INK,width=stroke)
    for cx in [.27,.73]:
        draw.ellipse(box(cx-.05,.63,cx+.05,.68),fill=PEACH)

def sparkle(d,x,y,r):
    d.polygon([(x,y-r),(x+r*.28,y-r*.28),(x+r,y),(x+r*.28,y+r*.28),(x,y+r),(x-r*.28,y+r*.28),(x-r,y),(x-r*.28,y-r*.28)],fill=CREAM)

def transparent_mark(path, size, kettlebell_box, sparkle_spec):
    """Render a transparent mark with enough inset for platform image crops."""
    image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    kettlebell(draw, *kettlebell_box)
    sparkle(draw, *sparkle_spec)
    image.save(path)

# Draw at high resolution and downsample for clean edges.
icon=Image.new('RGB',(1024,1024),PEACH)
d=ImageDraw.Draw(icon)
d.ellipse((120,120,904,904),fill=CREAM)
kettlebell(d,212,200,600)
sparkle(d,800,250,55)
icon.save('assets/icon.png')

# The native splash provides its own warm-ivory background. Keep both marks
# transparent and leave a generous safe inset around the sparkle so platform
# splash masks cannot clip it. The tighter brand mark avoids shrinking the
# actual artwork into a tiny, pixelated header image.
transparent_mark('assets/splash-icon.png', 1024, (222, 210, 580), (755, 245, 46))
transparent_mark('assets/brand-mark.png', 512, (42, 52, 410), (420, 98, 25))

banner=Image.new('RGB',(1280,720),PEACH)
d=ImageDraw.Draw(banner)
d.ellipse((-110,15,650,775),fill=CREAM)
kettlebell(d,70,145,430)
font=ImageFont.truetype('assets/fonts/Baloo2-ExtraBold.ttf',190)
d.text((555,220),'GetFit',font=font,fill=INK)
sparkle(d,1130,170,40)
sparkle(d,1090,550,26)
banner.resize((320,180),Image.Resampling.LANCZOS).save('assets/tv-banner.png')
banner.save('assets/tv-banner-preview.png')
