import { useState, useEffect } from 'react'
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData, useSearchParams, Link, useFetcher } from 'react-router'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Image,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Merge,
  X,
  Filter,
  ArrowUpDown,
  Tag,
  List,
  DollarSign,
} from 'lucide-react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Select } from '~/components/ui/select'
import {
  getDB,
  getItemsWithFilters,
  getDistinctCategories,
  getDistinctUnitNames,
  deleteItem,
  deleteItemsBulk,
  updateItemsCategory,
} from '~/lib/db.server'
import type { ItemFilters } from '~/lib/db.server'

export const meta: MetaFunction = () => {
  return [{ title: 'Items - Admin - CPL' }]
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const url = new URL(request.url)

  // Parse filter params
  const category = url.searchParams.get('category')
  const unitName = url.searchParams.get('unit')
  const hasAsinParam = url.searchParams.get('asin')
  const hasImageParam = url.searchParams.get('image')
  const search = url.searchParams.get('q')
  const sort = url.searchParams.get('sort') as ItemFilters['sort']
  const direction = url.searchParams.get('dir') as ItemFilters['direction']
  const page = parseInt(url.searchParams.get('page') || '1', 10)

  const filters: ItemFilters = {
    category: category || undefined,
    unitName: unitName || undefined,
    hasAsin: hasAsinParam === '1' ? true : hasAsinParam === '0' ? false : undefined,
    hasImage: hasImageParam === '1' ? true : hasImageParam === '0' ? false : undefined,
    search: search || undefined,
    sort: sort || 'name',
    direction: direction || 'asc',
    page,
    limit: 25,
  }

  // Fetch data in parallel
  const [itemsData, categories, unitNames] = await Promise.all([
    getItemsWithFilters(db, filters),
    getDistinctCategories(db),
    getDistinctUnitNames(db),
  ])

  return {
    ...itemsData,
    categories,
    unitNames,
    filters: {
      category: filters.category,
      unitName: filters.unitName,
      hasAsin: filters.hasAsin,
      hasImage: filters.hasImage,
      search: filters.search,
      sort: filters.sort,
      direction: filters.direction,
    },
  }
}

export async function action({ request, context }: ActionFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'delete') {
    const id = parseInt(formData.get('id') as string, 10)
    if (!isNaN(id)) {
      await deleteItem(db, id)
    }
    return { success: true, deleted: id }
  }

  if (intent === 'delete-bulk') {
    const idsString = formData.get('ids') as string
    const ids = idsString
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id))
    if (ids.length > 0) {
      await deleteItemsBulk(db, ids)
    }
    return { success: true, deleted: ids }
  }

  if (intent === 'set-category') {
    const idsString = formData.get('ids') as string
    const category = formData.get('category') as string
    const ids = idsString
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id))
    if (ids.length > 0 && category) {
      await updateItemsCategory(db, ids, category)
    }
    return { success: true, updated: ids }
  }

  return { success: false }
}

export default function AdminItemsListPage() {
  const {
    items,
    total,
    page,
    totalPages,
    categories,
    unitNames,
    filters,
  } = useLoaderData<typeof loader>()

  const [searchParams, setSearchParams] = useSearchParams()
  const deleteFetcher = useFetcher()
  const bulkDeleteFetcher = useFetcher()
  const setCategoryFetcher = useFetcher()

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [bulkCategory, setBulkCategory] = useState('')

  // Clear selections when page changes or items are deleted/updated
  useEffect(() => {
    setSelectedIds(new Set())
  }, [items])

  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams)
    if (value === null || value === '') {
      newParams.delete(key)
    } else {
      newParams.set(key, value)
    }
    // Reset to page 1 when filters change
    if (key !== 'page') {
      newParams.delete('page')
    }
    setSearchParams(newParams)
  }

  const toggleSort = (column: string) => {
    const currentSort = filters.sort
    const currentDir = filters.direction
    const newParams = new URLSearchParams(searchParams)

    if (currentSort === column) {
      newParams.set('dir', currentDir === 'asc' ? 'desc' : 'asc')
    } else {
      newParams.set('sort', column)
      newParams.set('dir', 'asc')
    }
    newParams.delete('page')
    setSearchParams(newParams)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)))
    }
  }

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleDelete = (id: number) => {
    deleteFetcher.submit({ intent: 'delete', id: id.toString() }, { method: 'post' })
    setDeleteConfirmId(null)
  }

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds).join(',')
    bulkDeleteFetcher.submit({ intent: 'delete-bulk', ids }, { method: 'post' })
    setShowBulkDeleteConfirm(false)
  }

  const handleSetCategory = () => {
    if (!bulkCategory) return
    const ids = Array.from(selectedIds).join(',')
    setCategoryFetcher.submit(
      { intent: 'set-category', ids, category: bulkCategory },
      { method: 'post' }
    )
    setBulkCategory('')
  }

  const clearFilters = () => {
    setSearchParams(new URLSearchParams())
  }

  const hasActiveFilters =
    filters.category !== undefined ||
    filters.unitName !== undefined ||
    filters.hasAsin !== undefined ||
    filters.hasImage !== undefined ||
    filters.search !== undefined

  const SortIcon = ({ column }: { column: string }) => {
    if (filters.sort !== column) return <ArrowUpDown size={14} className="opacity-30" />
    return (
      <ArrowUpDown
        size={14}
        className={`text-accent ${filters.direction === 'desc' ? 'rotate-180' : ''}`}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Items</h2>
          <p className="text-text-secondary text-sm mt-1">
            {total} item{total !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden"
          >
            <Filter size={16} />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center">
                !
              </span>
            )}
          </Button>
          <Link to="/admin/items/new">
            <Button size="sm">
              <Plus size={16} />
              Add Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card variant="bordered" padding="md">
        <div className={`space-y-4 ${showFilters ? '' : 'hidden sm:block'}`}>
          {/* Search */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="Search items..."
                defaultValue={filters.search || ''}
                onChange={(e) => updateFilter('q', e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-bg-elevated border border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/50"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X size={16} />
                Clear
              </Button>
            )}
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-3">
            <div className="w-full sm:w-auto sm:min-w-[160px]">
              <Select
                value={filters.category || ''}
                onChange={(e) => updateFilter('category', e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>

            <div className="w-full sm:w-auto sm:min-w-[140px]">
              <Select
                value={filters.unitName || ''}
                onChange={(e) => updateFilter('unit', e.target.value)}
              >
                <option value="">All Units</option>
                {unitNames.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </div>

            <div className="w-full sm:w-auto sm:min-w-[140px]">
              <Select
                value={filters.hasAsin === true ? '1' : filters.hasAsin === false ? '0' : ''}
                onChange={(e) => updateFilter('asin', e.target.value)}
              >
                <option value="">Amazon ASIN</option>
                <option value="1">Has ASIN</option>
                <option value="0">No ASIN</option>
              </Select>
            </div>

            <div className="w-full sm:w-auto sm:min-w-[140px]">
              <Select
                value={filters.hasImage === true ? '1' : filters.hasImage === false ? '0' : ''}
                onChange={(e) => updateFilter('image', e.target.value)}
              >
                <option value="">Image Status</option>
                <option value="1">Has Image</option>
                <option value="0">No Image</option>
              </Select>
            </div>

            <div className="w-full sm:w-auto sm:min-w-[160px]">
              <Select
                value={`${filters.sort || 'name'}-${filters.direction || 'asc'}`}
                onChange={(e) => {
                  const [sort, dir] = e.target.value.split('-')
                  const newParams = new URLSearchParams(searchParams)
                  newParams.set('sort', sort)
                  newParams.set('dir', dir)
                  newParams.delete('page')
                  setSearchParams(newParams)
                }}
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="category-asc">Category (A-Z)</option>
                <option value="category-desc">Category (Z-A)</option>
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <Card variant="elevated" padding="sm" className="sticky top-14 lg:top-14 z-30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-sm text-text-secondary">
              {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {/* Set Category */}
              <div className="flex items-center gap-2">
                <Select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="w-[140px] h-8 text-sm"
                >
                  <option value="">Set Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Select>
                {bulkCategory && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSetCategory}
                    loading={setCategoryFetcher.state === 'submitting'}
                  >
                    <Tag size={16} />
                    Apply
                  </Button>
                )}
              </div>
              <Link
                to={`/admin/items/merge?ids=${Array.from(selectedIds).join(',')}`}
              >
                <Button variant="secondary" size="sm">
                  <Merge size={16} />
                  Merge Selected
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowBulkDeleteConfirm(true)}
                loading={bulkDeleteFetcher.state === 'submitting'}
              >
                <Trash2 size={16} />
                Delete Selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Bulk Delete Confirmation */}
      {showBulkDeleteConfirm && (
        <Card variant="elevated" padding="md" className="border border-error/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-text-primary">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-error">{selectedIds.size}</span> items?
              This will also delete all associated prices and packing list entries.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBulkDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleBulkDelete}
                loading={bulkDeleteFetcher.state === 'submitting'}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Items Table */}
      <Card variant="bordered" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-elevated/50">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === items.length && items.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-border bg-bg-elevated text-accent focus:ring-accent/20"
                  />
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => toggleSort('name')}
                    className="flex items-center gap-1.5 text-xs font-medium text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors"
                  >
                    Name
                    <SortIcon column="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left hidden md:table-cell">
                  <button
                    onClick={() => toggleSort('category')}
                    className="flex items-center gap-1.5 text-xs font-medium text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors"
                  >
                    Category
                    <SortIcon column="category" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Unit
                  </span>
                </th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Status
                  </span>
                </th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    <DollarSign size={12} className="inline" /> Prices
                  </span>
                </th>
                <th className="px-4 py-3 text-center hidden md:table-cell">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    <List size={12} className="inline" /> Lists
                  </span>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                    No items found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-bg-subtle/50 transition-colors ${
                      selectedIds.has(item.id) ? 'bg-accent/5' : ''
                    } ${deleteConfirmId === item.id ? 'bg-error/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="w-4 h-4 rounded border-border bg-bg-elevated text-accent focus:ring-accent/20"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-text-primary">{item.name}</p>
                        {item.brand_preference && (
                          <p className="text-xs text-text-muted mt-0.5">
                            {item.brand_preference}
                          </p>
                        )}
                        {/* Mobile-only category */}
                        <p className="text-xs text-text-muted mt-0.5 md:hidden">
                          {item.category || 'Uncategorized'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-text-secondary">
                        {item.category || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-text-secondary">
                        {item.unit_name || 'each'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-1.5">
                        {item.asin && (
                          <span title={`ASIN: ${item.asin}`}>
                            <Badge variant="info" size="sm">
                              <ShoppingCart size={12} />
                              ASIN
                            </Badge>
                          </span>
                        )}
                        {item.image_url && (
                          <Badge variant="success" size="sm">
                            <Image size={12} />
                            Img
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex justify-center">
                        <Badge variant="outline" size="sm">
                          {item.price_count}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex justify-center">
                        <Badge variant="outline" size="sm">
                          {item.list_count}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {deleteConfirmId === item.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            loading={deleteFetcher.state === 'submitting'}
                          >
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/admin/items/${item.id}`}>
                            <Button variant="ghost" size="icon">
                              <Edit2 size={16} />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(item.id)}
                          >
                            <Trash2 size={16} className="text-error" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Showing {(page - 1) * 25 + 1}-{Math.min(page * 25, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateFilter('page', (page - 1).toString())}
            >
              <ChevronLeft size={16} />
              Prev
            </Button>
            <span className="text-sm text-text-secondary px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateFilter('page', (page + 1).toString())}
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
