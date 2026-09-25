"""Genera el icono (luna creciente sobre un subrayado dorado) y las pantallas de carga."""
from PIL import Image, ImageDraw, ImageFilter
import os
INK=(30,39,64); GOLD=(226,183,94); DESK_D=(15,19,28)
RES='android/app/src/main/res'
S=1024

def foreground(size=S, scale=1.0):
    """Motivo sobre transparente, dentro de la zona segura del icono adaptable."""
    im=Image.new('RGBA',(size,size),(0,0,0,0))
    c=size/2; u=size/1024*scale
    glow=Image.new('RGBA',(size,size),(0,0,0,0)); g=ImageDraw.Draw(glow)
    g.rounded_rectangle([c-190*u,c+150*u,c+190*u,c+196*u],radius=23*u,fill=GOLD+(150,))
    glow=glow.filter(ImageFilter.GaussianBlur(34*u)); im.alpha_composite(glow)
    moon=Image.new('L',(size,size),0); m=ImageDraw.Draw(moon)
    R=175*u; cx,cy=c-8*u,c-40*u
    m.ellipse([cx-R,cy-R,cx+R,cy+R],fill=255)
    r2=R*0.86; ox,oy=cx+R*0.52,cy-R*0.30
    m.ellipse([ox-r2,oy-r2,ox+r2,oy+r2],fill=0)
    im.paste(Image.new('RGBA',(size,size),GOLD+(255,)),(0,0),moon)
    d=ImageDraw.Draw(im); sx,sy,a,b=c+118*u,c-118*u,46*u,11*u
    d.polygon([(sx,sy-a),(sx+b,sy-b),(sx+a,sy),(sx+b,sy+b),(sx,sy+a),(sx-b,sy+b),(sx-a,sy),(sx-b,sy-b)],fill=GOLD+(255,))
    d.rounded_rectangle([c-200*u,c+160*u,c+200*u,c+186*u],radius=13*u,fill=GOLD+(255,))
    return im

def composite(shape, size):
    big=Image.new('RGBA',(S,S),(0,0,0,0)); mask=Image.new('L',(S,S),0); md=ImageDraw.Draw(mask)
    if shape=='round': md.ellipse([0,0,S-1,S-1],fill=255)
    else: md.rounded_rectangle([40,40,S-41,S-41],radius=190,fill=255)
    bg=Image.new('RGBA',(S,S),INK+(255,)); big.paste(bg,(0,0),mask)
    fg=foreground(S,1.18); fg_m=Image.new('RGBA',(S,S),(0,0,0,0)); fg_m.paste(fg,(0,0),mask)
    big.alpha_composite(fg_m)
    return big.resize((size,size),Image.LANCZOS)

dens={'mdpi':1,'hdpi':1.5,'xhdpi':2,'xxhdpi':3,'xxxhdpi':4}
fg=foreground()
for k,f in dens.items():
    d=f'{RES}/mipmap-{k}'
    fg.resize((round(108*f),)*2,Image.LANCZOS).save(f'{d}/ic_launcher_foreground.png')
    composite('square',round(48*f)).save(f'{d}/ic_launcher.png')
    composite('round',round(48*f)).save(f'{d}/ic_launcher_round.png')

def splash(path):
    w,h=Image.open(path).size
    im=Image.new('RGBA',(w,h),INK+(255,)); side=int(min(w,h)*0.42)
    im.alpha_composite(foreground(S,1.0).resize((side,side),Image.LANCZOS),((w-side)//2,(h-side)//2))
    im.convert('RGB').save(path)
for root,_,files in os.walk(RES):
    for fn in files:
        if fn=='splash.png': splash(os.path.join(root,fn))
composite('square',512).save('tools/icon-512.png')
print('ok')
