import { useState, useEffect } from 'react'
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData, useActionData, useNavigation, Form, Link } from 'react-router'
import { redirect } from 'react-router'
import { ArrowLeft, Globe, ShieldCheck, Save, MapPin } from 'lucide-react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select } from '~/components/ui/select'
import { Badge } from '~/components/ui/badge'
import { getDB, getBases, createStore } from '~/lib/db.server'
import type { Base } from '~/types/database'

export const meta: MetaFunction = () => {
  return [{ title: 'Add Store - Admin - CPL' }]
}

const STORE_TYPES = [
  { value: 'Online', label: 'Online' },
  { value: 'Military Surplus', label: 'Military Surplus' },
  { value: 'Retail', label: 'Retail' },
  { value: 'PX/BX', label: 'PX/BX' },
  { value: 'Commissary', label: 'Commissary' },
  { value: 'Discount', label: 'Discount' },
]

export async function loader({ context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const bases = await getBases(db)
  return { bases }
}

export async function action({ request, context }: ActionFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const formData = await request.formData()

  const name = formData.get('name') as string
  const address = formData.get('address') as string | null
  const city = formData.get('city') as string | null
  const state = formData.get('state') as string | null
  const zip = formData.get('zip') as string | null
  const phone = formData.get('phone') as string | null
  const website = formData.get('website') as string | null
  const lat = formData.get('lat') as string | null
  const lng = formData.get('lng') as string | null
  const isOnline = formData.get('is_online') === '1'
  const storeType = formData.get('store_type') as string | null
  const baseId = formData.get('base_id') as string | null
  const acceptsMilitaryDiscount = formData.get('accepts_military_discount') === '1'
  const militaryDiscountPct = formData.get('military_discount_pct') as string | null

  // Validation
  const errors: Record<string, string> = {}

  if (!name || name.trim() === '') {
    errors.name = 'Store name is required'
  }

  if (acceptsMilitaryDiscount && militaryDiscountPct) {
    const pct = parseFloat(militaryDiscountPct)
    if (isNaN(pct) || pct < 0 || pct > 100) {
      errors.military_discount_pct = 'Discount must be between 0 and 100'
    }
  }

  if (lat && lat.trim() !== '') {
    const latNum = parseFloat(lat)
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      errors.lat = 'Latitude must be between -90 and 90'
    }
  }

  if (lng && lng.trim() !== '') {
    const lngNum = parseFloat(lng)
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      errors.lng = 'Longitude must be between -180 and 180'
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  try {
    await createStore(db, {
      name: name.trim(),
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      zip: zip?.trim() || null,
      phone: phone?.trim() || null,
      website: website?.trim() || null,
      lat: lat && lat.trim() !== '' ? parseFloat(lat) : null,
      lng: lng && lng.trim() !== '' ? parseFloat(lng) : null,
      is_online: isOnline ? 1 : 0,
      store_type: storeType || null,
      base_id: baseId && baseId !== '' ? parseInt(baseId, 10) : null,
      accepts_military_discount: acceptsMilitaryDiscount ? 1 : 0,
      military_discount_pct: acceptsMilitaryDiscount && militaryDiscountPct
        ? parseFloat(militaryDiscountPct)
        : null,
    })

    return redirect('/admin/stores')
  } catch (error) {
    console.error('Failed to create store:', error)
    return { success: false, errors: { _form: 'Failed to create store. Please try again.' } }
  }
}

export default function AdminStoresNewPage() {
  const { bases } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const [isOnline, setIsOnline] = useState(false)
  const [acceptsMilitaryDiscount, setAcceptsMilitaryDiscount] = useState(false)

  const errors = actionData?.errors || {}

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/stores">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Add Store</h2>
          <p className="text-text-secondary text-sm mt-1">
            Create a new store for price tracking
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
            {/* Online Store Toggle */}
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_online"
                  value="1"
                  checked={isOnline}
                  onChange={(e) => setIsOnline(e.target.checked)}
                  className="w-5 h-5 rounded border-border bg-bg-elevated text-accent focus:ring-accent/20"
                />
                <span className="text-sm font-medium text-text-primary">Online Store</span>
              </label>
              {isOnline && (
                <Badge variant="info" size="sm">
                  <Globe size={12} />
                  Online
                </Badge>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Store Name"
                  name="name"
                  placeholder="e.g., Army Navy Surplus"
                  required
                  error={errors.name}
                />
              </div>

              <Select
                label="Store Type"
                name="store_type"
              >
                <option value="">Select type...</option>
                {STORE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>

              <Select
                label="Military Base"
                name="base_id"
                helperText="Associate with a base for location-based filtering"
              >
                <option value="">None (Online or Unassigned)</option>
                {(bases as Base[]).map((base) => (
                  <option key={base.id} value={base.id}>
                    {base.name} {base.state ? `(${base.state})` : ''}
                  </option>
                ))}
              </Select>
            </div>

            {/* Address Section */}
            <div className={`space-y-4 ${isOnline ? 'opacity-50' : ''}`}>
              <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                <MapPin size={16} />
                Physical Address
                {isOnline && (
                  <span className="text-xs text-text-muted">(Optional for online stores)</span>
                )}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Street Address"
                    name="address"
                    placeholder="123 Main St"
                    disabled={isOnline}
                  />
                </div>

                <Input
                  label="City"
                  name="city"
                  placeholder="Fayetteville"
                  disabled={isOnline}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="State"
                    name="state"
                    placeholder="NC"
                    maxLength={2}
                    disabled={isOnline}
                  />

                  <Input
                    label="ZIP Code"
                    name="zip"
                    placeholder="28301"
                    disabled={isOnline}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Latitude"
                  name="lat"
                  type="number"
                  step="any"
                  placeholder="35.0527"
                  disabled={isOnline}
                  error={errors.lat}
                  helperText="For map display and distance calculations"
                />

                <Input
                  label="Longitude"
                  name="lng"
                  type="number"
                  step="any"
                  placeholder="-78.8784"
                  disabled={isOnline}
                  error={errors.lng}
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-text-secondary">Contact Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  name="phone"
                  type="tel"
                  placeholder="(910) 555-0123"
                />

                <Input
                  label="Website"
                  name="website"
                  type="url"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* Military Discount */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="accepts_military_discount"
                    value="1"
                    checked={acceptsMilitaryDiscount}
                    onChange={(e) => setAcceptsMilitaryDiscount(e.target.checked)}
                    className="w-5 h-5 rounded border-border bg-bg-elevated text-accent focus:ring-accent/20"
                  />
                  <span className="text-sm font-medium text-text-primary">
                    Accepts Military Discount
                  </span>
                </label>
                {acceptsMilitaryDiscount && (
                  <Badge variant="success" size="sm">
                    <ShieldCheck size={12} />
                    Military
                  </Badge>
                )}
              </div>

              {acceptsMilitaryDiscount && (
                <div className="max-w-xs">
                  <Input
                    label="Discount Percentage"
                    name="military_discount_pct"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="10"
                    error={errors.military_discount_pct}
                    helperText="e.g., 10 for 10% off"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link to="/admin/stores">
                <Button variant="ghost" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" loading={isSubmitting}>
                <Save size={16} />
                Create Store
              </Button>
            </div>
          </div>
        </Card>
      </Form>
    </div>
  )
}
