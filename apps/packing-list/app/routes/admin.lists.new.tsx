import { useState } from 'react'
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData, useActionData, useNavigation, Form, Link } from 'react-router'
import { redirect } from 'react-router'
import { ArrowLeft, Save, ClipboardList, Copy } from 'lucide-react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select } from '~/components/ui/select'
import { Badge } from '~/components/ui/badge'
import {
  getDB,
  getSchoolsWithBases,
  getBases,
  getPackingLists,
  createPackingList,
  createChildList,
} from '~/lib/db.server'
import type { School, Base, PackingList } from '~/types/database'
import type { SchoolBaseRow } from '~/lib/db.server'

export const meta: MetaFunction = () => {
  return [{ title: 'Create Packing List - Admin - CPL' }]
}

const LIST_TYPES = [
  { value: 'Basic Training', label: 'Basic Training' },
  { value: 'AIT', label: 'Advanced Individual Training (AIT)' },
  { value: 'OCS', label: 'Officer Candidate School (OCS)' },
  { value: 'Deployment', label: 'Deployment' },
  { value: 'TDY', label: 'Temporary Duty (TDY)' },
  { value: 'PCS', label: 'Permanent Change of Station (PCS)' },
  { value: 'Field Exercise', label: 'Field Exercise' },
  { value: 'School', label: 'Military School' },
  { value: 'Other', label: 'Other' },
]

export async function loader({ context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])

  const [schoolsWithBases, bases, existingLists] = await Promise.all([
    getSchoolsWithBases(db),
    getBases(db),
    getPackingLists(db),
  ])

  // Filter to only master lists (no parent) for inheritance options
  const masterLists = existingLists.filter((l) => !l.parent_list_id)

  return { schoolsWithBases, bases, masterLists }
}

export async function action({ request, context }: ActionFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const formData = await request.formData()

  const intent = formData.get('intent') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const type = formData.get('type') as string | null
  const schoolId = formData.get('school_id') as string | null
  const baseId = formData.get('base_id') as string | null
  const isPublic = formData.get('is_public') === '1'
  const contributorName = formData.get('contributor_name') as string | null
  const parentListId = formData.get('parent_list_id') as string | null

  const errors: Record<string, string> = {}

  if (!name || name.trim() === '') {
    errors.name = 'List name is required'
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  try {
    let listId: number

    if (intent === 'create-child' && parentListId) {
      // Create as child list inheriting from parent
      listId = await createChildList(
        db,
        parseInt(parentListId, 10),
        baseId ? parseInt(baseId, 10) : 0,
        name.trim(),
        description?.trim() || null
      )
    } else {
      // Create standalone list
      listId = await createPackingList(db, {
        name: name.trim(),
        description: description?.trim() || null,
        type: type || null,
        is_public: isPublic ? 1 : 0,
        contributor_name: contributorName?.trim() || null,
        school_id: schoolId ? parseInt(schoolId, 10) : null,
        base_id: baseId ? parseInt(baseId, 10) : null,
      })
    }

    return redirect(`/admin/lists/${listId}`)
  } catch (error) {
    console.error('Failed to create list:', error)
    return { success: false, errors: { _form: 'Failed to create list. Please try again.' } }
  }
}

export default function AdminListsNewPage() {
  const { schoolsWithBases, bases, masterLists } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('')
  const [selectedParentId, setSelectedParentId] = useState<string>('')
  const [createMode, setCreateMode] = useState<'new' | 'child'>('new')

  const errors = actionData?.errors || {}

  // Get bases for selected school
  const selectedSchool = schoolsWithBases.find((s) => s.id.toString() === selectedSchoolId)
  const schoolBases = selectedSchool?.bases || []

  // Get parent list details
  const parentList = masterLists.find((l) => l.id.toString() === selectedParentId)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/lists">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList size={24} className="text-text-muted" />
            <h2 className="text-2xl font-semibold text-text-primary">Create Packing List</h2>
          </div>
          <p className="text-text-secondary text-sm mt-1">
            Create a new packing list or inherit from an existing one
          </p>
        </div>
      </div>

      {/* Form Error */}
      {errors._form && (
        <Card variant="bordered" padding="md" className="border-error/30 bg-error/5">
          <p className="text-sm text-error">{errors._form}</p>
        </Card>
      )}

      {/* Creation Mode Toggle */}
      <Card variant="bordered" padding="md">
        <div className="flex gap-2">
          <Button
            variant={createMode === 'new' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              setCreateMode('new')
              setSelectedParentId('')
            }}
          >
            <ClipboardList size={16} />
            New List
          </Button>
          <Button
            variant={createMode === 'child' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setCreateMode('child')}
          >
            <Copy size={16} />
            Inherit from Existing
          </Button>
        </div>
        <p className="text-xs text-text-muted mt-2">
          {createMode === 'new'
            ? 'Create a standalone packing list from scratch.'
            : 'Create a location-specific variant that inherits items from a master list.'}
        </p>
      </Card>

      {/* Form */}
      <Form method="post">
        <input type="hidden" name="intent" value={createMode === 'child' ? 'create-child' : 'create'} />

        <Card variant="bordered" padding="lg">
          <div className="space-y-6">
            {/* Inherit from (if child mode) */}
            {createMode === 'child' && (
              <div className="space-y-4 pb-4 border-b border-border">
                <h3 className="text-sm font-medium text-text-secondary">Inherit From</h3>
                <Select
                  label="Parent List"
                  name="parent_list_id"
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  required={createMode === 'child'}
                >
                  <option value="">Select a master list...</option>
                  {masterLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name} {list.school?.name ? `(${list.school.name})` : ''}
                    </option>
                  ))}
                </Select>
                {parentList && (
                  <div className="p-3 rounded-lg bg-bg-subtle">
                    <p className="text-sm text-text-primary font-medium">{parentList.name}</p>
                    <p className="text-xs text-text-muted mt-1">
                      {parentList.description || 'No description'}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {parentList.school && (
                        <Badge variant="outline" size="sm">{parentList.school.name}</Badge>
                      )}
                      {parentList.type && (
                        <Badge variant="secondary" size="sm">{parentList.type}</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="List Name"
                  name="name"
                  placeholder={createMode === 'child' ? 'e.g., BCT @ Fort Sill' : 'e.g., Army BCT Essentials'}
                  required
                  error={errors.name}
                />
              </div>

              <Select label="List Type" name="type">
                <option value="">Select type...</option>
                {LIST_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>

              <Input
                label="Contributor Name"
                name="contributor_name"
                placeholder="Your name (optional)"
                helperText="Who created or maintains this list"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Brief description of what this list is for..."
                className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/50"
              />
            </div>

            {/* School & Base Selection */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-text-secondary">Association</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="School"
                  name="school_id"
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  disabled={createMode === 'child' && !!parentList?.school_id}
                >
                  <option value="">No school (general list)</option>
                  {(schoolsWithBases as (School & { bases: SchoolBaseRow[] })[]).map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name} {school.branch ? `(${school.branch})` : ''}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Base / Location"
                  name="base_id"
                  helperText={schoolBases.length > 0 ? 'Bases where this school operates' : 'All bases'}
                >
                  <option value="">Any location (generic)</option>
                  {schoolBases.length > 0 ? (
                    <>
                      <optgroup label="School Locations">
                        {schoolBases.map((sb: SchoolBaseRow) => (
                          <option key={sb.base_id} value={sb.base_id}>
                            {sb.base_name} {sb.base_state ? `(${sb.base_state})` : ''}
                            {sb.is_primary ? ' - Primary' : ''}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Other Bases">
                        {(bases as Base[])
                          .filter((b) => !schoolBases.some((sb: SchoolBaseRow) => sb.base_id === b.id))
                          .map((base) => (
                            <option key={base.id} value={base.id}>
                              {base.name} {base.state ? `(${base.state})` : ''}
                            </option>
                          ))}
                      </optgroup>
                    </>
                  ) : (
                    (bases as Base[]).map((base) => (
                      <option key={base.id} value={base.id}>
                        {base.name} {base.state ? `(${base.state})` : ''}
                      </option>
                    ))
                  )}
                </Select>
              </div>
            </div>

            {/* Visibility */}
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_public"
                  value="1"
                  defaultChecked
                  className="w-5 h-5 rounded border-border bg-bg-elevated text-accent focus:ring-accent/20"
                />
                <span className="text-sm font-medium text-text-primary">Public List</span>
              </label>
              <p className="text-xs text-text-muted">
                Public lists are visible to all users. Private lists are only visible to admins.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link to="/admin/lists">
                <Button variant="ghost" type="button">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={createMode === 'child' && !selectedParentId}
              >
                <Save size={16} />
                Create List
              </Button>
            </div>
          </div>
        </Card>
      </Form>
    </div>
  )
}
