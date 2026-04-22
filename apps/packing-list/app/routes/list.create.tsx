import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { Form, Link, redirect, useLoaderData, useActionData } from 'react-router'
import { ArrowLeft, Save } from 'lucide-react'
import { Layout } from '~/components/layout'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select } from '~/components/ui/select'
import { Card } from '~/components/ui/card'
import { getDB, createPackingList, getSchools, getBases } from '~/lib/db.server'
import { validateLength, validateRequired } from '~/lib/validation'
import { validateOrigin } from '~/lib/csrf.server'
import type { School, Base } from '~/types/database'

export async function loader({ context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const [schools, bases] = await Promise.all([
    getSchools(db, { all: true }),
    getBases(db),
  ])
  return { schools, bases }
}

export async function action({ request, context }: ActionFunctionArgs) {
  const originError = validateOrigin(request)
  if (originError) {
    return new Response(originError, { status: 403 })
  }

  const formData = await request.formData()

  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const type = formData.get('type') as string | null
  const schoolId = formData.get('school_id') as string | null
  const baseId = formData.get('base_id') as string | null
  const isPublic = formData.get('is_public') === 'on'
  const contributorName = formData.get('contributor_name') as string | null

  const nameError = validateRequired(name, 'List name') || validateLength(name as string, 'name')
  if (nameError) return { error: nameError }

  if (description && validateLength(description, 'description')) {
    return { error: validateLength(description, 'description') }
  }

  const db = getDB(context as Parameters<typeof getDB>[0])
  const list = await createPackingList(db, {
    name: name.trim(),
    description: description?.trim() || null,
    type: type?.trim() || null,
    school_id: schoolId ? parseInt(schoolId) : null,
    base_id: baseId ? parseInt(baseId) : null,
    is_public: isPublic ? 1 : 0,
    contributor_name: contributorName?.trim() || null,
  })

  return redirect(`/list/${list.id}`)
}

export const meta: MetaFunction = () => {
  return [{ title: 'Create List - CPL' }]
}

export default function CreateListPage() {
  const { schools, bases } = useLoaderData<{ schools: School[]; bases: Base[] }>()
  const actionData = useActionData<{ error?: string }>()

  return (
    <Layout>
      <div className="max-w-xl mx-auto pb-20 md:pb-0">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} />
              Back
            </Button>
          </Link>
        </div>

        <h1 className="text-2xl font-semibold text-text-primary mb-6">
          Create Packing List
        </h1>

        <Card variant="bordered" padding="lg">
          <Form method="post" className="space-y-4">
            <Input
              label="List Name"
              name="name"
              placeholder="e.g., Basic Training Essentials"
              required
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-secondary">Description</label>
              <textarea
                name="description"
                placeholder="Optional description..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/50 transition-all duration-200"
              />
            </div>

            <Input
              label="Type"
              name="type"
              placeholder="e.g., Basic Training, Deployment, School"
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="School"
                name="school_id"
              >
                <option value="">None</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Base"
                name="base_id"
              >
                <option value="">None</option>
                {bases.map((base) => (
                  <option key={base.id} value={base.id}>
                    {base.name}
                  </option>
                ))}
              </Select>
            </div>

            <Input
              label="Your Name (optional)"
              name="contributor_name"
              placeholder="For attribution"
            />

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                name="is_public"
                id="is_public"
                defaultChecked
                className="w-4 h-4 rounded border-border bg-bg-elevated text-text-primary focus:ring-text-primary/20"
              />
              <label htmlFor="is_public" className="text-sm text-text-secondary cursor-pointer">
                Make this list public
              </label>
            </div>

            {actionData?.error && (
              <p className="text-sm text-error animate-slide-up">{actionData.error}</p>
            )}

            <div className="flex justify-end pt-4">
              <Button variant="primary" type="submit">
                <Save size={16} />
                Create List
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </Layout>
  )
}
