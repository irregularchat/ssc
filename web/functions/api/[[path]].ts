/**
 * API Proxy — forwards /api/* requests to the MilNav Worker backend.
 */

const WORKER_URL = 'https://milnav.wemea-5ahhf.workers.dev'

async function handleRequest(context: EventContext<unknown, string, unknown>): Promise<Response> {
  const { request, params, next } = context

  const pathSegments = params.path as string[]
  const path = pathSegments ? pathSegments.join('/') : ''
  if (!path) return next()

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  const url = new URL(request.url)
  const workerUrl = `${WORKER_URL}/api/${path}${url.search}`

  const headers = new Headers()
  for (const name of ['content-type', 'accept', 'user-agent']) {
    const val = request.headers.get(name)
    if (val) headers.set(name, val)
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  }

  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = request.body
    ;(init as any).duplex = 'half'
  }

  const response = await fetch(workerUrl, init)
  const responseHeaders = new Headers(response.headers)
  if (!responseHeaders.has('Access-Control-Allow-Origin')) {
    responseHeaders.set('Access-Control-Allow-Origin', '*')
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}

export const onRequest: PagesFunction = handleRequest
