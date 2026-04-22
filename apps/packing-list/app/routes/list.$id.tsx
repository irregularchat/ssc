import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { Link, useLoaderData, useActionData, useNavigate, isRouteErrorResponse, useRouteError } from 'react-router'
import { ArrowLeft, Plus, Trash2, Package, ExternalLink, Pencil, X, ShoppingCart, Lightbulb } from 'lucide-react'
import { Layout } from '~/components/layout'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card } from '~/components/ui/card'
import { EmptyState } from '~/components/ui/empty-state'
import { getDB, getPackingList, deletePackingList, removeItemFromList, getTipCountForList } from '~/lib/db.server'
import type { PackingListWithRelations } from '~/types/database'

export async function loader({ params, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const listId = parseInt(params.id!)
  const [list, tipCount] = await Promise.all([
    getPackingList(db, listId),
    getTipCountForList(db, listId),
  ])

  if (!list) {
    throw new Response('Not Found', { status: 404 })
  }

  return { list, tipCount }
}

export async function action({ params, request, context }: ActionFunctionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'delete') {
    const db = getDB(context as Parameters<typeof getDB>[0])
    await deletePackingList(db, parseInt(params.id!))
    return { redirect: '/' }
  }

  if (intent === 'remove-item') {
    const db = getDB(context as Parameters<typeof getDB>[0])
    const itemId = parseInt(formData.get('packing_list_item_id') as string)
    await removeItemFromList(db, itemId)
    return { success: true }
  }

  return null
}

export const meta: MetaFunction = ({ data }) => {
  const typedData = data as { list?: { name?: string } } | undefined
  return [
    { title: typedData?.list?.name ? `${typedData.list.name} - CPL` : 'Packing List' },
  ]
}

export default function ListDetailPage() {
  const { list, tipCount } = useLoaderData<{ list: PackingListWithRelations; tipCount: number }>()
  const actionData = useActionData<{ redirect?: string }>()
  const navigate = useNavigate()

  if (actionData?.redirect) {
    navigate(actionData.redirect)
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-20 md:pb-0">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} />
              Back
            </Button>
          </Link>
        </div>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary mb-2">
              {list.name}
            </h1>
            <div className="flex flex-wrap gap-2">
              {list.type && <Badge variant="primary">{list.type}</Badge>}
              {list.school && <Badge variant="default">{list.school.name}</Badge>}
              {list.base && <Badge variant="info">{list.base.name}</Badge>}
              <Badge variant={list.is_public ? 'success' : 'default'}>
                {list.is_public ? 'Public' : 'Private'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/list/${list.id}/shop`}>
              <Button variant="primary" size="sm">
                <ShoppingCart size={16} />
                Compare Prices
              </Button>
            </Link>
            <Link to={`/list/${list.id}/tips`}>
              <Button variant="secondary" size="sm">
                <Lightbulb size={16} />
                Tips
                {tipCount > 0 && (
                  <Badge variant="primary" size="sm" className="ml-1">{tipCount}</Badge>
                )}
              </Button>
            </Link>
            <Link to={`/list/${list.id}/edit`}>
              <Button variant="secondary" size="sm">
                <Pencil size={16} />
                Edit
              </Button>
            </Link>
            <form method="post">
              <input type="hidden" name="intent" value="delete" />
              <Button variant="danger" size="sm" type="submit">
                <Trash2 size={16} />
                Delete
              </Button>
            </form>
          </div>
        </div>

        {list.description && (
          <p className="text-text-secondary mb-6">{list.description}</p>
        )}

        {/* Items */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-text-primary">Items</h2>
          <Link to={`/list/${list.id}/add-item`}>
            <Button variant="secondary" size="sm">
              <Plus size={16} />
              Add Item
            </Button>
          </Link>
        </div>

        {list.items && list.items.length > 0 ? (
          <div className="space-y-2">
            {list.items.map((pli) => (
              <Card key={pli.id} variant="bordered" padding="sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-bg-elevated border border-border flex items-center justify-center">
                      {pli.item.image_url ? (
                        <img src={pli.item.image_url} alt="" className="w-8 h-8 object-contain" />
                      ) : (
                        <Package size={16} className="text-text-muted" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-text-primary">{pli.item.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-text-muted">
                        <span>Qty: {pli.quantity}</span>
                        {pli.item.category && (
                          <>
                            <span>·</span>
                            <span>{pli.item.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {pli.item.asin && (
                      <a
                        href={`https://amazon.com/dp/${pli.item.asin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm">
                          <ExternalLink size={14} />
                        </Button>
                      </a>
                    )}
                    <Link to={`/prices/${pli.item.id}`}>
                      <Button variant="secondary" size="sm">
                        Prices
                      </Button>
                    </Link>
                    <form method="post">
                      <input type="hidden" name="intent" value="remove-item" />
                      <input type="hidden" name="packing_list_item_id" value={pli.id} />
                      <Button variant="ghost" size="sm" type="submit" className="text-text-muted hover:text-error">
                        <X size={14} />
                      </Button>
                    </form>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Package size={24} />}
            title="No items yet"
            description="Add items to your packing list."
            action={
              <Link to={`/list/${list.id}/add-item`}>
                <Button variant="primary" size="sm">
                  <Plus size={16} />
                  Add Item
                </Button>
              </Link>
            }
          />
        )}
      </div>
    </Layout>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  const is404 = isRouteErrorResponse(error) && error.status === 404

  return (
    <div className="max-w-md mx-auto text-center py-16 px-4">
      <div className="text-5xl font-bold text-text-muted mb-4">{is404 ? '404' : 'Error'}</div>
      <h1 className="text-lg font-semibold text-text-primary mb-2">
        {is404 ? 'Not Found' : 'Something went wrong'}
      </h1>
      <p className="text-text-muted text-sm mb-6">
        {is404 ? "This page doesn't exist or has been removed." : 'Please try again.'}
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-text-primary text-text-inverse font-medium hover:bg-white/90 transition-colors"
      >
        Go Home
      </Link>
    </div>
  )
}
