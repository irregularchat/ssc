import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData, Link } from 'react-router'
import {
  Package,
  Store,
  ClipboardList,
  DollarSign,
  ThumbsUp,
  Shield,
  AlertTriangle,
  Lightbulb,
  Clock,
  ThumbsDown,
  Plus,
  ArrowRight,
  FileDown,
} from 'lucide-react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import {
  getDB,
  getAdminStats,
  getItemsWithoutPrices,
  getItemsWithoutPricesCount,
  getStoresWithoutPrices,
  getStoresWithoutPricesCount,
  getRecentPrices,
  getLowVotePrices,
} from '~/lib/db.server'
import { formatPrice } from '~/lib/format'

export const meta: MetaFunction = () => {
  return [{ title: 'Dashboard - Admin - CPL' }]
}

export async function loader({ context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])

  const [
    stats,
    itemsWithoutPrices,
    itemsWithoutPricesCount,
    storesWithoutPrices,
    storesWithoutPricesCount,
    recentPrices,
    lowVotePrices,
  ] = await Promise.all([
    getAdminStats(db),
    getItemsWithoutPrices(db, 5),
    getItemsWithoutPricesCount(db),
    getStoresWithoutPrices(db, 5),
    getStoresWithoutPricesCount(db),
    getRecentPrices(db, 5),
    getLowVotePrices(db, 5),
  ])

  return {
    stats,
    itemsWithoutPrices,
    itemsWithoutPricesCount,
    storesWithoutPrices,
    storesWithoutPricesCount,
    recentPrices,
    lowVotePrices,
  }
}

const statCards = [
  {
    key: 'storeCount' as const,
    label: 'Total Stores',
    icon: Store,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    href: '/admin/stores',
  },
  {
    key: 'itemCount' as const,
    label: 'Total Items',
    icon: Package,
    color: 'text-success',
    bgColor: 'bg-success/10',
    href: '/admin/items',
  },
  {
    key: 'listCount' as const,
    label: 'Packing Lists',
    icon: ClipboardList,
    color: 'text-info',
    bgColor: 'bg-info/10',
    href: '/admin/lists',
  },
  {
    key: 'priceCount' as const,
    label: 'Prices Submitted',
    icon: DollarSign,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    href: '/admin/prices',
  },
  {
    key: 'voteCount' as const,
    label: 'Total Votes',
    icon: ThumbsUp,
    color: 'text-accent-bright',
    bgColor: 'bg-accent-bright/10',
    href: null,
  },
  {
    key: 'storesWithMilitaryDiscount' as const,
    label: 'Military Discount',
    icon: Shield,
    color: 'text-success',
    bgColor: 'bg-success/10',
    href: '/admin/stores?militaryDiscount=true',
  },
]

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 60) {
    return `${diffMins}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

export default function AdminDashboardPage() {
  const {
    stats,
    itemsWithoutPrices,
    itemsWithoutPricesCount,
    storesWithoutPrices,
    storesWithoutPricesCount,
    recentPrices,
    lowVotePrices,
  } = useLoaderData<typeof loader>()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-text-primary mb-2">Dashboard</h2>
        <p className="text-text-secondary">Overview of all data in the system.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          const count = stats[card.key]
          const content = (
            <Card
              key={card.key}
              variant="bordered"
              padding="md"
              interactive={!!card.href}
              className={card.href ? 'group' : ''}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
                  <Icon size={20} className={card.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-semibold text-text-primary tabular-nums">{count}</p>
                  <p className="text-sm text-text-muted truncate">{card.label}</p>
                </div>
                {card.href && (
                  <ArrowRight
                    size={16}
                    className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                )}
              </div>
            </Card>
          )

          if (card.href) {
            return (
              <Link key={card.key} to={card.href} className="block">
                {content}
              </Link>
            )
          }
          return content
        })}
      </div>

      {/* Quick Actions */}
      <Card variant="bordered" padding="md">
        <h3 className="text-lg font-medium text-text-primary mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/stores/new">
            <Button variant="secondary" size="sm">
              <Plus size={16} />
              Add Store
            </Button>
          </Link>
          <Link to="/admin/items/new">
            <Button variant="secondary" size="sm">
              <Plus size={16} />
              Add Item
            </Button>
          </Link>
          <Link to="/admin/stores">
            <Button variant="ghost" size="sm">
              <Store size={16} />
              View All Stores
            </Button>
          </Link>
          <Link to="/admin/tips">
            <Button variant="ghost" size="sm">
              <Lightbulb size={16} />
              Manage Tips
            </Button>
          </Link>
          <Link to="/admin/import-export">
            <Button variant="ghost" size="sm">
              <FileDown size={16} />
              Import / Export
            </Button>
          </Link>
        </div>
      </Card>

      {/* Insights Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Items Without Prices */}
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-warning" />
              <h3 className="font-medium text-text-primary">Items Without Prices</h3>
            </div>
            <Badge variant="warning" size="sm">
              {itemsWithoutPricesCount}
            </Badge>
          </div>
          {itemsWithoutPrices.length > 0 ? (
            <ul className="space-y-2">
              {itemsWithoutPrices.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary truncate">{item.name}</span>
                  {item.category && (
                    <Badge variant="outline" size="sm">
                      {item.category}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">All items have prices.</p>
          )}
          {itemsWithoutPricesCount > 5 && (
            <Link
              to="/admin/items?noPrices=true"
              className="block mt-3 text-xs text-accent hover:text-accent-bright transition-colors"
            >
              View all {itemsWithoutPricesCount} items without prices
            </Link>
          )}
        </Card>

        {/* Stores Without Prices */}
        <Card variant="bordered" padding="md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Store size={18} className="text-warning" />
              <h3 className="font-medium text-text-primary">Stores Without Prices</h3>
            </div>
            <Badge variant="warning" size="sm">
              {storesWithoutPricesCount}
            </Badge>
          </div>
          {storesWithoutPrices.length > 0 ? (
            <ul className="space-y-2">
              {storesWithoutPrices.map((store) => (
                <li key={store.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary truncate">{store.name}</span>
                  {store.city && store.state && (
                    <span className="text-text-muted text-xs">
                      {store.city}, {store.state}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">All stores have prices.</p>
          )}
          {storesWithoutPricesCount > 5 && (
            <Link
              to="/admin/stores?noPrices=true"
              className="block mt-3 text-xs text-accent hover:text-accent-bright transition-colors"
            >
              View all {storesWithoutPricesCount} stores without prices
            </Link>
          )}
        </Card>

        {/* Recent Prices */}
        <Card variant="bordered" padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-info" />
            <h3 className="font-medium text-text-primary">Recent Prices</h3>
          </div>
          {recentPrices.length > 0 ? (
            <ul className="space-y-3">
              {recentPrices.map((price, index) => (
                <li key={index} className="flex items-start justify-between gap-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="text-text-primary truncate">{price.item_name}</p>
                    <p className="text-text-muted text-xs truncate">at {price.store_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-success font-medium tabular-nums">{formatPrice(price.price)}</p>
                    <p className="text-text-muted text-xs">{formatDate(price.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">No prices submitted yet.</p>
          )}
        </Card>

        {/* Low Vote Scores */}
        <Card variant="bordered" padding="md">
          <div className="flex items-center gap-2 mb-4">
            <ThumbsDown size={18} className="text-error" />
            <h3 className="font-medium text-text-primary">Low Vote Scores</h3>
          </div>
          {lowVotePrices.length > 0 ? (
            <ul className="space-y-3">
              {lowVotePrices.map((price) => (
                <li key={price.id} className="flex items-start justify-between gap-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="text-text-primary truncate">{price.item_name}</p>
                    <p className="text-text-muted text-xs truncate">at {price.store_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-text-secondary tabular-nums">{formatPrice(price.price)}</p>
                    <Badge variant="error" size="sm">
                      {price.vote_score}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">No prices with negative votes.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
