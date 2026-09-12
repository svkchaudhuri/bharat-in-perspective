from PIL import Image, ImageDraw
from math import sin,cos,pi
from pathlib import Path
out=Path('assets/icons');out.mkdir(exist_ok=True)
s=1536
im=Image.new('RGB',(s,s),'#edf1ed');d=ImageDraw.Draw(im)
x,y,w,h=300,456,936,624
for n,c in enumerate(['#ff9933','#ffffff','#138808']):d.rectangle((x,y+n*h/3,x+w,y+(n+1)*h/3),fill=c)
cx,cy,r=s/2,s/2,85
d.ellipse((cx-r,cy-r,cx+r,cy+r),outline='#000080',width=7)
for n in range(24):
 a=2*pi*n/24;d.line((cx,cy,cx+r*cos(a),cy+r*sin(a)),fill='#000080',width=4)
d.ellipse((cx-12,cy-12,cx+12,cy+12),fill='#000080')
for size in [48,180,192,512]:im.resize((size,size),Image.Resampling.LANCZOS).save(out/f'india-{size}.png')
