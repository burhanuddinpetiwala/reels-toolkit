"""Product cut-outs (transparent PNG, cropped) with rembg.
python3 cutout.py <project> <image path or https URL> <out name, e.g. fireplace>   -> assets/p/<name>.png
Store images: append ?width=1600 to Shopify CDN URLs. If the network blocks the CDN, ask the user to attach the image."""
import io, os, sys, urllib.request
from PIL import Image
from rembg import new_session, remove

P, src, name = sys.argv[1:4]
os.makedirs(f'{P}/assets/p', exist_ok=True)
if src.startswith('http'):
    data = urllib.request.urlopen(urllib.request.Request(src, headers={'User-Agent': 'Mozilla/5.0'}), timeout=60).read()
    im = Image.open(io.BytesIO(data)).convert('RGB')
else:
    im = Image.open(src).convert('RGB')
cut = remove(im, session=new_session('isnet-general-use'), post_process_mask=True)
bb = cut.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
if bb:
    cut = cut.crop(bb)
out = f'{P}/assets/p/{name}.png'
cut.save(out)
print(out, cut.size)
