import { redirect } from 'react-router'

const COOKIE_NAME = 'cpl_admin_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

interface CloudflareContext {
  cloudflare: {
    env: {
      ADMIN_PASSWORD?: string
      COOKIE_SECRET?: string
    }
  }
}

/**
 * Derive a signing key from a secret string using HMAC-SHA256
 */
async function getSigningKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

/**
 * Sign a payload with HMAC-SHA256
 */
async function sign(payload: string, secret: string): Promise<string> {
  const key = await getSigningKey(secret)
  const encoder = new TextEncoder()
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  const sigHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return `${btoa(payload)}.${sigHex}`
}

/**
 * Verify a signed cookie value. Returns the payload if valid, null otherwise.
 */
async function verify(cookieValue: string, secret: string): Promise<string | null> {
  const parts = cookieValue.split('.')
  if (parts.length !== 2) return null

  const [encodedPayload, sigHex] = parts
  try {
    const payload = atob(encodedPayload)
    const key = await getSigningKey(secret)
    const encoder = new TextEncoder()
    const sigBytes = new Uint8Array(sigHex.match(/.{2}/g)!.map(b => parseInt(b, 16)))
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payload))
    return valid ? payload : null
  } catch {
    return null
  }
}

/**
 * Timing-safe password comparison using HMAC
 */
async function timingSafeCompare(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)

  // Use HMAC to compare — both inputs go through the same hash
  // This is timing-safe because crypto.subtle operations are constant-time
  const key = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(32), // dummy key
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const aHash = new Uint8Array(await crypto.subtle.sign('HMAC', key, aBytes))
  const bHash = new Uint8Array(await crypto.subtle.sign('HMAC', key, bBytes))

  if (aHash.length !== bHash.length) return false
  let result = 0
  for (let i = 0; i < aHash.length; i++) {
    result |= aHash[i] ^ bHash[i]
  }
  return result === 0
}

/**
 * Verify password against ADMIN_PASSWORD env var (timing-safe)
 */
export async function verifyPassword(context: CloudflareContext, password: string): Promise<boolean> {
  const adminPassword = context.cloudflare.env.ADMIN_PASSWORD
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD env var not set')
    return false
  }
  return timingSafeCompare(password, adminPassword)
}

/**
 * Create a signed auth cookie
 */
export async function createAuthCookie(context: CloudflareContext): Promise<string> {
  const secret = context.cloudflare.env.COOKIE_SECRET || context.cloudflare.env.ADMIN_PASSWORD || 'fallback-dev-secret'
  const payload = JSON.stringify({
    authenticated: true,
    timestamp: Date.now(),
  })
  return sign(payload, secret)
}

/**
 * Verify the auth cookie is valid and not expired
 */
export async function verifyAuthCookie(cookieValue: string | null, context: CloudflareContext): Promise<boolean> {
  if (!cookieValue) return false

  const secret = context.cloudflare.env.COOKIE_SECRET || context.cloudflare.env.ADMIN_PASSWORD || 'fallback-dev-secret'

  try {
    const payload = await verify(cookieValue, secret)
    if (!payload) return false

    const data = JSON.parse(payload)
    if (!data.authenticated) return false

    // Check expiration
    const age = Date.now() - data.timestamp
    const maxAge = COOKIE_MAX_AGE * 1000
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
export async function isAuthenticated(request: Request, context: CloudflareContext): Promise<boolean> {
  const cookie = getAuthCookie(request)
  return verifyAuthCookie(cookie, context)
}

/**
 * Build the Set-Cookie header for admin session
 */
export function buildSetCookieHeader(value: string): string {
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/admin; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`
}

/**
 * Build the Set-Cookie header to clear the admin session
 */
export function buildClearCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/admin; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

/**
 * Require admin authentication - throws redirect to login if not authenticated
 */
export async function requireAdmin(request: Request, context: CloudflareContext): Promise<void> {
  if (!(await isAuthenticated(request, context))) {
    throw redirect('/admin/login')
  }
}
