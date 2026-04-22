import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { Link, useLoaderData } from 'react-router'
import { Store as StoreIcon, MapPin, Phone, Globe, ArrowLeft, Shield } from 'lucide-react'
import { Layout } from '~/components/layout'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { EmptyState } from '~/components/ui/empty-state'
import { getDB, getStores } from '~/lib/db.server'
import { useLocation } from '~/lib/location'
import type { Store } from '~/types/database'

export async function loader({ context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const stores = await getStores(db)
  return { stores }
}

export const meta: MetaFunction = () => {
  return [
    { title: 'Stores - CPL' },
    { name: 'description', content: 'Find stores near you with military gear and supplies.' },
  ]
}

export default function StoresPage() {
  const { stores } = useLoaderData<{ stores: Store[] }>()
  const { selectedBase } = useLocation()

  // Filter stores by selected location
  const filteredStores = selectedBase
    ? stores.filter((store) => store.base_id === selectedBase.id)
    : stores

  // Sort: stores with the selected base first, then others
  const sortedStores = selectedBase
    ? [...filteredStores].sort((a, b) => {
        if (a.base_id === selectedBase.id && b.base_id !== selectedBase.id) return -1
        if (a.base_id !== selectedBase.id && b.base_id === selectedBase.id) return 1
        return 0
      })
    : stores

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-20 md:pb-0">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} />
              Back
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary mb-2">
              Stores
              {selectedBase && (
                <span className="text-accent ml-2 text-lg font-normal">
                  near {selectedBase.name}
                </span>
              )}
            </h1>
            <p className="text-text-secondary">
              {selectedBase
                ? `Showing stores near ${selectedBase.name}. Change location in the header to see more.`
                : 'Find stores near your base with military gear and supplies.'}
            </p>
          </div>
          <Badge variant="default" className="font-mono">
            {filteredStores.length} stores
          </Badge>
        </div>

        {/* Location filter indicator */}
        {selectedBase && filteredStores.length === 0 && stores.length > 0 && (
          <Card variant="bordered" padding="md" className="mb-6 border-warning/30 bg-warning/5">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-warning mt-0.5" />
              <div>
                <p className="text-text-primary font-medium">No stores near {selectedBase.name}</p>
                <p className="text-sm text-text-muted mt-1">
                  There are {stores.length} stores in other locations.
                  Change your location in the header to see all stores.
                </p>
              </div>
            </div>
          </Card>
        )}

        {sortedStores.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedStores.map((store) => (
              <Card key={store.id} variant="bordered" padding="md">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0">
                    <StoreIcon size={16} className="text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-text-primary truncate">
                        {store.name}
                      </h3>
                      {store.military_discount && (
                        <Badge variant="success" size="sm">
                          <Shield size={10} />
                          Military
                        </Badge>
                      )}
                    </div>

                    {store.store_type && (
                      <Badge variant="outline" size="sm" className="mt-1">
                        {store.store_type}
                      </Badge>
                    )}

                    {(store.address || store.city) && (
                      <div className="flex items-center gap-1.5 text-sm text-text-muted mt-2">
                        <MapPin size={12} />
                        <span className="truncate">
                          {store.address && `${store.address}, `}
                          {store.city}{store.state && `, ${store.state}`} {store.zip}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-3">
                      {store.phone && (
                        <a href={`tel:${store.phone}`} className="flex items-center gap-1 text-sm text-accent hover:underline">
                          <Phone size={12} />
                          {store.phone}
                        </a>
                      )}
                      {store.website && (
                        <a
                          href={store.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-accent hover:underline"
                        >
                          <Globe size={12} />
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<StoreIcon size={24} />}
            title="No stores yet"
            description="Store listings will appear here."
          />
        )}
      </div>
    </Layout>
  )
}
