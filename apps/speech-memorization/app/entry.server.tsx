import type { EntryContext } from 'react-router'
import { ServerRouter } from 'react-router'
import { renderToString } from 'react-dom/server'

// Required by React Router 7 build even with ssr: false
export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  const html = renderToString(
    <ServerRouter context={routerContext} url={request.url} />
  )

  responseHeaders.set('Content-Type', 'text/html')
  return new Response(`<!DOCTYPE html>${html}`, {
    status: responseStatusCode,
    headers: responseHeaders,
  })
}
