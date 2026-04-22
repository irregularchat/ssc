import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { Link, useLoaderData, useFetcher, isRouteErrorResponse, useRouteError } from 'react-router'
import { ArrowLeft, DollarSign, MapPin, ThumbsUp, ThumbsDown, CheckCircle, XCircle, Plus } from 'lucide-react'
import { Layout } from '~/components/layout'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { EmptyState } from '~/components/ui/empty-state'
import { getDB, getItemPrices, voteOnPrice } from '~/lib/db.server'
import { validateOrigin } from '~/lib/csrf.server'
import { formatPrice } from '~/lib/format'
import type { PriceWithStore, Item } from '~/types/database'

export async function action({ request, context }: ActionFunctionArgs) {
  const originError = validateOrigin(request)
  if (originError) {
    return new Response(originError, { status: 403 })
  }

  const formData = await request.formData()
  const priceId = parseInt(formData.get('price_id') as string)
  const voteType = formData.get('vote_type') as 'up' | 'down'

  if (!priceId || !voteType || (voteType !== 'up' && voteType !== 'down')) {
    return { error: 'Invalid vote' }
  }

  const voterIp = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown'
  const db = getDB(context as Parameters<typeof getDB>[0])
  await voteOnPrice(db, priceId, voteType, voterIp)

  return { success: true }
}

export async function loader({ params, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const itemId = parseInt(params.itemId!)

  // Get item details
  const item = await db
    .prepare('SELECT * FROM items WHERE id = ?')
    .bind(itemId)
    .first<Item>()

  if (!item) {
    throw new Response('Item not found', { status: 404 })
  }

  const prices = await getItemPrices(db, itemId)

  return { item, prices }
}

export const meta: MetaFunction = ({ data }) => {
  const typedData = data as { item?: Item } | undefined
  return [
    { title: typedData?.item ? `Prices - ${typedData.item.name}` : 'Prices' },
  ]
}

function VoteButtons({ priceId, votesUp, votesDown }: { priceId: number; votesUp: number; votesDown: number }) {
  const fetcher = useFetcher()
  const isVoting = fetcher.state !== 'idle'

  return (
    <div className="flex items-center gap-1">
      <fetcher.Form method="post">
        <input type="hidden" name="price_id" value={priceId} />
        <input type="hidden" name="vote_type" value="up" />
        <button
          type="submit"
          disabled={isVoting}
          className="flex items-center gap-0.5 px-2 py-1 rounded text-xs text-text-muted hover:text-success hover:bg-success/10 transition-colors disabled:opacity-50"
          title="Price is accurate"
        >
          <ThumbsUp size={12} />
          <span>{votesUp}</span>
        </button>
      </fetcher.Form>
      <fetcher.Form method="post">
        <input type="hidden" name="price_id" value={priceId} />
        <input type="hidden" name="vote_type" value="down" />
        <button
          type="submit"
          disabled={isVoting}
          className="flex items-center gap-0.5 px-2 py-1 rounded text-xs text-text-muted hover:text-error hover:bg-error/10 transition-colors disabled:opacity-50"
          title="Price is inaccurate"
        >
          <ThumbsDown size={12} />
          <span>{votesDown}</span>
        </button>
      </fetcher.Form>
    </div>
  )
}

export default function PricesPage() {
  const { item, prices } = useLoaderData<{ item: Item; prices: PriceWithStore[] }>()

  return (
    <Layout>
      <div className="max-w-2xl mx-auto pb-20 md:pb-0">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} />
              Back
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            {item.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {item.category && (
              <Badge variant="default">{item.category}</Badge>
            )}
            {item.asin && (
              <a
                href={`https://amazon.com/dp/${item.asin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline font-mono"
              >
                View on Amazon →
              </a>
            )}
          </div>
          {item.description && (
            <p className="text-text-secondary mt-2 text-sm">{item.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-text-primary">Store Prices</h2>
          <Link to={`/prices/${item.id}/add`}>
            <Button variant="secondary" size="sm">
              <Plus size={16} />
              Add Price
            </Button>
          </Link>
        </div>

        {prices.length > 0 ? (
          <div className="space-y-3">
            {prices.map((price, index) => (
              <Card
                key={price.id}
                variant="bordered"
                padding="md"
                className={index === 0 ? 'border-success/30 bg-success/5' : ''}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-text-primary">
                        {(price as any).store_name}
                      </h3>
                      {index === 0 && (
                        <Badge variant="success" size="sm">Best Price</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-text-muted">
                      <MapPin size={12} />
                      <span>
                        {(price as any).city}, {(price as any).state}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-sm">
                        {price.in_stock ? (
                          <>
                            <CheckCircle size={14} className="text-success" />
                            <span className="text-success">In Stock</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={14} className="text-error" />
                            <span className="text-error">Out of Stock</span>
                          </>
                        )}
                      </div>

                      <VoteButtons priceId={price.id} votesUp={price.votes_up} votesDown={price.votes_down} />
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-semibold text-text-primary">
                      {formatPrice(price.price)}
                    </p>
                    {price.last_verified && (
                      <p className="text-xs text-text-muted">
                        Updated {new Date(price.last_verified).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<DollarSign size={24} />}
            title="No prices yet"
            description="Be the first to submit a price for this item."
            action={
              <Link to={`/prices/${item.id}/add`}>
                <Button variant="primary" size="sm">
                  <Plus size={16} />
                  Add Price
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
