import type { ActionFunctionArgs, MetaFunction } from 'react-router'
import { Form, Link, redirect, useActionData, useNavigation } from 'react-router'
import { ArrowLeft, Upload, FileText, AlertCircle } from 'lucide-react'
import { Layout } from '~/components/layout'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card } from '~/components/ui/card'
import { getDB, createPackingList, createItem, addItemToList } from '~/lib/db.server'
import { validateLength, validateRequired } from '~/lib/validation'

interface ParsedItem {
  name: string
  quantity: number
  category: string | null
  notes: string | null
  asin: string | null
}

function parseCSV(content: string): ParsedItem[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
  const items: ParsedItem[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
    if (values.length === 0 || !values[0]) continue

    const item: ParsedItem = {
      name: '',
      quantity: 1,
      category: null,
      notes: null,
      asin: null,
    }

    headers.forEach((header, idx) => {
      const value = values[idx] || ''
      switch (header) {
        case 'name':
        case 'item':
        case 'item name':
          item.name = value
          break
        case 'quantity':
        case 'qty':
        case 'count':
          item.quantity = parseInt(value) || 1
          break
        case 'category':
        case 'type':
          item.category = value || null
          break
        case 'notes':
        case 'note':
        case 'description':
          item.notes = value || null
          break
        case 'asin':
        case 'amazon':
          item.asin = value || null
          break
      }
    })

    if (item.name) {
      items.push(item)
    }
  }

  return items
}

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData()
  const listName = formData.get('list_name') as string
  const csvContent = formData.get('csv_content') as string

  const nameError = validateRequired(listName, 'List name') || validateLength(listName as string, 'name')
  if (nameError) return { error: nameError }

  if (!csvContent || csvContent.trim().length === 0) {
    return { error: 'CSV content is required' }
  }

  const items = parseCSV(csvContent)

  if (items.length === 0) {
    return { error: 'No valid items found in CSV. Make sure you have a header row with "name" column.' }
  }

  if (items.length > 1000) {
    return { error: 'CSV uploads are limited to 1000 rows. Please split your file into smaller batches.' }
  }

  const db = getDB(context as Parameters<typeof getDB>[0])

  // Create the packing list
  const list = await createPackingList(db, {
    name: listName.trim(),
    description: `Imported ${items.length} items from CSV`,
    type: 'Imported',
    is_public: 1,
    contributor_name: null,
    school_id: null,
    base_id: null,
  })

  // Create items and add to list
  for (const parsedItem of items) {
    const item = await createItem(db, {
      name: parsedItem.name,
      description: parsedItem.notes,
      category: parsedItem.category,
      asin: parsedItem.asin,
      image_url: null,
    })

    await addItemToList(db, list.id, item.id, parsedItem.quantity, parsedItem.notes)
  }

  return redirect(`/list/${list.id}`)
}

export const meta: MetaFunction = () => {
  return [{ title: 'Import List - CPL' }]
}

export default function UploadListPage() {
  const actionData = useActionData<{ error?: string }>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

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

        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          Import Packing List
        </h1>
        <p className="text-text-secondary mb-6">
          Upload a CSV file to create a new packing list with items.
        </p>

        <Card variant="bordered" padding="lg" className="mb-6">
          <Form method="post" className="space-y-4">
            <Input
              label="List Name"
              name="list_name"
              placeholder="e.g., My Deployment Gear"
              required
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-secondary">
                CSV Content
              </label>
              <textarea
                name="csv_content"
                placeholder="name,quantity,category,notes
Black Boot Socks,6,Clothing,Get extra pairs
Boot Care Kit,1,Footwear,Kiwi brand recommended
Padlock Set,2,Security,One for each locker"
                rows={8}
                required
                className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/50 transition-all duration-200 font-mono text-sm"
              />
            </div>

            {actionData?.error && (
              <div className="flex items-center gap-2 text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
                <AlertCircle size={16} />
                {actionData.error}
              </div>
            )}

            <Button
              variant="primary"
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              <Upload size={16} />
              {isSubmitting ? 'Importing...' : 'Import List'}
            </Button>
          </Form>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-start gap-3">
            <FileText size={20} className="text-text-muted flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-text-primary text-sm mb-1">
                CSV Format
              </h3>
              <p className="text-text-muted text-sm mb-2">
                Your CSV should have a header row with column names. Supported columns:
              </p>
              <ul className="text-xs text-text-muted space-y-1 font-mono">
                <li><span className="text-text-primary">name</span> - Item name (required)</li>
                <li><span className="text-text-primary">quantity</span> - Number of items (default: 1)</li>
                <li><span className="text-text-primary">category</span> - Item category</li>
                <li><span className="text-text-primary">notes</span> - Additional notes</li>
                <li><span className="text-text-primary">asin</span> - Amazon product ID</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
