import { useState, useEffect } from 'react'
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData, useSearchParams, Link, useFetcher } from 'react-router'
import {
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  ArrowUpDown,
  DollarSign,
  Package,
  Store,
  ThumbsUp,
  ThumbsDown,
  Clock,
} from 'lucide-react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Select } from '~/components/ui/select'
import {
  getDB,
  getPricesWithFilters,
  deletePrice,
  bulkVerifyPrices,
  bulkDeletePrices,
} from '~/lib/db.server'
import { formatPrice } from '~/lib/format'
import type { PriceFilters } from '~/lib/db.server'

export const meta: MetaFunction = () => {
  return [{ title: 'Prices - Admin - CPL' }]
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const url = new URL(request.url)

  // Parse filter params
  const itemQuery = url.searchParams.get('item')
  const storeQuery = url.searchParams.get('store')
  const inStockParam = url.searchParams.get('stock')
  const daysAgoParam = url.searchParams.get('days')
  const sortBy = url.searchParams.get('sort') as PriceFilters['sortBy']
  const page = parseInt(url.searchParams.get('page') || '1', 10)

  const filters: PriceFilters = {
    itemQuery: itemQuery || undefined,
    storeQuery: storeQuery || undefined,
    inStock: inStockParam === '1' ? true : inStockParam === '0' ? false : undefined,
    daysAgo: daysAgoParam ? parseInt(daysAgoParam, 10) : undefined,
    sortBy: sortBy || 'newest',
    page,
    limit: 25,
  }

  const pricesData = await getPricesWithFilters(db, filters)

  return {
    ...pricesData,
    filters: {
      itemQuery: filters.itemQuery,
      storeQuery: filters.storeQuery,
      inStock: filters.inStock,
      daysAgo: filters.daysAgo,
      sortBy: filters.sortBy,
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
      await deletePrice(db, id)
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
      await bulkDeletePrices(db, ids)
    }
    return { success: true, deleted: ids }
  }

  if (intent === 'verify-bulk') {
    const idsString = formData.get('ids') as string
    const ids = idsString
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id))
    if (ids.length > 0) {
      await bulkVerifyPrices(db, ids)
    }
    return { success: true, verified: ids }
  }

  return { success: false }
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export default function AdminPricesListPage() {
  const {
    prices,
    total,
    page,
    totalPages,
    filters,
  } = useLoaderData<typeof loader>()

  const [searchParams, setSearchParams] = useSearchParams()
  const deleteFetcher = useFetcher()
  const bulkDeleteFetcher = useFetcher()
  const bulkVerifyFetcher = useFetcher()

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  // Clear selections when page changes or prices are modified
  useEffect(() => {
    setSelectedIds(new Set())
  }, [prices])

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

  const toggleSelectAll = () => {
    if (selectedIds.size === prices.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(prices.map((p) => p.id)))
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

  const handleBulkVerify = () => {
    const ids = Array.from(selectedIds).join(',')
    bulkVerifyFetcher.submit({ intent: 'verify-bulk', ids }, { method: 'post' })
  }

  const clearFilters = () => {
    setSearchParams(new URLSearchParams())
  }

  const hasActiveFilters =
    filters.itemQuery !== undefined ||
    filters.storeQuery !== undefined ||
    filters.inStock !== undefined ||
    filters.daysAgo !== undefined

  const SortIcon = ({ sortKey }: { sortKey: string }) => {
    if (filters.sortBy !== sortKey) return <ArrowUpDown size={14} className="opacity-30" />
    return (
      <ArrowUpDown
        size={14}
        className="text-accent"
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Prices</h2>
          <p className="text-text-secondary text-sm mt-1">
            {total} price{total !== 1 ? 's' : ''} total
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
        </div>
      </div>

      {/* Search and Filters */}
      <Card variant="bordered" padding="md">
        <div className={`space-y-4 ${showFilters ? '' : 'hidden sm:block'}`}>
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Package
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="Search by item name..."
                defaultValue={filters.itemQuery || ''}
                onChange={(e) => updateFilter('item', e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-bg-elevated border border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/50"
              />
            </div>
            <div className="flex-1 relative">
              <Store
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="Search by store name..."
                defaultValue={filters.storeQuery || ''}
                onChange={(e) => updateFilter('store', e.target.value)}
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
            <div className="w-full sm:w-auto sm:min-w-[140px]">
              <Select
                value={filters.inStock === true ? '1' : filters.inStock === false ? '0' : ''}
                onChange={(e) => updateFilter('stock', e.target.value)}
              >
                <option value="">Stock Status</option>
                <option value="1">In Stock</option>
                <option value="0">Out of Stock</option>
              </Select>
            </div>

            <div className="w-full sm:w-auto sm:min-w-[160px]">
              <Select
                value={filters.daysAgo?.toString() || ''}
                onChange={(e) => updateFilter('days', e.target.value)}
              >
                <option value="">All Time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </Select>
            </div>

            <div className="w-full sm:w-auto sm:min-w-[160px]">
              <Select
                value={filters.sortBy || 'newest'}
                onChange={(e) => updateFilter('sort', e.target.value)}
              >
                <option value="newest">Verified (Newest)</option>
                <option value="oldest">Verified (Oldest)</option>
                <option value="price_asc">Price (Low to High)</option>
                <option value="price_desc">Price (High to Low)</option>
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
              {selectedIds.size} price{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkVerify}
                loading={bulkVerifyFetcher.state === 'submitting'}
              >
                <CheckCircle size={16} />
                Verify Selected
              </Button>
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
              <span className="font-semibold text-error">{selectedIds.size}</span> prices?
              This will also delete all associated votes.
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

      {/* Prices Table */}
      <Card variant="bordered" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-elevated/50">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === prices.length && prices.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-border bg-bg-elevated text-accent focus:ring-accent/20"
                  />
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Item
                  </span>
                </th>
                <th className="px-4 py-3 text-left hidden md:table-cell">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Store
                  </span>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Price
                  </span>
                </th>
                <th className="px-4 py-3 text-center hidden lg:table-cell">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Package
                  </span>
                </th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Stock
                  </span>
                </th>
                <th className="px-4 py-3 text-center hidden lg:table-cell">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Votes
                  </span>
                </th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Verified
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
              {prices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-text-muted">
                    No prices found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                prices.map((price) => (
                  <tr
                    key={price.id}
                    className={`hover:bg-bg-subtle/50 transition-colors ${
                      selectedIds.has(price.id) ? 'bg-accent/5' : ''
                    } ${deleteConfirmId === price.id ? 'bg-error/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(price.id)}
                        onChange={() => toggleSelect(price.id)}
                        className="w-4 h-4 rounded border-border bg-bg-elevated text-accent focus:ring-accent/20"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-text-primary">{price.item_name}</p>
                        {/* Mobile-only store */}
                        <p className="text-xs text-text-muted mt-0.5 md:hidden">
                          {price.store_name}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-text-secondary">{price.store_name}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-medium text-text-primary">
                        {formatPrice(price.price)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex justify-center">
                        {price.package_qty > 1 || price.package_name ? (
                          <Badge variant="outline" size="sm">
                            {price.package_name || `${price.package_qty}x`}
                          </Badge>
                        ) : (
                          <span className="text-text-muted text-sm">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex justify-center">
                        {price.in_stock === 1 ? (
                          <Badge variant="success" size="sm">
                            In Stock
                          </Badge>
                        ) : (
                          <Badge variant="error" size="sm">
                            Out
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center justify-center gap-2">
                        <span className="flex items-center gap-0.5 text-sm">
                          <ThumbsUp size={12} className="text-success" />
                          <span className="text-text-secondary">{price.upvotes}</span>
                        </span>
                        <span className="flex items-center gap-0.5 text-sm">
                          <ThumbsDown size={12} className="text-error" />
                          <span className="text-text-secondary">{price.downvotes}</span>
                        </span>
                        <Badge
                          variant={price.vote_score > 0 ? 'success' : price.vote_score < 0 ? 'error' : 'outline'}
                          size="sm"
                        >
                          {price.vote_score > 0 ? '+' : ''}{price.vote_score}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-text-muted">
                        <Clock size={12} />
                        {formatRelativeDate(price.last_verified)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {deleteConfirmId === price.id ? (
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
                            onClick={() => handleDelete(price.id)}
                            loading={deleteFetcher.state === 'submitting'}
                          >
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/admin/prices/${price.id}`}>
                            <Button variant="ghost" size="icon">
                              <Edit2 size={16} />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(price.id)}
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
