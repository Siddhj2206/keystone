from PIL import Image, ImageDraw
from pathlib import Path

root = Path(__file__).parent
image = Image.new('RGB', (1024, 1024), '#285b43')
draw = ImageDraw.Draw(image)
draw.polygon([(288, 280), (736, 280), (656, 740), (368, 740)], fill='#f1f2df')
draw.line([(430, 490), (500, 560), (624, 400)], fill='#285b43', width=40)
for name in ['icon.png', 'splash-icon.png', 'favicon.png']:
    image.save(root / name)
