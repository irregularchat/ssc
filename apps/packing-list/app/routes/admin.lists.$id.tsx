import { useState, useEffect } from 'react'
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import {
  useLoaderData,
  useActionData,
  useNavigation,
  Form,
  Link,
  useFetcher,
} from 'react-router'
import { redirect } from 'react-router'
import {
  ArrowLeft,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Search,
  X,
  Package,
  GraduationCap,
  MapPin,
  ExternalLink,
  Copy,
  GitBranch,
  Link as LinkIcon,
} from 'lucide-react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select } from '~/components/ui/select'
import { Badge } from '~/components/ui/badge'
import {
  getDB,
  getPackingListWithItems,
  getSchools,
  getBases,
  getItems,
  updatePackingListDetails,
  deletePackingListById,
  updatePackingListItem,
  addItemToPackingList,
  removeItemFromPackingList,
  searchItems,
  getChildLists,
  getSchoolBases,
} from '~/lib/db.server'
import type { School, Base, Item } from '~/types/database'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const listName = data?.list?.name || 'List'
  return [{ title: `${listName} - Edit List - Admin - CPL` }]
}

const LIST_TYPES = [
  'Basic Training',
  'AIT',
  'Deployment',
  'PCS',
  'TDY',
  'School',
  'General',
]

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Required' },
  { value: 2, label: 'Recommended' },
  { value: 3, label: 'Optional' },
]

export async function loader({ params, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const id = parseInt(params.id!, 10)

  if (isNaN(id)) {
    throw new Response('Invalid list ID', { status: 400 })
  }

  const [list, schools, bases, items] = await Promise.all([
    getPackingListWithItems(db, id),
    getSchools(db, { all: true }),
    getBases(db),
    getItems(db, { all: true }),
  ])

  if (!list) {
    throw new Response('List not found', { status: 404 })
  }

  // Fetch inheritance info
  const childLists = await getChildLists(db, id)

  // Fetch parent list info if this is a child
  let parentList = null
  if (list.parent_list_id) {
    parentList = await getPackingListWithItems(db, list.parent_list_id)
  }

  // Fetch school bases if school is selected
  let schoolBases: any[] = []
  if (list.school_id) {
    schoolBases = await getSchoolBases(db, list.school_id)
  }

  return { list, schools, bases, items, childLists, parentList, schoolBases }
}

export async function action({ request, params, context }: ActionFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const id = parseInt(params.id!, 10)

  if (isNaN(id)) {
    throw new Response('Invalid list ID', { status: 400 })
  }

  const formData = await request.formData()
  const intent = formData.get('intent')

  // Handle delete list
  if (intent === 'delete') {
    await deletePackingListById(db, id)
    return redirect('/admin/lists')
  }

  // Handle update list details
  if (intent === 'update-details') {
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const type = formData.get('type') as string | null
    const isPublic = formData.get('is_public') === '1'
    const contributorName = formData.get('contributor_name') as string | null
    const schoolId = formData.get('school_id') as string | null
    const baseId = formData.get('base_id') as string | null

    // Validation
    const errors: Record<string, string> = {}

    if (!name || name.trim() === '') {
      errors.name = 'List name is required'
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors }
    }

    try {
      await updatePackingListDetails(db, id, {
        name: name.trim(),
        description: description?.trim() || null,
        type: type || null,
        is_public: isPublic ? 1 : 0,
        contributor_name: contributorName?.trim() || null,
        school_id: schoolId && schoolId !== '' ? parseInt(schoolId, 10) : null,
        base_id: baseId && baseId !== '' ? parseInt(baseId, 10) : null,
      })

      return { success: true, message: 'List details updated successfully' }
    } catch (error) {
      console.error('Failed to update list:', error)
      return { success: false, errors: { _form: 'Failed to update list. Please try again.' } }
    }
  }

  // Handle update packing list item (quantity, priority, notes)
  if (intent === 'update-item') {
    const itemId = parseInt(formData.get('item_id') as string, 10)
    const quantity = parseInt(formData.get('quantity') as string, 10)
    const priority = parseInt(formData.get('priority') as string, 10)
    const notes = formData.get('notes') as string | null

    if (!isNaN(itemId)) {
      await updatePackingListItem(db, itemId, {
        quantity: isNaN(quantity) ? undefined : quantity,
        priority: isNaN(priority) ? undefined : priority,
        notes: notes?.trim() || null,
      })
    }

    return { success: true, itemUpdated: itemId }
  }

  // Handle add item to list
  if (intent === 'add-item') {
    const itemId = parseInt(formData.get('item_id') as string, 10)
    const quantity = parseInt(formData.get('quantity') as string, 10) || 1
    const priority = parseInt(formData.get('priority') as string, 10) || 1
    const notes = formData.get('notes') as string | null

    if (!isNaN(itemId)) {
      await addItemToPackingList(db, id, itemId, quantity, priority, notes?.trim() || null)
    }

    return { success: true, itemAdded: itemId }
  }

  // Handle remove item from list
  if (intent === 'remove-item') {
    const packingListItemId = parseInt(formData.get('packing_list_item_id') as string, 10)

    if (!isNaN(packingListItemId)) {
      await removeItemFromPackingList(db, packingListItemId)
    }

    return { success: true, itemRemoved: packingListItemId }
  }

  // Handle search items
  if (intent === 'search-items') {
    const query = formData.get('query') as string
    if (query && query.trim().length >= 2) {
      const results = await searchItems(db, query.trim(), 20)
      return { success: true, searchResults: results }
    }
    return { success: true, searchResults: [] }
  }

  return { success: false }
}

export default function AdminListEditPage() {
  const { list, schools, bases, items, childLists, parentList, schoolBases } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const deleteFetcher = useFetcher()
  const itemFetcher = useFetcher()
  const searchFetcher = useFetcher()

  const isSubmitting = navigation.state === 'submitting'
  const isDeleting = deleteFetcher.state === 'submitting'

  const [isPublic, setIsPublic] = useState(list.is_public === 1)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [addQuantity, setAddQuantity] = useState(1)
  const [addPriority, setAddPriority] = useState(1)

  // Update local state when list data changes
  useEffect(() => {
    setIsPublic(list.is_public === 1)
  }, [list])

  const errors = (actionData as { errors?: Record<string, string> })?.errors || {}
  const successMessage = (actionData as { success?: boolean; message?: string })?.success
    ? (actionData as { message?: string }).message
    : null

  const handleDelete = () => {
    deleteFetcher.submit({ intent: 'delete' }, { method: 'post' })
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim().length >= 2) {
      searchFetcher.submit({ intent: 'search-items', query }, { method: 'post' })
    }
  }

  const handleAddItem = () => {
    if (selectedItemId) {
      itemFetcher.submit(
        {
          intent: 'add-item',
          item_id: selectedItemId.toString(),
          quantity: addQuantity.toString(),
          priority: addPriority.toString(),
        },
        { method: 'post' }
      )
      setShowAddItem(false)
      setSelectedItemId(null)
      setSearchQuery('')
      setAddQuantity(1)
      setAddPriority(1)
    }
  }

  const handleRemoveItem = (packingListItemId: number) => {
    itemFetcher.submit(
      {
        intent: 'remove-item',
        packing_list_item_id: packingListItemId.toString(),
      },
      { method: 'post' }
    )
  }

  const searchResults = (searchFetcher.data as { searchResults?: Item[] })?.searchResults || []

  // Filter out items already in the list from search results
  const existingItemIds = new Set(list.items?.map((i) => i.item_id) || [])
  const filteredSearchResults = searchResults.filter((item) => !existingItemIds.has(item.id))

  // Get priority label
  const getPriorityLabel = (priority: number) => {
    const option = PRIORITY_OPTIONS.find((o) => o.value === priority)
    return option?.label || 'Unknown'
  }

  const getPriorityVariant = (priority: number): 'success' | 'warning' | 'outline' => {
    switch (priority) {
      case 1:
        return 'success'
      case 2:
        return 'warning'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/lists">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-semibold text-text-primary">{list.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              {list.is_public === 1 ? (
                <Badge variant="success" size="sm">
                  <Eye size={12} />
                  Public
                </Badge>
              ) : (
                <Badge variant="outline" size="sm">
                  <EyeOff size={12} />
                  Private
                </Badge>
              )}
              {list.type && (
                <Badge variant="outline" size="sm">
                  {list.type}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Item Count Card */}
        <Card variant="bordered" padding="sm" className="hidden sm:flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Package size={20} className="text-accent" />
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">{list.items?.length || 0}</p>
            <p className="text-xs text-text-muted">Item{(list.items?.length || 0) !== 1 ? 's' : ''}</p>
          </div>
          <Link to={`/list/${list.id}`} className="ml-2">
            <Button variant="ghost" size="sm">
              View
              <ExternalLink size={14} />
            </Button>
          </Link>
        </Card>
      </div>

      {/* Mobile Item Count */}
      <Card variant="bordered" padding="sm" className="sm:hidden flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Package size={20} className="text-accent" />
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">{list.items?.length || 0}</p>
            <p className="text-xs text-text-muted">Items in list</p>
          </div>
        </div>
        <Link to={`/list/${list.id}`}>
          <Button variant="ghost" size="sm">
            View List
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
              <p className="font-medium text-text-primary">Delete this list?</p>
              <p className="text-sm text-text-muted mt-1">
                This will also delete all {list.items?.length || 0} items in this list.
                This action cannot be undone.
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
                Delete List
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Inheritance Info */}
      {(parentList || childLists.length > 0) && (
        <Card variant="bordered" padding="md" className="border-accent/30 bg-accent/5">
          <div className="flex items-start gap-3">
            <GitBranch size={20} className="text-accent mt-0.5" />
            <div className="flex-1">
              {parentList && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-text-primary">
                    Inherits from:
                  </p>
                  <Link
                    to={`/admin/lists/${parentList.id}`}
                    className="inline-flex items-center gap-2 mt-1 text-accent hover:underline"
                  >
                    <LinkIcon size={14} />
                    {parentList.name}
                  </Link>
                  <p className="text-xs text-text-muted mt-1">
                    This is a location-specific variant. Items are inherited from the parent list.
                  </p>
                </div>
              )}
              {childLists.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-text-primary mb-2">
                    Location Variants ({childLists.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {childLists.map((child: any) => (
                      <Link key={child.id} to={`/admin/lists/${child.id}`}>
                        <Badge variant="secondary" size="sm" className="hover:bg-accent/20">
                          {child.base_name || child.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    This is a master list. Changes here will affect all variants.
                  </p>
                </div>
              )}
            </div>
            {!parentList && schoolBases.length > 0 && childLists.length < schoolBases.length && (
              <Link to={`/admin/lists/new?parent=${list.id}`}>
                <Button variant="secondary" size="sm">
                  <Copy size={14} />
                  Create Variant
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Section 1: List Details Form */}
      <Card variant="bordered" padding="lg">
        <h3 className="text-lg font-medium text-text-primary mb-4">List Details</h3>
        <Form method="post">
          <input type="hidden" name="intent" value="update-details" />
          <div className="space-y-6">
            {/* Public Toggle */}
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_public"
                  value="1"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 rounded border-border bg-bg-elevated text-accent focus:ring-accent/20"
                />
                <span className="text-sm font-medium text-text-primary">Public List</span>
              </label>
              {isPublic ? (
                <Badge variant="success" size="sm">
                  <Eye size={12} />
                  Visible to everyone
                </Badge>
              ) : (
                <Badge variant="outline" size="sm">
                  <EyeOff size={12} />
                  Private
                </Badge>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="List Name"
                  name="name"
                  placeholder="e.g., Basic Training Packing List"
                  required
                  defaultValue={list.name}
                  error={errors.name}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  placeholder="What is this list for?"
                  defaultValue={list.description || ''}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/50 resize-none"
                />
              </div>

              <Select
                label="List Type"
                name="type"
                defaultValue={list.type || ''}
              >
                <option value="">Select type...</option>
                {LIST_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>

              <Input
                label="Contributor Name"
                name="contributor_name"
                placeholder="Who created this list?"
                defaultValue={list.contributor_name || ''}
              />

              <Select
                label="School"
                name="school_id"
                defaultValue={list.school_id?.toString() || ''}
                helperText="Associate with a military school"
              >
                <option value="">None</option>
                {(schools as School[]).map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Base"
                name="base_id"
                defaultValue={list.base_id?.toString() || ''}
                helperText="Associate with a military base"
              >
                <option value="">None</option>
                {(bases as Base[]).map((base) => (
                  <option key={base.id} value={base.id}>
                    {base.name} {base.state ? `(${base.state})` : ''}
                  </option>
                ))}
              </Select>
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
                Delete List
              </Button>

              <div className="flex items-center gap-3">
                <Link to="/admin/lists">
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
        </Form>
      </Card>

      {/* Section 2: Manage Items */}
      <Card variant="bordered" padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-text-primary">Items in List</h3>
          <Button size="sm" onClick={() => setShowAddItem(true)}>
            <Plus size={16} />
            Add Item
          </Button>
        </div>

        {/* Add Item Dialog */}
        {showAddItem && (
          <div className="mb-6 p-4 rounded-lg bg-bg-subtle border border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-text-primary">Add Item to List</h4>
              <Button variant="ghost" size="icon" onClick={() => setShowAddItem(false)}>
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-bg-elevated border border-border text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary/50"
                />
              </div>

              {/* Search Results */}
              {searchQuery.length >= 2 && filteredSearchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-bg-elevated">
                  {filteredSearchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItemId(item.id)}
                      className={`w-full text-left px-3 py-2 hover:bg-bg-subtle border-b border-border last:border-0 transition-colors ${
                        selectedItemId === item.id ? 'bg-accent/10' : ''
                      }`}
                    >
                      <p className="text-sm font-medium text-text-primary">{item.name}</p>
                      {item.category && (
                        <p className="text-xs text-text-muted">{item.category}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && filteredSearchResults.length === 0 && (
                <p className="text-sm text-text-muted text-center py-4">
                  No items found matching "{searchQuery}"
                </p>
              )}

              {/* Selected Item */}
              {selectedItemId && (
                <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <p className="text-sm font-medium text-text-primary mb-3">
                    Selected: {items.find((i) => i.id === selectedItemId)?.name}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Quantity"
                      type="number"
                      min="1"
                      value={addQuantity}
                      onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
                    />
                    <Select
                      label="Priority"
                      value={addPriority.toString()}
                      onChange={(e) => setAddPriority(parseInt(e.target.value))}
                    >
                      {PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button
                      size="sm"
                      onClick={handleAddItem}
                      loading={itemFetcher.state === 'submitting'}
                    >
                      <Plus size={16} />
                      Add to List
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Items Table */}
        {list.items && list.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-24">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-32">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.items.map((pli) => (
                  <ListItemRow
                    key={pli.id}
                    packingListItem={pli}
                    onRemove={() => handleRemoveItem(pli.id)}
                    isRemoving={itemFetcher.state === 'submitting'}
                    getPriorityLabel={getPriorityLabel}
                    getPriorityVariant={getPriorityVariant}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-text-muted/30 mb-4" />
            <p className="text-text-muted">No items in this list yet.</p>
            <Button size="sm" className="mt-4" onClick={() => setShowAddItem(true)}>
              <Plus size={16} />
              Add First Item
            </Button>
          </div>
        )}
      </Card>

      {/* Metadata */}
      <Card variant="bordered" padding="md" className="text-xs text-text-muted">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>ID: {list.id}</span>
          <span>Created: {new Date(list.created_at).toLocaleDateString()}</span>
          <span>Updated: {new Date(list.updated_at).toLocaleDateString()}</span>
        </div>
      </Card>
    </div>
  )
}

// Separate component for item rows with inline editing
function ListItemRow({
  packingListItem,
  onRemove,
  isRemoving,
  getPriorityLabel,
  getPriorityVariant,
}: {
  packingListItem: {
    id: number
    item_id: number
    quantity: number
    priority?: number
    notes: string | null
    item: { id: number; name: string; category: string | null }
  }
  onRemove: () => void
  isRemoving: boolean
  getPriorityLabel: (priority: number) => string
  getPriorityVariant: (priority: number) => 'success' | 'warning' | 'outline'
}) {
  const fetcher = useFetcher()
  const [isEditing, setIsEditing] = useState(false)
  const [quantity, setQuantity] = useState(packingListItem.quantity)
  const [priority, setPriority] = useState(packingListItem.priority || 1)
  const [notes, setNotes] = useState(packingListItem.notes || '')
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  const handleSave = () => {
    fetcher.submit(
      {
        intent: 'update-item',
        item_id: packingListItem.id.toString(),
        quantity: quantity.toString(),
        priority: priority.toString(),
        notes: notes,
      },
      { method: 'post' }
    )
    setIsEditing(false)
  }

  return (
    <tr className={`hover:bg-bg-subtle/50 transition-colors ${showRemoveConfirm ? 'bg-error/5' : ''}`}>
      <td className="px-4 py-3">
        <div>
          <Link
            to={`/prices/${packingListItem.item_id}`}
            className="font-medium text-text-primary hover:text-accent transition-colors"
          >
            {packingListItem.item.name}
          </Link>
          {packingListItem.item.category && (
            <p className="text-xs text-text-muted">{packingListItem.item.category}</p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        {isEditing ? (
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-16 h-8 px-2 text-center rounded border border-border bg-bg-elevated text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        ) : (
          <span className="text-sm text-text-primary">{packingListItem.quantity}</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {isEditing ? (
          <select
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value))}
            className="h-8 px-2 rounded border border-border bg-bg-elevated text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value={1}>Required</option>
            <option value={2}>Recommended</option>
            <option value={3}>Optional</option>
          </select>
        ) : (
          <Badge variant={getPriorityVariant(packingListItem.priority || 1)} size="sm">
            {getPriorityLabel(packingListItem.priority || 1)}
          </Badge>
        )}
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        {isEditing ? (
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes..."
            className="w-full h-8 px-2 rounded border border-border bg-bg-elevated text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        ) : (
          <span className="text-sm text-text-muted">
            {packingListItem.notes || '-'}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {showRemoveConfirm ? (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowRemoveConfirm(false)}>
              No
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={onRemove}
              loading={isRemoving}
            >
              Yes
            </Button>
          </div>
        ) : isEditing ? (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              loading={fetcher.state === 'submitting'}
            >
              Save
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowRemoveConfirm(true)}
            >
              <Trash2 size={16} className="text-error" />
            </Button>
          </div>
        )}
      </td>
    </tr>
  )
}
