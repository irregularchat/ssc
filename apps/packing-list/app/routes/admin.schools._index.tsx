import { useState, useEffect } from 'react'
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData, useSearchParams, Link, useFetcher } from 'react-router'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  ArrowUpDown,
  GraduationCap,
  FileText,
} from 'lucide-react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Select } from '~/components/ui/select'
import {
  getDB,
  getSchoolsWithFilters,
  getDistinctSchoolBranches,
  deleteSchool,
} from '~/lib/db.server'
import type { SchoolFilters } from '~/lib/db.server'

export const meta: MetaFunction = () => {
  return [{ title: 'Schools - Admin - CPL' }]
}

const BRANCH_OPTIONS = [
  'Army',
  'Navy',
  'Air Force',
  'Marines',
  'Coast Guard',
  'Space Force',
  'Joint',
]

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const url = new URL(request.url)

  const branch = url.searchParams.get('branch')
  const search = url.searchParams.get('q')
  const sort = url.searchParams.get('sort') as SchoolFilters['sort']
  const direction = url.searchParams.get('dir') as SchoolFilters['direction']
  const page = parseInt(url.searchParams.get('page') || '1', 10)

  const filters: SchoolFilters = {
    branch: branch || undefined,
    search: search || undefined,
    sort: sort || 'name',
    direction: direction || 'asc',
    page,
    limit: 25,
  }

  const [schoolsData, branches] = await Promise.all([
    getSchoolsWithFilters(db, filters),
    getDistinctSchoolBranches(db),
  ])

  return {
    ...schoolsData,
    branches: branches.length > 0 ? branches : BRANCH_OPTIONS,
    filters: {
      branch: filters.branch,
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
      await deleteSchool(db, id)
    }
    return { success: true, deleted: id }
  }

  return { success: false }
}

export default function AdminSchoolsListPage() {
  const { schools, total, page, totalPages, branches, filters } =
    useLoaderData<typeof loader>()

  const [searchParams, setSearchParams] = useSearchParams()
  const deleteFetcher = useFetcher()

  const [showFilters, setShowFilters] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams)
    if (value === null || value === '') {
      newParams.delete(key)
    } else {
      newParams.set(key, value)
    }
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

  const handleDelete = (id: number) => {
    deleteFetcher.submit({ intent: 'delete', id: id.toString() }, { method: 'post' })
    setDeleteConfirmId(null)
  }

  const clearFilters = () => {
    setSearchParams(new URLSearchParams())
  }

  const hasActiveFilters = filters.branch !== undefined || filters.search !== undefined

  const SortIcon = ({ column }: { column: string }) => {
    if (filters.sort !== column) return <ArrowUpDown size={14} className="opacity-30" />
    return (
      <ArrowUpDown
        size={14}
        className={`text-accent ${filters.direction === 'desc' ? 'rotate-180' : ''}`}
      />
    )
  }

  const getBranchColor = (branch: string | null) => {
    switch (branch) {
      case 'Army':
        return 'success'
      case 'Navy':
        return 'info'
      case 'Air Force':
        return 'info'
      case 'Marines':
        return 'error'
      case 'Coast Guard':
        return 'warning'
      case 'Space Force':
        return 'outline'
      case 'Joint':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Military Schools</h2>
          <p className="text-text-secondary text-sm mt-1">
            {total} school{total !== 1 ? 's' : ''} total
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
          <Link to="/admin/schools/new">
            <Button size="sm">
              <Plus size={16} />
              Add School
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
                placeholder="Search schools..."
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
                value={filters.branch || ''}
                onChange={(e) => updateFilter('branch', e.target.value)}
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
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
                <option value="branch-asc">Branch (A-Z)</option>
                <option value="branch-desc">Branch (Z-A)</option>
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Schools Table */}
      <Card variant="bordered" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-elevated/50">
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
                    onClick={() => toggleSort('branch')}
                    className="flex items-center gap-1.5 text-xs font-medium text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors"
                  >
                    Branch
                    <SortIcon column="branch" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Location
                  </span>
                </th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Packing Lists
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
              {schools.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-text-muted">
                    No schools found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                schools.map((school) => (
                  <tr
                    key={school.id}
                    className={`hover:bg-bg-subtle/50 transition-colors ${
                      deleteConfirmId === school.id ? 'bg-error/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <GraduationCap size={16} className="text-text-muted" />
                          <p className="font-medium text-text-primary">{school.name}</p>
                        </div>
                        {school.abbreviation && (
                          <p className="text-xs text-text-muted mt-0.5 ml-6">
                            {school.abbreviation}
                          </p>
                        )}
                        {/* Mobile-only info */}
                        <div className="flex flex-wrap gap-1 mt-1 md:hidden ml-6">
                          {school.branch && (
                            <Badge variant={getBranchColor(school.branch) as any} size="sm">
                              {school.branch}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {school.branch ? (
                        <Badge variant={getBranchColor(school.branch) as any} size="sm">
                          {school.branch}
                        </Badge>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-text-secondary">
                        {school.location || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex justify-center">
                        <Badge variant="outline" size="sm">
                          <FileText size={12} />
                          {school.list_count}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {deleteConfirmId === school.id ? (
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
                            onClick={() => handleDelete(school.id)}
                            loading={deleteFetcher.state === 'submitting'}
                          >
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/admin/schools/${school.id}`}>
                            <Button variant="ghost" size="icon">
                              <Edit2 size={16} />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(school.id)}
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
