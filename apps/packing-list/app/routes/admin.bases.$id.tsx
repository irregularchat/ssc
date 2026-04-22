import { useState, useEffect } from 'react'
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData, useActionData, useNavigation, Form, Link, useFetcher } from 'react-router'
import { redirect } from 'react-router'
import {
  ArrowLeft,
  Save,
  MapPin,
  Trash2,
  ExternalLink,
  Building2,
  Globe,
} from 'lucide-react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select } from '~/components/ui/select'
import { Badge } from '~/components/ui/badge'
import {
  getDB,
  getBaseById,
  updateBase,
  deleteBase,
  getStoresByBaseId,
} from '~/lib/db.server'
import type { Store } from '~/types/database'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const baseName = data?.base?.name || 'Base'
  return [{ title: `${baseName} - Edit Base - Admin - CPL` }]
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

const REGION_OPTIONS = [
  { value: 'CONUS', label: 'CONUS' },
  { value: 'OCONUS', label: 'OCONUS' },
  { value: 'Pacific', label: 'Pacific' },
  { value: 'Europe', label: 'Europe' },
  { value: 'Middle East', label: 'Middle East' },
]

export async function loader({ params, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const id = parseInt(params.id!, 10)

  if (isNaN(id)) {
    throw new Response('Invalid base ID', { status: 400 })
  }

  const [base, stores] = await Promise.all([
    getBaseById(db, id),
    getStoresByBaseId(db, id),
  ])

  if (!base) {
    throw new Response('Base not found', { status: 404 })
  }

  return { base, stores }
}

export async function action({ request, params, context }: ActionFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const id = parseInt(params.id!, 10)

  if (isNaN(id)) {
    throw new Response('Invalid base ID', { status: 400 })
  }

  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'delete') {
    await deleteBase(db, id)
    return redirect('/admin/bases')
  }

  const name = formData.get('name') as string
  const abbreviation = formData.get('abbreviation') as string | null
  const branch = formData.get('branch') as string | null
  const location = formData.get('location') as string | null
  const state = formData.get('state') as string | null
  const region = formData.get('region') as string | null
  const website = formData.get('website') as string | null
  const description = formData.get('description') as string | null

  const errors: Record<string, string> = {}

  if (!name || name.trim() === '') {
    errors.name = 'Base name is required'
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  try {
    await updateBase(db, id, {
      name: name.trim(),
      abbreviation: abbreviation?.trim() || null,
      branch: branch || null,
      location: location?.trim() || null,
      state: state?.trim() || null,
      region: region || null,
      website: website?.trim() || null,
      description: description?.trim() || null,
    })

    return { success: true, message: 'Base updated successfully' }
  } catch (error) {
    console.error('Failed to update base:', error)
    return { success: false, errors: { _form: 'Failed to update base. Please try again.' } }
  }
}

export default function AdminBasesEditPage() {
  const { base, stores } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const deleteFetcher = useFetcher()

  const isSubmitting = navigation.state === 'submitting'
  const isDeleting = deleteFetcher.state === 'submitting'

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
          <Link to="/admin/bases">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-semibold text-text-primary">{base.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              {base.branch && (
                <Badge variant={getBranchColor(base.branch) as any} size="sm">
                  {base.branch}
                </Badge>
              )}
              {base.region && (
                <Badge variant="outline" size="sm">
                  {base.region}
                </Badge>
              )}
              {base.abbreviation && (
                <span className="text-sm text-text-muted">{base.abbreviation}</span>
              )}
            </div>
          </div>
        </div>

        {/* Store Count Card */}
        <Card variant="bordered" padding="sm" className="hidden sm:flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Building2 size={20} className="text-accent" />
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">{stores.length}</p>
            <p className="text-xs text-text-muted">Store{stores.length !== 1 ? 's' : ''}</p>
          </div>
          <Link to={`/admin/stores?base=${base.id}`} className="ml-2">
            <Button variant="ghost" size="sm">
              View
              <ExternalLink size={14} />
            </Button>
          </Link>
        </Card>
      </div>

      {/* Mobile Store Count */}
      <Card variant="bordered" padding="sm" className="sm:hidden flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Building2 size={20} className="text-accent" />
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">{stores.length}</p>
            <p className="text-xs text-text-muted">Store{stores.length !== 1 ? 's' : ''} at this base</p>
          </div>
        </div>
        <Link to={`/admin/stores?base=${base.id}`}>
          <Button variant="ghost" size="sm">
            View Stores
            <ExternalLink size={14} />
          </Button>
        </Link>
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
              <p className="font-medium text-text-primary">Delete this base?</p>
              <p className="text-sm text-text-muted mt-1">
                {stores.length > 0
                  ? `This will unlink ${stores.length} store${stores.length !== 1 ? 's' : ''} from this base.`
                  : 'This action cannot be undone.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                loading={isDeleting}
              >
                <Trash2 size={16} />
                Delete Base
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
                  label="Base Name"
                  name="name"
                  placeholder="e.g., Fort Bragg"
                  required
                  defaultValue={base.name}
                  error={errors.name}
                />
              </div>

              <Input
                label="Abbreviation"
                name="abbreviation"
                placeholder="e.g., Ft. Bragg"
                defaultValue={base.abbreviation || ''}
                helperText="Short name or acronym"
              />

              <Select
                label="Branch"
                name="branch"
                defaultValue={base.branch || ''}
              >
                <option value="">Select branch...</option>
                {BRANCH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Location Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                <MapPin size={16} />
                Location
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="City/Location"
                  name="location"
                  placeholder="e.g., Fayetteville"
                  defaultValue={base.location || ''}
                />

                <Input
                  label="State"
                  name="state"
                  placeholder="e.g., NC"
                  maxLength={2}
                  defaultValue={base.state || ''}
                />

                <Select
                  label="Region"
                  name="region"
                  defaultValue={base.region || ''}
                >
                  <option value="">Select region...</option>
                  {REGION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                <Globe size={16} />
                Additional Info
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="Website"
                  name="website"
                  type="url"
                  placeholder="https://example.mil"
                  defaultValue={base.website || ''}
                />

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Brief description of the base..."
                    defaultValue={base.description || ''}
                    className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/50"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button
                type="button"
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={showDeleteConfirm}
              >
                <Trash2 size={16} />
                Delete Base
              </Button>

              <div className="flex items-center gap-3">
                <Link to="/admin/bases">
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

      {/* Associated Stores */}
      {stores.length > 0 && (
        <Card variant="bordered" padding="md">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Stores at this Base ({stores.length})
          </h3>
          <div className="space-y-2">
            {stores.slice(0, 5).map((store) => (
              <Link
                key={store.id}
                to={`/admin/stores/${store.id}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-bg-subtle/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">{store.name}</p>
                  {store.store_type && (
                    <p className="text-xs text-text-muted">{store.store_type}</p>
                  )}
                </div>
                <ExternalLink size={14} className="text-text-muted" />
              </Link>
            ))}
            {stores.length > 5 && (
              <Link
                to={`/admin/stores?base=${base.id}`}
                className="block text-center text-sm text-accent hover:underline py-2"
              >
                View all {stores.length} stores
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Metadata */}
      <Card variant="bordered" padding="md" className="text-xs text-text-muted">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>ID: {base.id}</span>
          <span>Created: {new Date(base.created_at).toLocaleDateString()}</span>
          <span>Updated: {new Date(base.updated_at).toLocaleDateString()}</span>
        </div>
      </Card>
    </div>
  )
}
