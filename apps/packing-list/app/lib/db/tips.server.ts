import type { D1Database } from '@cloudflare/workers-types'
import type { Tip, TipWithVotes } from '~/types/database'

// ==========================================
// Tips (Life Pro Tips)
// ==========================================

export async function getTipsForList(
  db: D1Database,
  packingListId: number
): Promise<TipWithVotes[]> {
  const results = await db.prepare(`
    SELECT
      t.*,
      i.name as item_name,
      pl.name as list_name,
      COALESCE(SUM(CASE WHEN tv.vote_type = 'up' THEN 1 ELSE 0 END), 0) as votes_up,
      COALESCE(SUM(CASE WHEN tv.vote_type = 'down' THEN 1 ELSE 0 END), 0) as votes_down
    FROM tips t
    LEFT JOIN items i ON t.item_id = i.id
    JOIN packing_lists pl ON t.packing_list_id = pl.id
    LEFT JOIN tip_votes tv ON t.id = tv.tip_id
    WHERE t.packing_list_id = ? AND t.approved = 1
    GROUP BY t.id
    ORDER BY (COALESCE(SUM(CASE WHEN tv.vote_type = 'up' THEN 1 ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN tv.vote_type = 'down' THEN 1 ELSE 0 END), 0)) DESC, t.created_at DESC
  `).bind(packingListId).all<TipWithVotes>()
  return results.results
}

export async function getTipById(
  db: D1Database,
  tipId: number
): Promise<TipWithVotes | null> {
  const result = await db.prepare(`
    SELECT
      t.*,
      i.name as item_name,
      pl.name as list_name,
      COALESCE(SUM(CASE WHEN tv.vote_type = 'up' THEN 1 ELSE 0 END), 0) as votes_up,
      COALESCE(SUM(CASE WHEN tv.vote_type = 'down' THEN 1 ELSE 0 END), 0) as votes_down
    FROM tips t
    LEFT JOIN items i ON t.item_id = i.id
    JOIN packing_lists pl ON t.packing_list_id = pl.id
    LEFT JOIN tip_votes tv ON t.id = tv.tip_id
    WHERE t.id = ?
    GROUP BY t.id
  `).bind(tipId).first<TipWithVotes>()
  return result
}

export async function createTip(
  db: D1Database,
  data: {
    packing_list_id: number
    item_id?: number | null
    title: string
    body: string
    compliance_status: 'allowed' | 'tolerated' | 'not_allowed'
    contributor_name?: string | null
  }
): Promise<Tip> {
  const result = await db.prepare(`
    INSERT INTO tips (packing_list_id, item_id, title, body, compliance_status, contributor_name)
    VALUES (?, ?, ?, ?, ?, ?)
    RETURNING *
  `).bind(
    data.packing_list_id,
    data.item_id ?? null,
    data.title,
    data.body,
    data.compliance_status,
    data.contributor_name ?? null
  ).first<Tip>()
  return result!
}

export async function voteOnTip(
  db: D1Database,
  tipId: number,
  voteType: 'up' | 'down',
  voterIp?: string | null
): Promise<void> {
  await db.prepare(`
    INSERT OR IGNORE INTO tip_votes (tip_id, vote_type, voter_ip)
    VALUES (?, ?, ?)
  `).bind(tipId, voteType, voterIp ?? null).run()
}

export async function deleteTip(
  db: D1Database,
  tipId: number
): Promise<void> {
  await db.prepare('DELETE FROM tips WHERE id = ?').bind(tipId).run()
}

export async function updateTipApproval(
  db: D1Database,
  tipId: number,
  approved: number
): Promise<void> {
  await db.prepare('UPDATE tips SET approved = ? WHERE id = ?').bind(approved, tipId).run()
}

export async function getTipsForAdmin(
  db: D1Database,
  filters: {
    search?: string
    compliance_status?: string
    approved?: string
    packing_list_id?: number
    page?: number
    per_page?: number
  }
): Promise<{ tips: TipWithVotes[]; total: number }> {
  const conditions: string[] = []
  const params: (string | number)[] = []

  if (filters.search) {
    conditions.push('(t.title LIKE ? OR t.body LIKE ?)')
    params.push(`%${filters.search}%`, `%${filters.search}%`)
  }
  if (filters.compliance_status) {
    conditions.push('t.compliance_status = ?')
    params.push(filters.compliance_status)
  }
  if (filters.approved !== undefined && filters.approved !== '') {
    conditions.push('t.approved = ?')
    params.push(parseInt(filters.approved))
  }
  if (filters.packing_list_id) {
    conditions.push('t.packing_list_id = ?')
    params.push(filters.packing_list_id)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const page = filters.page || 1
  const perPage = filters.per_page || 25
  const offset = (page - 1) * perPage

  // Count query — bind order: ...condition params
  const countResult = await db.prepare(`
    SELECT COUNT(*) as total FROM tips t ${whereClause}
  `).bind(...params).first<{ total: number }>()

  // Data query — bind order: ...condition params, perPage, offset
  const results = await db.prepare(`
    SELECT
      t.*,
      i.name as item_name,
      pl.name as list_name,
      COALESCE(SUM(CASE WHEN tv.vote_type = 'up' THEN 1 ELSE 0 END), 0) as votes_up,
      COALESCE(SUM(CASE WHEN tv.vote_type = 'down' THEN 1 ELSE 0 END), 0) as votes_down
    FROM tips t
    LEFT JOIN items i ON t.item_id = i.id
    JOIN packing_lists pl ON t.packing_list_id = pl.id
    LEFT JOIN tip_votes tv ON t.id = tv.tip_id
    ${whereClause}
    GROUP BY t.id
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, perPage, offset).all<TipWithVotes>()

  return { tips: results.results, total: countResult?.total || 0 }
}

export async function getTipCountForList(
  db: D1Database,
  packingListId: number
): Promise<number> {
  const result = await db.prepare(
    'SELECT COUNT(*) as count FROM tips WHERE packing_list_id = ? AND approved = 1'
  ).bind(packingListId).first<{ count: number }>()
  return result?.count || 0
}
