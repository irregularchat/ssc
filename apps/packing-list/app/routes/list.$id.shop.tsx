import { useState, useMemo, useEffect } from 'react'
import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { Link, useLoaderData, useSearchParams, useNavigate } from 'react-router'
import { ArrowLeft, Filter, ChevronDown, ChevronUp, Plus, MapPin, Globe, ShoppingBag, Store as StoreIcon, Shield, Star, AlertCircle } from 'lucide-react'
import { Layout } from '~/components/layout'
import { Button } from '~/components/ui/button'
import { EmptyState } from '~/components/ui/empty-state'
import { getDB, getPackingList, getShoppingComparisonV2, getBasesWithStoreCount } from '~/lib/db.server'
import { formatPrice } from '~/lib/format'
import { getLocationFromCookie } from '~/lib/location'
import { useLocation } from '~/lib/location'
import type { PackingListWithRelations, Base } from '~/types/database'
import type { ShoppingComparisonDataV2 } from '~/lib/db.server'

// Priority labels and colors
const PRIORITY_CONFIG: Record<number, { label: string; color: string; icon: React.ReactNode }> = {
  1: { label: 'Required', color: 'text-error', icon: <AlertCircle size={12} /> },
  2: { label: 'Recommended', color: 'text-warning', icon: <Star size={12} /> },
  3: { label: 'Optional', color: 'text-text-muted', icon: null },
}

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const listId = parseInt(params.id!)

  const url = new URL(request.url)
  const baseIdParam = url.searchParams.get('base')

  // If no URL param, check cookie for global location
  let baseId: number | null = null
  if (baseIdParam) {
    baseId = parseInt(baseIdParam)
  } else {
    const cookieHeader = request.headers.get('Cookie')
    baseId = getLocationFromCookie(cookieHeader)
  }

  const list = await getPackingList(db, listId)
  if (!list) {
    throw new Response('Not Found', { status: 404 })
  }

  const [comparison, bases] = await Promise.all([
    getShoppingComparisonV2(db, listId, baseId),
    getBasesWithStoreCount(db),
  ])

  const selectedBase = baseId ? bases.find((b) => b.id === baseId) : null

  return { list, comparison, bases, selectedBase, baseIdFromCookie: !baseIdParam && baseId !== null }
}

export const meta: MetaFunction = ({ data }) => {
  const typedData = data as { list?: PackingListWithRelations } | undefined
  return [
    { title: typedData?.list ? `Prices - ${typedData.list.name}` : 'Price Comparison' },
  ]
}

// Calculate packages needed and total cost
function calcPackagesNeeded(quantity: number, packageQty: number): number {
  return Math.ceil(quantity / packageQty)
}

function formatPackageInfo(packageQty: number, packageName: string | null, unitName: string): string {
  if (packageQty === 1) return ''
  if (packageName) return packageName
  return `${packageQty} ${unitName}s`
}

// Group bases by branch for the selector
function groupBasesByBranch(bases: (Base & { store_count: number })[]) {
  const groups: Record<string, (Base & { store_count: number })[]> = {}
  bases.forEach((base) => {
    const branch = base.branch || 'Other'
    if (!groups[branch]) groups[branch] = []
    groups[branch].push(base)
  })
  return groups
}

export default function ShopComparisonPage() {
  const { list, comparison, bases, selectedBase, baseIdFromCookie } = useLoaderData<{
    list: PackingListWithRelations
    comparison: ShoppingComparisonDataV2 | null
    bases: (Base & { store_count: number })[]
    selectedBase: Base | null
    baseIdFromCookie: boolean
  }>()

  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { selectedBase: globalBase } = useLocation()

  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [includeOnline, setIncludeOnline] = useState(true)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [showBaseSelector, setShowBaseSelector] = useState(false)
  const [baseSearch, setBaseSearch] = useState('')

  // Sync with global location when it changes (and no URL override)
  useEffect(() => {
    const urlBaseId = searchParams.get('base')
    // Only sync if there's no explicit URL param and global location differs from current
    if (!urlBaseId && globalBase?.id !== selectedBase?.id) {
      // Trigger a navigation to refresh the loader with new location
      navigate('.', { replace: true })
    }
  }, [globalBase?.id, selectedBase?.id, searchParams, navigate])

  const branchGroups = useMemo(() => groupBasesByBranch(bases), [bases])

  // Filter bases by search
  const filteredBases = useMemo(() => {
    if (!baseSearch) return bases
    const search = baseSearch.toLowerCase()
    return bases.filter((b) =>
      b.name.toLowerCase().includes(search) ||
      b.abbreviation?.toLowerCase().includes(search) ||
      b.state?.toLowerCase().includes(search) ||
      b.branch?.toLowerCase().includes(search)
    )
  }, [bases, baseSearch])

  // Filter items by category and apply online filter to prices
  const filteredItems = useMemo(() => {
    if (!comparison) return []

    let items = comparison.items

    // Filter by category
    if (categoryFilter !== 'all') {
      items = items.filter((i) => i.category === categoryFilter)
    }

    // Apply online filter to prices within each item
    if (!includeOnline) {
      items = items.map((item) => {
        const filteredPrices = item.allPrices.filter((p) => !p.isOnline)
        const newBestPrice = filteredPrices.length > 0 ? filteredPrices[0] : null
        return {
          ...item,
          bestPrice: newBestPrice,
          allPrices: filteredPrices,
        }
      })
    }

    return items
  }, [comparison, categoryFilter, includeOnline])

  const toggleExpanded = (itemId: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const selectBase = (baseId: number | null) => {
    const params = new URLSearchParams(searchParams)
    if (baseId) {
      params.set('base', baseId.toString())
    } else {
      params.delete('base')
    }
    navigate(`?${params.toString()}`)
    setShowBaseSelector(false)
  }

  // Calculate totals (based on packages needed)
  const totalBestPrice = filteredItems.reduce((sum, item) => {
    if (!item.bestPrice) return sum
    const packagesNeeded = calcPackagesNeeded(item.quantity, item.bestPrice.packageQty)
    return sum + (item.bestPrice.price * packagesNeeded)
  }, 0)

  const itemsWithPrices = filteredItems.filter((i) => i.bestPrice).length
  const itemsWithoutPrices = filteredItems.filter((i) => !i.bestPrice).length

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-20 md:pb-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link to={`/list/${list.id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft size={16} />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">{list.name}</h1>
              <p className="text-sm text-text-muted">Price Comparison</p>
            </div>
          </div>
        </div>

        {/* Installation Selector */}
        <div className="mb-4">
          <button
            onClick={() => setShowBaseSelector(!showBaseSelector)}
            className={`w-full flex items-center justify-between p-3 border rounded-lg hover:bg-bg-elevated transition-colors ${
              selectedBase && baseIdFromCookie
                ? 'bg-accent/5 border-accent/30'
                : 'bg-bg-subtle border-border'
            }`}
          >
            <div className="flex items-center gap-2">
              <MapPin size={16} className={selectedBase && baseIdFromCookie ? 'text-accent' : 'text-text-muted'} />
              <span className="font-medium text-text-primary">
                {selectedBase ? selectedBase.name : 'Select Installation'}
              </span>
              {selectedBase && (
                <span className="text-xs text-text-muted">
                  ({selectedBase.branch} • {selectedBase.state})
                </span>
              )}
              {selectedBase && baseIdFromCookie && (
                <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded">
                  from header
                </span>
              )}
            </div>
            <ChevronDown size={16} className={`text-text-muted transition-transform ${showBaseSelector ? 'rotate-180' : ''}`} />
          </button>

          {showBaseSelector && (
            <div className="mt-2 border border-border rounded-lg bg-bg-base shadow-lg max-h-80 overflow-hidden">
              {/* Search */}
              <div className="p-2 border-b border-border">
                <input
                  type="text"
                  placeholder="Search installations..."
                  value={baseSearch}
                  onChange={(e) => setBaseSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-text-primary/20"
                  autoFocus
                />
              </div>

              {/* Online only option */}
              <button
                onClick={() => selectBase(null)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-bg-elevated text-left border-b border-border"
              >
                <Globe size={14} className="text-accent" />
                <span className="text-sm font-medium text-text-primary">Online Stores Only</span>
                <span className="text-xs text-text-muted ml-auto">Ships anywhere</span>
              </button>

              {/* Grouped bases */}
              <div className="overflow-y-auto max-h-56">
                {baseSearch ? (
                  // Flat list when searching
                  filteredBases.map((base) => (
                    <button
                      key={base.id}
                      onClick={() => selectBase(base.id)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-bg-elevated text-left"
                    >
                      <div>
                        <span className="text-sm text-text-primary">{base.name}</span>
                        <span className="text-xs text-text-muted ml-2">{base.state}</span>
                      </div>
                      <span className="text-xs text-text-muted">{base.store_count} stores</span>
                    </button>
                  ))
                ) : (
                  // Grouped by branch
                  Object.entries(branchGroups).map(([branch, branchBases]) => (
                    <div key={branch}>
                      <div className="px-3 py-1.5 bg-bg-subtle text-xs font-medium text-text-muted sticky top-0">
                        {branch}
                      </div>
                      {branchBases.map((base) => (
                        <button
                          key={base.id}
                          onClick={() => selectBase(base.id)}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-bg-elevated text-left"
                        >
                          <div>
                            <span className="text-sm text-text-primary">{base.name}</span>
                            <span className="text-xs text-text-muted ml-2">{base.state}</span>
                          </div>
                          <span className="text-xs text-text-muted">{base.store_count} stores</span>
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {!comparison || comparison.items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={24} />}
            title="No items in list"
            description="Add items to your packing list to compare prices."
            action={
              <Link to={`/list/${list.id}`}>
                <Button variant="primary" size="sm">
                  View List
                </Button>
              </Link>
            }
          />
        ) : (
          <>
            {/* Summary Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-bg-subtle border border-border rounded-lg mb-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-text-muted" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-bg-elevated border border-border rounded px-2 py-1 text-sm text-text-primary focus:outline-none"
                  >
                    <option value="all">All ({comparison.items.length})</option>
                    {comparison.categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat} ({comparison.items.filter((i) => i.category === cat).length})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Online Toggle */}
                <button
                  onClick={() => setIncludeOnline(!includeOnline)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors ${
                    includeOnline
                      ? 'bg-accent/20 text-accent'
                      : 'bg-bg-elevated text-text-muted hover:text-text-primary'
                  }`}
                >
                  <Globe size={14} />
                  <span>Online</span>
                  {includeOnline && (
                    <span className="text-xs opacity-70">✓</span>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <span className="text-text-muted">
                  <span className="text-success font-medium">{itemsWithPrices}</span> priced
                  {itemsWithoutPrices > 0 && (
                    <span className="text-text-muted"> • <span className="text-warning">{itemsWithoutPrices}</span> missing</span>
                  )}
                </span>
                <span className="font-bold text-text-primary">
                  Est. Total: <span className="text-success">{formatPrice(totalBestPrice)}</span>
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-border rounded-lg bg-bg-base overflow-hidden"
                >
                  {/* Main Row */}
                  <div className="flex items-center p-3 gap-3">
                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/prices/${item.id}`}
                          className="font-medium text-text-primary hover:text-accent truncate"
                        >
                          {item.name}
                        </Link>
                        {item.quantity > 1 && (
                          <span className="text-xs text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded">
                            ×{item.quantity}
                          </span>
                        )}
                        {/* Priority Badge */}
                        {item.priority && item.priority <= 2 && (
                          <span className={`inline-flex items-center gap-0.5 text-xs ${PRIORITY_CONFIG[item.priority]?.color || 'text-text-muted'}`}>
                            {PRIORITY_CONFIG[item.priority]?.icon}
                            {PRIORITY_CONFIG[item.priority]?.label}
                          </span>
                        )}
                      </div>
                      {item.category && (
                        <span className="text-xs text-text-muted">{item.category}</span>
                      )}
                    </div>

                    {/* Best Price */}
                    <div className="flex items-center gap-3">
                      {item.bestPrice ? (
                        <>
                          <div className="text-right">
                            {/* Show package info if not single */}
                            {item.bestPrice.packageQty > 1 && (
                              <p className="text-xs text-accent mb-0.5">
                                {formatPackageInfo(item.bestPrice.packageQty, item.bestPrice.packageName, item.unitName)}
                              </p>
                            )}
                            <p className="font-mono font-bold text-success">
                              {formatPrice(item.bestPrice.price)}
                              {item.bestPrice.packageQty > 1 && (
                                <span className="text-xs text-text-muted font-normal ml-1">
                                  /{item.bestPrice.packageQty}
                                </span>
                              )}
                            </p>
                            {/* Show packages needed if more than 1 */}
                            {(() => {
                              const packagesNeeded = calcPackagesNeeded(item.quantity, item.bestPrice.packageQty)
                              if (packagesNeeded > 1) {
                                return (
                                  <p className="text-xs text-warning">
                                    Buy {packagesNeeded}× = {formatPrice(item.bestPrice.price * packagesNeeded)}
                                  </p>
                                )
                              }
                              return null
                            })()}
                            <p className="text-xs text-text-muted flex items-center gap-1 justify-end flex-wrap">
                              {item.bestPrice.isOnline ? (
                                <Globe size={10} />
                              ) : (
                                <StoreIcon size={10} />
                              )}
                              {item.bestPrice.storeName}
                              {item.bestPrice.hasMilitaryDiscount && (
                                <span className="inline-flex items-center gap-0.5 text-accent" title="Military discount available">
                                  <Shield size={10} />
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Expand Button */}
                          {item.allPrices.length > 1 && (
                            <button
                              onClick={() => toggleExpanded(item.id)}
                              className="p-1.5 rounded hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors"
                              title={`${item.allPrices.length} stores have prices`}
                            >
                              {expandedItems.has(item.id) ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                              <span className="sr-only">
                                {expandedItems.has(item.id) ? 'Hide' : 'Show'} all prices
                              </span>
                            </button>
                          )}
                        </>
                      ) : (
                        <Link
                          to={`/prices/${item.id}/add`}
                          className="flex items-center gap-1 text-sm text-text-muted hover:text-accent transition-colors"
                        >
                          <Plus size={14} />
                          Add price
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Expanded Prices */}
                  {expandedItems.has(item.id) && item.allPrices.length > 1 && (
                    <div className="border-t border-border bg-bg-subtle">
                      <div className="p-2 space-y-1">
                        {item.allPrices.map((price, idx) => {
                          const packagesNeeded = calcPackagesNeeded(item.quantity, price.packageQty)
                          const totalCost = price.price * packagesNeeded
                          return (
                            <div
                              key={`${price.storeId}-${price.packageQty}`}
                              className={`flex items-center justify-between py-1.5 px-2 rounded ${
                                idx === 0 ? 'bg-success/10' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                {price.isOnline ? (
                                  <Globe size={12} className="text-accent" />
                                ) : (
                                  <StoreIcon size={12} className="text-text-muted" />
                                )}
                                <span className="text-sm text-text-primary">{price.storeName}</span>
                                {price.packageQty > 1 && (
                                  <span className="text-xs text-accent">
                                    ({formatPackageInfo(price.packageQty, price.packageName, item.unitName)})
                                  </span>
                                )}
                                {price.storeType && (
                                  <span className="text-xs text-text-muted">({price.storeType})</span>
                                )}
                                {price.hasMilitaryDiscount && (
                                  <span className="inline-flex items-center gap-0.5 text-xs text-accent" title="Military discount available">
                                    <Shield size={10} />
                                    MIL
                                  </span>
                                )}
                                {price.priceType === 'sale' && (
                                  <span className="text-xs text-success">SALE</span>
                                )}
                                {price.votesUp - price.votesDown !== 0 && (
                                  <span className={`text-xs ${price.votesUp > price.votesDown ? 'text-success' : 'text-error'}`}>
                                    {price.votesUp > price.votesDown ? '+' : ''}{price.votesUp - price.votesDown}
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <span className={`font-mono text-sm ${idx === 0 ? 'text-success font-semibold' : 'text-text-primary'}`}>
                                  {formatPrice(price.price)}
                                </span>
                                {packagesNeeded > 1 && (
                                  <span className="text-xs text-text-muted ml-1">
                                    ×{packagesNeeded} = {formatPrice(totalCost)}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="px-3 py-2 border-t border-border/50">
                        <Link
                          to={`/prices/${item.id}/add`}
                          className="text-xs text-text-muted hover:text-accent transition-colors"
                        >
                          + Add another price
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer Summary */}
            <div className="mt-4 p-4 bg-bg-subtle border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted">
                    Showing best prices from{' '}
                    {includeOnline
                      ? `${comparison.stores.length} stores`
                      : `${comparison.stores.filter((s) => !s.is_online).length} local stores`}
                    {selectedBase && ` near ${selectedBase.name}`}
                    {includeOnline && ' + online'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Estimated Total</p>
                  <p className="text-2xl font-bold text-success">{formatPrice(totalBestPrice)}</p>
                </div>
              </div>
            </div>

            {/* Help Text */}
            <p className="text-xs text-text-muted text-center mt-4">
              Prices are crowdsourced. Click an item to see all prices or add your own.
            </p>
          </>
        )}
      </div>
    </Layout>
  )
}
