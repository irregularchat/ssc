import { useState, useEffect } from 'react'
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData, useActionData, useNavigation, Form, Link, useFetcher } from 'react-router'
import { redirect } from 'react-router'
import {
  ArrowLeft,
  Save,
  Trash2,
  DollarSign,
  Package,
  Store,
  ShoppingBag,
  ThumbsUp,
  ThumbsDown,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select } from '~/components/ui/select'
import { Badge } from '~/components/ui/badge'
import {
  getDB,
  getPriceById,
  updatePrice,
  deletePrice,
  getVotesForPrice,
} from '~/lib/db.server'
import { formatPrice } from '~/lib/format'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const itemName = data?.price?.item_name || 'Price'
  return [{ title: `${itemName} - Edit Price - Admin - CPL` }]
}

export async function loader({ params, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const id = parseInt(params.id!, 10)

  if (isNaN(id)) {
    throw new Response('Invalid price ID', { status: 400 })
  }

  const [price, votes] = await Promise.all([
    getPriceById(db, id),
    getVotesForPrice(db, id),
  ])

  if (!price) {
    throw new Response('Price not found', { status: 404 })
  }

  return { price, votes }
}

export async function action({ request, params, context }: ActionFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const id = parseInt(params.id!, 10)

  if (isNaN(id)) {
    throw new Response('Invalid price ID', { status: 400 })
  }

  const formData = await request.formData()
  const intent = formData.get('intent')

  // Handle delete
  if (intent === 'delete') {
    await deletePrice(db, id)
    return redirect('/admin/prices')
  }

  // Handle update
  const priceValue = formData.get('price') as string
  const inStock = formData.get('in_stock') === '1'
  const packageQty = formData.get('package_qty') as string
  const packageName = formData.get('package_name') as string | null
  const militaryDiscountPct = formData.get('military_discount_pct') as string | null

  // Validation
  const errors: Record<string, string> = {}

  const priceNum = parseFloat(priceValue)
  if (isNaN(priceNum) || priceNum < 0) {
    errors.price = 'Price must be a positive number'
  }

  const packageQtyNum = parseInt(packageQty, 10)
  if (isNaN(packageQtyNum) || packageQtyNum < 1) {
    errors.package_qty = 'Package quantity must be at least 1'
  }

  if (militaryDiscountPct && militaryDiscountPct.trim() !== '') {
    const discountNum = parseFloat(militaryDiscountPct)
    if (isNaN(discountNum) || discountNum < 0 || discountNum > 100) {
      errors.military_discount_pct = 'Discount must be between 0 and 100'
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  // Convert dollars to cents for storage
  const priceInCents = Math.round(priceNum * 100)

  try {
    await updatePrice(db, id, {
      price: priceInCents,
      in_stock: inStock ? 1 : 0,
      package_qty: packageQtyNum,
      package_name: packageName?.trim() || null,
      military_discount_pct: militaryDiscountPct && militaryDiscountPct.trim() !== ''
        ? parseFloat(militaryDiscountPct)
        : null,
    })

    return { success: true, message: 'Price updated successfully' }
  } catch (error) {
    console.error('Failed to update price:', error)
    return { success: false, errors: { _form: 'Failed to update price. Please try again.' } }
  }
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export default function AdminPricesEditPage() {
  const { price, votes } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const deleteFetcher = useFetcher()

  const isSubmitting = navigation.state === 'submitting'
  const isDeleting = deleteFetcher.state === 'submitting'

  const [inStock, setInStock] = useState(price.in_stock === 1)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Update local state when price data changes
  useEffect(() => {
    setInStock(price.in_stock === 1)
  }, [price])

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
          <Link to="/admin/prices">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-semibold text-text-primary">Edit Price</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" size="sm">
                {formatPrice(price.price)}
              </Badge>
              {price.in_stock === 1 ? (
                <Badge variant="success" size="sm">
                  In Stock
                </Badge>
              ) : (
                <Badge variant="error" size="sm">
                  Out of Stock
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Item and Store Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-accent/10">
              <ShoppingBag size={24} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-muted uppercase tracking-wider">Item</p>
              <p className="font-medium text-text-primary truncate">{price.item_name}</p>
            </div>
            <Link to={`/admin/items/${price.item_id}`}>
              <Button variant="ghost" size="sm">
                <ExternalLink size={14} />
              </Button>
            </Link>
          </div>
        </Card>

        <Card variant="bordered" padding="md">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-info/10">
              <Store size={24} className="text-info" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-muted uppercase tracking-wider">Store</p>
              <p className="font-medium text-text-primary truncate">{price.store_name}</p>
            </div>
            <Link to={`/admin/stores/${price.store_id}`}>
              <Button variant="ghost" size="sm">
                <ExternalLink size={14} />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Vote Breakdown */}
      <Card variant="bordered" padding="md">
        <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
          <ThumbsUp size={16} />
          Vote Breakdown
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-success/10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ThumbsUp size={18} className="text-success" />
              <span className="text-2xl font-bold text-success">{votes.upvotes}</span>
            </div>
            <p className="text-xs text-text-muted">Upvotes</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-error/10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ThumbsDown size={18} className="text-error" />
              <span className="text-2xl font-bold text-error">{votes.downvotes}</span>
            </div>
            <p className="text-xs text-text-muted">Downvotes</p>
          </div>
          <div className={`text-center p-4 rounded-lg ${
            votes.score > 0 ? 'bg-success/10' : votes.score < 0 ? 'bg-error/10' : 'bg-bg-elevated'
          }`}>
            <span className={`text-2xl font-bold ${
              votes.score > 0 ? 'text-success' : votes.score < 0 ? 'text-error' : 'text-text-muted'
            }`}>
              {votes.score > 0 ? '+' : ''}{votes.score}
            </span>
            <p className="text-xs text-text-muted mt-1">Score</p>
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
              <p className="font-medium text-text-primary">Delete this price?</p>
              <p className="text-sm text-text-muted mt-1">
                This will also delete {votes.upvotes + votes.downvotes} associated vote
                {votes.upvotes + votes.downvotes !== 1 ? 's' : ''}.
                This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete} loading={isDeleting}>
                <Trash2 size={16} />
                Delete Price
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Form */}
      <Form method="post">
        <Card variant="bordered" padding="lg">
          <div className="space-y-6">
            {/* Price Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                <DollarSign size={16} />
                Price Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                  defaultValue={(price.price / 100).toFixed(2)}
                  error={errors.price}
                />

                <div className="flex items-center gap-3 pt-8">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="in_stock"
                      value="1"
                      checked={inStock}
                      onChange={(e) => setInStock(e.target.checked)}
                      className="w-5 h-5 rounded border-border bg-bg-elevated text-accent focus:ring-accent/20"
                    />
                    <span className="text-sm font-medium text-text-primary">In Stock</span>
                  </label>
                  {inStock ? (
                    <Badge variant="success" size="sm">
                      Available
                    </Badge>
                  ) : (
                    <Badge variant="error" size="sm">
                      Out of Stock
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Package Info */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                <Package size={16} />
                Package Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Package Quantity"
                  name="package_qty"
                  type="number"
                  min="1"
                  placeholder="1"
                  required
                  defaultValue={price.package_qty.toString()}
                  error={errors.package_qty}
                  helperText="Number of units per package (e.g., 6 for a 6-pack)"
                />

                <Input
                  label="Package Name"
                  name="package_name"
                  placeholder="e.g., 6-pack, Box of 12"
                  defaultValue={price.package_name || ''}
                  helperText="Display name for the package (optional)"
                />
              </div>
            </div>

            {/* Military Discount */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-text-secondary">Military Discount</h3>

              <div className="max-w-xs">
                <Input
                  label="Discount Percentage"
                  name="military_discount_pct"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="10"
                  defaultValue={price.military_discount_pct?.toString() || ''}
                  error={errors.military_discount_pct}
                  helperText="If this price includes a military discount (e.g., 10 for 10% off)"
                />
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
                Delete Price
              </Button>

              <div className="flex items-center gap-3">
                <Link to="/admin/prices">
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
          <span>ID: {price.id}</span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            Last Verified: {formatRelativeDate(price.last_verified)}
          </span>
          <span>Created: {new Date(price.created_at).toLocaleDateString()}</span>
        </div>
      </Card>
    </div>
  )
}
