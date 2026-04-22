import { useState, useEffect } from 'react'
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData, useSearchParams, Link, useFetcher } from 'react-router'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  ArrowUpDown,
  Package,
  GraduationCap,
  MapPin,
} from 'lucide-react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Select } from '~/components/ui/select'
import {
  getDB,
  getPackingListsWithFilters,
  getSchools,
  getBases,
  getDistinctListTypes,
  deletePackingListById,
  deletePackingListsBulk,
  bulkUpdatePublicStatus,
} from '~/lib/db.server'
import type { PackingListFilters } from '~/lib/db.server'
import type { School, Base } from '~/types/database'

export const meta: MetaFunction = () => {
  return [{ title: 'Packing Lists - Admin - CPL' }]
}

const LIST_TYPES = [
  'Basic Training',
  'AIT',
  'Deployment',
  'PCS',
  'TDY',
  'School',
  'General',
]

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const url = new URL(request.url)

  // Parse filter params
  const schoolId = url.searchParams.get('school')
  const baseId = url.searchParams.get('base')
  const type = url.searchParams.get('type')
  const isPublicParam = url.searchParams.get('public')
  const search = url.searchParams.get('q')
  const sort = url.searchParams.get('sort') as PackingListFilters['sort']
  const direction = url.searchParams.get('dir') as PackingListFilters['direction']
  const page = parseInt(url.searchParams.get('page') || '1', 10)

  const filters: PackingListFilters = {
    schoolId: schoolId ? parseInt(schoolId, 10) : undefined,
    baseId: baseId ? parseInt(baseId, 10) : undefined,
    type: type || undefined,
    isPublic: isPublicParam === '1' ? true : isPublicParam === '0' ? false : undefined,
    search: search || undefined,
    sort: sort || 'name',
    direction: direction || 'asc',
    page,
    limit: 25,
  }

  // Fetch data in parallel
  const [listsData, schools, bases, listTypes] = await Promise.all([
    getPackingListsWithFilters(db, filters),
    getSchools(db, { all: true }),
    getBases(db),
    getDistinctListTypes(db),
  ])

  return {
    ...listsData,
    schools,
    bases,
    listTypes: listTypes.length > 0 ? listTypes : LIST_TYPES,
    filters: {
      schoolId: filters.schoolId,
      baseId: filters.baseId,
      type: filters.type,
      isPublic: filters.isPublic,
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
      await deletePackingListById(db, id)
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
      await deletePackingListsBulk(db, ids)
    }
    return { success: true, deleted: ids }
  }

  if (intent === 'publish-bulk') {
    const idsString = formData.get('ids') as string
    const ids = idsString
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id))
    if (ids.length > 0) {
      await bulkUpdatePublicStatus(db, ids, true)
    }
    return { success: true, published: ids }
  }

  if (intent === 'unpublish-bulk') {
    const idsString = formData.get('ids') as string
    const ids = idsString
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id))
    if (ids.length > 0) {
      await bulkUpdatePublicStatus(db, ids, false)
    }
    return { success: true, unpublished: ids }
  }

  return { success: false }
}

export default function AdminListsIndexPage() {
  const {
    lists,
    total,
    page,
    totalPages,
    schools,
    bases,
    listTypes,
    filters,
  } = useLoaderData<typeof loader>()

  const [searchParams, setSearchParams] = useSearchParams()
  const deleteFetcher = useFetcher()
  const bulkActionFetcher = useFetcher()

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  // Clear selections when page changes or lists are deleted
  useEffect(() => {
    setSelectedIds(new Set())
  }, [lists])

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
    if (selectedIds.size === lists.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(lists.map((l) => l.id)))
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
    bulkActionFetcher.submit({ intent: 'delete-bulk', ids }, { method: 'post' })
    setShowBulkDeleteConfirm(false)
  }

  const handleBulkPublish = () => {
    const ids = Array.from(selectedIds).join(',')
    bulkActionFetcher.submit({ intent: 'publish-bulk', ids }, { method: 'post' })
  }

  const handleBulkUnpublish = () => {
    const ids = Array.from(selectedIds).join(',')
    bulkActionFetcher.submit({ intent: 'unpublish-bulk', ids }, { method: 'post' })
  }

  const clearFilters = () => {
    setSearchParams(new URLSearchParams())
  }

  const hasActiveFilters =
    filters.schoolId !== undefined ||
    filters.baseId !== undefined ||
    filters.type !== undefined ||
    filters.isPublic !== undefined ||
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
          <h2 className="text-2xl font-semibold text-text-primary">Packing Lists</h2>
          <p className="text-text-secondary text-sm mt-1">
            {total} list{total !== 1 ? 's' : ''} total
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
          <Link to="/admin/lists/new">
            <Button size="sm">
              <Plus size={16} />
              New List
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
                placeholder="Search lists..."
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
                value={filters.schoolId?.toString() || ''}
                onChange={(e) => updateFilter('school', e.target.value)}
              >
                <option value="">All Schools</option>
                {(schools as School[]).map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </Select>
            </div>

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
                value={filters.type || ''}
                onChange={(e) => updateFilter('type', e.target.value)}
              >
                <option value="">All Types</option>
                {listTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>

            <div className="w-full sm:w-auto sm:min-w-[140px]">
              <Select
                value={filters.isPublic === true ? '1' : filters.isPublic === false ? '0' : ''}
                onChange={(e) => updateFilter('public', e.target.value)}
              >
                <option value="">All Visibility</option>
                <option value="1">Public Only</option>
                <option value="0">Private Only</option>
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
                <option value="type-asc">Type (A-Z)</option>
                <option value="type-desc">Type (Z-A)</option>
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
              {selectedIds.size} list{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkPublish}
                loading={bulkActionFetcher.state === 'submitting'}
              >
                <Eye size={16} />
                Publish
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkUnpublish}
                loading={bulkActionFetcher.state === 'submitting'}
              >
                <EyeOff size={16} />
                Unpublish
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowBulkDeleteConfirm(true)}
                loading={bulkActionFetcher.state === 'submitting'}
              >
                <Trash2 size={16} />
                Delete
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
              <span className="font-semibold text-error">{selectedIds.size}</span> lists?
              This will also delete all items in these lists.
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
                loading={bulkActionFetcher.state === 'submitting'}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Lists Table */}
      <Card variant="bordered" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-elevated/50">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === lists.length && lists.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-border bg-bg-elevated text-accent focus:ring-accent/20"
                  />
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams)
                      if (filters.sort === 'name') {
                        newParams.set('dir', filters.direction === 'asc' ? 'desc' : 'asc')
                      } else {
                        newParams.set('sort', 'name')
                        newParams.set('dir', 'asc')
                      }
                      newParams.delete('page')
                      setSearchParams(newParams)
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors"
                  >
                    Name
                    <SortIcon column="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left hidden md:table-cell">
                  <button
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams)
                      if (filters.sort === 'type') {
                        newParams.set('dir', filters.direction === 'asc' ? 'desc' : 'asc')
                      } else {
                        newParams.set('sort', 'type')
                        newParams.set('dir', 'asc')
                      }
                      newParams.delete('page')
                      setSearchParams(newParams)
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors"
                  >
                    Type
                    <SortIcon column="type" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    School / Base
                  </span>
                </th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Status
                  </span>
                </th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    <Package size={12} className="inline" /> Items
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
              {lists.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                    No packing lists found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                lists.map((list) => (
                  <tr
                    key={list.id}
                    className={`hover:bg-bg-subtle/50 transition-colors ${
                      selectedIds.has(list.id) ? 'bg-accent/5' : ''
                    } ${deleteConfirmId === list.id ? 'bg-error/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(list.id)}
                        onChange={() => toggleSelect(list.id)}
                        className="w-4 h-4 rounded border-border bg-bg-elevated text-accent focus:ring-accent/20"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <Link
                          to={`/admin/lists/${list.id}`}
                          className="font-medium text-text-primary hover:text-accent transition-colors"
                        >
                          {list.name}
                        </Link>
                        {list.contributor_name && (
                          <p className="text-xs text-text-muted mt-0.5">
                            by {list.contributor_name}
                          </p>
                        )}
                        {/* Mobile-only type */}
                        <p className="text-xs text-text-muted mt-0.5 md:hidden">
                          {list.type || 'General'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-text-secondary">
                        {list.type || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-col gap-0.5">
                        {list.school_name && (
                          <span className="text-sm text-text-secondary flex items-center gap-1">
                            <GraduationCap size={12} className="text-text-muted" />
                            {list.school_name}
                          </span>
                        )}
                        {list.base_name && (
                          <span className="text-sm text-text-secondary flex items-center gap-1">
                            <MapPin size={12} className="text-text-muted" />
                            {list.base_name}
                          </span>
                        )}
                        {!list.school_name && !list.base_name && (
                          <span className="text-sm text-text-muted">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center justify-center">
                        {list.is_public === 1 ? (
                          <Badge variant="success" size="sm">
                            <Eye size={12} />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="outline" size="sm">
                            <EyeOff size={12} />
                            Private
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex justify-center">
                        <Badge variant="outline" size="sm">
                          {list.item_count}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {deleteConfirmId === list.id ? (
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
                            onClick={() => handleDelete(list.id)}
                            loading={deleteFetcher.state === 'submitting'}
                          >
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/admin/lists/${list.id}`}>
                            <Button variant="ghost" size="icon">
                              <Edit2 size={16} />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(list.id)}
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
