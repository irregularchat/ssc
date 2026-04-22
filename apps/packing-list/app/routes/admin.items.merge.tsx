import { useState } from 'react'
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData, useNavigation, Form, redirect, Link } from 'react-router'
import {
  Merge,
  ArrowLeft,
  Package,
  AlertTriangle,
  Check,
  DollarSign,
  List,
  Image,
  ShoppingCart,
} from 'lucide-react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { getDB, getItemsByIds, mergeItems } from '~/lib/db.server'
import type { Item } from '~/types/database'

export const meta: MetaFunction = () => {
  return [{ title: 'Merge Items - Admin - CPL' }]
}

type ItemWithCounts = Item & { price_count: number; list_count: number }

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const url = new URL(request.url)

  const idsParam = url.searchParams.get('ids')
  if (!idsParam) {
    throw redirect('/admin/items?error=no-ids')
  }

  const ids = idsParam
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id))

  if (ids.length < 2) {
    throw redirect('/admin/items?error=min-items')
  }

  const items = await getItemsByIds(db, ids)

  // Check if any requested IDs were not found
  const foundIds = items.map((i) => i.id)
  const missingIds = ids.filter((id) => !foundIds.includes(id))

  if (missingIds.length > 0) {
    throw redirect(`/admin/items?error=items-not-found&missing=${missingIds.join(',')}`)
  }

  return { items }
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
    return { error: 'No items selected to merge' }
  }

  try {
    const result = await mergeItems(db, primaryId, mergeIds)
    // Redirect with success message
    throw redirect(
      `/admin/items?success=merge&pricesMoved=${result.pricesMoved}&listEntriesMoved=${result.listEntriesMoved}&itemsDeleted=${result.itemsDeleted}`
    )
  } catch (e) {
    // Re-throw redirects
    if (e instanceof Response) throw e
    console.error('Merge failed:', e)
    return { error: 'Failed to merge items. Please try again.' }
  }
}

export default function AdminItemsMergePage() {
  const { items } = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  // Default to the first item as primary (or one with most prices)
  const sortedByPrices = [...items].sort((a, b) => b.price_count - a.price_count)
  const [primaryId, setPrimaryId] = useState<number>(sortedByPrices[0]?.id ?? 0)

  const primaryItem = items.find((i) => i.id === primaryId)
  const itemsToMerge = items.filter((i) => i.id !== primaryId)

  // Calculate totals
  const totalPricesToMove = itemsToMerge.reduce((sum, i) => sum + i.price_count, 0)
  const totalListEntriesToMove = itemsToMerge.reduce((sum, i) => sum + i.list_count, 0)
  const itemsToDelete = itemsToMerge.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/items">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Merge Items</h2>
          <p className="text-text-secondary text-sm mt-1">
            Combine {items.length} items into one
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
              Select one item to keep as the primary. All prices and packing list entries from the
              other items will be moved to the primary item, then the other items will be deleted.
            </p>
          </div>
        </div>
      </Card>

      {/* Item Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-text-primary">Select Primary Item</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              isSelected={item.id === primaryId}
              onSelect={() => setPrimaryId(item.id)}
            />
          ))}
        </div>
      </div>

      {/* Merge Preview */}
      <Card variant="elevated" padding="lg" className="border border-warning/30 bg-warning/5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-warning mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-text-primary font-medium">Merge Preview</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-success" />
                <span className="text-text-secondary">
                  <span className="font-medium text-text-primary">{primaryItem?.name}</span> will be
                  kept as the primary item
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-info" />
                <span className="text-text-secondary">
                  <span className="font-medium text-text-primary">{totalPricesToMove}</span> price
                  {totalPricesToMove !== 1 ? 's' : ''} will be moved to{' '}
                  <span className="font-medium text-text-primary">{primaryItem?.name}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <List size={16} className="text-info" />
                <span className="text-text-secondary">
                  <span className="font-medium text-text-primary">{totalListEntriesToMove}</span>{' '}
                  packing list entr{totalListEntriesToMove !== 1 ? 'ies' : 'y'} will be updated
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-error" />
                <span className="text-text-secondary">
                  <span className="font-medium text-error">{itemsToDelete}</span> item
                  {itemsToDelete !== 1 ? 's' : ''} will be permanently deleted
                </span>
              </div>
            </div>

            {itemsToMerge.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-text-muted mb-2">Items to be deleted:</p>
                <div className="flex flex-wrap gap-2">
                  {itemsToMerge.map((item) => (
                    <Badge key={item.id} variant="error" size="sm">
                      {item.name}
                      {(item.price_count > 0 || item.list_count > 0) && (
                        <span className="ml-1 opacity-75">
                          ({item.price_count}P, {item.list_count}L)
                        </span>
                      )}
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
        <input type="hidden" name="allIds" value={items.map((i) => i.id).join(',')} />

        <div className="flex items-center justify-end gap-3">
          <Link to="/admin/items">
            <Button variant="secondary" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            variant="danger"
            type="submit"
            disabled={isSubmitting || items.length < 2}
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

function ItemCard({
  item,
  isSelected,
  onSelect,
}: {
  item: ItemWithCounts
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <Card
      variant={isSelected ? 'elevated' : 'bordered'}
      padding="md"
      className={`cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-success border-success/50' : 'hover:border-border-hover'
      }`}
      interactive
    >
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="radio"
          name="primary-item"
          checked={isSelected}
          onChange={onSelect}
          className="mt-1 w-4 h-4 text-success border-border bg-bg-elevated focus:ring-success/20"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-text-muted flex-shrink-0" />
            <p className="font-medium text-text-primary truncate">{item.name}</p>
          </div>

          {item.category && (
            <p className="text-xs text-text-muted mt-1">{item.category}</p>
          )}

          {item.brand_preference && (
            <p className="text-xs text-text-muted truncate">{item.brand_preference}</p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {item.asin && (
              <Badge variant="info" size="sm">
                <ShoppingCart size={10} />
                ASIN
              </Badge>
            )}
            {item.image_url && (
              <Badge variant="success" size="sm">
                <Image size={10} />
                Img
              </Badge>
            )}
            <Badge variant="outline" size="sm">
              <DollarSign size={10} />
              {item.price_count}
            </Badge>
            <Badge variant="outline" size="sm">
              <List size={10} />
              {item.list_count}
            </Badge>
          </div>

          {isSelected && (
            <div className="mt-3 pt-2 border-t border-success/20">
              <Badge variant="success" size="sm">
                <Check size={10} />
                Primary Item
              </Badge>
            </div>
          )}
        </div>
      </label>
    </Card>
  )
}
