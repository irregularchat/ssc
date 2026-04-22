import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { Form, Link, redirect, useLoaderData, useActionData } from 'react-router'
import { ArrowLeft, Save } from 'lucide-react'
import { Layout } from '~/components/layout'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select } from '~/components/ui/select'
import { Card } from '~/components/ui/card'
import { getDB, getPackingList, updatePackingList, getSchools, getBases } from '~/lib/db.server'
import type { PackingListWithRelations, School, Base } from '~/types/database'

export async function loader({ params, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const list = await getPackingList(db, parseInt(params.id!))

  if (!list) {
    throw new Response('Not Found', { status: 404 })
  }

  const [schools, bases] = await Promise.all([
    getSchools(db, { all: true }),
    getBases(db),
  ])

  return { list, schools, bases }
}

export async function action({ params, request, context }: ActionFunctionArgs) {
  const formData = await request.formData()
  const db = getDB(context as Parameters<typeof getDB>[0])
  const listId = parseInt(params.id!)

  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const type = formData.get('type') as string | null
  const schoolId = formData.get('school_id') as string | null
  const baseId = formData.get('base_id') as string | null
  const isPublic = formData.get('is_public') === 'on'
  const contributorName = formData.get('contributor_name') as string | null

  if (!name || name.trim().length === 0) {
    return { error: 'Name is required' }
  }

  await updatePackingList(db, listId, {
    name: name.trim(),
    description: description?.trim() || null,
    type: type?.trim() || null,
    school_id: schoolId ? parseInt(schoolId) : null,
    base_id: baseId ? parseInt(baseId) : null,
    is_public: isPublic ? 1 : 0,
    contributor_name: contributorName?.trim() || null,
  })

  return redirect(`/list/${listId}`)
}

export const meta: MetaFunction = ({ data }) => {
  const typedData = data as { list?: PackingListWithRelations } | undefined
  return [
    { title: typedData?.list ? `Edit - ${typedData.list.name}` : 'Edit List' },
  ]
}

export default function EditListPage() {
  const { list, schools, bases } = useLoaderData<{
    list: PackingListWithRelations
    schools: School[]
    bases: Base[]
  }>()
  const actionData = useActionData<{ error?: string }>()

  return (
    <Layout>
      <div className="max-w-xl mx-auto pb-20 md:pb-0">
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/list/${list.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} />
              Back to List
            </Button>
          </Link>
        </div>

        <h1 className="text-2xl font-semibold text-text-primary mb-6">
          Edit Packing List
        </h1>

        <Card variant="bordered" padding="lg">
          <Form method="post" className="space-y-4">
            <Input
              label="List Name"
              name="name"
              placeholder="e.g., Basic Training Essentials"
              defaultValue={list.name}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-secondary">Description</label>
              <textarea
                name="description"
                placeholder="Optional description..."
                defaultValue={list.description || ''}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/50 transition-all duration-200"
              />
            </div>

            <Input
              label="Type"
              name="type"
              placeholder="e.g., Basic Training, Deployment, School"
              defaultValue={list.type || ''}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="School"
                name="school_id"
                defaultValue={list.school_id?.toString() || ''}
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
                defaultValue={list.base_id?.toString() || ''}
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
              defaultValue={list.contributor_name || ''}
            />

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                name="is_public"
                id="is_public"
                defaultChecked={list.is_public === 1}
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
                Save Changes
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </Layout>
  )
}
