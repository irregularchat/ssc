import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { Form, Link, useLoaderData, useActionData } from 'react-router'
import { Plus, Upload, Store, Package, TrendingUp, MapPin, GraduationCap, ArrowRight, Search, DollarSign, Check, X } from 'lucide-react'
import { Layout } from '~/components/layout'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { EmptyState } from '~/components/ui/empty-state'
import {
  getDB,
  getPackingLists,
  getDistinctCategories,
  getItemStats,
  getItemsNeedingPricesAtBase,
  searchItemsEnhanced,
  createItem,
  searchItems,
} from '~/lib/db.server'
import { formatPrice } from '~/lib/format'
import type { ItemSearchResult } from '~/lib/db.server'
import { getLocationFromCookie } from '~/lib/location'
import { useLocation } from '~/lib/location'
import type { PackingListWithRelations, Item } from '~/types/database'

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const url = new URL(request.url)
  const searchQuery = url.searchParams.get('q') || ''
  const categoryFilter = url.searchParams.get('category') || ''

  const cookieHeader = request.headers.get('Cookie')
  const selectedBaseId = getLocationFromCookie(cookieHeader)

  const [packingLists, categories, itemStats] = await Promise.all([
    getPackingLists(db),
    getDistinctCategories(db),
    getItemStats(db),
  ])

  let searchResults: ItemSearchResult[] | null = null
  if (searchQuery.trim()) {
    searchResults = await searchItemsEnhanced(db, searchQuery, {
      baseId: selectedBaseId,
      category: categoryFilter || null,
    })
  }

  let itemsNeedingPrices: Item[] = []
  if (selectedBaseId) {
    itemsNeedingPrices = await getItemsNeedingPricesAtBase(db, selectedBaseId, 8)
  }

  return {
    packingLists,
    searchResults,
    searchQuery,
    categoryFilter,
    categories,
    itemStats,
    selectedBaseId,
    itemsNeedingPrices,
  }
}

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent')
  const db = getDB(context as Parameters<typeof getDB>[0])

  if (intent === 'quick-add-item') {
    const name = (formData.get('name') as string)?.trim()
    const description = (formData.get('description') as string)?.trim() || null
    const category = (formData.get('category') as string)?.trim() || null

    if (!name) {
      return { error: 'Item name is required' }
    }

    // Check for near-duplicate before creating
    const existing = await searchItems(db, name, 5)
    const exactMatch = existing.find(
      e => e.name.toLowerCase() === name.toLowerCase()
    )

    if (exactMatch) {
      return {
        error: `"${exactMatch.name}" already exists. Try searching for it instead.`,
        duplicateItemId: exactMatch.id,
      }
    }

    const item = await createItem(db, {
      name,
      description,
      category,
      asin: null,
      image_url: null,
    })

    return {
      success: true,
      newItem: item,
      message: `Added "${item.name}"! Now help the community \u2014 find the price at a local store.`,
    }
  }

  return null
}

export const meta: MetaFunction = () => {
  return [
    { title: 'Community Packing List' },
    { name: 'description', content: 'Community-driven packing lists for military schools, training courses, and deployments.' },
  ]
}

// -- Inline Components --

function SearchResultCard({ item, index }: { item: ItemSearchResult; index: number }) {
  return (
    <div
      className="opacity-0 animate-fade-in"
      style={{ animationDelay: `${index * 0.03}s`, animationFillMode: 'forwards' }}
    >
      <Card variant="bordered" padding="sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-bg-elevated border border-border flex items-center justify-center flex-shrink-0">
              <Package size={14} className="text-text-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-text-primary text-sm truncate">{item.name}</h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {item.category && (
                  <Badge variant="default" size="sm">{item.category}</Badge>
                )}
                <span className="text-xs text-text-muted">
                  On {item.list_count} list{item.list_count !== 1 ? 's' : ''}
                </span>
                {item.best_price !== null && (
                  <Badge variant="success" size="sm">
                    {formatPrice(item.best_price)}
                  </Badge>
                )}
                {item.price_count === 0 && (
                  <Badge variant="warning" size="sm">Needs price</Badge>
                )}
                {item.has_local_price ? (
                  <Badge variant="info" size="sm">Local</Badge>
                ) : null}
              </div>
            </div>
          </div>
          <Link to={`/prices/${item.id}`}>
            <Button variant="ghost" size="sm">
              <DollarSign size={14} />
              <span className="hidden sm:inline">Prices</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

function QuickAddPrompt({ query, categories }: { query: string; categories: string[] }) {
  const actionData = useActionData<{
    error?: string
    success?: boolean
    message?: string
    newItem?: Item
    duplicateItemId?: number
  }>()

  if (actionData?.success && actionData.newItem) {
    return (
      <Card variant="bordered" padding="md" className="border-success/30 bg-success/5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center flex-shrink-0">
            <Check size={16} className="text-success" />
          </div>
          <div>
            <h3 className="font-medium text-text-primary text-sm">{actionData.message}</h3>
            <Link
              to={`/prices/${actionData.newItem.id}/add`}
              className="inline-flex items-center gap-1.5 mt-2 text-sm text-accent hover:underline"
            >
              <DollarSign size={14} />
              Add a price now
            </Link>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="bordered" padding="md">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-text-primary">
          No results for &ldquo;{query}&rdquo;
        </h3>
        <p className="text-xs text-text-muted mt-1">
          Can&apos;t find what you need? Add it to the community database.
        </p>
      </div>

      <Form method="post" className="space-y-3">
        <input type="hidden" name="intent" value="quick-add-item" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            name="name"
            placeholder="Item name"
            defaultValue={query}
            required
          />
          <select
            name="category"
            className="h-10 px-3 rounded-lg bg-bg-elevated border border-border text-text-secondary text-sm focus:outline-none focus:ring-2 focus:ring-text-primary/20"
          >
            <option value="">Category (optional)</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <Input
          name="description"
          placeholder="Brief description (optional)"
        />

        {actionData?.error && (
          <div className="flex items-center gap-2 text-xs text-error">
            <X size={12} />
            <span>{actionData.error}</span>
            {actionData.duplicateItemId && (
              <Link
                to={`/prices/${actionData.duplicateItemId}`}
                className="text-accent hover:underline ml-1"
              >
                View existing item
              </Link>
            )}
          </div>
        )}

        <Button variant="primary" size="sm" type="submit">
          <Plus size={14} />
          Add to Database
        </Button>
      </Form>
    </Card>
  )
}

// -- Main Page --

export default function HomePage() {
  const {
    packingLists,
    searchResults,
    searchQuery,
    categoryFilter,
    categories,
    itemStats,
    selectedBaseId,
    itemsNeedingPrices,
  } = useLoaderData<{
    packingLists: PackingListWithRelations[]
    searchResults: ItemSearchResult[] | null
    searchQuery: string
    categoryFilter: string
    categories: string[]
    itemStats: { totalItems: number; itemsWithPrices: number; itemsWithoutPrices: number; totalCategories: number }
    selectedBaseId: number | null
    itemsNeedingPrices: Item[]
  }>()

  const { selectedBase } = useLocation()
  const totalLists = packingLists.length

  return (
    <Layout>
      <div className="min-h-screen pb-20 md:pb-0">
        {/* Hero */}
        <div className="mb-8 pt-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-text-muted font-mono">OPERATIONAL</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold text-text-primary mb-3 tracking-tight">
            Community Packing List
          </h1>

          <p className="text-text-secondary max-w-md mb-6">
            Community-driven packing lists for military schools, training courses, and deployments.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/list/create">
              <Button variant="primary" size="md">
                <Plus size={16} />
                New List
              </Button>
            </Link>
            <Link to="/list/upload">
              <Button variant="secondary" size="md">
                <Upload size={16} />
                Import
              </Button>
            </Link>
            <Link to="/stores">
              <Button variant="ghost" size="md">
                <Store size={16} />
                Stores
              </Button>
            </Link>
            <Link to="/schools">
              <Button variant="ghost" size="md">
                <GraduationCap size={16} />
                Schools
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <div className="rounded-xl bg-bg-subtle border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package size={14} className="text-text-muted" />
              <span className="text-xs text-text-muted font-mono">LISTS</span>
            </div>
            <p className="text-2xl font-semibold text-text-primary">{totalLists}</p>
            <Badge variant="success" size="sm" dot className="mt-2">Active</Badge>
          </div>

          <div className="rounded-xl bg-bg-subtle border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-text-muted" />
              <span className="text-xs text-text-muted font-mono">RECENT</span>
            </div>
            <p className="text-2xl font-semibold text-text-primary">
              {packingLists.filter((l: PackingListWithRelations) => {
                const created = new Date(l.created_at)
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return created > weekAgo
              }).length}
            </p>
            <Badge variant="primary" size="sm" className="mt-2">This week</Badge>
          </div>

          <div className="rounded-xl bg-bg-subtle border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package size={14} className="text-text-muted" />
              <span className="text-xs text-text-muted font-mono">ITEMS</span>
            </div>
            <p className="text-2xl font-semibold text-text-primary">{itemStats.totalItems}</p>
            <Badge variant="info" size="sm" className="mt-2">{itemStats.totalCategories} categories</Badge>
          </div>

          <div className="rounded-xl bg-bg-subtle border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={14} className="text-text-muted" />
              <span className="text-xs text-text-muted font-mono">PRICED</span>
            </div>
            <p className="text-2xl font-semibold text-text-primary">{itemStats.itemsWithPrices}</p>
            <Badge variant={itemStats.itemsWithoutPrices > 0 ? 'warning' : 'success'} size="sm" className="mt-2">
              {itemStats.itemsWithoutPrices > 0
                ? `${itemStats.itemsWithoutPrices} need prices`
                : 'All priced'}
            </Badge>
          </div>
        </div>

        {/* Item Search */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Search size={14} className="text-text-muted" />
            <h2 className="text-sm font-medium text-text-primary">Find Items</h2>
            <span className="text-xs text-text-muted font-mono">{itemStats.totalItems} items</span>
          </div>

          <Form method="get" className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder={selectedBase
                  ? `Search ${itemStats.totalItems} items at ${selectedBase.name}...`
                  : `Search ${itemStats.totalItems} items...`
                }
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-bg-subtle border border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/50 transition-all"
                autoComplete="off"
              />
            </div>
            {categories.length > 0 && (
              <select
                name="category"
                defaultValue={categoryFilter}
                className="h-10 px-3 rounded-lg bg-bg-subtle border border-border text-text-secondary text-sm focus:outline-none focus:ring-2 focus:ring-text-primary/20 appearance-none"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
            <Button variant="secondary" size="md" type="submit">
              <Search size={16} />
              Search
            </Button>
          </Form>

          {!selectedBase && !searchQuery && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/5 border border-accent/20 text-sm text-accent">
              <MapPin size={14} />
              <span>Select a location above to see local prices and store availability</span>
            </div>
          )}

          {/* Search Results */}
          {searchResults !== null && (
            <div className="mt-4">
              {searchResults.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-text-muted font-mono">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                      {searchQuery && ` for "${searchQuery}"`}
                    </span>
                    <Link to="/" className="text-xs text-accent hover:underline">
                      Clear search
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {searchResults.map((item, index) => (
                      <SearchResultCard key={item.id} item={item} index={index} />
                    ))}
                  </div>
                </>
              ) : (
                <QuickAddPrompt query={searchQuery} categories={categories} />
              )}
            </div>
          )}
        </div>

        {/* Price Bounties */}
        {selectedBase && itemsNeedingPrices.length > 0 && !searchQuery && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={14} className="text-warning" />
              <h2 className="text-sm font-medium text-text-primary">Price Bounties</h2>
              <Badge variant="warning" size="sm">{itemsNeedingPrices.length} needed</Badge>
            </div>
            <p className="text-xs text-text-muted mb-3">
              These items need price data at {selectedBase.name}. Help the community by submitting prices!
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {itemsNeedingPrices.map(item => (
                <Link
                  key={item.id}
                  to={`/prices/${item.id}/add`}
                  className="flex-shrink-0"
                >
                  <Card variant="bordered" padding="sm" interactive className="w-48">
                    <h3 className="text-sm font-medium text-text-primary truncate">{item.name}</h3>
                    {item.category && (
                      <Badge variant="default" size="sm" className="mt-1">{item.category}</Badge>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-xs text-warning">
                      <DollarSign size={12} />
                      Add price
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Lists */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-text-primary">Packing Lists</h2>
          {totalLists > 0 && (
            <span className="text-xs text-text-muted font-mono">{totalLists} total</span>
          )}
        </div>

        {packingLists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {packingLists.map((plist: PackingListWithRelations, index: number) => (
              <Link
                key={plist.id}
                to={`/list/${plist.id}/shop`}
                className="group opacity-0 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
              >
                <Card
                  variant="bordered"
                  padding="md"
                  interactive
                  className="h-full flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-3">
                      <h3 className="font-medium text-text-primary group-hover:text-text-primary transition-colors truncate">
                        {plist.name}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {plist.type && (
                          <Badge variant="primary" size="sm">{plist.type}</Badge>
                        )}
                        {plist.school && (
                          <Badge variant="default" size="sm">
                            <GraduationCap size={10} />
                            {plist.school.name}
                          </Badge>
                        )}
                        {plist.base && (
                          <Badge variant="info" size="sm">
                            <MapPin size={10} />
                            {plist.base.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-bg-elevated border border-border flex items-center justify-center group-hover:bg-bg-subtle transition-colors">
                      <Package className="text-text-muted group-hover:text-text-primary" size={16} />
                    </div>
                  </div>

                  {plist.description && (
                    <p className="text-text-muted text-sm line-clamp-2 mb-3 flex-1">
                      {plist.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      <span className="text-xs text-text-muted">Ready</span>
                    </div>
                    <div className="flex items-center gap-1 text-text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Open</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Package size={24} />}
            title="No lists yet"
            description="Create your first packing list to get started."
            action={
              <Link to="/list/create">
                <Button variant="primary" size="sm">
                  <Plus size={16} />
                  Create List
                </Button>
              </Link>
            }
          />
        )}
      </div>
    </Layout>
  )
}
