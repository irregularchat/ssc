import { useState } from 'react'
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData, useActionData, useNavigation, Form, Link } from 'react-router'
import { redirect } from 'react-router'
import { ArrowLeft, Save, Package, Tag } from 'lucide-react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select } from '~/components/ui/select'
import { getDB, getDistinctCategories, createItem } from '~/lib/db.server'

export const meta: MetaFunction = () => {
  return [{ title: 'Add Item - Admin - CPL' }]
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

export async function loader({ context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const existingCategories = await getDistinctCategories(db)

  // Merge existing categories with suggestions, removing duplicates
  const allCategories = [...new Set([...existingCategories, ...CATEGORY_SUGGESTIONS])].sort()

  return { categories: allCategories }
}

export async function action({ request, context }: ActionFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const formData = await request.formData()

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
    await createItem(db, {
      name: name.trim(),
      description: description?.trim() || null,
      category: category?.trim() || null,
      asin: asin?.trim() || null,
      image_url: imageUrl?.trim() || null,
      unit_name: unitName || 'each',
      weight_oz: weightOz && weightOz.trim() !== '' ? parseFloat(weightOz) : null,
      brand_preference: brandPreference?.trim() || null,
    })

    return redirect('/admin/items')
  } catch (error) {
    console.error('Failed to create item:', error)
    return { success: false, errors: { _form: 'Failed to create item. Please try again.' } }
  }
}

export default function AdminItemsNewPage() {
  const { categories } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const [selectedCategory, setSelectedCategory] = useState('')
  const showCategoryOther = selectedCategory === '_other'

  const errors = actionData?.errors || {}

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/items">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Add Item</h2>
          <p className="text-text-secondary text-sm mt-1">
            Create a new item for packing lists
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
                    error={errors.name}
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="Description"
                    name="description"
                    placeholder="Optional description or notes about this item"
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
                    error={errors.category_other}
                  />
                )}

                <Select
                  label="Unit"
                  name="unit_name"
                  defaultValue="each"
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
                  helperText="For Amazon product links"
                />

                <Input
                  label="Weight (oz)"
                  name="weight_oz"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g., 2.5"
                  error={errors.weight_oz}
                  helperText="For pack weight calculations"
                />

                <div className="md:col-span-2">
                  <Input
                    label="Image URL"
                    name="image_url"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    helperText="Direct link to product image"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link to="/admin/items">
                <Button variant="ghost" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" loading={isSubmitting}>
                <Save size={16} />
                Create Item
              </Button>
            </div>
          </div>
        </Card>
      </Form>
    </div>
  )
}
