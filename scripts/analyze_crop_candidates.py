"""
Analyze reference images for crop candidate quality.
Detects: edge density, color diversity, region analysis.
"""
from PIL import Image, ImageFilter
import os, json

def analyze_detail(path):
    img = Image.open(path).convert('RGB')
    w, h = img.size
    small = img.resize((100, 100))
    
    # Edge density (high = more detailed/illustrated content)
    edges = small.filter(ImageFilter.FIND_EDGES)
    edge_pixels = list(edges.getdata())
    edge_avg = sum(sum(p) / 3 for p in edge_pixels) / len(edge_pixels)
    
    # Color diversity (number of unique quantized colors)
    q = small.quantize(colors=64, method=2)
    unique_colors = len(set(q.getdata()))
    
    # Quadrant analysis - check if content is spread or centered
    quads = {}
    for qi, (x0, y0, x1, y1) in enumerate([(0,0,50,50),(50,0,100,50),(0,50,50,100),(50,50,100,100)]):
        region = small.crop((x0, y0, x1, y1))
        rpixels = list(region.getdata())
        rb = sum(sum(p)/3 for p in rpixels) / len(rpixels)
        quads[f'q{qi}_bright'] = round(rb)
    
    # Top region brightness (top 30% = likely UI header or background)
    top = small.crop((0, 0, 100, 30))
    top_bright = sum(sum(p)/3 for p in list(top.getdata())) / (30*100)
    
    # Center region analysis (center 40% = likely main content)
    center = small.crop((30, 30, 70, 70))
    center_bright = sum(sum(p)/3 for p in list(center.getdata())) / (40*40)
    
    # Bottom region
    bottom = small.crop((0, 70, 100, 100))
    bottom_bright = sum(sum(p)/3 for p in list(bottom.getdata())) / (30*100)
    
    return {
        'w': w, 'h': h,
        'edge_density': round(edge_avg, 1),
        'unique_colors': unique_colors,
        'top_bright': round(top_bright),
        'center_bright': round(center_bright),
        'bottom_bright': round(bottom_bright),
        **quads
    }

ref_dir = r'C:\AI_KIDS_BUDDY\asset\reference'
results = []
for f in sorted(os.listdir(ref_dir)):
    if f.endswith('.png'):
        info = analyze_detail(os.path.join(ref_dir, f))
        info['filename'] = f
        # Score: higher edge density + more colors = more likely to be illustration/sprite
        info['sprite_score'] = round(info['edge_density'] * 0.5 + info['unique_colors'] * 0.3, 1)
        results.append(info)

# Sort by sprite_score descending
results.sort(key=lambda x: x['sprite_score'], reverse=True)

print("=== TOP CROP CANDIDATES (by sprite_score) ===")
for r in results[:20]:
    print("{} | {}x{} | edge={} | colors={} | score={} | top={} ctr={} btm={}".format(
        r['filename'][:8], r['w'], r['h'], r['edge_density'], 
        r['unique_colors'], r['sprite_score'],
        r['top_bright'], r['center_bright'], r['bottom_bright']))

print("\n=== LIKELY UI MOCKUPS (high bright, low detail) ===")
for r in results[-10:]:
    print("{} | {}x{} | edge={} | colors={} | score={}".format(
        r['filename'][:8], r['w'], r['h'], r['edge_density'],
        r['unique_colors'], r['sprite_score']))

with open(r'C:\AI_KIDS_BUDDY\scripts\crop_candidates.json', 'w') as fp:
    json.dump(results, fp, indent=2)
print("\nSaved to scripts/crop_candidates.json")
