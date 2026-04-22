/**
 * Validate that a POST/PUT/DELETE request comes from the same origin.
 * Checks Origin header first, falls back to Referer.
 * Returns null if valid, error message if invalid.
 */
export function validateOrigin(request: Request): string | null {
  if (request.method === 'GET' || request.method === 'HEAD') return null

  const origin = request.headers.get('Origin')
  const referer = request.headers.get('Referer')
  const url = new URL(request.url)
  const expectedOrigin = url.origin

  if (origin) {
    return origin === expectedOrigin ? null : 'Invalid request origin'
  }

  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin
      return refererOrigin === expectedOrigin ? null : 'Invalid request origin'
    } catch {
      return 'Invalid referer'
    }
  }

  // No Origin or Referer — could be a direct form submission without headers
  // Allow it since SameSite=Lax cookies already block most cross-site POSTs
  return null
}
