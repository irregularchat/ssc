/**
 * Test MGRS conversion on known coordinates before batch processing.
 * CRITICAL: mgrs.forward() takes [longitude, latitude] — NOT lat/lng!
 */
import pkg from 'mgrs'
const { forward } = pkg

// Test cases: [description, latitude, longitude, expected_mgrs_prefix]
const tests = [
  ['Fort Bragg center', 35.1390, -79.0064, '17SPU'],
  ['User-provided coordinate', 35.151668, -78.986453, '17SPU'],
  // Sample buildings from D1
  ['Bldg A3137', 35.148968, -79.0290058, '17SPU'],
  ['Bldg A2217', 35.1463925, -79.0335663, '17SPU'],
  ['Bldg 31647', 35.1632193, -79.0040396, '17SPU'],
  ['Bldg A4406', 35.1498711, -79.0372271, '17SPU'],
  ['Bldg A6481', 35.1575193, -79.0210045, '17SPU'],
]

console.log('MGRS Conversion Test Results')
console.log('=' .repeat(70))
console.log()

let allPassed = true

for (const [desc, lat, lng, expectedPrefix] of tests) {
  // CRITICAL: forward() takes [longitude, latitude] order!
  const mgrs = forward([lng, lat], 5) // 5 = 1m precision (10-digit)
  const passed = mgrs.startsWith(expectedPrefix)
  const status = passed ? '✅' : '❌'

  if (!passed) allPassed = false

  console.log(`${status} ${desc}`)
  console.log(`   Lat/Lng: ${lat}, ${lng}`)
  console.log(`   MGRS:    ${mgrs}`)
  console.log(`   Expected prefix: ${expectedPrefix} — ${passed ? 'MATCH' : 'MISMATCH'}`)
  console.log()
}

console.log('=' .repeat(70))
console.log(allPassed ? '✅ All tests passed!' : '❌ Some tests FAILED!')

// Also test edge cases
console.log('\n--- Precision levels ---')
const testCoord = [-79.0064, 35.1390] // [lng, lat]
for (let precision = 1; precision <= 5; precision++) {
  const mgrs = forward(testCoord, precision)
  const res = ['100km', '10km', '1km', '100m', '10m', '1m']
  console.log(`  Precision ${precision} (~${res[precision]}): ${mgrs}`)
}
