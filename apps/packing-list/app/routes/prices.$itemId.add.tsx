import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { Form, Link, redirect, useLoaderData, useActionData } from 'react-router'
import { ArrowLeft, DollarSign, Package, Store as StoreIcon, Hash } from 'lucide-react'
import { Layout } from '~/components/layout'
import { Button } from '~/components/ui/button'
import { Select } from '~/components/ui/select'
import { Card } from '~/components/ui/card'
import { getDB, getItem, getStores, createPrice } from '~/lib/db.server'
import { validateLength } from '~/lib/validation'
import { validateOrigin } from '~/lib/csrf.server'
import type { Item, Store } from '~/types/database'

// Common package sizes for quick selection
const COMMON_PACKAGES = [
  { qty: 1, name: null, label: 'Single' },
  { qty: 2, name: '2-pack', label: '2-pack' },
  { qty: 3, name: '3-pack', label: '3-pack' },
  { qty: 6, name: '6-pack', label: '6-pack' },
  { qty: 12, name: '12-pack', label: '12-pack' },
]

export async function loader({ params, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const itemId = parseInt(params.itemId!)

  const item = await getItem(db, itemId)
  if (!item) {
    throw new Response('Item not found', { status: 404 })
  }

  const stores = await getStores(db, { all: true })

  return { item, stores }
}

export async function action({ params, request, context }: ActionFunctionArgs) {
  const originError = validateOrigin(request)
  if (originError) {
    return new Response(originError, { status: 403 })
  }

  const formData = await request.formData()
  const db = getDB(context as Parameters<typeof getDB>[0])
  const itemId = parseInt(params.itemId!)

  const storeId = formData.get('store_id') as string
  const priceStr = formData.get('price') as string
  const inStock = formData.get('in_stock') === 'on'
  const packageQtyStr = formData.get('package_qty') as string
  const packageName = formData.get('package_name') as string | null

  if (!storeId) {
    return { error: 'Please select a store' }
  }

  if (!priceStr || priceStr.trim().length === 0) {
    return { error: 'Please enter a price' }
  }

  const price = parseFloat(priceStr)
  if (isNaN(price) || price <= 0) {
    return { error: 'Please enter a valid price' }
  }

  if (packageName && validateLength(packageName, 'name')) {
    return { error: validateLength(packageName, 'name') }
  }

  const packageQty = packageQtyStr ? parseInt(packageQtyStr) : 1
  if (isNaN(packageQty) || packageQty < 1) {
    return { error: 'Package quantity must be at least 1' }
  }

  // Convert dollars to cents
  const priceInCents = Math.round(price * 100)

  await createPrice(db, {
    itemId,
    storeId: parseInt(storeId),
    price: priceInCents,
    inStock,
    packageQty,
    packageName: packageName && packageName.trim() ? packageName.trim() : null,
  })

  return redirect(`/prices/${itemId}`)
}

export const meta: MetaFunction = ({ data }) => {
  const typedData = data as { item?: Item } | undefined
  return [
    { title: typedData?.item ? `Add Price - ${typedData.item.name}` : 'Add Price' },
  ]
}

export default function AddPricePage() {
  const { item, stores } = useLoaderData<{ item: Item; stores: Store[] }>()
  const actionData = useActionData<{ error?: string }>()

  return (
    <Layout>
      <div className="max-w-xl mx-auto pb-20 md:pb-0">
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/prices/${item.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} />
              Back to Prices
            </Button>
          </Link>
        </div>

        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          Add Price
        </h1>
        <p className="text-text-secondary mb-6">
          Help the community by sharing a price you found.
        </p>

        {/* Item Info */}
        <Card variant="bordered" padding="md" className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-bg-elevated border border-border flex items-center justify-center">
              {item.image_url ? (
                <img src={item.image_url} alt="" className="w-10 h-10 object-contain" />
              ) : (
                <Package size={20} className="text-text-muted" />
              )}
            </div>
            <div>
              <h2 className="font-medium text-text-primary">{item.name}</h2>
              <p className="text-sm text-text-muted">
                {item.category && <span>{item.category} • </span>}
                <span className="text-accent">Sold per {item.unit_name || 'each'}</span>
              </p>
            </div>
          </div>
        </Card>

        <Card variant="bordered" padding="lg">
          <Form method="post" className="space-y-4">
            <Select label="Store" name="store_id" required>
              <option value="">Select a store...</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} {store.city && `(${store.city}, ${store.state})`}
                </option>
              ))}
            </Select>

            {/* Package Size Quick Select */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-secondary">
                Package Size
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_PACKAGES.map((pkg) => (
                  <label
                    key={pkg.qty}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border cursor-pointer hover:border-text-primary/30 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/10"
                  >
                    <input
                      type="radio"
                      name="package_preset"
                      value={pkg.qty}
                      defaultChecked={pkg.qty === 1}
                      onChange={(e) => {
                        const form = e.target.form
                        if (form) {
                          const qtyInput = form.elements.namedItem('package_qty') as HTMLInputElement
                          const nameInput = form.elements.namedItem('package_name') as HTMLInputElement
                          if (qtyInput) qtyInput.value = String(pkg.qty)
                          if (nameInput) nameInput.value = pkg.name || ''
                        }
                      }}
                      className="sr-only"
                    />
                    <span className="text-sm text-text-primary">{pkg.label}</span>
                  </label>
                ))}
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border cursor-pointer hover:border-text-primary/30 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/10">
                  <input
                    type="radio"
                    name="package_preset"
                    value="custom"
                    className="sr-only"
                  />
                  <span className="text-sm text-text-primary">Custom</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                    <Hash size={16} />
                  </span>
                  <input
                    type="number"
                    name="package_qty"
                    placeholder="Qty"
                    min="1"
                    defaultValue="1"
                    className="w-full pl-10 pr-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/50 transition-all duration-200"
                  />
                </div>
                <input
                  type="text"
                  name="package_name"
                  placeholder="e.g., 6-pack, box of 12"
                  className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/50 transition-all duration-200"
                />
              </div>
              <p className="text-xs text-text-muted">
                How many {item.unit_name || 'units'} come in the package?
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-secondary">
                Price (for the package)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <DollarSign size={16} />
                </span>
                <input
                  type="number"
                  name="price"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                  className="w-full pl-10 pr-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/50 transition-all duration-200"
                />
              </div>
              <p className="text-xs text-text-muted">Enter the total package price (e.g., 12.99 for a 6-pack)</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                name="in_stock"
                id="in_stock"
                defaultChecked={true}
                className="w-4 h-4 rounded border-border bg-bg-elevated text-text-primary focus:ring-text-primary/20"
              />
              <label htmlFor="in_stock" className="text-sm text-text-secondary cursor-pointer">
                Item was in stock
              </label>
            </div>

            {actionData?.error && (
              <p className="text-sm text-error animate-slide-up">{actionData.error}</p>
            )}

            <div className="flex justify-end pt-4">
              <Button variant="primary" type="submit">
                <DollarSign size={16} />
                Submit Price
              </Button>
            </div>
          </Form>
        </Card>

        <p className="text-sm text-text-muted mt-4 text-center">
          Your contribution helps others find the best deals.
        </p>
      </div>
    </Layout>
  )
}
