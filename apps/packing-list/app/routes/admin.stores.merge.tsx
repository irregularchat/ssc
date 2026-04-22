import { useState } from 'react'
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData, useNavigation, Form, redirect, Link } from 'react-router'
import {
  Merge,
  ArrowLeft,
  Store as StoreIcon,
  Globe,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  Check,
} from 'lucide-react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { getDB, getStoresByIds, mergeStores } from '~/lib/db.server'
import type { Store } from '~/types/database'

export const meta: MetaFunction = () => {
  return [{ title: 'Merge Stores - Admin - CPL' }]
}

type StoreWithPriceCount = Store & { price_count: number }

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const url = new URL(request.url)

  const idsParam = url.searchParams.get('ids')
  if (!idsParam) {
    throw redirect('/admin/stores?error=no-ids')
  }

  const ids = idsParam
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id))

  if (ids.length < 2) {
    throw redirect('/admin/stores?error=min-stores')
  }

  const stores = await getStoresByIds(db, ids)

  // Check if any requested IDs were not found
  const foundIds = stores.map((s) => s.id)
  const missingIds = ids.filter((id) => !foundIds.includes(id))

  if (missingIds.length > 0) {
    throw redirect(`/admin/stores?error=stores-not-found&missing=${missingIds.join(',')}`)
  }

  return { stores }
}

export async function action({ request, context }: ActionFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const formData = await request.formData()

  const primaryId = parseInt(formData.get('primaryId') as string, 10)
  const allIdsString = formData.get('allIds') as string

  if (isNaN(primaryId) || !allIdsString) {
    return { error: 'Invalid form data' }
  }

  const allIds = allIdsString
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id))

  // Get the IDs to merge (all except primary)
  const mergeIds = allIds.filter((id) => id !== primaryId)

  if (mergeIds.length === 0) {
    return { error: 'No stores selected to merge' }
  }

  try {
    const result = await mergeStores(db, primaryId, mergeIds)
    // Redirect with success message
    throw redirect(
      `/admin/stores?success=merge&pricesMoved=${result.pricesMoved}&storesDeleted=${result.storesDeleted}`
    )
  } catch (e) {
    // Re-throw redirects
    if (e instanceof Response) throw e
    console.error('Merge failed:', e)
    return { error: 'Failed to merge stores. Please try again.' }
  }
}

export default function AdminStoresMergePage() {
  const { stores } = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  // Default to the first store as primary
  const [primaryId, setPrimaryId] = useState<number>(stores[0]?.id ?? 0)

  const primaryStore = stores.find((s) => s.id === primaryId)
  const storesToMerge = stores.filter((s) => s.id !== primaryId)

  // Calculate totals
  const totalPricesToMove = storesToMerge.reduce((sum, s) => sum + s.price_count, 0)
  const storesToDelete = storesToMerge.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/stores">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Merge Stores</h2>
          <p className="text-text-secondary text-sm mt-1">
            Combine {stores.length} stores into one
          </p>
        </div>
      </div>

      {/* Instructions */}
      <Card variant="bordered" padding="md">
        <div className="flex items-start gap-3">
          <Merge size={20} className="text-info mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-text-primary font-medium">How merge works</p>
            <p className="text-text-secondary text-sm mt-1">
              Select one store to keep as the primary. All prices from the other stores will be
              moved to the primary store, then the other stores will be deleted.
            </p>
          </div>
        </div>
      </Card>

      {/* Store Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-text-primary">
          Select Primary Store
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              isSelected={store.id === primaryId}
              onSelect={() => setPrimaryId(store.id)}
            />
          ))}
        </div>
      </div>

      {/* Merge Preview */}
      <Card
        variant="elevated"
        padding="lg"
        className="border border-warning/30 bg-warning/5"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-warning mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-text-primary font-medium">Merge Preview</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-success" />
                <span className="text-text-secondary">
                  <span className="font-medium text-text-primary">{primaryStore?.name}</span> will
                  be kept as the primary store
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Merge size={16} className="text-info" />
                <span className="text-text-secondary">
                  <span className="font-medium text-text-primary">{totalPricesToMove}</span> price
                  {totalPricesToMove !== 1 ? 's' : ''} will be moved to{' '}
                  <span className="font-medium text-text-primary">{primaryStore?.name}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-error" />
                <span className="text-text-secondary">
                  <span className="font-medium text-error">{storesToDelete}</span> store
                  {storesToDelete !== 1 ? 's' : ''} will be permanently deleted
                </span>
              </div>
            </div>

            {storesToMerge.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-text-muted mb-2">Stores to be deleted:</p>
                <div className="flex flex-wrap gap-2">
                  {storesToMerge.map((store) => (
                    <Badge key={store.id} variant="error" size="sm">
                      {store.name}
                      {store.price_count > 0 && ` (${store.price_count} prices)`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Actions */}
      <Form method="post">
        <input type="hidden" name="primaryId" value={primaryId} />
        <input type="hidden" name="allIds" value={stores.map((s) => s.id).join(',')} />

        <div className="flex items-center justify-end gap-3">
          <Link to="/admin/stores">
            <Button variant="secondary" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            variant="danger"
            type="submit"
            disabled={isSubmitting || stores.length < 2}
            loading={isSubmitting}
          >
            <Merge size={16} />
            {isSubmitting ? 'Merging...' : 'Confirm Merge'}
          </Button>
        </div>
      </Form>
    </div>
  )
}

function StoreCard({
  store,
  isSelected,
  onSelect,
}: {
  store: StoreWithPriceCount
  isSelected: boolean
  onSelect: () => void
}) {
  const location = [store.city, store.state].filter(Boolean).join(', ')

  return (
    <Card
      variant={isSelected ? 'elevated' : 'bordered'}
      padding="md"
      className={`cursor-pointer transition-all ${
        isSelected
          ? 'ring-2 ring-success border-success/50'
          : 'hover:border-border-hover'
      }`}
      interactive
    >
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="radio"
          name="primary-store"
          checked={isSelected}
          onChange={onSelect}
          className="mt-1 w-4 h-4 text-success border-border bg-bg-elevated focus:ring-success/20"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <StoreIcon size={16} className="text-text-muted flex-shrink-0" />
            <p className="font-medium text-text-primary truncate">{store.name}</p>
          </div>

          {location && (
            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-text-secondary">
              <MapPin size={12} className="flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            {store.is_online === 1 && (
              <Badge variant="info" size="sm">
                <Globe size={10} />
                Online
              </Badge>
            )}
            {store.accepts_military_discount === 1 && (
              <Badge variant="success" size="sm">
                <ShieldCheck size={10} />
                Military
              </Badge>
            )}
            <Badge variant="outline" size="sm">
              {store.price_count} price{store.price_count !== 1 ? 's' : ''}
            </Badge>
          </div>

          {isSelected && (
            <div className="mt-3 pt-2 border-t border-success/20">
              <Badge variant="success" size="sm">
                <Check size={10} />
                Primary Store
              </Badge>
            </div>
          )}
        </div>
      </label>
    </Card>
  )
}
