#!/usr/bin/env python3
"""
Extract building numbers and positions from Fort Bragg installation map PDF.

Strategy:
1. Render PDF in overlapping tiles at 600 DPI
2. Isolate blue text pixels (building numbers are blue, various shades)
3. OCR each tile at 4 rotations (0°, 90°, 180°, 270°) to catch angled labels
4. Merge results, deduplicate overlapping regions
5. Output building numbers with PDF coordinates

Requirements: pip install pymupdf pytesseract pillow numpy
Also needs: tesseract-ocr installed system-wide
"""

import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import numpy as np
import re
import json
import sys
import math
from collections import defaultdict

PDF_PATH = "/tmp/post_map.pdf"
OUTPUT_PATH = "/tmp/extracted_buildings.json"
DPI = 600
ZOOM = DPI / 72
TILE_SIZE = 250  # PDF points per tile (~3.5 inches)
OVERLAP = 40     # PDF points overlap between tiles
CONF_THRESHOLD = 30  # Minimum OCR confidence

# Building number patterns for Fort Bragg
# Format: Letter prefix + digits (M2567, N6002, J1952, etc.)
BUILDING_PATTERN = re.compile(r'^[A-Z]\d{3,5}$')

# Rotations to try (degrees clockwise)
ROTATIONS = [0, 90, 180, 270]

# Tesseract config
OCR_CONFIG = '--psm 11 --oem 3 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'


def isolate_blue_text(arr):
    """Isolate blue-ish text pixels from the map.
    Building numbers are dark blue on a light background.
    Returns binary image: black text on white background."""
    # Broad filter: any pixel where blue channel dominates and overall is dark-ish
    mask = (
        (arr[:, :, 0].astype(int) + arr[:, :, 1].astype(int) + arr[:, :, 2].astype(int) < 400) &
        (arr[:, :, 2] > arr[:, :, 0]) &
        (arr[:, :, 2] > arr[:, :, 1]) &
        (arr[:, :, 2] > 50)
    )
    result = np.ones((arr.shape[0], arr.shape[1]), dtype=np.uint8) * 255
    result[mask] = 0
    return result


def rotate_point_back(px, py, img_w, img_h, rotation):
    """Convert a point from rotated image coordinates back to original coords."""
    if rotation == 0:
        return px, py
    elif rotation == 90:
        # 90° CW: (x, y) in rotated -> (y, w-x) in original
        return py, img_w - px
    elif rotation == 180:
        return img_w - px, img_h - py
    elif rotation == 270:
        # 270° CW: (x, y) in rotated -> (h-y, x) in original
        return img_h - py, px
    return px, py


def extract_tile(page, tile_rect, tile_id):
    """Extract building numbers from a single tile, trying multiple rotations."""
    mat = fitz.Matrix(ZOOM, ZOOM)
    pix = page.get_pixmap(matrix=mat, clip=tile_rect, alpha=False)

    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    arr = np.array(img)

    # Isolate blue text
    binary = isolate_blue_text(arr)

    # Check if there are enough dark pixels to bother OCR'ing
    dark_pct = (binary < 128).sum() / binary.size
    if dark_pct < 0.001:
        return []

    pil_img = Image.fromarray(binary)
    orig_w, orig_h = pil_img.size

    results = []
    seen_texts = set()  # Avoid duplicates from different rotations in same tile

    for rotation in ROTATIONS:
        if rotation == 0:
            rotated = pil_img
        else:
            # PIL rotate is counter-clockwise, so negate for CW
            rotated = pil_img.rotate(-rotation, expand=True, fillcolor=255)

        try:
            data = pytesseract.image_to_data(
                rotated, output_type=pytesseract.Output.DICT, config=OCR_CONFIG
            )
        except Exception:
            continue

        for i in range(len(data['text'])):
            text = data['text'][i].strip()
            conf = int(data['conf'][i])

            if not text or conf < CONF_THRESHOLD:
                continue

            if not BUILDING_PATTERN.match(text):
                continue

            # Skip if we already found this building number in this tile
            if text in seen_texts:
                continue
            seen_texts.add(text)

            # Get center position in rotated image
            rot_x = data['left'][i] + data['width'][i] / 2
            rot_y = data['top'][i] + data['height'][i] / 2

            # Convert back to original image coordinates
            rot_w, rot_h = rotated.size
            if rotation == 0:
                orig_x, orig_y = rot_x, rot_y
            elif rotation == 90:
                orig_x = rot_y
                orig_y = rot_w - rot_x
            elif rotation == 180:
                orig_x = rot_w - rot_x
                orig_y = rot_h - rot_y
            elif rotation == 270:
                orig_x = rot_h - rot_y
                orig_y = rot_x

            # Convert pixel position to PDF coordinates
            pdf_x = tile_rect.x0 + orig_x / ZOOM
            pdf_y = tile_rect.y0 + orig_y / ZOOM

            results.append({
                'building_number': text,
                'confidence': conf,
                'pdf_x': round(pdf_x, 1),
                'pdf_y': round(pdf_y, 1),
                'tile_id': tile_id,
                'rotation': rotation,
            })

    return results


def deduplicate(all_results, distance_threshold=20):
    """Deduplicate building numbers that appear in overlapping tiles.
    Keep the highest confidence match for each building number at each location."""

    by_number = defaultdict(list)
    for r in all_results:
        by_number[r['building_number']].append(r)

    deduped = []
    for bldg_num, matches in by_number.items():
        if len(matches) == 1:
            deduped.append(matches[0])
            continue

        # Cluster nearby matches
        clusters = []
        used = set()
        for i, m1 in enumerate(matches):
            if i in used:
                continue
            cluster = [m1]
            used.add(i)
            for j, m2 in enumerate(matches):
                if j in used:
                    continue
                dist = ((m1['pdf_x'] - m2['pdf_x'])**2 + (m1['pdf_y'] - m2['pdf_y'])**2)**0.5
                if dist < distance_threshold:
                    cluster.append(m2)
                    used.add(j)
            clusters.append(cluster)

        for cluster in clusters:
            best = max(cluster, key=lambda x: x['confidence'])
            avg_x = sum(m['pdf_x'] for m in cluster) / len(cluster)
            avg_y = sum(m['pdf_y'] for m in cluster) / len(cluster)
            best['pdf_x'] = round(avg_x, 1)
            best['pdf_y'] = round(avg_y, 1)
            deduped.append(best)

    return deduped


def main():
    doc = fitz.open(PDF_PATH)
    page = doc[0]

    page_w = page.rect.width
    page_h = page.rect.height
    print(f"Page size: {page_w:.0f} x {page_h:.0f} pts")
    print(f"Tile size: {TILE_SIZE} pts, Overlap: {OVERLAP} pts")
    print(f"DPI: {DPI}, Zoom: {ZOOM:.2f}")
    print(f"Rotations: {ROTATIONS}")

    # Generate tile grid
    tiles = []
    step = TILE_SIZE - OVERLAP
    y = 0
    while y < page_h:
        x = 0
        while x < page_w:
            x1 = min(x + TILE_SIZE, page_w)
            y1 = min(y + TILE_SIZE, page_h)
            tiles.append(fitz.Rect(x, y, x1, y1))
            x += step
        y += step

    print(f"Total tiles: {len(tiles)}")
    print(f"Processing with 4 rotation passes per tile...\n")

    all_results = []
    for i, tile in enumerate(tiles):
        results = extract_tile(page, tile, i)
        if results:
            all_results.extend(results)
            bldgs = [r['building_number'] for r in results]
            print(f"  Tile {i:>4}/{len(tiles)}: {len(results)} buildings: {', '.join(bldgs[:5])}"
                  f"{'...' if len(bldgs) > 5 else ''}")

        if (i + 1) % 50 == 0:
            print(f"  Progress: {i+1}/{len(tiles)} tiles, {len(all_results)} raw matches")

    print(f"\nRaw matches: {len(all_results)}")

    deduped = deduplicate(all_results)
    print(f"After deduplication: {len(deduped)}")

    deduped.sort(key=lambda x: x['building_number'])

    output = {
        'metadata': {
            'source': PDF_PATH,
            'dpi': DPI,
            'tile_size': TILE_SIZE,
            'overlap': OVERLAP,
            'page_width': page_w,
            'page_height': page_h,
            'total_tiles': len(tiles),
            'raw_matches': len(all_results),
            'rotations': ROTATIONS,
        },
        'buildings': [{
            'building_number': b['building_number'],
            'pdf_x': b['pdf_x'],
            'pdf_y': b['pdf_y'],
            'confidence': b['confidence'],
        } for b in deduped]
    }

    with open(OUTPUT_PATH, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\nSaved {len(deduped)} buildings to {OUTPUT_PATH}")

    print(f"\n=== Building Number Prefixes ===")
    prefixes = defaultdict(int)
    for b in deduped:
        prefix = b['building_number'][0]
        prefixes[prefix] += 1
    for prefix, count in sorted(prefixes.items()):
        print(f"  {prefix}: {count} buildings")

    print(f"\n=== Sample buildings (first 30) ===")
    for b in deduped[:30]:
        print(f"  {b['building_number']:>8} at PDF({b['pdf_x']:.0f}, {b['pdf_y']:.0f}) conf={b['confidence']}")

    doc.close()


if __name__ == '__main__':
    main()
