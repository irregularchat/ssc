import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { Form, Link, redirect, useLoaderData, useActionData } from 'react-router'
import { ArrowLeft, Plus, Search, Check, AlertTriangle } from 'lucide-react'
import { Layout } from '~/components/layout'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { EmptyState } from '~/components/ui/empty-state'
import {
  getDB,
  getPackingList,
  createItem,
  addItemToList,
  searchItemsEnhanced,
  getDistinctCategories,
  findDuplicateItems,
} from '~/lib/db.server'
import { formatPrice } from '~/lib/format'
import type { ItemSearchResult } from '~/lib/db.server'
import { validateOrigin } from '~/lib/csrf.server'
import { validateLength, validateRequired } from '~/lib/validation'
import type { PackingListWithRelations } from '~/types/database'

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const list = await getPackingList(db, parseInt(params.id!))

  if (!list) {
    throw new Response('Not Found', { status: 404 })
  }

  const url = new URL(request.url)
  const searchQuery = url.searchParams.get('q') || ''

  const categories = await getDistinctCategories(db)

  let searchResults: ItemSearchResult[] | null = null
  if (searchQuery.trim()) {
    searchResults = await searchItemsEnhanced(db, searchQuery)
  }

  // IDs of items already on this list
  const existingItemIds = list.items?.map(pli => pli.item.id) ?? []

  return { list, searchResults, searchQuery, categories, existingItemIds }
}

export async function action({ params, request, context }: ActionFunctionArgs) {
  const originError = validateOrigin(request)
  if (originError) {
    return new Response(originError, { status: 403 })
  }

  const formData = await request.formData()
  const intent = formData.get('intent')
  const db = getDB(context as Parameters<typeof getDB>[0])
  const listId = parseInt(params.id!)

  if (intent === 'add-existing') {
    const itemId = parseInt(formData.get('item_id') as string)
    const quantity = parseInt(formData.get('quantity') as string) || 1
    const notes = formData.get('notes') as string | null

    await addItemToList(db, listId, itemId, quantity, notes)
    return redirect(`/list/${listId}`)
  }

  if (intent === 'create-and-add') {
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const category = formData.get('category') as string | null
    const asin = formData.get('asin') as string | null
    const quantity = parseInt(formData.get('quantity') as string) || 1
    const notes = formData.get('notes') as string | null

    const nameError = validateRequired(name, 'Item name') || validateLength(name, 'name')
    if (nameError) return { error: nameError }
    if (description) {
      const descError = validateLength(description, 'description')
      if (descError) return { error: descError }
    }
    if (notes) {
      const notesError = validateLength(notes, 'notes')
      if (notesError) return { error: notesError }
    }

    // Check for duplicates
    const duplicates = await findDuplicateItems(db, name.trim())
    const exactMatch = duplicates.find(
      d => d.name.toLowerCase() === name.trim().toLowerCase()
    )

    if (exactMatch) {
      return {
        error: `"${exactMatch.name}" already exists. Use the search to find and add it instead.`,
        duplicateName: exactMatch.name,
      }
    }

    const item = await createItem(db, {
      name: name.trim(),
      description: description?.trim() || null,
      category: category?.trim() || null,
      asin: asin?.trim() || null,
      image_url: null,
    })

    await addItemToList(db, listId, item.id, quantity, notes)
    return redirect(`/list/${listId}`)
  }

  return { error: 'Invalid action' }
}

export const meta: MetaFunction = ({ data }) => {
  const typedData = data as { list?: PackingListWithRelations } | undefined
  return [
    { title: typedData?.list ? `Add Item - ${typedData.list.name}` : 'Add Item' },
  ]
}

export default function AddItemPage() {
  const { list, searchResults, searchQuery, categories, existingItemIds } = useLoaderData<{
    list: PackingListWithRelations
    searchResults: ItemSearchResult[] | null
    searchQuery: string
    categories: string[]
    existingItemIds: number[]
  }>()
  const actionData = useActionData<{ error?: string; duplicateName?: string }>()

  const existingSet = new Set(existingItemIds)

  return (
    <Layout>
      <div className="max-w-2xl mx-auto pb-20 md:pb-0">
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/list/${list.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} />
              Back to List
            </Button>
          </Link>
        </div>

        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          Add Item
        </h1>
        <p className="text-text-secondary mb-6">
          Search for an existing item or create a new one for <span className="text-text-primary font-medium">{list.name}</span>
        </p>

        {/* Search Existing Items */}
        <Form method="get" className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search items by name, description, or category..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-bg-subtle border border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/50 transition-all"
              autoComplete="off"
              autoFocus
            />
          </div>
          <Button variant="secondary" size="md" type="submit">
            <Search size={16} />
            Search
          </Button>
        </Form>

        {/* Search Results */}
        {searchResults !== null && searchResults.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-text-muted font-mono">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </span>
              {searchQuery && (
                <Link to={`/list/${list.id}/add-item`} className="text-xs text-accent hover:underline">
                  Clear
                </Link>
              )}
            </div>

            <div className="space-y-2">
              {searchResults.map((item) => {
                const alreadyOnList = existingSet.has(item.id)
                return (
                  <Card key={item.id} variant="bordered" padding="sm">
                    <Form method="post" className="flex items-center justify-between gap-4">
                      <input type="hidden" name="intent" value="add-existing" />
                      <input type="hidden" name="item_id" value={item.id} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-text-primary truncate">{item.name}</h3>
                          {alreadyOnList && (
                            <Badge variant="success" size="sm">
                              <Check size={10} />
                              On list
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {item.category && <Badge variant="default" size="sm">{item.category}</Badge>}
                          <span className="text-xs text-text-muted">
                            On {item.list_count} list{item.list_count !== 1 ? 's' : ''}
                          </span>
                          {item.best_price !== null && (
                            <span className="text-xs text-success">{formatPrice(item.best_price)}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name="quantity"
                          min={1}
                          defaultValue={1}
                          className="w-16 px-2 py-1 rounded-lg bg-bg-elevated border border-border text-text-primary text-center text-sm focus:outline-none focus:ring-2 focus:ring-text-primary/20"
                        />
                        <Button
                          variant={alreadyOnList ? 'ghost' : 'secondary'}
                          size="sm"
                          type="submit"
                          disabled={alreadyOnList}
                        >
                          <Plus size={14} />
                          {alreadyOnList ? 'Added' : 'Add'}
                        </Button>
                      </div>
                    </Form>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* No results prompt */}
        {searchResults !== null && searchResults.length === 0 && searchQuery && (
          <div className="mb-6">
            <Card variant="bordered" padding="md" className="border-warning/20 bg-warning/5">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle size={16} className="text-warning mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-text-primary">
                    No items found for &ldquo;{searchQuery}&rdquo;
                  </h3>
                  <p className="text-xs text-text-muted mt-1">
                    Create it below to add it to the community database.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted font-mono">
            {searchResults !== null && searchResults.length === 0 ? 'CREATE NEW ITEM' : 'OR CREATE NEW'}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Create New Item */}
        <Card variant="bordered" padding="lg">
          <h2 className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2">
            <Plus size={16} />
            Create New Item
          </h2>

          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="create-and-add" />

            <Input
              label="Item Name"
              name="name"
              placeholder="e.g., Black Boot Socks"
              defaultValue={searchResults !== null && searchResults.length === 0 ? searchQuery : ''}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-secondary">Category</label>
                <select
                  name="category"
                  className="w-full h-10 px-3 rounded-lg bg-bg-elevated border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-text-primary/20 appearance-none"
                >
                  <option value="">Select category...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <Input
                label="ASIN (Amazon)"
                name="asin"
                placeholder="e.g., B08XXXXX01"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-secondary">Description</label>
              <textarea
                name="description"
                placeholder="Optional description..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/50 transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Quantity"
                name="quantity"
                type="number"
                min={1}
                defaultValue={1}
              />
              <Input
                label="Notes"
                name="notes"
                placeholder="Optional notes..."
              />
            </div>

            {actionData?.error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-error/5 border border-error/20">
                <AlertTriangle size={14} className="text-error mt-0.5 flex-shrink-0" />
                <p className="text-sm text-error">{actionData.error}</p>
              </div>
            )}

            <Button variant="primary" type="submit" className="w-full">
              <Plus size={16} />
              Create & Add to List
            </Button>
          </Form>
        </Card>
      </div>
    </Layout>
  )
}
