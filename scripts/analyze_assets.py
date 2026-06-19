from PIL import Image
import os, json

def analyze_img(path):
    img = Image.open(path).convert('RGB')
    w, h = img.size
    small = img.resize((50, 50))
    pixels = list(small.getdata())
    r_avg = sum(p[0] for p in pixels) / len(pixels)
    g_avg = sum(p[1] for p in pixels) / len(pixels)
    b_avg = sum(p[2] for p in pixels) / len(pixels)
    brightness = (r_avg + g_avg + b_avg) / 3
    r_var = sum((p[0]-r_avg)**2 for p in pixels) / len(pixels)
    g_var = sum((p[1]-g_avg)**2 for p in pixels) / len(pixels)
    b_var = sum((p[2]-b_avg)**2 for p in pixels) / len(pixels)
    var = (r_var + g_var + b_var) / 3
    return {
        'w': w, 'h': h, 'ratio': round(w/h, 2),
        'r': round(r_avg), 'g': round(g_avg), 'b': round(b_avg),
        'brightness': round(brightness), 'variance': round(var)
    }

bg_dir = r'C:\AI_KIDS_BUDDY\asset\background'
ref_dir = r'C:\AI_KIDS_BUDDY\asset\reference'

results = {'backgrounds': [], 'references': []}

print('=== BACKGROUNDS ===')
for f in sorted(os.listdir(bg_dir)):
    if f.endswith('.png'):
        info = analyze_img(os.path.join(bg_dir, f))
        info['filename'] = f
        results['backgrounds'].append(info)
        print("{} | {}x{} | RGB({},{},{}) | bright={} | var={}".format(
            f[:8], info['w'], info['h'], info['r'], info['g'], info['b'], info['brightness'], info['variance']))

print()
print('=== REFERENCES ===')
for f in sorted(os.listdir(ref_dir)):
    if f.endswith('.png'):
        info = analyze_img(os.path.join(ref_dir, f))
        info['filename'] = f
        results['references'].append(info)
        print("{} | {}x{} | RGB({},{},{}) | bright={} | var={}".format(
            f[:8], info['w'], info['h'], info['r'], info['g'], info['b'], info['brightness'], info['variance']))

# Save results
with open(r'C:\AI_KIDS_BUDDY\scripts\asset_analysis.json', 'w') as fp:
    json.dump(results, fp, indent=2)
print('\nSaved to scripts/asset_analysis.json')
