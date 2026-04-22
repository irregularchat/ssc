import type { ActionFunctionArgs, MetaFunction } from 'react-router'
import { useActionData, useNavigation, Form, Link } from 'react-router'
import { redirect } from 'react-router'
import { ArrowLeft, Save, Globe, GraduationCap } from 'lucide-react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select } from '~/components/ui/select'
import { getDB, createSchool } from '~/lib/db.server'

export const meta: MetaFunction = () => {
  return [{ title: 'Add School - Admin - CPL' }]
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

export async function action({ request, context }: ActionFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const formData = await request.formData()

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
    await createSchool(db, {
      name: name.trim(),
      abbreviation: abbreviation?.trim() || null,
      branch: branch || null,
      location: location?.trim() || null,
      website: website?.trim() || null,
      description: description?.trim() || null,
    })

    return redirect('/admin/schools')
  } catch (error) {
    console.error('Failed to create school:', error)
    return { success: false, errors: { _form: 'Failed to create school. Please try again.' } }
  }
}

export default function AdminSchoolsNewPage() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const errors = actionData?.errors || {}

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/schools">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap size={24} className="text-text-muted" />
            <h2 className="text-2xl font-semibold text-text-primary">Add School</h2>
          </div>
          <p className="text-text-secondary text-sm mt-1">
            Create a new military school or training program
          </p>
        </div>
      </div>

      {/* Form Error */}
      {errors._form && (
        <Card variant="bordered" padding="md" className="border-error/30 bg-error/5">
          <p className="text-sm text-error">{errors._form}</p>
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
                  error={errors.name}
                />
              </div>

              <Input
                label="Abbreviation"
                name="abbreviation"
                placeholder="e.g., USARS"
                helperText="Short name or acronym"
              />

              <Select label="Branch" name="branch">
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

              <Input
                label="Website"
                name="website"
                type="url"
                placeholder="https://example.mil"
                helperText="Official school website"
              />

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Brief description of the school and its training programs..."
                  className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/50"
                />
              </div>

              <p className="text-xs text-text-muted">
                After creating the school, you can add training locations on the edit page.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link to="/admin/schools">
                <Button variant="ghost" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" loading={isSubmitting}>
                <Save size={16} />
                Create School
              </Button>
            </div>
          </div>
        </Card>
      </Form>
    </div>
  )
}
