import { redirect } from 'react-router'

const COOKIE_NAME = 'cpl_admin_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

interface CloudflareContext {
  cloudflare: {
    env: {
      ADMIN_PASSWORD?: string
    }
  }
}

/**
 * Verify the provided password against the ADMIN_PASSWORD env var
 */
export function verifyPassword(context: CloudflareContext, password: string): boolean {
  const adminPassword = context.cloudflare.env.ADMIN_PASSWORD
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD env var not set')
    return false
  }
  return password === adminPassword
}

/**
 * Create a simple auth cookie value (base64 encoded timestamp + signature)
 * For MVP, we just use a base64 encoded JSON with a timestamp
 */
export function createAuthCookie(): string {
  const payload = {
    authenticated: true,
    timestamp: Date.now(),
  }
  return btoa(JSON.stringify(payload))
}

/**
 * Verify the auth cookie is valid
 */
export function verifyAuthCookie(cookieValue: string | null): boolean {
  if (!cookieValue) return false

  try {
    const payload = JSON.parse(atob(cookieValue))
    if (!payload.authenticated) return false

    // Check if cookie is expired (7 days)
    const age = Date.now() - payload.timestamp
    const maxAge = COOKIE_MAX_AGE * 1000 // convert to ms
    if (age > maxAge) return false

    return true
  } catch {
    return false
  }
}

/**
 * Parse cookies from a request
 */
export function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) return {}

  const cookies: Record<string, string> = {}
  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.split('=')
    const value = rest.join('=')
    if (name && value) {
      cookies[name.trim()] = decodeURIComponent(value.trim())
    }
  })
  return cookies
}

/**
 * Get the admin auth cookie from request
 */
export function getAuthCookie(request: Request): string | null {
  const cookies = parseCookies(request)
  return cookies[COOKIE_NAME] || null
}

/**
 * Check if the request is authenticated as admin
 */
export function isAuthenticated(request: Request): boolean {
  const cookie = getAuthCookie(request)
  return verifyAuthCookie(cookie)
}

/**
 * Build the Set-Cookie header for admin session
 */
export function buildSetCookieHeader(value: string): string {
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`
}

/**
 * Build the Set-Cookie header to clear the admin session
 */
export function buildClearCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=0`
}

/**
 * Require admin authentication - throws redirect to login if not authenticated
 */
export function requireAdmin(request: Request): void {
  if (!isAuthenticated(request)) {
    throw redirect('/admin/login')
  }
}
