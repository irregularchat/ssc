import { toPoint } from 'mgrs'

/**
 * Check if a string looks like an MGRS coordinate.
 * MGRS format: 2-digit zone + 1 letter band + 2 letters 100km square + even-digit easting/northing
 * Examples: 17SPU8341291718, 17S PU 83412 91718, 17SPU83419171
 */
export function isMGRS(input: string): boolean {
  // Strip spaces and uppercase
  const cleaned = input.replace(/\s+/g, '').toUpperCase()
  // Pattern: 1-2 digit zone, 1 letter band (C-X excl I/O), 2 letter 100km square, even digits (2-10)
  return /^\d{1,2}[C-HJ-NP-X][A-HJ-NP-Z][A-HJ-NP-V]\d{2,10}$/.test(cleaned)
}

/**
 * Decode an MGRS string to latitude/longitude.
 * Returns null if the MGRS string is invalid.
 */
export function decodeMGRS(input: string): { latitude: number; longitude: number } | null {
  try {
    const cleaned = input.replace(/\s+/g, '').toUpperCase()
    const [longitude, latitude] = toPoint(cleaned)
    if (isNaN(latitude) || isNaN(longitude)) return null
    return { latitude, longitude }
  } catch {
    return null
  }
}
