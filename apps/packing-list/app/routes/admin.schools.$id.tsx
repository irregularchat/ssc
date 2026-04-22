import { useState } from 'react'
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData, useActionData, useNavigation, Form, Link, useFetcher } from 'react-router'
import { redirect } from 'react-router'
import {
  ArrowLeft,
  Save,
  Trash2,
  ExternalLink,
  GraduationCap,
  Globe,
  FileText,
  MapPin,
  Plus,
  Star,
  X,
} from 'lucide-react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select } from '~/components/ui/select'
import { Badge } from '~/components/ui/badge'
import {
  getDB,
  getSchoolById,
  updateSchool,
  deleteSchool,
  getPackingListsBySchoolId,
  getSchoolBases,
  getBases,
  addSchoolBase,
  removeSchoolBase,
  setSchoolPrimaryBase,
} from '~/lib/db.server'
import type { PackingList, Base } from '~/types/database'
import type { SchoolBaseRow } from '~/lib/db.server'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const schoolName = data?.school?.name || 'School'
  return [{ title: `${schoolName} - Edit School - Admin - CPL` }]
}

const BRANCH_OPTIONS = [
  { value: 'Army', label: 'Army' },
  { value: 'Navy', label: 'Navy' },
  { value: 'Air Force', label: 'Air Force' },
  { value: 'Marines', label: 'Marines' },
  { value: 'Coast Guard', label: 'Coast Guard' },
  { value: 'Space Force', label: 'Space Force' },
  { value: 'Joint', label: 'Joint' },
]

export async function loader({ params, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const id = parseInt(params.id!, 10)

  if (isNaN(id)) {
    throw new Response('Invalid school ID', { status: 400 })
  }

  const [school, packingLists, schoolBases, allBases] = await Promise.all([
    getSchoolById(db, id),
    getPackingListsBySchoolId(db, id),
    getSchoolBases(db, id),
    getBases(db),
  ])

  if (!school) {
    throw new Response('School not found', { status: 404 })
  }

  // Filter out bases already linked to this school
  const linkedBaseIds = new Set(schoolBases.map((sb) => sb.base_id))
  const availableBases = allBases.filter((b) => !linkedBaseIds.has(b.id))

  return { school, packingLists, schoolBases, availableBases }
}

export async function action({ request, params, context }: ActionFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const id = parseInt(params.id!, 10)

  if (isNaN(id)) {
    throw new Response('Invalid school ID', { status: 400 })
  }

  const formData = await request.formData()
  const intent = formData.get('intent')

  // Handle delete school
  if (intent === 'delete') {
    await deleteSchool(db, id)
    return redirect('/admin/schools')
  }

  // Handle add base location
  if (intent === 'add-base') {
    const baseId = parseInt(formData.get('base_id') as string, 10)
    const isPrimary = formData.get('is_primary') === '1'
    const notes = formData.get('notes') as string | null

    if (!isNaN(baseId)) {
      await addSchoolBase(db, id, baseId, isPrimary, notes?.trim() || null)
      return { success: true, message: 'Location added' }
    }
    return { success: false, errors: { _form: 'Invalid base selected' } }
  }

  // Handle remove base location
  if (intent === 'remove-base') {
    const baseId = parseInt(formData.get('base_id') as string, 10)
    if (!isNaN(baseId)) {
      await removeSchoolBase(db, id, baseId)
      return { success: true, message: 'Location removed' }
    }
    return { success: false, errors: { _form: 'Invalid base' } }
  }

  // Handle set primary location
  if (intent === 'set-primary') {
    const baseId = parseInt(formData.get('base_id') as string, 10)
    if (!isNaN(baseId)) {
      await setSchoolPrimaryBase(db, id, baseId)
      return { success: true, message: 'Primary location updated' }
    }
    return { success: false, errors: { _form: 'Invalid base' } }
  }

  // Handle update school details
  const name = formData.get('name') as string
  const abbreviation = formData.get('abbreviation') as string | null
  const branch = formData.get('branch') as string | null
  const location = formData.get('location') as string | null
  const website = formData.get('website') as string | null
  const description = formData.get('description') as string | null

  const errors: Record<string, string> = {}

  if (!name || name.trim() === '') {
    errors.name = 'School name is required'
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  try {
    await updateSchool(db, id, {
      name: name.trim(),
      abbreviation: abbreviation?.trim() || null,
      branch: branch || null,
      location: location?.trim() || null,
      website: website?.trim() || null,
      description: description?.trim() || null,
    })

    return { success: true, message: 'School updated successfully' }
  } catch (error) {
    console.error('Failed to update school:', error)
    return { success: false, errors: { _form: 'Failed to update school. Please try again.' } }
  }
}

export default function AdminSchoolsEditPage() {
  const { school, packingLists, schoolBases, availableBases } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const deleteFetcher = useFetcher()
  const baseFetcher = useFetcher()

  const isSubmitting = navigation.state === 'submitting'
  const isDeleting = deleteFetcher.state === 'submitting'
  const isBaseMutating = baseFetcher.state === 'submitting'

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAddLocation, setShowAddLocation] = useState(false)
  const [newBaseId, setNewBaseId] = useState('')
  const [newBaseNotes, setNewBaseNotes] = useState('')
  const [newBasePrimary, setNewBasePrimary] = useState(false)

  const errors = (actionData as { errors?: Record<string, string> })?.errors || {}
  const successMessage = (actionData as { success?: boolean; message?: string })?.success
    ? (actionData as { message?: string }).message
    : null

  const handleDelete = () => {
    deleteFetcher.submit({ intent: 'delete' }, { method: 'post' })
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
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/schools">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap size={24} className="text-text-muted" />
              <h2 className="text-2xl font-semibold text-text-primary">{school.name}</h2>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {school.branch && (
                <Badge variant={getBranchColor(school.branch) as any} size="sm">
                  {school.branch}
                </Badge>
              )}
              {school.abbreviation && (
                <span className="text-sm text-text-muted">{school.abbreviation}</span>
              )}
            </div>
          </div>
        </div>

        {/* Packing List Count Card */}
        <Card variant="bordered" padding="sm" className="hidden sm:flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <FileText size={20} className="text-accent" />
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">{packingLists.length}</p>
            <p className="text-xs text-text-muted">
              Packing List{packingLists.length !== 1 ? 's' : ''}
            </p>
          </div>
        </Card>
      </div>

      {/* Mobile Packing List Count */}
      <Card
        variant="bordered"
        padding="sm"
        className="sm:hidden flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <FileText size={20} className="text-accent" />
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">{packingLists.length}</p>
            <p className="text-xs text-text-muted">
              Packing List{packingLists.length !== 1 ? 's' : ''} for this school
            </p>
          </div>
        </div>
      </Card>

      {/* Success Message */}
      {successMessage && (
        <Card variant="bordered" padding="md" className="border-success/30 bg-success/5">
          <p className="text-sm text-success">{successMessage}</p>
        </Card>
      )}

      {/* Form Error */}
      {errors._form && (
        <Card variant="bordered" padding="md" className="border-error/30 bg-error/5">
          <p className="text-sm text-error">{errors._form}</p>
        </Card>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <Card variant="elevated" padding="md" className="border border-error/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-medium text-text-primary">Delete this school?</p>
              <p className="text-sm text-text-muted mt-1">
                {packingLists.length > 0
                  ? `This will unlink ${packingLists.length} packing list${packingLists.length !== 1 ? 's' : ''} from this school.`
                  : 'This action cannot be undone.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete} loading={isDeleting}>
                <Trash2 size={16} />
                Delete School
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Form */}
      <Form method="post">
        <Card variant="bordered" padding="lg">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="School Name"
                  name="name"
                  placeholder="e.g., U.S. Army Ranger School"
                  required
                  defaultValue={school.name}
                  error={errors.name}
                />
              </div>

              <Input
                label="Abbreviation"
                name="abbreviation"
                placeholder="e.g., USARS"
                defaultValue={school.abbreviation || ''}
                helperText="Short name or acronym"
              />

              <Select label="Branch" name="branch" defaultValue={school.branch || ''}>
                <option value="">Select branch...</option>
                {BRANCH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Additional Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                <Globe size={16} />
                Additional Info
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Website"
                  name="website"
                  type="url"
                  placeholder="https://example.mil"
                  defaultValue={school.website || ''}
                  helperText="Official school website"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Brief description of the school and its training programs..."
                  defaultValue={school.description || ''}
                  className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/50"
                />
              </div>
            </div>

            {/* Hidden field to preserve legacy location data */}
            <input type="hidden" name="location" value={school.location || ''} />

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button
                type="button"
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={showDeleteConfirm}
              >
                <Trash2 size={16} />
                Delete School
              </Button>

              <div className="flex items-center gap-3">
                <Link to="/admin/schools">
                  <Button variant="ghost" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" loading={isSubmitting}>
                  <Save size={16} />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </Form>

      {/* School Locations (Bases) */}
      <Card variant="bordered" padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
            <MapPin size={16} />
            Training Locations ({schoolBases.length})
          </h3>
          {!showAddLocation && availableBases.length > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setShowAddLocation(true)}>
              <Plus size={14} />
              Add Location
            </Button>
          )}
        </div>

        {/* Add Location Form */}
        {showAddLocation && (
          <baseFetcher.Form method="post" className="mb-4 p-3 rounded-lg bg-bg-subtle border border-border">
            <input type="hidden" name="intent" value="add-base" />
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select
                  label="Base"
                  name="base_id"
                  value={newBaseId}
                  onChange={(e) => setNewBaseId(e.target.value)}
                  required
                >
                  <option value="">Select a base...</option>
                  {(availableBases as Base[]).map((base) => (
                    <option key={base.id} value={base.id}>
                      {base.name} {base.state ? `(${base.state})` : ''}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Notes"
                  name="notes"
                  placeholder="e.g., Infantry OSUT, Winter cycle"
                  value={newBaseNotes}
                  onChange={(e) => setNewBaseNotes(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_primary"
                    value="1"
                    checked={newBasePrimary}
                    onChange={(e) => setNewBasePrimary(e.target.checked)}
                    className="w-4 h-4 rounded border-border bg-bg-elevated text-accent focus:ring-accent/20"
                  />
                  <span className="text-sm text-text-secondary">Primary location</span>
                </label>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddLocation(false)
                    setNewBaseId('')
                    setNewBaseNotes('')
                    setNewBasePrimary(false)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={isBaseMutating} disabled={!newBaseId}>
                  <Plus size={14} />
                  Add Location
                </Button>
              </div>
            </div>
          </baseFetcher.Form>
        )}

        {/* Locations List */}
        {schoolBases.length > 0 ? (
          <div className="space-y-2">
            {(schoolBases as SchoolBaseRow[]).map((sb) => (
              <div
                key={sb.id}
                className="flex items-center justify-between p-3 rounded-lg bg-bg-subtle/50 hover:bg-bg-subtle transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {sb.is_primary === 1 && (
                      <Star size={14} className="text-warning fill-warning" />
                    )}
                    <span className="font-medium text-text-primary">{sb.base_name}</span>
                    {sb.base_state && (
                      <span className="text-text-muted">({sb.base_state})</span>
                    )}
                  </div>
                  {sb.notes && (
                    <Badge variant="outline" size="sm">
                      {sb.notes}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {sb.is_primary !== 1 && (
                    <baseFetcher.Form method="post">
                      <input type="hidden" name="intent" value="set-primary" />
                      <input type="hidden" name="base_id" value={sb.base_id} />
                      <Button
                        variant="ghost"
                        size="sm"
                        type="submit"
                        title="Set as primary"
                        loading={isBaseMutating}
                      >
                        <Star size={14} />
                      </Button>
                    </baseFetcher.Form>
                  )}
                  <baseFetcher.Form method="post">
                    <input type="hidden" name="intent" value="remove-base" />
                    <input type="hidden" name="base_id" value={sb.base_id} />
                    <Button
                      variant="ghost"
                      size="sm"
                      type="submit"
                      title="Remove location"
                      loading={isBaseMutating}
                    >
                      <X size={14} className="text-error" />
                    </Button>
                  </baseFetcher.Form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted py-4 text-center">
            No training locations added yet. Add bases where this school operates.
          </p>
        )}
      </Card>

      {/* Associated Packing Lists */}
      {packingLists.length > 0 && (
        <Card variant="bordered" padding="md">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Packing Lists for this School ({packingLists.length})
          </h3>
          <div className="space-y-2">
            {packingLists.slice(0, 5).map((list) => (
              <Link
                key={list.id}
                to={`/list/${list.id}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-bg-subtle/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">{list.name}</p>
                  {list.type && <p className="text-xs text-text-muted">{list.type}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {list.is_public === 1 ? (
                    <Badge variant="success" size="sm">
                      Public
                    </Badge>
                  ) : (
                    <Badge variant="outline" size="sm">
                      Private
                    </Badge>
                  )}
                  <ExternalLink size={14} className="text-text-muted" />
                </div>
              </Link>
            ))}
            {packingLists.length > 5 && (
              <p className="text-center text-sm text-text-muted py-2">
                +{packingLists.length - 5} more packing list
                {packingLists.length - 5 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Metadata */}
      <Card variant="bordered" padding="md" className="text-xs text-text-muted">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>ID: {school.id}</span>
          <span>Created: {new Date(school.created_at).toLocaleDateString()}</span>
          <span>Updated: {new Date(school.updated_at).toLocaleDateString()}</span>
        </div>
      </Card>
    </div>
  )
}
