import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router'
import { useLoaderData, useSearchParams, useFetcher, Link } from 'react-router'
import { Lightbulb, Trash2, Eye, EyeOff, CheckCircle, AlertTriangle, XOctagon, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { EmptyState } from '~/components/ui/empty-state'
import { getDB, getTipsForAdmin, deleteTip, updateTipApproval } from '~/lib/db.server'
import type { TipWithVotes } from '~/types/database'

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || undefined
  const compliance_status = url.searchParams.get('compliance_status') || undefined
  const approved = url.searchParams.get('approved') ?? undefined
  const page = parseInt(url.searchParams.get('page') || '1')

  const { tips, total } = await getTipsForAdmin(db, {
    search,
    compliance_status,
    approved,
    page,
    per_page: 25,
  })

  return { tips, total, page }
}

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent')
  const db = getDB(context as Parameters<typeof getDB>[0])

  if (intent === 'delete') {
    const tipId = parseInt(formData.get('tip_id') as string)
    await deleteTip(db, tipId)
    return { success: true }
  }

  if (intent === 'toggle-approval') {
    const tipId = parseInt(formData.get('tip_id') as string)
    const currentApproval = parseInt(formData.get('current_approval') as string)
    await updateTipApproval(db, tipId, currentApproval === 1 ? 0 : 1)
    return { success: true }
  }

  return null
}

const complianceConfig = {
  allowed: { label: 'Allowed', icon: CheckCircle, variant: 'success' as const },
  tolerated: { label: 'Tolerated', icon: AlertTriangle, variant: 'warning' as const },
  not_allowed: { label: 'Not Allowed', icon: XOctagon, variant: 'error' as const },
}

export default function AdminTipsPage() {
  const { tips, total, page } = useLoaderData<{ tips: TipWithVotes[]; total: number; page: number }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const fetcher = useFetcher()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Tips</h1>
          <p className="text-sm text-text-muted">{total} total tips</p>
        </div>
      </div>

      {/* Filters */}
      <Card variant="bordered" padding="md" className="mb-6">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search tips..."
            defaultValue={searchParams.get('search') || ''}
            onChange={e => {
              const params = new URLSearchParams(searchParams)
              if (e.target.value) params.set('search', e.target.value)
              else params.delete('search')
              params.delete('page')
              setSearchParams(params)
            }}
            className="flex-1 min-w-[200px] rounded-lg border border-border bg-bg-subtle px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <select
            value={searchParams.get('compliance_status') || ''}
            onChange={e => {
              const params = new URLSearchParams(searchParams)
              if (e.target.value) params.set('compliance_status', e.target.value)
              else params.delete('compliance_status')
              params.delete('page')
              setSearchParams(params)
            }}
            className="rounded-lg border border-border bg-bg-subtle px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            <option value="">All Compliance</option>
            <option value="allowed">Allowed</option>
            <option value="tolerated">Tolerated</option>
            <option value="not_allowed">Not Allowed</option>
          </select>
          <select
            value={searchParams.get('approved') ?? ''}
            onChange={e => {
              const params = new URLSearchParams(searchParams)
              if (e.target.value !== '') params.set('approved', e.target.value)
              else params.delete('approved')
              params.delete('page')
              setSearchParams(params)
            }}
            className="rounded-lg border border-border bg-bg-subtle px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            <option value="">All Status</option>
            <option value="1">Approved</option>
            <option value="0">Hidden</option>
          </select>
        </div>
      </Card>

      {/* Tips list */}
      {tips.length > 0 ? (
        <div className="space-y-2">
          {tips.map(tip => {
            const config = complianceConfig[tip.compliance_status]
            const StatusIcon = config.icon
            return (
              <Card key={tip.id} variant="bordered" padding="sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium text-text-primary text-sm">{tip.title}</h3>
                      <Badge variant={config.variant} size="sm">
                        <StatusIcon size={10} className="mr-0.5" />
                        {config.label}
                      </Badge>
                      {!tip.approved && <Badge variant="error" size="sm">Hidden</Badge>}
                      {tip.item_name && <Badge variant="default" size="sm">{tip.item_name}</Badge>}
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2">{tip.body}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                      <Link to={`/list/${tip.packing_list_id}`} className="hover:text-accent">
                        {tip.list_name}
                      </Link>
                      {tip.contributor_name && <span>by {tip.contributor_name}</span>}
                      <span>{new Date(tip.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp size={10} /> {tip.votes_up}
                        <ThumbsDown size={10} className="ml-1" /> {tip.votes_down}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <fetcher.Form method="post">
                      <input type="hidden" name="intent" value="toggle-approval" />
                      <input type="hidden" name="tip_id" value={tip.id} />
                      <input type="hidden" name="current_approval" value={tip.approved} />
                      <Button variant="ghost" size="sm" type="submit" title={tip.approved ? 'Hide' : 'Approve'}>
                        {tip.approved ? <EyeOff size={14} /> : <Eye size={14} />}
                      </Button>
                    </fetcher.Form>
                    <fetcher.Form method="post">
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="tip_id" value={tip.id} />
                      <Button variant="ghost" size="sm" type="submit" className="text-text-muted hover:text-error">
                        <Trash2 size={14} />
                      </Button>
                    </fetcher.Form>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Lightbulb size={24} />}
          title="No tips found"
          description="Tips submitted by users will appear here."
        />
      )}

      {/* Pagination */}
      {total > 25 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams)
              params.set('page', String(page - 1))
              setSearchParams(params)
            }}
          >
            Previous
          </Button>
          <span className="text-sm text-text-muted">
            Page {page} of {Math.ceil(total / 25)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= Math.ceil(total / 25)}
            onClick={() => {
              const params = new URLSearchParams(searchParams)
              params.set('page', String(page + 1))
              setSearchParams(params)
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
