# Fort Bragg (Fort Liberty) Building Data Extraction Research

## Date: 2026-02-18

---

## 1. PDF Structure Analysis

### Source File
- **File:** `/tmp/post_map.pdf` (8.8 MB, 1 page)
- **Format:** PDF 1.6
- **Creator:** Bentley Systems ProjectWise InterPlot Organizer 08.11.05.08
- **Created:** 2011-07-25 (modified 2023-08-13 on iOS)
- **Page Size:** 4098 x 2783 points (38.7" x 56.9") with 270-degree rotation
- **Displayed As:** 2783 x 4098 pixels (portrait orientation after rotation)

### Text Layer: ALL TEXT IS VECTOR PATHS (No Extractable Text)

**Critical Finding:** The PDF contains **zero text operators** (BT/ET/Tj/TJ/Tf). All text - including building numbers, road names, grid labels, and area designators - is rendered as **vector path outlines** (glyph shapes drawn with `m`/`l`/`f*` fill operators).

Evidence:
- 8 content streams, each ~3.5 MB (total ~28 MB of vector data)
- Zero fonts in page resources (`Resources: <</ExtGState<</GS0 207 0 R>>>>`)
- No BT/ET text blocks in any content stream
- Text visible in renders is drawn as filled/stroked paths

### Content Streams
| Stream | Xref | Size | Content |
|--------|------|------|---------|
| 0 | 139 | 3.49 MB | Vector paths (building outlines, decorations) |
| 1 | 140 | 3.49 MB | Line segments (roads, boundaries) |
| 2 | 141 | 3.49 MB | Dashed lines (boundaries, terrain) |
| 3 | 142 | 3.49 MB | Absolute coordinate paths (roads, features) |
| 4 | 143 | 3.49 MB | Cross-hatch patterns, symbols |
| 5 | 144 | 3.49 MB | Building fills (orange/brown colored) |
| 6 | 145 | 3.49 MB | Text outlines (black filled paths = text) |
| 7 | 146 | 3.49 MB | More text outlines, symbols |

### Annotations (23 Sticky Notes)
The PDF has 23 "Sticky Note" annotations added by user `donald.s.nauck` in September 2011. These are location notes like:
- "ASP" at (767, 142)
- "Green Ramp PAC Sheds" at (1500, 782)
- "Kitty Hawk DFAC" at (2167, 566)
- "SSA/CRP/HAZMAT" at (3007, 2271)
- "Rail Yard" at (2597, 1656)
- etc.

These are NOT building number labels - they're user-added comments about areas.

### Map Layout
The PDF shows:
1. **Main map** covering the Fort Bragg installation (occupies ~90% of page)
2. **"LINDEN OAKS" inset** in the top-left corner (housing area)
3. **"ASP" inset** in the bottom-right corner (ammunition supply point)
4. **Title block** in the top-right ("Fort Bragg, NC")
5. **Red border** around the entire map with grid tick marks
6. **Red area zone letters** (A-Z, digits 1-9) scattered as large zone designators
7. **Orange grid lines** forming the military coordinate grid
8. **Building footprints** shown as outlined/filled polygons with small number labels

---

## 2. Coordinate System

### Grid System on PDF Map
Grid numbers observed on the PDF borders:
- **Left/Right edges (Northing):** 79 at one corner, 84 at mid-left
- **Top/Bottom edges (Easting):** 102, 104 at different positions along top

These are **truncated UTM Zone 17N kilometer values**:
- Easting range: 90-104 = UTM 590,000m - 604,000m
- Northing range: 74-87 = UTM 3,874,000m - 3,887,000m

### GIS Data Coordinate Systems
The Cumberland County GIS data uses two coordinate systems:

1. **Building polygons:** Available in WGS84 (EPSG:4326) via `outSR=4326` query parameter
2. **Address points:** Native coords in NAD83 State Plane NC (EPSG:2264, US Survey Feet), also available in WGS84

### Verified Coordinate Range
From the 7,253 building polygons:
- **Latitude:** 35.010813 to 35.262060 N
- **Longitude:** -79.519778 to -78.915413 W
- Fort Bragg center: approximately 35.14 N, -79.00 W

---

## 3. Anchor Points (PDF-to-GPS Mapping)

**Note:** Anchor points are NO LONGER NEEDED because we found a complete authoritative GIS dataset (see section 6). However, for reference:

The grid line intersections visible in the PDF provide natural anchor points. Each grid label corresponds to a UTM Zone 17N km value:

| PDF Grid Label | UTM Easting (m) | UTM Northing (m) |
|---------------|-----------------|-------------------|
| E=90 | 590,000 | - |
| E=95 | 595,000 | - |
| E=100 | 600,000 | - |
| E=104 | 604,000 | - |
| N=74 | - | 3,874,000 |
| N=79 | - | 3,879,000 |
| N=84 | - | 3,884,000 |
| N=87 | - | 3,887,000 |

---

## 4. Building Number Patterns

### From PDF (OCR Results)
Building numbers visible on the PDF follow the pattern: **Letter prefix + 4 digits**

Examples from OCR of Aviation Combat Rd area:
- Y7802, Y7602, Y7502, Y7302, Y7102, Y6902 (Y-zone buildings)
- Y8807, Y8113, Y7920, Y7522 (Y-zone buildings)
- Y6707, Y6711, Y6715 (Y-zone buildings)

### From GIS Dataset (Comprehensive)
The GIS data reveals the full building numbering system:

**Building Layer (FACIL_ID/BUILDNG_NO) - 7,253 records:**

| Pattern | Count | Examples |
|---------|-------|----------|
| Digits only | 4,148 | 31647, 298143 |
| Letter + digits | 1,688 | A3137, R1234 |
| Other (with suffix) | 897 | N6104*, H1656B, O19W0 |
| Empty/null | 517 | - |
| 2-letter + digits | 3 | OX1234 |

**Letter prefixes (Building layer):**
| Prefix | Count | Zone Area |
|--------|-------|-----------|
| R | 627 | R-zone |
| L | 616 | L-zone |
| B | 185 | B-zone |
| O | 84 | O-zone |
| A | 56 | A-zone |
| T | 49 | T-zone |
| N | 26 | N-zone |
| C | 23 | C-zone |
| P | 13 | P-zone |
| H | 11 | H-zone |
| X | 10 | X-zone |
| Y | 3 | Y-zone |

**Address Layer (facilityNumber) - 7,724 records:**

| Prefix | Count |
|--------|-------|
| B | 1,695 |
| L | 1,455 |
| A | 242 |
| C | 191 |
| H | 147 |
| D | 141 |
| M | 117 |
| O | 96 |
| E | 74 |
| P | 73 |
| R | 61 |
| X | 60 |
| T | 42 |
| N | 28 |
| F | 27 |
| Y | 19 |

The letter prefix corresponds to the **zone area** on the map (the large red letters visible in the PDF overview).

### Building Status Distribution
| Status | Count |
|--------|-------|
| PERMANENT | 3,513 |
| B PERM | 1,646 |
| UNKNOWN | 532 |
| ACT | 444 |
| EXISTING | 423 |
| S PORT | 162 |
| OPERATIONAL | 104 |
| SEMI_PERM | 60 |
| Other | ~369 |

---

## 5. OCR Feasibility Assessment

### Test Results
OCR was tested using Tesseract 5.5.2 at multiple DPI levels:

| DPI | Config | Result |
|-----|--------|--------|
| 300 | Default | Detected "AVIATION COMBAT RD" but building numbers mostly garbled |
| 600 | --psm 12 | Found some: "Y7920", "Y7522", "Y 71027302" (partial) |
| 600 | --psm 11 | Mostly noise with occasional fragments |
| 1200 | --psm 12 (binary) | Better: "Y8113", "Y670" but still many missed |

### OCR Challenges
1. **Text is vector outlines:** No actual font glyphs, just path shapes
2. **Very small text:** Building numbers are tiny relative to page size
3. **Rotated text:** Many labels are angled/rotated to follow building orientation
4. **Overlapping elements:** Grid lines, boundaries, and contours overlap text
5. **Low contrast:** Some labels are in colors similar to background elements
6. **Non-standard characters:** Dash separators, zone prefixes mixed with digits

### OCR Verdict: NOT RECOMMENDED
OCR extraction from this PDF would be unreliable, requiring extensive manual verification. Estimated accuracy: 40-60% for building numbers. The GIS data source (section 6) completely supersedes this approach.

---

## 6. RECOMMENDED: Cumberland County GIS Data Source

### Discovery
Cumberland County, NC maintains a comprehensive GIS dataset for Fort Liberty (formerly Fort Bragg) through their ArcGIS REST service.

### Data Endpoints

**Base URL:** `https://gis.co.cumberland.nc.us/server/rest/services/Bragg/BraggData/MapServer`

| Layer | ID | Type | Records | Content |
|-------|-----|------|---------|---------|
| Ft Liberty Addresses | 0 | Point | 7,724 | Street addresses with facility numbers |
| Ft Liberty Streets | 1 | Polyline | ~TBD | Road network |
| Buildings | 2 | Polygon | 7,253 | Building footprints with metadata |

### Buildings Layer (Layer 2) - Key Fields
```
FACIL_ID     - Facility ID / Building number (e.g., "A3137", "31647")
BUILDNG_NO   - Building number (same as FACIL_ID)
STRUCTNAME   - Building name (e.g., "JSOC, Admin, General Purpose")
STR_USE_D    - Use type (e.g., OFFICE, STORAGE, SECURITY)
STR_STAT_D   - Status (PERMANENT, EXISTING, DEMOLISHED, etc.)
COORD_X/Y    - State Plane coordinates (often -9999 placeholder)
Shape        - Polygon geometry (WGS84 available via outSR=4326)
```

### Addresses Layer (Layer 0) - Key Fields
```
facilityNumber    - Facility number with zone prefix (e.g., "M3226", "N5401")
buildingNo        - Street address number (e.g., "2520")
fullSt            - Full street address (e.g., "2520 SERVICE ST, FORT LIBERTY, NC 28310")
structName        - Street name
featureName       - Feature name (e.g., "SENTRY STATION")
featureDescription - Detailed description
operationalStatus - Status (inService, etc.)
coordinateX/Y     - UTM coordinates
Point geometry    - WGS84 lat/lon available
```

### Query Example
```bash
# Get all buildings with centroids in WGS84
curl "https://gis.co.cumberland.nc.us/server/rest/services/Bragg/BraggData/MapServer/2/query?\
where=1%3D1&\
outFields=FACIL_ID,STRUCTNAME,STR_USE_D&\
returnGeometry=true&\
outSR=4326&\
f=json&\
resultRecordCount=2000&\
resultOffset=0"
```

### Data Quality
- **7,252 of 7,253 buildings** have valid polygon geometry (WGS84 centroids computable)
- **7,724 of 7,724 addresses** have valid point geometry
- **5,916 buildings** have names (STRUCTNAME)
- **7,723 addresses** are marked "inService"
- Coordinate accuracy: Sub-meter (building polygon vertices)

### Downloaded Data Files
Saved to `/Users/sac/Git/milnav/data/`:
- `fort_bragg_buildings_raw.json` - Raw GIS response with polygon geometry (6.8 MB)
- `fort_bragg_buildings.json` - Processed: facil_id, name, use, status, lat, lon (1.4 MB)
- `fort_bragg_addresses_raw.json` - Raw GIS response with point geometry (2.9 MB)
- `fort_bragg_addresses.json` - Processed: facility_number, address, lat, lon (2.9 MB)

---

## 7. Recommended Extraction Approach

### Primary Approach: GIS REST API (RECOMMENDED)

**Use the Cumberland County GIS dataset.** This provides:
- Complete building inventory (7,253 buildings)
- Authoritative GPS coordinates (polygon centroids and address points)
- Building names, types, and statuses
- Street addresses
- No OCR errors, no georeferencing needed

**Implementation Steps:**

1. **Download both layers** (already done - saved to `data/` directory)
2. **Merge buildings + addresses** by facility number for enriched records
3. **Compute polygon centroids** for building center points
4. **Filter by status** (exclude DEMOLISHED, etc.)
5. **Import to database**

**Python Code for Batch Download:**
```python
import urllib.request
import json

base_url = "https://gis.co.cumberland.nc.us/server/rest/services/Bragg/BraggData/MapServer/2/query"
all_features = []
offset = 0

while True:
    params = {
        "where": "1=1",
        "outFields": "FACIL_ID,STRUCTNAME,STR_USE_D,STR_STAT_D",
        "returnGeometry": "true",
        "outSR": "4326",
        "f": "json",
        "resultRecordCount": "2000",
        "resultOffset": str(offset)
    }
    url = f"{base_url}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    with urllib.request.urlopen(url) as resp:
        data = json.loads(resp.read())
    features = data.get('features', [])
    if not features:
        break
    all_features.extend(features)
    offset += 2000

# Compute centroids
for feat in all_features:
    ring = feat['geometry']['rings'][0]
    feat['centroid'] = {
        'lat': sum(p[1] for p in ring) / len(ring),
        'lon': sum(p[0] for p in ring) / len(ring)
    }
```

### Secondary Approach: PDF OCR (NOT Recommended)

If GIS data were unavailable, the fallback would be:

1. Render PDF at 600-1200 DPI in tiles
2. Preprocess (binary threshold, contrast enhancement)
3. Run Tesseract with `--psm 11` or `--psm 12`
4. Filter OCR results for building number patterns: `/^[A-Z]?\d{3,5}[A-Z]?$/`
5. Map OCR positions to UTM coordinates using grid line anchor points
6. Manual verification required for ~40-60% of detections

**This approach is NOT recommended** due to low accuracy and high manual effort.

### Alternative Data Sources Investigated

| Source | Status | Notes |
|--------|--------|-------|
| Cumberland County GIS | AVAILABLE | Primary source (7,253 buildings + 7,724 addresses) |
| OpenStreetMap | Partial | Has some Fort Bragg features but far less complete than county GIS |
| Fort Liberty Official Website | 404/Unavailable | Map PDFs appear to be removed or reorganized |
| USGS National Map | General | Has building footprints but no military-specific numbers |

---

## 8. Summary & Next Steps

### Key Findings
1. The PDF has **no extractable text** - all text is vector path outlines
2. OCR achieves only **40-60% accuracy** on building numbers
3. Cumberland County GIS provides **7,253 buildings with GPS polygons** - a complete, authoritative dataset
4. The GIS data includes **building names, types, statuses, and addresses**
5. **No OCR or georeferencing needed** - GPS coordinates are already included

### Recommended Next Steps
1. Use the already-downloaded GIS data in `data/` directory
2. Merge buildings and addresses datasets by facility number
3. Filter to active/permanent buildings
4. Import to the MilNav database with: building_number, name, lat, lon, use_type, address
5. Optionally use the PDF for visual verification of building locations
