import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router'
import { Link, useLoaderData, useActionData, useFetcher, Form } from 'react-router'
import { ArrowLeft, Lightbulb, ThumbsUp, ThumbsDown, CheckCircle, AlertTriangle, XOctagon, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { useState } from 'react'
import { Layout } from '~/components/layout'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { EmptyState } from '~/components/ui/empty-state'
import { getDB, getPackingList, getTipsForList, createTip, voteOnTip } from '~/lib/db.server'
import type { PackingList, TipWithVotes, PackingListItemWithItem } from '~/types/database'

export async function loader({ params, context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const listId = parseInt(params.id!)

  const [list, tips] = await Promise.all([
    getPackingList(db, listId),
    getTipsForList(db, listId),
  ])

  if (!list) {
    throw new Response('Not Found', { status: 404 })
  }

  return { list, tips }
}

export async function action({ params, request, context }: ActionFunctionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent')
  const db = getDB(context as Parameters<typeof getDB>[0])

  if (intent === 'submit-tip') {
    const title = (formData.get('title') as string)?.trim()
    const body = (formData.get('body') as string)?.trim()
    const compliance_status = formData.get('compliance_status') as 'allowed' | 'tolerated' | 'not_allowed'
    const item_id = formData.get('item_id') ? parseInt(formData.get('item_id') as string) : null
    const contributor_name = (formData.get('contributor_name') as string)?.trim() || null

    if (!title) {
      return { error: 'Give your tip a short title.' }
    }
    if (!body) {
      return { error: 'Explain why this tip helps.' }
    }
    if (!['allowed', 'tolerated', 'not_allowed'].includes(compliance_status)) {
      return { error: 'Pick whether this is officially okay or not.' }
    }

    await createTip(db, {
      packing_list_id: parseInt(params.id!),
      item_id,
      title,
      body,
      compliance_status,
      contributor_name,
    })

    return { success: true, message: 'Thanks for sharing! Your tip is live.' }
  }

  if (intent === 'vote') {
    const tipId = parseInt(formData.get('tip_id') as string)
    const voteType = formData.get('vote_type') as 'up' | 'down'
    if (!tipId || !voteType) return { error: 'Invalid vote' }
    await voteOnTip(db, tipId, voteType)
    return { success: true }
  }

  return null
}

export const meta: MetaFunction = ({ data }) => {
  const typedData = data as { list?: PackingList } | undefined
  return [{ title: typedData?.list ? `Tips - ${typedData.list.name}` : 'Tips' }]
}

const complianceOptions = [
  {
    value: 'allowed' as const,
    label: 'Officially OK',
    description: 'On the approved list or explicitly allowed',
    icon: CheckCircle,
    selectedClass: 'border-success/60 bg-success/10 ring-1 ring-success/30',
    iconColor: 'text-success',
  },
  {
    value: 'tolerated' as const,
    label: 'Gray Area',
    description: "Not on the list, but nobody's getting smoked for it",
    icon: AlertTriangle,
    selectedClass: 'border-warning/60 bg-warning/10 ring-1 ring-warning/30',
    iconColor: 'text-warning',
  },
  {
    value: 'not_allowed' as const,
    label: 'Risky',
    description: 'Not officially allowed — use at your own risk',
    icon: XOctagon,
    selectedClass: 'border-error/60 bg-error/10 ring-1 ring-error/30',
    iconColor: 'text-error',
  },
]

const complianceBadgeConfig: Record<string, { label: string; icon: typeof CheckCircle; variant: 'success' | 'warning' | 'error' }> = {
  allowed: { label: 'Officially OK', icon: CheckCircle, variant: 'success' },
  tolerated: { label: 'Gray Area', icon: AlertTriangle, variant: 'warning' },
  not_allowed: { label: 'Risky', icon: XOctagon, variant: 'error' },
}

function TipVoteButtons({ tipId, votesUp, votesDown }: { tipId: number; votesUp: number; votesDown: number }) {
  const fetcher = useFetcher()
  const isVoting = fetcher.state !== 'idle'
  const score = votesUp - votesDown

  return (
    <div className="flex flex-col items-center gap-0.5">
      <fetcher.Form method="post">
        <input type="hidden" name="intent" value="vote" />
        <input type="hidden" name="tip_id" value={tipId} />
        <input type="hidden" name="vote_type" value="up" />
        <button
          type="submit"
          disabled={isVoting}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-success hover:bg-success/10 transition-colors disabled:opacity-50"
          title="Helpful tip"
        >
          <ThumbsUp size={14} />
        </button>
      </fetcher.Form>
      <span className={`text-xs font-mono font-semibold tabular-nums ${score > 0 ? 'text-success' : score < 0 ? 'text-error' : 'text-text-muted'}`}>
        {score > 0 ? `+${score}` : score}
      </span>
      <fetcher.Form method="post">
        <input type="hidden" name="intent" value="vote" />
        <input type="hidden" name="tip_id" value={tipId} />
        <input type="hidden" name="vote_type" value="down" />
        <button
          type="submit"
          disabled={isVoting}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors disabled:opacity-50"
          title="Not helpful"
        >
          <ThumbsDown size={14} />
        </button>
      </fetcher.Form>
    </div>
  )
}

function TipCard({ tip }: { tip: TipWithVotes }) {
  const config = complianceBadgeConfig[tip.compliance_status]
  const StatusIcon = config?.icon || CheckCircle

  return (
    <Card variant="bordered" padding="md">
      <div className="flex items-start gap-3">
        {/* Vote column - Reddit-style vertical */}
        <TipVoteButtons tipId={tip.id} votesUp={tip.votes_up} votesDown={tip.votes_down} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-medium text-text-primary">{tip.title}</h3>
            {config && (
              <Badge variant={config.variant} size="sm">
                <StatusIcon size={10} className="mr-0.5" />
                {config.label}
              </Badge>
            )}
            {tip.item_name && (
              <Badge variant="default" size="sm">
                {tip.item_name}
              </Badge>
            )}
          </div>
          <p className="text-sm text-text-secondary mt-1 leading-relaxed">{tip.body}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
            {tip.contributor_name && <span>by {tip.contributor_name}</span>}
            {tip.contributor_name && <span className="text-border">|</span>}
            <span>{new Date(tip.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

function SubmitTipForm({ listId, items, startOpen }: { listId: number; items?: PackingListItemWithItem[]; startOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(startOpen ?? false)
  const [compliance, setCompliance] = useState<string>('allowed')
  const actionData = useActionData<{ error?: string; success?: boolean; message?: string }>()

  return (
    <Card variant="bordered" padding="md" className={isOpen ? 'border-accent/20' : ''}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-warning/10">
            <Lightbulb size={14} className="text-warning" />
          </div>
          <div>
            <span className="font-medium text-text-primary">Share a Tip</span>
            <span className="text-text-muted text-xs ml-2">Help others pack smarter</span>
          </div>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
      </button>

      {isOpen && (
        <Form method="post" className="mt-4 space-y-4">
          <input type="hidden" name="intent" value="submit-tip" />
          <input type="hidden" name="compliance_status" value={compliance} />

          {actionData?.error && (
            <div className="text-sm text-error bg-error/10 rounded-lg px-3 py-2">{actionData.error}</div>
          )}
          {actionData?.success && (
            <div className="text-sm text-success bg-success/10 rounded-lg px-3 py-2">{actionData.message}</div>
          )}

          {/* What's the tip? */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">What's your tip?</label>
            <input
              name="title"
              type="text"
              required
              placeholder='e.g., "Bring Darn Tough socks instead of issued ones"'
              className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          {/* Why does it help? */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Why does this help?</label>
            <textarea
              name="body"
              required
              rows={2}
              placeholder="They last 10x longer, have a lifetime warranty, and your feet won't blister..."
              className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-y"
            />
          </div>

          {/* Is this officially okay? — Visual radio cards */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Is this officially okay?</label>
            <div className="grid grid-cols-3 gap-2">
              {complianceOptions.map(opt => {
                const Icon = opt.icon
                const isSelected = compliance === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCompliance(opt.value)}
                    className={`relative flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-all cursor-pointer ${
                      isSelected
                        ? opt.selectedClass
                        : 'border-border bg-bg-subtle hover:border-border hover:bg-bg-elevated'
                    }`}
                  >
                    <Icon size={18} className={isSelected ? opt.iconColor : 'text-text-muted'} />
                    <span className={`text-xs font-medium leading-tight ${isSelected ? 'text-text-primary' : 'text-text-muted'}`}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-text-muted leading-tight hidden sm:block">
                      {opt.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Related item + name — side by side on desktop */}
          <div className="grid sm:grid-cols-2 gap-3">
            {items && items.length > 0 && (
              <div>
                <label className="block text-xs text-text-muted mb-1">About which item? (optional)</label>
                <select
                  name="item_id"
                  className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <option value="">General tip</option>
                  {items.map(pli => (
                    <option key={pli.item.id} value={pli.item.id}>{pli.item.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs text-text-muted mb-1">Your name (optional)</label>
              <input
                name="contributor_name"
                type="text"
                placeholder="Anonymous"
                className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="sm">
            <Send size={14} />
            Share Tip
          </Button>
        </Form>
      )}
    </Card>
  )
}

export default function ListTipsPage() {
  const { list, tips } = useLoaderData<{ list: { id: number; name: string; items?: PackingListItemWithItem[] }; tips: TipWithVotes[] }>()
  const hasTips = tips.length > 0

  return (
    <Layout>
      <div className="max-w-2xl mx-auto pb-20 md:pb-0">
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/list/${list.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} />
              Back to List
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-primary mb-1">
            Life Pro Tips
          </h1>
          <p className="text-text-secondary text-sm">
            Community advice for <span className="text-text-primary font-medium">{list.name}</span> — tips, tricks, and alternatives from people who've been there.
          </p>
        </div>

        {/* Submit form — open by default when there are no tips yet */}
        <div className="mb-6">
          <SubmitTipForm listId={list.id} items={list.items} startOpen={!hasTips} />
        </div>

        {/* Tips list */}
        {hasTips ? (
          <div className="space-y-3">
            {tips.map(tip => (
              <TipCard key={tip.id} tip={tip} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Lightbulb size={24} />}
            title="No tips yet"
            description="Be the first! Share what you wish someone told you before packing."
          />
        )}
      </div>
    </Layout>
  )
}
