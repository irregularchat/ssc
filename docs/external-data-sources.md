# MilNav — External Data Sources Research

**Date:** 2026-02-18
**Scope:** Fort Bragg / Fort Liberty, NC — building location data alternatives to PDF extraction

---

## Problem

MilNav needs building number → GPS coordinate data for Fort Bragg, NC (officially renamed back from Fort Liberty in 2025). The current assumption is that this data must be extracted from PDF installation maps. This document evaluates whether official or public geospatial data sources can supplement or replace that manual PDF extraction process.

**Key data requirements for each building record:**
- Building number (e.g., "4-2274", "C-6837") — primary search key
- GPS coordinates (latitude, longitude)
- Optional: building name, category, street address

---

## Local Context

- **Database schema:** `/Users/sac/Git/milnav/migrations/0001_initial_schema.sql` — `buildings` table requires `building_number`, `latitude`, `longitude`; `source` field distinguishes `official`, `community`, `import`
- **Project goal:** Multi-installation support starting with Fort Bragg
- **Current data:** None — database is empty, seeded only with the Fort Bragg installation metadata (lat: 35.1390, lng: -79.0064)
- **Design doc:** `/Users/sac/Git/milnav/docs/plans/2026-02-18-milnav-design.md`

---

## Source-by-Source Findings

---

### 1. Army Installation GIS / DISDI Program

**Verdict: Restricted — requires DoD CAC/PKI credentials**

The Defense Installations Spatial Data Infrastructure (DISDI) program is the authoritative source for Army building-level GIS data. Its key product relevant to MilNav is the **Common Installation Picture (CIP)** — a set of required geospatial data layers including building footprints, road networks, utilities, and environmental features.

| Attribute | Detail |
|-----------|--------|
| URL | https://www.acq.osd.mil/eie/imr/rpid/disdi/index.html |
| Portal | https://rsgisias.crrel.usace.army.mil/disdiportal/ (CAC required) |
| Format | Shapefile, GeoJSON via ArcGIS REST API |
| Building numbers | Yes — CIP includes building footprints with RPUID (Real Property Unique Identifier) which maps to building numbers |
| Public access | No — NIPRNET + CAC/PKI authentication required |
| Licensing | DoD internal use |

The CIP is available to all `.mil` domain users via NIPRNET, hosted by USACE as CorpsMap. There is no public download. If a team member holds a `.mil` account or CAC, they may be able to export Fort Bragg building data from the DISDI Portal.

The separate **MIRTA** (Military Installations, Ranges, and Training Areas) dataset IS public, but contains only installation boundary polygons — not individual building locations.

**References:**
- DISDI Program: https://www.acq.osd.mil/eie/imr/rpid/disdi/index.html
- DISDI Handout (PDF): https://www.acq.osd.mil/eie/imr/rpid/disdi/Downloads/DISDI_Handout.pdf
- Army Geospatial Center: https://www.agc.army.mil/

---

### 2. HIFLD Open Data (Homeland Infrastructure Foundation-Level Data)

**Verdict: Deactivated — no building-level data was ever public**

HIFLD Open published the MIRTA dataset (installation boundaries), not individual building footprints. The HIFLD Open GIS repository was **deactivated on August 26, 2025**. Its data is now only available via HIFLD Secure, which requires a DHS GII account and an approved Data Use Agreement (DUA).

| Attribute | Detail |
|-----------|--------|
| URL (archived) | https://hifld-geoplatform.hub.arcgis.com/ |
| Status | Deactivated August 26, 2025 |
| What was public | MIRTA: installation/base boundary polygons only |
| Building numbers | No |
| Public access | No longer available |
| Secure version | https://gii.dhs.gov/hifld/data/secure (requires DUA) |

Even before deactivation, HIFLD Open did not publish building-level data for military installations. The MIRTA boundary polygons are still available via data.gov as a historical dataset but contain no building point/footprint data.

**References:**
- HIFLD Open (archived): https://hifld-geoplatform.hub.arcgis.com/pages/hifld-open
- DHS HIFLD: https://www.dhs.gov/gmo/hifld
- MIRTA on ArcGIS Hub: https://hifld-geoplatform.hub.arcgis.com/datasets/geoplatform::military-installations-ranges-and-training-areas-mirta-dod-sites-boundaries/explore
- data.gov MIRTA: https://catalog.data.gov/dataset/military-installations-ranges-and-training-areas

---

### 3. OpenStreetMap (OSM) / Overpass API

**Verdict: Partial coverage — footprints may exist but building numbers are sparse**

OpenStreetMap uses `landuse=military`, `military=base`, and `military=barracks` tags for military areas. Individual buildings within Fort Bragg may be mapped as closed ways (polygons) with `building=yes`. However, OSM mapping quality for military installations is uneven — contributors often cannot access restricted areas to survey buildings.

The `ref` tag in OSM is the standard for building numbers, but military buildings are rarely tagged with their official Army building numbers due to access restrictions. OSM mapping of Fort Bragg was present as of 2024 but building-number tagging was not confirmed.

| Attribute | Detail |
|-----------|--------|
| Overpass API | https://overpass-api.de/ |
| Query tool | https://overpass-turbo.eu/ |
| Format | GeoJSON, XML, CSV (via Overpass) |
| Building footprints | Possibly — depends on volunteer mapping effort |
| Building numbers | Unlikely — `ref` tags rarely present for military buildings |
| License | ODbL (Open Database License) — permissive, attribution required |

**Sample Overpass query to test Fort Bragg coverage:**
```
[out:json][timeout:25];
(
  way["building"]["military"](35.0800,-79.1200,35.2000,-78.8500);
  way["building"](area["name"="Fort Bragg"]);
);
out body;
>;
out skel qt;
```

Run at: https://overpass-turbo.eu/

**Assessment:** OSM is worth querying to establish a baseline of footprint geometry, but building numbers will almost certainly be missing. Footprints could be used to verify/correct coordinates from other sources, not as a primary building-number data source.

**References:**
- OSM Military tagging: https://wiki.openstreetmap.org/wiki/Key:military
- Overpass API: https://wiki.openstreetmap.org/wiki/Overpass_API
- OSM Buildings for North America (ArcGIS): https://hub.arcgis.com/maps/openstreetmap::openstreetmap-buildings-for-north-america-1

---

### 4. USGS National Map / Microsoft Building Footprints

**Verdict: Footprints only — no building numbers**

Two sources provide ML-derived building footprint polygons for Fort Bragg's geographic area:

**USGS Rasterized Building Footprints:**
- URL: https://data.usgs.gov/datacatalog/data/USGS:5e432002e4b0edb47be84652
- Format: Raster (GeoTIFF) — not useful for point lookup
- Building numbers: No
- Coverage: CONUS including Fort Bragg area

**Microsoft US Building Footprints:**
- URL: https://github.com/microsoft/USBuildingFootprints
- Format: GeoJSON (by state — North Carolina available)
- Building numbers: No — computer-vision derived, no semantic labels
- License: ODbL
- Last updated: 2022 (Maxar/Vexcel imagery)
- Coverage: ~130M buildings across all 50 states

| Source | Format | Building Numbers | License | Useful for MilNav |
|--------|--------|-----------------|---------|-------------------|
| USGS National Map | Raster GeoTIFF | No | Public Domain | No |
| Microsoft Building Footprints | GeoJSON | No | ODbL | Geometry only |

Microsoft footprints could provide building polygon centroids for Fort Bragg, which could be cross-referenced against known building numbers. However, this requires a mapping step (manual or ML) to assign the Army building number to each footprint polygon — defeating the purpose of avoiding manual work.

**References:**
- Microsoft US Building Footprints: https://github.com/microsoft/USBuildingFootprints
- USGS Building Footprints: https://www.sciencebase.gov/catalog/item/5d27a8dfe4b0941bde650fc7

---

### 5. Fort Bragg / Fort Liberty Official Website

**Verdict: PDF maps only — no structured/machine-readable building directory**

The official Army website for Fort Liberty (formerly Fort Bragg) is at `home.army.mil/liberty`. An FY23 flat map PDF was located:

- **URL:** `https://home.army.mil/liberty/application/files/4717/0231/1951/Final_Approved_Fort_Liberty_Flat_Maps_FY23_002.pdf` (returns 404 as of Feb 2026)
- **Format:** PDF (static map image)
- **Building numbers:** Yes — PDF maps show building numbers on base map
- **Machine-readable:** No

The installation website does not provide a searchable online building directory. The `military.com` base directory for Fort Bragg lists facilities by service name and street address, not building number. MilitaryINSTALLATIONS (militaryonesource.mil) provides facility contact info but no building-number-to-coordinate lookup.

There is also a fire station dataset at `fdmaps.com/fort-bragg-2/` which provides 10 fire station building numbers with GPS coordinates — a very small but verified subset of buildings.

| Resource | URL | Building Numbers | Machine-Readable |
|----------|-----|-----------------|-----------------|
| Fort Liberty official site | https://home.army.mil/liberty | Yes (in PDFs) | No |
| military.com base directory | https://www.military.com/base-guide/fort-bragg/base-directory | No (facility names only) | Partial |
| MilitaryONE Source | https://installations.militaryonesource.mil/military-installation/fort-liberty | No | No |
| FD Maps (fire stations only) | https://fdmaps.com/fort-bragg-2/ | Yes (10 stations) | Yes (HTML) |
| Fort Liberty ArcGIS Web App | https://asis.maps.arcgis.com/apps/webappviewer/index.html?id=7710f24d1fbf41d59e5158d8ab00922a | Unknown | Via ArcGIS API |

**References:**
- Fort Liberty MilitaryONE Source: https://installations.militaryonesource.mil/military-installation/fort-liberty
- FD Maps Fort Bragg fire stations: https://fdmaps.com/fort-bragg-2/

---

### 6. Google Maps / Google Places API

**Verdict: Some buildings indexed, not comprehensive, requires paid API**

Google Maps does index some Fort Bragg buildings by name (e.g., "Gavin Hall", "Pope Field"), and a limited number appear to have building number references in their names. However:

- Google Places API is paid ($17/1000 requests for Nearby Search)
- No systematic coverage of all buildings on post
- Building numbers are not a consistent search key in Google's data model
- Military installation buildings are often intentionally limited in Google's index

A Google Maps search URL was found: `https://www.google.com/maps/search/?api=1&query=Building+4-2070+Military+Only,Fort+Bragg,NC,US,28307+ENTERPRISE` — indicating some building numbers do appear in Google's data, likely from user contributions or Army data feeds. This is anecdotal, not a reliable programmatic source.

**Assessment:** Not viable as a bulk data source. May be useful to verify individual coordinates.

---

### 7. North Carolina County GIS / NC OneMap

**Verdict: County parcel data exists but excludes federal land**

Fort Bragg spans Cumberland and Hoke Counties. Both counties maintain GIS portals:

| Resource | URL | Notes |
|----------|-----|-------|
| Cumberland County Open Data | https://opendata.co.cumberland.nc.us/ | County parcels, possibly includes some base data |
| Hoke County GIS | https://maps.hokecounty.org/maps/ | Local GIS mapping portal |
| NC OneMap | https://www.nconemap.gov/ | Statewide parcel and GIS data |
| NCSU GIS Data Archive (Cumberland) | https://www.lib.ncsu.edu/gis/counties/codata.php?co=37051 | Historical GIS downloads |

**Critical limitation:** Federal land (military installations) is typically excluded from county parcel databases. County assessors do not assess federal property. County GIS layers will show the installation boundary as a single federal parcel, not individual buildings with building numbers.

NC OneMap may have building footprint layers derived from lidar or imagery, but these would have the same problem as Microsoft footprints — no building numbers.

**Assessment:** Low value for building-number lookup. County GIS is appropriate for surrounding area context but not for on-post building data.

**References:**
- Cumberland County Open Data: https://opendata.co.cumberland.nc.us/
- NC OneMap: https://www.nconemap.gov/

---

## Summary Comparison Table

| Source | Public? | Has Building Numbers? | Format | Viable? |
|--------|---------|----------------------|--------|---------|
| DISDI / Army CIP | No (CAC required) | Yes | Shapefile/GeoJSON | Only if DoD account available |
| HIFLD Open | Deactivated Aug 2025 | No (boundaries only) | Was GeoJSON | No |
| OpenStreetMap / Overpass | Yes | Rarely | GeoJSON | Footprints only |
| Microsoft Building Footprints | Yes | No | GeoJSON | Geometry reference only |
| USGS National Map | Yes | No | Raster | No |
| Fort Liberty official website | Yes | Yes (PDF only) | PDF | PDF extraction required |
| Google Maps / Places API | Paid | Partial | API | Not bulk-viable |
| NC County GIS | Yes | No (federal excluded) | Shapefile | No |
| FD Maps fire stations | Yes | Yes (10 buildings) | HTML | Tiny dataset, seed use only |

---

## Recommendations

1. **PDF extraction remains the primary path.** No public machine-readable source provides Fort Bragg building numbers with coordinates. The Army FY23 flat maps (and any updated versions) are the highest-fidelity source. Priority: extract these systematically.

2. **OSM as a cross-reference.** Query Overpass API for building polygons within Fort Bragg's bounding box. Use polygon centroids to cross-reference coordinates from PDF extraction — not as a number source, but as a geometry sanity check.

3. **Seed from FD Maps fire station data.** 10 verified building-number + coordinate pairs are available from `fdmaps.com/fort-bragg-2/`. These can be imported immediately as `source = 'official'` records and serve as known-good anchors for coordinate validation.

4. **Pursue DISDI access if a DoD contact is available.** The CIP contains exactly the data MilNav needs, fully structured with building numbers. A single export from a CAC-authenticated user at Fort Bragg DPW would provide hundreds or thousands of records. This is the highest-ROI path if access can be obtained.

5. **Community submissions as the long-term gap filler.** Given the access restrictions on official data, the moderated submission pipeline (`/api/submissions`) is the correct long-term strategy. Military community forums (Reddit r/army, Facebook groups for Fort Bragg units) are likely sources for a launch push.

6. **Microsoft Building Footprints as import geometry aid.** Download the North Carolina GeoJSON, clip to Fort Bragg bounding box (35.08°N to 35.20°N, -79.12°W to -78.85°W), compute polygon centroids. These centroids can be displayed as candidate pins in the submission UI to help contributors place buildings more accurately.

---

## Next Steps

| Priority | Action | Owner |
|----------|--------|-------|
| High | Download current Fort Liberty PDF flat maps from `home.army.mil/liberty` and extract building numbers + coordinates | Data team |
| High | Scrape FD Maps fire station data (10 buildings) and import as seed records | Engineering |
| Medium | Run Overpass query for Fort Bragg building polygons; compute centroids as geometry reference | Engineering |
| Medium | Download Microsoft Building Footprints for NC; clip to Fort Bragg bbox; integrate into submission UI as pin suggestions | Engineering |
| Low | Identify a DoD contact with CAC access to request CIP export from DISDI | Product/Community |
| Low | Post to r/army and Fort Bragg Facebook groups to recruit launch contributors | Marketing |

---

## Appendix: Key Bounding Box for Fort Bragg

For any spatial queries, use this approximate bounding box:
```
North:  35.200°N
South:  35.080°N
East:  -78.850°W
West:  -79.120°W
```

Overpass API query template:
```
[out:json][timeout:60];
(
  way["building"](35.080,-79.120,35.200,-78.850);
  node["building"](35.080,-79.120,35.200,-78.850);
);
out body;
>;
out skel qt;
```

---

## Source List

| ID | Title | URL |
|----|-------|-----|
| S1 | DISDI Program — DoD Installation GIS | https://www.acq.osd.mil/eie/imr/rpid/disdi/index.html |
| S2 | DISDI Handout (PDF) | https://www.acq.osd.mil/eie/imr/rpid/disdi/Downloads/DISDI_Handout.pdf |
| S3 | HIFLD Open (archived) | https://hifld-geoplatform.hub.arcgis.com/pages/hifld-open |
| S4 | DHS HIFLD Program | https://www.dhs.gov/gmo/hifld |
| S5 | MIRTA Dataset on ArcGIS Hub | https://hifld-geoplatform.hub.arcgis.com/datasets/geoplatform::military-installations-ranges-and-training-areas-mirta-dod-sites-boundaries/explore |
| S6 | MIRTA on data.gov | https://catalog.data.gov/dataset/military-installations-ranges-and-training-areas |
| S7 | OSM Military Tagging Wiki | https://wiki.openstreetmap.org/wiki/Key:military |
| S8 | Overpass API | https://wiki.openstreetmap.org/wiki/Overpass_API |
| S9 | Overpass Turbo (query tool) | https://overpass-turbo.eu/ |
| S10 | Microsoft US Building Footprints (GitHub) | https://github.com/microsoft/USBuildingFootprints |
| S11 | USGS Building Footprints (ScienceBase) | https://www.sciencebase.gov/catalog/item/5d27a8dfe4b0941bde650fc7 |
| S12 | Fort Liberty — MilitaryONE Source | https://installations.militaryonesource.mil/military-installation/fort-liberty |
| S13 | FD Maps — Fort Bragg Fire Stations | https://fdmaps.com/fort-bragg-2/ |
| S14 | military.com — Fort Bragg Base Directory | https://www.military.com/base-guide/fort-bragg/base-directory |
| S15 | Fort Liberty ArcGIS Web App | https://asis.maps.arcgis.com/apps/webappviewer/index.html?id=7710f24d1fbf41d59e5158d8ab00922a |
| S16 | Cumberland County Open Data | https://opendata.co.cumberland.nc.us/ |
| S17 | NC OneMap | https://www.nconemap.gov/ |
| S18 | Army Geospatial Center | https://www.agc.army.mil/ |
| S19 | OSM Buildings for North America (ArcGIS) | https://hub.arcgis.com/maps/openstreetmap::openstreetmap-buildings-for-north-america-1 |
