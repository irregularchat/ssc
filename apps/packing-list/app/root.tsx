import type { LinksFunction, LoaderFunctionArgs } from 'react-router'
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from 'react-router'
import stylesheet from './app.css?url'
import { LocationProvider, getLocationFromCookie } from '~/lib/location'
import { getDB, getBases } from '~/lib/db.server'
import type { Base } from '~/types/database'

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap' },
  { rel: 'stylesheet', href: stylesheet },
]

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const bases = await getBases(db)

  // Read selected base from cookie
  const cookieHeader = request.headers.get('Cookie')
  const selectedBaseId = getLocationFromCookie(cookieHeader)

  return { bases, selectedBaseId }
}

export default function App() {
  const { bases, selectedBaseId } = useLoaderData<{ bases: Base[]; selectedBaseId: number | null }>()

  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-bg text-text-primary antialiased">
        <LocationProvider bases={bases} initialBaseId={selectedBaseId}>
          <Outlet />
        </LocationProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
