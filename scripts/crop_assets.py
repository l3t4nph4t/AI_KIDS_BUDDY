"""
Smart crop script for VyVy sprites and decoration items.
Attempts to find the main subject region and crop it with padding.
Falls back to center-crop if subject detection fails.
"""
from PIL import Image, ImageFilter, ImageDraw
import os, json

OUT_DIR = r'C:\AI_KIDS_BUDDY\web\assets\vyvy\derived'
os.makedirs(OUT_DIR, exist_ok=True)

def find_subject_bbox(img, threshold=30):
    """Find bounding box of the main subject using edge detection."""
    small = img.resize((200, 200))
    gray = small.convert('L')
    edges = gray.filter(ImageFilter.FIND_EDGES)
    # Threshold edge image
    edge_data = edges.load()
    w, h = edges.size
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            if edge_data[x, y] > threshold:
                xs.append(x)
                ys.append(y)
    if not xs:
        return None
    return (min(xs), min(ys), max(xs), max(ys))

def smart_crop(img_path, crop_type, target_size=None, padding=0.15):
    """
    Smart crop an image.
    crop_type: 'character_center', 'character_top', 'object_grid', 'full_center'
    target_size: (w, h) to resize output
    padding: fraction of padding around detected subject
    """
    img = Image.open(img_path).convert('RGBA')
    w, h = img.size
    
    bbox = find_subject_bbox(img)
    
    if crop_type == 'character_center':
        # Crop center region where character likely is (center 60% width, middle 50% height)
        cx, cy = w // 2, int(h * 0.45)
        crop_w, crop_h = int(w * 0.55), int(h * 0.45)
        x0 = max(0, cx - crop_w // 2)
        y0 = max(0, cy - crop_h // 2)
        x1 = min(w, x0 + crop_w)
        y1 = min(h, y0 + crop_h)
    elif crop_type == 'character_top':
        # Character in upper portion
        cx, cy = w // 2, int(h * 0.3)
        crop_w, crop_h = int(w * 0.5), int(h * 0.35)
        x0 = max(0, cx - crop_w // 2)
        y0 = max(0, cy - crop_h // 2)
        x1 = min(w, x0 + crop_w)
        y1 = min(h, y0 + crop_h)
    elif crop_type == 'object_grid':
        # Use detected bbox if available
        if bbox:
            scale = w / 200.0
            x0 = max(0, int((bbox[0] - 10) * scale))
            y0 = max(0, int((bbox[1] - 10) * scale))
            x1 = min(w, int((bbox[2] + 10) * scale))
            y1 = min(h, int((bbox[3] + 10) * scale))
        else:
            # Fallback: center crop
            cx, cy = w // 2, h // 2
            crop_w, crop_h = int(w * 0.6), int(h * 0.6)
            x0 = max(0, cx - crop_w // 2)
            y0 = max(0, cy - crop_h // 2)
            x1 = min(w, x0 + crop_w)
            y1 = min(h, y0 + crop_h)
    else:  # full_center
        x0, y0, x1, y1 = 0, 0, w, h
    
    # Add padding
    pad_x = int((x1 - x0) * padding)
    pad_y = int((y1 - y0) * padding)
    x0 = max(0, x0 - pad_x)
    y0 = max(0, y0 - pad_y)
    x1 = min(w, x1 + pad_x)
    y1 = min(h, y1 + pad_y)
    
    cropped = img.crop((x0, y0, x1, y1))
    
    if target_size:
        cropped = cropped.resize(target_size, Image.Resampling.LANCZOS)
    
    return cropped

def remove_bg_simple(img, bg_threshold=230):
    """Simple white/light background removal."""
    img = img.convert('RGBA')
    data = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = data[x, y]
            if r > bg_threshold and g > bg_threshold and b > bg_threshold:
                data[x, y] = (r, g, b, 0)
    return img

def create_square_sprite(img, size=256):
    """Create a square sprite with the image centered."""
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    # Fit image in canvas maintaining aspect ratio
    img_w, img_h = img.size
    ratio = min(size * 0.85 / img_w, size * 0.85 / img_h)
    new_w, new_h = int(img_w * ratio), int(img_h * ratio)
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    x = (size - new_w) // 2
    y = (size - new_w) // 2
    canvas.paste(resized, (x, y), resized if resized.mode == 'RGBA' else None)
    return canvas

# Define crop jobs
# Format: (source_filename, crop_id, crop_type, target_size, remove_bg, quality_note)
CROP_JOBS = [
    # VyVy sprites from top-detail sheets
    ('642ebb9e-b4f7-4738-b835-10a3fe26dcaa.png', 'vyvy_idle', 'character_center', (256, 256), True, 'good'),
    ('290280e8-9ada-432a-bcc6-55d60748e074.png', 'vyvy_happy_clap', 'character_center', (256, 256), True, 'good'),
    ('c9abdefc-7eb6-44f9-96db-13b9d455f0d6.png', 'vyvy_thinking', 'character_top', (256, 256), True, 'good'),
    ('5bc5cf35-53a4-43f0-b1ff-1a1712b22921.png', 'vyvy_supportive', 'character_center', (256, 256), True, 'usable'),
    ('a8c62348-3df9-4c42-8179-c114408da249.png', 'vyvy_celebrate', 'character_center', (256, 256), True, 'usable'),
    ('8937d96a-312c-498a-be2f-c82bb5e11578.png', 'vyvy_reading', 'character_center', (256, 256), True, 'usable'),
    
    # Decoration/reward items from medium-detail sheets
    ('6f03c145-dc88-4d24-a5ab-3c4ce1a4bf94.png', 'star_coin', 'object_grid', (128, 128), True, 'usable'),
    ('6c022d4e-8878-40c8-a70e-f1675c878840.png', 'desk_lamp', 'object_grid', (128, 128), True, 'usable'),
    ('adf8d50f-6511-45d9-a3a3-4e5850be8ec8.png', 'plant', 'object_grid', (128, 128), True, 'usable'),
    ('1f8767f7-4657-46c8-aee1-8dd1ddf359ba.png', 'rug', 'object_grid', (128, 128), True, 'usable'),
    ('bec2ce62-6086-415e-9d7e-c4098c3068df.png', 'puppy_plush', 'object_grid', (128, 128), True, 'usable'),
    ('7eef0500-df01-4ff3-b8b9-0bc9e8f0ed57.png', 'bookshelf', 'object_grid', (128, 128), True, 'usable'),
    ('00d61f36-eca5-4d5a-b3c7-0b96225ade27.png', 'trophy', 'object_grid', (128, 128), True, 'usable'),
    ('43d3abf5-d584-4605-aa75-096fc81a35c6.png', 'treasure_chest', 'object_grid', (128, 128), True, 'usable'),
]

ref_dir = r'C:\AI_KIDS_BUDDY\asset\reference'
manifest_entries = []

for src_name, crop_id, crop_type, target_size, do_remove_bg, quality in CROP_JOBS:
    src_path = os.path.join(ref_dir, src_name)
    if not os.path.exists(src_path):
        print(f"SKIP: {src_name} not found")
        continue
    
    try:
        cropped = smart_crop(src_path, crop_type, target_size, padding=0.12)
        
        if do_remove_bg:
            cropped = remove_bg_simple(cropped, bg_threshold=235)
        
        out_name = f"{crop_id}.png"
        out_path = os.path.join(OUT_DIR, out_name)
        cropped.save(out_path, 'PNG', optimize=True)
        
        file_size = os.path.getsize(out_path)
        
        entry = {
            'id': crop_id,
            'type': 'vyvy_sprite' if crop_id.startswith('vyvy_') else 'decoration',
            'source_raw': f'asset/reference/{src_name}',
            'derived_path': f'assets/vyvy/derived/{out_name}',
            'recommended_screen': 'home' if not crop_id.startswith('vyvy_') else 
                                  'practice' if 'happy' in crop_id or 'supportive' in crop_id else
                                  'quiz' if 'thinking' in crop_id else
                                  'reward' if 'celebrate' in crop_id else
                                  'reading' if 'reading' in crop_id else 'home',
            'notes': f'Cropped from {src_name[:8]}, type={crop_type}',
            'quality': quality,
            'size_bytes': file_size
        }
        manifest_entries.append(entry)
        print(f"OK: {out_name} ({file_size} bytes) - {quality}")
    except Exception as e:
        print(f"ERROR: {crop_id} - {e}")
        manifest_entries.append({
            'id': crop_id,
            'type': 'vyvy_sprite' if crop_id.startswith('vyvy_') else 'decoration',
            'source_raw': f'asset/reference/{src_name}',
            'derived_path': '',
            'quality': 'needs_manual_crop',
            'notes': f'Auto-crop failed: {str(e)}'
        })

# Save manifest entries
with open(r'C:\AI_KIDS_BUDDY\scripts\derived_manifest.json', 'w') as fp:
    json.dump(manifest_entries, fp, indent=2)
print(f"\nProcessed {len(manifest_entries)} items. Saved manifest.")
