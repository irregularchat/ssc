import { useState } from 'react'
import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { Link, useLoaderData, useSearchParams } from 'react-router'
import {
  GraduationCap,
  MapPin,
  ChevronRight,
  Package,
  Search,
  Star,
  ArrowRight,
} from 'lucide-react'
import { Layout } from '~/components/layout'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Select } from '~/components/ui/select'
import {
  getDB,
  getSchoolsWithBases,
  getSchoolPackingLists,
} from '~/lib/db.server'
import type { School, PackingList } from '~/types/database'
import type { SchoolBaseRow } from '~/lib/db.server'

export const meta: MetaFunction = () => {
  return [
    { title: 'Browse by School - Community Packing List' },
    { name: 'description', content: 'Find packing lists by military school and training location.' },
  ]
}

interface SchoolWithBases extends School {
  bases: SchoolBaseRow[]
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const url = new URL(request.url)

  const schoolId = url.searchParams.get('school')
  const baseId = url.searchParams.get('base')

  const schoolsWithBases = await getSchoolsWithBases(db)

  // If school selected, fetch its packing lists
  let packingLists: PackingList[] = []
  if (schoolId) {
    packingLists = await getSchoolPackingLists(
      db,
      parseInt(schoolId, 10),
      baseId ? parseInt(baseId, 10) : undefined
    )
  }

  return { schoolsWithBases, packingLists }
}

const BRANCH_COLORS: Record<string, string> = {
  Army: 'bg-success/10 text-success border-success/20',
  Navy: 'bg-info/10 text-info border-info/20',
  'Air Force': 'bg-info/10 text-info border-info/20',
  Marines: 'bg-error/10 text-error border-error/20',
  'Coast Guard': 'bg-warning/10 text-warning border-warning/20',
  'Space Force': 'bg-accent/10 text-accent border-accent/20',
  Joint: 'bg-text-muted/10 text-text-secondary border-border',
}

export default function SchoolsPage() {
  const { schoolsWithBases, packingLists } = useLoaderData<typeof loader>()
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedSchoolId = searchParams.get('school')
  const selectedBaseId = searchParams.get('base')

  const selectedSchool = schoolsWithBases.find(
    (s: SchoolWithBases) => s.id.toString() === selectedSchoolId
  )

  const [searchQuery, setSearchQuery] = useState('')

  // Filter schools by search
  const filteredSchools = searchQuery
    ? schoolsWithBases.filter(
        (s: SchoolWithBases) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.abbreviation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.branch?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : schoolsWithBases

  // Group schools by branch
  const schoolsByBranch = filteredSchools.reduce(
    (acc: Record<string, SchoolWithBases[]>, school: SchoolWithBases) => {
      const branch = school.branch || 'Other'
      if (!acc[branch]) acc[branch] = []
      acc[branch].push(school)
      return acc
    },
    {}
  )

  const handleSelectSchool = (schoolId: string) => {
    const newParams = new URLSearchParams()
    newParams.set('school', schoolId)
    setSearchParams(newParams)
  }

  const handleSelectBase = (baseId: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (baseId) {
      newParams.set('base', baseId)
    } else {
      newParams.delete('base')
    }
    setSearchParams(newParams)
  }

  const handleClearSelection = () => {
    setSearchParams(new URLSearchParams())
  }

  return (
    <Layout>
      <div className="min-h-screen pb-20 md:pb-0">
        {/* Header */}
        <div className="mb-6 pt-4">
          <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-2">
            Browse by School
          </h1>
          <p className="text-text-secondary">
            Find packing lists for your military school and training location.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Schools List */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="Search schools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-bg-subtle border border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/50"
              />
            </div>

            {/* School List by Branch */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {Object.entries(schoolsByBranch).map(([branch, schools]) => (
                <div key={branch}>
                  <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 px-1">
                    {branch}
                  </h3>
                  <div className="space-y-1">
                    {schools.map((school: SchoolWithBases) => (
                      <button
                        key={school.id}
                        onClick={() => handleSelectSchool(school.id.toString())}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedSchoolId === school.id.toString()
                            ? 'bg-accent/10 border-accent/30 text-text-primary'
                            : 'bg-bg-subtle border-border hover:bg-bg-elevated hover:border-border-hover text-text-secondary'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <GraduationCap size={16} className="flex-shrink-0" />
                            <span className="font-medium truncate">{school.name}</span>
                          </div>
                          {school.bases.length > 0 && (
                            <Badge variant="outline" size="sm">
                              {school.bases.length} loc
                            </Badge>
                          )}
                        </div>
                        {school.abbreviation && (
                          <p className="text-xs text-text-muted mt-1 ml-6">
                            {school.abbreviation}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {Object.keys(schoolsByBranch).length === 0 && (
                <p className="text-center text-text-muted py-8">
                  No schools found matching "{searchQuery}"
                </p>
              )}
            </div>
          </div>

          {/* Selected School Details */}
          <div className="lg:col-span-2">
            {selectedSchool ? (
              <Card variant="bordered" padding="lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-semibold text-text-primary">
                        {selectedSchool.name}
                      </h2>
                      {selectedSchool.branch && (
                        <Badge
                          variant="outline"
                          size="sm"
                          className={BRANCH_COLORS[selectedSchool.branch]}
                        >
                          {selectedSchool.branch}
                        </Badge>
                      )}
                    </div>
                    {selectedSchool.description && (
                      <p className="text-text-secondary text-sm">
                        {selectedSchool.description}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                    Change
                  </Button>
                </div>

                {/* Location Picker */}
                {selectedSchool.bases.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      <MapPin size={14} className="inline mr-1" />
                      Select Your Training Location
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSelectBase('')}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          !selectedBaseId
                            ? 'bg-accent/10 border-accent/30'
                            : 'bg-bg-subtle border-border hover:bg-bg-elevated'
                        }`}
                      >
                        <p className="font-medium text-text-primary">Any Location</p>
                        <p className="text-xs text-text-muted">Generic list for all locations</p>
                      </button>
                      {selectedSchool.bases.map((sb: SchoolBaseRow) => (
                        <button
                          key={sb.base_id}
                          onClick={() => handleSelectBase(sb.base_id.toString())}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            selectedBaseId === sb.base_id.toString()
                              ? 'bg-accent/10 border-accent/30'
                              : 'bg-bg-subtle border-border hover:bg-bg-elevated'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {sb.is_primary === 1 && (
                              <Star size={12} className="text-warning fill-warning" />
                            )}
                            <p className="font-medium text-text-primary">{sb.base_name}</p>
                            {sb.base_state && (
                              <span className="text-text-muted text-sm">({sb.base_state})</span>
                            )}
                          </div>
                          {sb.notes && (
                            <p className="text-xs text-text-muted mt-1">{sb.notes}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Packing Lists */}
                <div>
                  <h3 className="text-sm font-medium text-text-secondary mb-3">
                    Available Packing Lists
                  </h3>
                  {packingLists.length > 0 ? (
                    <div className="space-y-2">
                      {packingLists.map((list: PackingList) => (
                        <Link
                          key={list.id}
                          to={`/list/${list.id}/shop`}
                          className="flex items-center justify-between p-4 rounded-lg bg-bg-subtle border border-border hover:bg-bg-elevated hover:border-border-hover transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                              <Package size={20} className="text-accent" />
                            </div>
                            <div>
                              <p className="font-medium text-text-primary group-hover:text-accent transition-colors">
                                {list.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {list.type && (
                                  <Badge variant="secondary" size="sm">{list.type}</Badge>
                                )}
                                {list.base_id && (
                                  <Badge variant="info" size="sm">
                                    <MapPin size={10} />
                                    Location-specific
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <ArrowRight
                            size={16}
                            className="text-text-muted group-hover:text-accent transition-colors"
                          />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 rounded-lg bg-bg-subtle border border-border">
                      <Package size={32} className="mx-auto text-text-muted mb-3" />
                      <p className="text-text-secondary">
                        No packing lists available for this selection yet.
                      </p>
                      <p className="text-sm text-text-muted mt-1">
                        Be the first to create one!
                      </p>
                      <Link to="/list/create" className="mt-3 inline-block">
                        <Button size="sm">Create List</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card variant="bordered" padding="lg" className="h-full min-h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <GraduationCap size={48} className="mx-auto text-text-muted mb-4" />
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    Select a School
                  </h3>
                  <p className="text-text-secondary max-w-sm">
                    Choose a military school from the list to see available packing lists
                    and training locations.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
