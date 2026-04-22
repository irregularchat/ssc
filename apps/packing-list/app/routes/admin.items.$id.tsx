import { useState, useEffect } from 'react'
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData, useActionData, useNavigation, Form, Link, useFetcher } from 'react-router'
import { redirect } from 'react-router'
import {
  ArrowLeft,
  Save,
  Trash2,
  Package,
  Tag,
  DollarSign,
  List,
  ExternalLink,
} from 'lucide-react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select } from '~/components/ui/select'
import { Badge } from '~/components/ui/badge'
import {
  getDB,
  getDistinctCategories,
  getItemById,
  updateItem,
  deleteItem,
  getItemPriceCount,
  getPackingListsContainingItem,
} from '~/lib/db.server'
import type { Item } from '~/types/database'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const itemName = data?.item?.name || 'Item'
  return [{ title: `${itemName} - Edit Item - Admin - CPL` }]
}

const UNIT_NAME_OPTIONS = [
  { value: 'each', label: 'Each' },
  { value: 'pair', label: 'Pair' },
  { value: 'pack', label: 'Pack' },
  { value: 'set', label: 'Set' },
  { value: 'box', label: 'Box' },
  { value: 'roll', label: 'Roll' },
]

const CATEGORY_SUGGESTIONS = [
  'Clothing',
  'Footwear',
  'Personal Care',
  'Security',
  'Supplies',
  'Equipment',
  'Electronics',
]

export async function loader({ params, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const id = parseInt(params.id!, 10)

  if (isNaN(id)) {
    throw new Response('Invalid item ID', { status: 400 })
  }

  const [item, existingCategories, priceCount, packingLists] = await Promise.all([
    getItemById(db, id),
    getDistinctCategories(db),
    getItemPriceCount(db, id),
    getPackingListsContainingItem(db, id),
  ])

  if (!item) {
    throw new Response('Item not found', { status: 404 })
  }

  // Merge existing categories with suggestions, removing duplicates
  const allCategories = [...new Set([...existingCategories, ...CATEGORY_SUGGESTIONS])].sort()

  return { item, categories: allCategories, priceCount, packingLists }
}

export async function action({ request, params, context }: ActionFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const id = parseInt(params.id!, 10)

  if (isNaN(id)) {
    throw new Response('Invalid item ID', { status: 400 })
  }

  const formData = await request.formData()
  const intent = formData.get('intent')

  // Handle delete
  if (intent === 'delete') {
    await deleteItem(db, id)
    return redirect('/admin/items')
  }

  // Handle update
  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const categorySelect = formData.get('category') as string | null
  const categoryOther = formData.get('category_other') as string | null
  const asin = formData.get('asin') as string | null
  const imageUrl = formData.get('image_url') as string | null
  const unitName = formData.get('unit_name') as string | null
  const weightOz = formData.get('weight_oz') as string | null
  const brandPreference = formData.get('brand_preference') as string | null

  // Determine final category
  const category = categorySelect === '_other' ? categoryOther : categorySelect

  // Validation
  const errors: Record<string, string> = {}

  if (!name || name.trim() === '') {
    errors.name = 'Item name is required'
  }

  if (categorySelect === '_other' && (!categoryOther || categoryOther.trim() === '')) {
    errors.category_other = 'Please enter a category name'
  }

  if (weightOz && weightOz.trim() !== '') {
    const weight = parseFloat(weightOz)
    if (isNaN(weight) || weight < 0) {
      errors.weight_oz = 'Weight must be a positive number'
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  try {
    await updateItem(db, id, {
      name: name.trim(),
      description: description?.trim() || null,
      category: category?.trim() || null,
      asin: asin?.trim() || null,
      image_url: imageUrl?.trim() || null,
      unit_name: unitName || 'each',
      weight_oz: weightOz && weightOz.trim() !== '' ? parseFloat(weightOz) : null,
      brand_preference: brandPreference?.trim() || null,
    })

    return { success: true, message: 'Item updated successfully' }
  } catch (error) {
    console.error('Failed to update item:', error)
    return { success: false, errors: { _form: 'Failed to update item. Please try again.' } }
  }
}

export default function AdminItemsEditPage() {
  const { item, categories, priceCount, packingLists } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const deleteFetcher = useFetcher()

  const isSubmitting = navigation.state === 'submitting'
  const isDeleting = deleteFetcher.state === 'submitting'

  // Determine if current category is in the list or needs "Other"
  const categoryInList = categories.includes(item.category || '')
  const initialCategory = item.category && !categoryInList ? '_other' : (item.category || '')

  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Update local state when item data changes
  useEffect(() => {
    const categoryInListNew = categories.includes(item.category || '')
    setSelectedCategory(item.category && !categoryInListNew ? '_other' : (item.category || ''))
  }, [item, categories])

  const showCategoryOther = selectedCategory === '_other'

  const errors = (actionData as { errors?: Record<string, string> })?.errors || {}
  const successMessage = (actionData as { success?: boolean; message?: string })?.success
    ? (actionData as { message?: string }).message
    : null

  const handleDelete = () => {
    deleteFetcher.submit({ intent: 'delete' }, { method: 'post' })
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/items">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-semibold text-text-primary">{item.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              {item.category && (
                <Badge variant="outline" size="sm">
                  {item.category}
                </Badge>
              )}
              {item.asin && (
                <Badge variant="info" size="sm">
                  ASIN
                </Badge>
              )}
              {item.image_url && (
                <Badge variant="success" size="sm">
                  Has Image
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards - Desktop */}
        <div className="hidden sm:flex items-center gap-3">
          <Card variant="bordered" padding="sm" className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <DollarSign size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary">{priceCount}</p>
              <p className="text-xs text-text-muted">Price{priceCount !== 1 ? 's' : ''}</p>
            </div>
            <Link to={`/admin/prices?item=${item.id}`} className="ml-2">
              <Button variant="ghost" size="sm">
                View
                <ExternalLink size={14} />
              </Button>
            </Link>
          </Card>

          <Card variant="bordered" padding="sm" className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <List size={20} className="text-info" />
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary">{packingLists.length}</p>
              <p className="text-xs text-text-muted">List{packingLists.length !== 1 ? 's' : ''}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile Stats */}
      <div className="sm:hidden grid grid-cols-2 gap-3">
        <Card variant="bordered" padding="sm" className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <DollarSign size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary">{priceCount}</p>
              <p className="text-xs text-text-muted">Price{priceCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </Card>
        <Card variant="bordered" padding="sm" className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-info/10">
            <List size={20} className="text-info" />
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">{packingLists.length}</p>
            <p className="text-xs text-text-muted">List{packingLists.length !== 1 ? 's' : ''}</p>
          </div>
        </Card>
      </div>

      {/* Packing Lists containing this item */}
      {packingLists.length > 0 && (
        <Card variant="bordered" padding="md">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Used in {packingLists.length} packing list{packingLists.length !== 1 ? 's' : ''}
          </h3>
          <div className="flex flex-wrap gap-2">
            {packingLists.map((list) => (
              <Link key={list.id} to={`/list/${list.id}`}>
                <Badge variant="outline" size="sm" className="hover:bg-bg-subtle transition-colors">
                  {list.name}
                  <ExternalLink size={10} className="ml-1" />
                </Badge>
              </Link>
            ))}
          </div>
        </Card>
      )}

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
              <p className="font-medium text-text-primary">Delete this item?</p>
              <p className="text-sm text-text-muted mt-1">
                This will also delete {priceCount} associated price{priceCount !== 1 ? 's' : ''} and
                remove this item from {packingLists.length} packing list
                {packingLists.length !== 1 ? 's' : ''}.
                This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete} loading={isDeleting}>
                <Trash2 size={16} />
                Delete Item
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
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                <Package size={16} />
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Item Name"
                    name="name"
                    placeholder="e.g., Boot Socks, Wool Blend"
                    required
                    defaultValue={item.name}
                    error={errors.name}
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="Description"
                    name="description"
                    placeholder="Optional description or notes about this item"
                    defaultValue={item.description || ''}
                  />
                </div>

                <Select
                  label="Category"
                  name="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="_other">Other (specify)</option>
                </Select>

                {showCategoryOther && (
                  <Input
                    label="New Category Name"
                    name="category_other"
                    placeholder="e.g., Medical Supplies"
                    defaultValue={!categoryInList ? (item.category || '') : ''}
                    error={errors.category_other}
                  />
                )}

                <Select
                  label="Unit"
                  name="unit_name"
                  defaultValue={item.unit_name || 'each'}
                  helperText="How is this item counted?"
                >
                  {UNIT_NAME_OPTIONS.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Brand Preference"
                  name="brand_preference"
                  placeholder="e.g., Darn Tough, Fox River"
                  defaultValue={item.brand_preference || ''}
                  helperText="Recommended brand(s)"
                />
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                <Tag size={16} />
                Product Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Amazon ASIN"
                  name="asin"
                  placeholder="e.g., B07X1234AB"
                  defaultValue={item.asin || ''}
                  helperText="For Amazon product links"
                />

                <Input
                  label="Weight (oz)"
                  name="weight_oz"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g., 2.5"
                  defaultValue={item.weight_oz?.toString() || ''}
                  error={errors.weight_oz}
                  helperText="For pack weight calculations"
                />

                <div className="md:col-span-2">
                  <Input
                    label="Image URL"
                    name="image_url"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    defaultValue={item.image_url || ''}
                    helperText="Direct link to product image"
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
                Delete Item
              </Button>

              <div className="flex items-center gap-3">
                <Link to="/admin/items">
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

      {/* Metadata */}
      <Card variant="bordered" padding="md" className="text-xs text-text-muted">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>ID: {item.id}</span>
          <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
          <span>Updated: {new Date(item.updated_at).toLocaleDateString()}</span>
        </div>
      </Card>
    </div>
  )
}
