import { useState, useEffect } from 'react'
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData, useSearchParams, Link, useFetcher, Form } from 'react-router'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Globe,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Merge,
  X,
  Filter,
  ArrowUpDown,
} from 'lucide-react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Select } from '~/components/ui/select'
import {
  getDB,
  getStoresWithFilters,
  getBases,
  getDistinctStoreStates,
  getDistinctStoreTypes,
  deleteStore,
  deleteStoresBulk,
} from '~/lib/db.server'
import type { StoreFilters } from '~/lib/db.server'
import type { Base } from '~/types/database'

export const meta: MetaFunction = () => {
  return [{ title: 'Stores - Admin - CPL' }]
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const url = new URL(request.url)

  // Parse filter params
  const baseId = url.searchParams.get('base')
  const state = url.searchParams.get('state')
  const storeType = url.searchParams.get('type')
  const isOnlineParam = url.searchParams.get('online')
  const hasMilitaryParam = url.searchParams.get('military')
  const search = url.searchParams.get('q')
  const sort = url.searchParams.get('sort') as StoreFilters['sort']
  const direction = url.searchParams.get('dir') as StoreFilters['direction']
  const page = parseInt(url.searchParams.get('page') || '1', 10)

  const filters: StoreFilters = {
    baseId: baseId ? parseInt(baseId, 10) : undefined,
    state: state || undefined,
    storeType: storeType || undefined,
    isOnline: isOnlineParam === '1' ? true : isOnlineParam === '0' ? false : undefined,
    hasMilitaryDiscount: hasMilitaryParam === '1' ? true : hasMilitaryParam === '0' ? false : undefined,
    search: search || undefined,
    sort: sort || 'name',
    direction: direction || 'asc',
    page,
    limit: 25,
  }

  // Fetch data in parallel
  const [storesData, bases, states, storeTypes] = await Promise.all([
    getStoresWithFilters(db, filters),
    getBases(db),
    getDistinctStoreStates(db),
    getDistinctStoreTypes(db),
  ])

  return {
    ...storesData,
    bases,
    states,
    storeTypes,
    filters: {
      baseId: filters.baseId,
      state: filters.state,
      storeType: filters.storeType,
      isOnline: filters.isOnline,
      hasMilitaryDiscount: filters.hasMilitaryDiscount,
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
      await deleteStore(db, id)
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
      await deleteStoresBulk(db, ids)
    }
    return { success: true, deleted: ids }
  }

  return { success: false }
}

export default function AdminStoresListPage() {
  const {
    stores,
    total,
    page,
    totalPages,
    bases,
    states,
    storeTypes,
    filters,
  } = useLoaderData<typeof loader>()

  const [searchParams, setSearchParams] = useSearchParams()
  const deleteFetcher = useFetcher()
  const bulkDeleteFetcher = useFetcher()

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  // Clear selections when page changes or stores are deleted
  useEffect(() => {
    setSelectedIds(new Set())
  }, [stores])

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
    if (selectedIds.size === stores.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(stores.map((s) => s.id)))
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

  const clearFilters = () => {
    setSearchParams(new URLSearchParams())
  }

  const hasActiveFilters =
    filters.baseId !== undefined ||
    filters.state !== undefined ||
    filters.storeType !== undefined ||
    filters.isOnline !== undefined ||
    filters.hasMilitaryDiscount !== undefined ||
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
          <h2 className="text-2xl font-semibold text-text-primary">Stores</h2>
          <p className="text-text-secondary text-sm mt-1">
            {total} store{total !== 1 ? 's' : ''} total
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
          <Link to="/admin/stores/new">
            <Button size="sm">
              <Plus size={16} />
              Add Store
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
                placeholder="Search stores..."
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
                value={filters.baseId?.toString() || ''}
                onChange={(e) => updateFilter('base', e.target.value)}
              >
                <option value="">All Bases</option>
                {(bases as Base[]).map((base) => (
                  <option key={base.id} value={base.id}>
                    {base.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="w-full sm:w-auto sm:min-w-[140px]">
              <Select
                value={filters.state || ''}
                onChange={(e) => updateFilter('state', e.target.value)}
              >
                <option value="">All States</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </Select>
            </div>

            <div className="w-full sm:w-auto sm:min-w-[160px]">
              <Select
                value={filters.storeType || ''}
                onChange={(e) => updateFilter('type', e.target.value)}
              >
                <option value="">All Types</option>
                {storeTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>

            <div className="w-full sm:w-auto sm:min-w-[140px]">
              <Select
                value={filters.isOnline === true ? '1' : filters.isOnline === false ? '0' : ''}
                onChange={(e) => updateFilter('online', e.target.value)}
              >
                <option value="">Online Status</option>
                <option value="1">Online Only</option>
                <option value="0">Physical Only</option>
              </Select>
            </div>

            <div className="w-full sm:w-auto sm:min-w-[160px]">
              <Select
                value={
                  filters.hasMilitaryDiscount === true
                    ? '1'
                    : filters.hasMilitaryDiscount === false
                      ? '0'
                      : ''
                }
                onChange={(e) => updateFilter('military', e.target.value)}
              >
                <option value="">Military Discount</option>
                <option value="1">Has Discount</option>
                <option value="0">No Discount</option>
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
                <option value="city-asc">City (A-Z)</option>
                <option value="city-desc">City (Z-A)</option>
                <option value="state-asc">State (A-Z)</option>
                <option value="state-desc">State (Z-A)</option>
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
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              {selectedIds.size} store{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Link
                to={`/admin/stores/merge?ids=${Array.from(selectedIds).join(',')}`}
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
              <span className="font-semibold text-error">{selectedIds.size}</span> stores?
              This will also delete all associated prices.
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

      {/* Stores Table */}
      <Card variant="bordered" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-elevated/50">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === stores.length && stores.length > 0}
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
                    onClick={() => toggleSort('city')}
                    className="flex items-center gap-1.5 text-xs font-medium text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors"
                  >
                    City
                    <SortIcon column="city" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left hidden md:table-cell">
                  <button
                    onClick={() => toggleSort('state')}
                    className="flex items-center gap-1.5 text-xs font-medium text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors"
                  >
                    State
                    <SortIcon column="state" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Type
                  </span>
                </th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Status
                  </span>
                </th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Prices
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
              {stores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                    No stores found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr
                    key={store.id}
                    className={`hover:bg-bg-subtle/50 transition-colors ${
                      selectedIds.has(store.id) ? 'bg-accent/5' : ''
                    } ${deleteConfirmId === store.id ? 'bg-error/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(store.id)}
                        onChange={() => toggleSelect(store.id)}
                        className="w-4 h-4 rounded border-border bg-bg-elevated text-accent focus:ring-accent/20"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-text-primary">{store.name}</p>
                        {store.base_name && (
                          <p className="text-xs text-text-muted mt-0.5">
                            {store.base_name}
                          </p>
                        )}
                        {/* Mobile-only location */}
                        <p className="text-xs text-text-muted mt-0.5 md:hidden">
                          {store.city && store.state
                            ? `${store.city}, ${store.state}`
                            : store.city || store.state || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-text-secondary">
                        {store.city || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-text-secondary">
                        {store.state || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-text-secondary">
                        {store.store_type || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-1.5">
                        {store.is_online === 1 && (
                          <Badge variant="info" size="sm">
                            <Globe size={12} />
                            Online
                          </Badge>
                        )}
                        {store.accepts_military_discount === 1 && (
                          <Badge variant="success" size="sm">
                            <ShieldCheck size={12} />
                            {store.military_discount_pct
                              ? `${store.military_discount_pct}%`
                              : 'Mil'}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex justify-center">
                        <Badge variant="outline" size="sm">
                          {store.price_count}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {deleteConfirmId === store.id ? (
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
                            onClick={() => handleDelete(store.id)}
                            loading={deleteFetcher.state === 'submitting'}
                          >
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/admin/stores/${store.id}`}>
                            <Button variant="ghost" size="icon">
                              <Edit2 size={16} />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(store.id)}
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
