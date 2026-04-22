import type { LinksFunction } from 'react-router'
import { Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse, useRouteError } from 'react-router'
import stylesheet from './app.css?url'

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap',
  },
  { rel: 'stylesheet', href: stylesheet },
]

export default function Root() {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Speech Memorization — SSC</title>
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-bg text-text-primary antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-text-primary focus:text-text-inverse focus:rounded-lg">
          Skip to content
        </a>
        <main id="main-content">
          <Outlet />
        </main>
        <noscript>
          <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui' }}>
            <h1>Speech Memorization</h1>
            <p>This app requires JavaScript to run. Please enable JavaScript in your browser.</p>
          </div>
        </noscript>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  const is404 = isRouteErrorResponse(error) && error.status === 404

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0b', color: '#fafafa', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#71717a', marginBottom: '1rem' }}>{is404 ? '404' : 'Error'}</div>
        <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{is404 ? 'Page Not Found' : 'Something Went Wrong'}</h1>
        <p style={{ color: '#71717a', marginBottom: '1.5rem' }}>
          {is404 ? "This page doesn't exist." : 'Please try refreshing the page.'}
        </p>
        <a href="/" style={{ color: '#8b5cf6', textDecoration: 'underline' }}>Go Home</a>
      </div>
    </div>
  )
}
