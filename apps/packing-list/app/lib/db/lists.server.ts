import type { D1Database } from '@cloudflare/workers-types'
import type {
  PackingList,
  PackingListWithRelations,
  PackingListItemWithItem,
  Item,
  School,
  Base,
} from '~/types/database'

// ==========================================
// Packing Lists CRUD
// ==========================================

export async function getPackingLists(db: D1Database): Promise<PackingListWithRelations[]> {
  const lists = await db
    .prepare(`
      SELECT
        pl.*,
        s.id as school_id, s.name as school_name, s.abbreviation as school_abbreviation,
        b.id as base_id, b.name as base_name, b.abbreviation as base_abbreviation
      FROM packing_lists pl
      LEFT JOIN schools s ON pl.school_id = s.id
      LEFT JOIN bases b ON pl.base_id = b.id
      ORDER BY pl.created_at DESC
    `)
    .all<PackingList & { school_name?: string; base_name?: string }>()

  return lists.results.map((row) => ({
    ...row,
    school: row.school_id ? { id: row.school_id, name: row.school_name! } as School : null,
    base: row.base_id ? { id: row.base_id, name: row.base_name! } as Base : null,
  }))
}

export async function getPackingList(db: D1Database, id: number): Promise<PackingListWithRelations | null> {
  const listRow = await db
    .prepare(`
      SELECT
        pl.*,
        s.id as s_id, s.name as school_name,
        b.id as b_id, b.name as base_name
      FROM packing_lists pl
      LEFT JOIN schools s ON pl.school_id = s.id
      LEFT JOIN bases b ON pl.base_id = b.id
      WHERE pl.id = ?
    `)
    .bind(id)
    .first<PackingList & { s_id?: number; school_name?: string; b_id?: number; base_name?: string }>()

  if (!listRow) return null

  const list: PackingListWithRelations = {
    ...listRow,
    school: listRow.s_id ? { id: listRow.s_id, name: listRow.school_name! } as School : null,
    base: listRow.b_id ? { id: listRow.b_id, name: listRow.base_name! } as Base : null,
  }

  const itemsResult = await db
    .prepare(`
      SELECT
        pli.id as pli_id,
        pli.packing_list_id,
        pli.item_id,
        pli.quantity,
        pli.notes,
        pli.added_by,
        pli.created_at as pli_created_at,
        i.id as item_id,
        i.name as item_name,
        i.description as item_description,
        i.category as item_category,
        i.asin as item_asin,
        i.image_url as item_image_url,
        COALESCE(i.unit_name, 'each') as item_unit_name,
        i.created_at as item_created_at,
        i.updated_at as item_updated_at
      FROM packing_list_items pli
      JOIN items i ON pli.item_id = i.id
      WHERE pli.packing_list_id = ?
      ORDER BY pli.created_at DESC
    `)
    .bind(id)
    .all<{
      pli_id: number
      packing_list_id: number
      item_id: number
      quantity: number
      notes: string | null
      added_by: string | null
      pli_created_at: string
      item_name: string
      item_description: string | null
      item_category: string | null
      item_asin: string | null
      item_image_url: string | null
      item_unit_name: string
      item_created_at: string
      item_updated_at: string
    }>()

  const items: PackingListItemWithItem[] = itemsResult.results.map((row) => ({
    id: row.pli_id,
    packing_list_id: row.packing_list_id,
    item_id: row.item_id,
    quantity: row.quantity,
    notes: row.notes,
    added_by: row.added_by,
    created_at: row.pli_created_at,
    item: {
      id: row.item_id,
      name: row.item_name,
      description: row.item_description,
      category: row.item_category,
      asin: row.item_asin,
      image_url: row.item_image_url,
      unit_name: row.item_unit_name,
      created_at: row.item_created_at,
      updated_at: row.item_updated_at,
    },
  }))

  return {
    ...list,
    items,
  }
}

export async function createPackingList(
  db: D1Database,
  data: Omit<PackingList, 'id' | 'created_at' | 'updated_at'>
): Promise<PackingList> {
  const result = await db
    .prepare(`
      INSERT INTO packing_lists (name, description, type, is_public, contributor_name, school_id, base_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `)
    .bind(
      data.name,
      data.description,
      data.type,
      data.is_public,
      data.contributor_name,
      data.school_id,
      data.base_id
    )
    .first<PackingList>()

  return result!
}

export async function updatePackingList(
  db: D1Database,
  id: number,
  data: Partial<Omit<PackingList, 'id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  await db
    .prepare(`
      UPDATE packing_lists
      SET name = ?, description = ?, type = ?, is_public = ?,
          contributor_name = ?, school_id = ?, base_id = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `)
    .bind(
      data.name,
      data.description,
      data.type,
      data.is_public,
      data.contributor_name,
      data.school_id,
      data.base_id,
      id
    )
    .run()
}

export async function deletePackingList(db: D1Database, id: number): Promise<void> {
  await db.prepare('DELETE FROM packing_lists WHERE id = ?').bind(id).run()
}

export async function addItemToList(
  db: D1Database,
  listId: number,
  itemId: number,
  quantity: number = 1,
  notes: string | null = null
): Promise<void> {
  await db
    .prepare(`
      INSERT INTO packing_list_items (packing_list_id, item_id, quantity, notes)
      VALUES (?, ?, ?, ?)
    `)
    .bind(listId, itemId, quantity, notes)
    .run()
}

export async function removeItemFromList(
  db: D1Database,
  packingListItemId: number
): Promise<void> {
  await db
    .prepare('DELETE FROM packing_list_items WHERE id = ?')
    .bind(packingListItemId)
    .run()
}

// ==========================================
// Packing Lists Admin CRUD
// ==========================================

export interface PackingListFilters {
  schoolId?: number
  baseId?: number
  type?: string
  isPublic?: boolean
  search?: string
  sort?: 'name' | 'type' | 'created_at'
  direction?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface PackingListWithItemCount extends PackingList {
  item_count: number
  school_name?: string | null
  base_name?: string | null
}

export interface PackingListsWithFiltersResult {
  lists: PackingListWithItemCount[]
  total: number
  page: number
  totalPages: number
}

export async function getPackingListsWithFilters(
  db: D1Database,
  filters: PackingListFilters
): Promise<PackingListsWithFiltersResult> {
  const {
    schoolId,
    baseId,
    type,
    isPublic,
    search,
    sort = 'name',
    direction = 'asc',
    page = 1,
    limit = 25,
  } = filters

  const conditions: string[] = []
  const params: (string | number)[] = []

  if (schoolId !== undefined) {
    conditions.push('pl.school_id = ?')
    params.push(schoolId)
  }

  if (baseId !== undefined) {
    conditions.push('pl.base_id = ?')
    params.push(baseId)
  }

  if (type) {
    conditions.push('pl.type = ?')
    params.push(type)
  }

  if (isPublic !== undefined) {
    conditions.push('pl.is_public = ?')
    params.push(isPublic ? 1 : 0)
  }

  if (search) {
    conditions.push('pl.name LIKE ?')
    params.push(`%${search}%`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const validSorts = ['name', 'type', 'created_at']
  const sortCol = validSorts.includes(sort) ? sort : 'name'
  const sortDir = direction === 'desc' ? 'DESC' : 'ASC'

  const countResult = await db
    .prepare(`SELECT COUNT(*) as count FROM packing_lists pl ${whereClause}`)
    .bind(...params)
    .first<{ count: number }>()

  const total = countResult?.count ?? 0
  const totalPages = Math.ceil(total / limit)
  const offset = (page - 1) * limit

  const listsResult = await db
    .prepare(`
      SELECT
        pl.*,
        COALESCE(s.name, NULL) as school_name,
        COALESCE(b.name, NULL) as base_name,
        (SELECT COUNT(*) FROM packing_list_items WHERE packing_list_id = pl.id) as item_count
      FROM packing_lists pl
      LEFT JOIN schools s ON pl.school_id = s.id
      LEFT JOIN bases b ON pl.base_id = b.id
      ${whereClause}
      ORDER BY pl.${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `)
    .bind(...params, limit, offset)
    .all<PackingListWithItemCount>()

  return {
    lists: listsResult.results,
    total,
    page,
    totalPages,
  }
}

export async function getPackingListWithItems(
  db: D1Database,
  id: number
): Promise<(PackingListWithRelations & { items: PackingListItemWithItem[] }) | null> {
  const listRow = await db
    .prepare(`
      SELECT
        pl.*,
        s.id as s_id, s.name as school_name,
        b.id as b_id, b.name as base_name
      FROM packing_lists pl
      LEFT JOIN schools s ON pl.school_id = s.id
      LEFT JOIN bases b ON pl.base_id = b.id
      WHERE pl.id = ?
    `)
    .bind(id)
    .first<PackingList & { s_id?: number; school_name?: string; b_id?: number; base_name?: string }>()

  if (!listRow) return null

  const list: PackingListWithRelations = {
    ...listRow,
    school: listRow.s_id ? { id: listRow.s_id, name: listRow.school_name! } as School : null,
    base: listRow.b_id ? { id: listRow.b_id, name: listRow.base_name! } as Base : null,
  }

  const itemsResult = await db
    .prepare(`
      SELECT
        pli.id as pli_id,
        pli.packing_list_id,
        pli.item_id,
        pli.quantity,
        pli.notes,
        pli.added_by,
        COALESCE(pli.priority, 1) as priority,
        pli.source,
        pli.created_at as pli_created_at,
        i.id as i_id,
        i.name as item_name,
        i.description as item_description,
        i.category as item_category,
        i.asin as item_asin,
        i.image_url as item_image_url,
        COALESCE(i.unit_name, 'each') as item_unit_name,
        i.created_at as item_created_at,
        i.updated_at as item_updated_at
      FROM packing_list_items pli
      JOIN items i ON pli.item_id = i.id
      WHERE pli.packing_list_id = ?
      ORDER BY pli.priority ASC, pli.created_at DESC
    `)
    .bind(id)
    .all<{
      pli_id: number
      packing_list_id: number
      item_id: number
      quantity: number
      notes: string | null
      added_by: string | null
      priority: number
      source: string | null
      pli_created_at: string
      i_id: number
      item_name: string
      item_description: string | null
      item_category: string | null
      item_asin: string | null
      item_image_url: string | null
      item_unit_name: string
      item_created_at: string
      item_updated_at: string
    }>()

  const items: PackingListItemWithItem[] = itemsResult.results.map((row) => ({
    id: row.pli_id,
    packing_list_id: row.packing_list_id,
    item_id: row.item_id,
    quantity: row.quantity,
    notes: row.notes,
    added_by: row.added_by,
    priority: row.priority,
    source: row.source,
    created_at: row.pli_created_at,
    item: {
      id: row.i_id,
      name: row.item_name,
      description: row.item_description,
      category: row.item_category,
      asin: row.item_asin,
      image_url: row.item_image_url,
      unit_name: row.item_unit_name,
      created_at: row.item_created_at,
      updated_at: row.item_updated_at,
    },
  }))

  return {
    ...list,
    items,
  }
}

export async function updatePackingListDetails(
  db: D1Database,
  id: number,
  data: Partial<Omit<PackingList, 'id' | 'created_at' | 'updated_at'>>
): Promise<PackingList> {
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (data.name !== undefined) {
    fields.push('name = ?')
    values.push(data.name)
  }
  if (data.description !== undefined) {
    fields.push('description = ?')
    values.push(data.description)
  }
  if (data.type !== undefined) {
    fields.push('type = ?')
    values.push(data.type)
  }
  if (data.is_public !== undefined) {
    fields.push('is_public = ?')
    values.push(data.is_public)
  }
  if (data.contributor_name !== undefined) {
    fields.push('contributor_name = ?')
    values.push(data.contributor_name)
  }
  if (data.school_id !== undefined) {
    fields.push('school_id = ?')
    values.push(data.school_id)
  }
  if (data.base_id !== undefined) {
    fields.push('base_id = ?')
    values.push(data.base_id)
  }

  fields.push("updated_at = datetime('now')")
  values.push(id)

  const result = await db
    .prepare(`
      UPDATE packing_lists
      SET ${fields.join(', ')}
      WHERE id = ?
      RETURNING *
    `)
    .bind(...values)
    .first<PackingList>()

  return result!
}

export async function deletePackingListById(db: D1Database, id: number): Promise<void> {
  // Delete associated items first
  await db.prepare('DELETE FROM packing_list_items WHERE packing_list_id = ?').bind(id).run()
  // Then delete the list
  await db.prepare('DELETE FROM packing_lists WHERE id = ?').bind(id).run()
}

export async function bulkUpdatePublicStatus(
  db: D1Database,
  ids: number[],
  isPublic: boolean
): Promise<void> {
  if (ids.length === 0) return

  const placeholders = ids.map(() => '?').join(',')
  await db
    .prepare(
      `UPDATE packing_lists SET is_public = ?, updated_at = datetime('now') WHERE id IN (${placeholders})`
    )
    .bind(isPublic ? 1 : 0, ...ids)
    .run()
}

export async function deletePackingListsBulk(db: D1Database, ids: number[]): Promise<void> {
  if (ids.length === 0) return

  const placeholders = ids.map(() => '?').join(',')
  // Delete associated items first
  await db
    .prepare(`DELETE FROM packing_list_items WHERE packing_list_id IN (${placeholders})`)
    .bind(...ids)
    .run()
  // Then delete the lists
  await db
    .prepare(`DELETE FROM packing_lists WHERE id IN (${placeholders})`)
    .bind(...ids)
    .run()
}

export async function getDistinctListTypes(db: D1Database): Promise<string[]> {
  const result = await db
    .prepare(`
      SELECT DISTINCT type FROM packing_lists
      WHERE type IS NOT NULL AND type != ''
      ORDER BY type
    `)
    .all<{ type: string }>()
  return result.results.map((r) => r.type)
}

// Packing List Item management
export async function updatePackingListItem(
  db: D1Database,
  id: number,
  data: { quantity?: number; priority?: number; notes?: string | null }
): Promise<void> {
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (data.quantity !== undefined) {
    fields.push('quantity = ?')
    values.push(data.quantity)
  }
  if (data.priority !== undefined) {
    fields.push('priority = ?')
    values.push(data.priority)
  }
  if (data.notes !== undefined) {
    fields.push('notes = ?')
    values.push(data.notes)
  }

  if (fields.length === 0) return

  values.push(id)

  await db
    .prepare(`UPDATE packing_list_items SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run()
}

export async function addItemToPackingList(
  db: D1Database,
  listId: number,
  itemId: number,
  quantity: number = 1,
  priority: number = 1,
  notes: string | null = null
): Promise<{ id: number }> {
  // Check if item already exists in list
  const existing = await db
    .prepare('SELECT id FROM packing_list_items WHERE packing_list_id = ? AND item_id = ?')
    .bind(listId, itemId)
    .first<{ id: number }>()

  if (existing) {
    // Update quantity and priority
    await db
      .prepare(
        'UPDATE packing_list_items SET quantity = quantity + ?, priority = ?, notes = COALESCE(?, notes) WHERE id = ?'
      )
      .bind(quantity, priority, notes, existing.id)
      .run()
    return { id: existing.id }
  }

  const result = await db
    .prepare(`
      INSERT INTO packing_list_items (packing_list_id, item_id, quantity, priority, notes)
      VALUES (?, ?, ?, ?, ?)
      RETURNING id
    `)
    .bind(listId, itemId, quantity, priority, notes)
    .first<{ id: number }>()

  return { id: result!.id }
}

export async function removeItemFromPackingList(
  db: D1Database,
  packingListItemId: number
): Promise<void> {
  await db.prepare('DELETE FROM packing_list_items WHERE id = ?').bind(packingListItemId).run()
}

// ============================================
// PACKING LIST INHERITANCE
// ============================================

// Get child lists that inherit from a parent list
export async function getChildLists(db: D1Database, parentListId: number): Promise<PackingList[]> {
  const result = await db
    .prepare(`
      SELECT pl.*, b.name as base_name, s.name as school_name
      FROM packing_lists pl
      LEFT JOIN bases b ON pl.base_id = b.id
      LEFT JOIN schools s ON pl.school_id = s.id
      WHERE pl.parent_list_id = ?
      ORDER BY b.name ASC
    `)
    .bind(parentListId)
    .all<PackingList & { base_name: string | null; school_name: string | null }>()
  return result.results
}

// Create a child list that inherits from a parent
export async function createChildList(
  db: D1Database,
  parentListId: number,
  baseId: number,
  name: string,
  description: string | null = null
): Promise<number> {
  // Get parent list info
  const parent = await db
    .prepare(`SELECT school_id, type, is_public, contributor_name FROM packing_lists WHERE id = ?`)
    .bind(parentListId)
    .first<{ school_id: number | null; type: string | null; is_public: number; contributor_name: string | null }>()

  if (!parent) throw new Error('Parent list not found')

  // Create child list
  const result = await db
    .prepare(`
      INSERT INTO packing_lists (name, description, type, is_public, contributor_name, school_id, base_id, parent_list_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(name, description, parent.type, parent.is_public, parent.contributor_name, parent.school_id, baseId, parentListId)
    .run()

  const childListId = result.meta.last_row_id as number

  // Copy all items from parent as "inherited"
  await db
    .prepare(`
      INSERT INTO packing_list_items (packing_list_id, item_id, quantity, notes, added_by, priority, source, override_type)
      SELECT ?, item_id, quantity, notes, added_by, priority, source, 'inherited'
      FROM packing_list_items
      WHERE packing_list_id = ?
    `)
    .bind(childListId, parentListId)
    .run()

  return childListId
}

// Get effective items for a list (merging parent + child overrides)
export async function getEffectiveListItems(
  db: D1Database,
  listId: number
): Promise<PackingListItemWithItem[]> {
  // Get the list to check if it has a parent
  const list = await db
    .prepare(`SELECT parent_list_id FROM packing_lists WHERE id = ?`)
    .bind(listId)
    .first<{ parent_list_id: number | null }>()

  if (!list) return []

  // If no parent, just return the list's items directly
  if (!list.parent_list_id) {
    const result = await db
      .prepare(`
        SELECT
          pli.*,
          i.id as item_id,
          i.name as item_name,
          i.description as item_description,
          i.category as item_category,
          i.asin as item_asin,
          i.image_url as item_image_url,
          COALESCE(i.unit_name, 'each') as item_unit_name,
          i.created_at as item_created_at,
          i.updated_at as item_updated_at
        FROM packing_list_items pli
        JOIN items i ON pli.item_id = i.id
        WHERE pli.packing_list_id = ?
        ORDER BY i.category, i.name
      `)
      .bind(listId)
      .all()

    return result.results.map((row: any) => ({
      id: row.id,
      packing_list_id: row.packing_list_id,
      item_id: row.item_id,
      quantity: row.quantity,
      notes: row.notes,
      added_by: row.added_by,
      priority: row.priority,
      source: row.source,
      override_type: row.override_type,
      created_at: row.created_at,
      item: {
        id: row.item_id,
        name: row.item_name,
        description: row.item_description,
        category: row.item_category,
        asin: row.item_asin,
        image_url: row.item_image_url,
        unit_name: row.item_unit_name,
        created_at: row.item_created_at,
        updated_at: row.item_updated_at,
      },
    }))
  }

  // For child lists: get parent items + apply child overrides
  // Child items with override_type='removed' are excluded
  // Child items with override_type='added' are included
  // Child items with override_type='modified' replace parent values
  const result = await db
    .prepare(`
      WITH parent_items AS (
        SELECT pli.*, i.*
        FROM packing_list_items pli
        JOIN items i ON pli.item_id = i.id
        WHERE pli.packing_list_id = ?
      ),
      child_items AS (
        SELECT pli.*, i.*
        FROM packing_list_items pli
        JOIN items i ON pli.item_id = i.id
        WHERE pli.packing_list_id = ?
      )
      SELECT
        COALESCE(c.id, p.id) as id,
        ? as packing_list_id,
        COALESCE(c.item_id, p.item_id) as item_id,
        COALESCE(c.quantity, p.quantity) as quantity,
        COALESCE(c.notes, p.notes) as notes,
        COALESCE(c.added_by, p.added_by) as added_by,
        COALESCE(c.priority, p.priority) as priority,
        COALESCE(c.source, p.source) as source,
        COALESCE(c.override_type, 'inherited') as override_type,
        COALESCE(c.created_at, p.created_at) as created_at,
        COALESCE(c.name, p.name) as item_name,
        COALESCE(c.description, p.description) as item_description,
        COALESCE(c.category, p.category) as item_category,
        COALESCE(c.asin, p.asin) as item_asin,
        COALESCE(c.image_url, p.image_url) as item_image_url,
        COALESCE(c.unit_name, p.unit_name, 'each') as item_unit_name
      FROM parent_items p
      LEFT JOIN child_items c ON p.item_id = c.item_id
      WHERE COALESCE(c.override_type, 'inherited') != 'removed'

      UNION

      -- Items added only in child (not in parent)
      SELECT
        c.id,
        c.packing_list_id,
        c.item_id,
        c.quantity,
        c.notes,
        c.added_by,
        c.priority,
        c.source,
        c.override_type,
        c.created_at,
        c.name as item_name,
        c.description as item_description,
        c.category as item_category,
        c.asin as item_asin,
        c.image_url as item_image_url,
        COALESCE(c.unit_name, 'each') as item_unit_name
      FROM child_items c
      WHERE c.override_type = 'added'
        AND c.item_id NOT IN (SELECT item_id FROM parent_items)

      ORDER BY item_category, item_name
    `)
    .bind(list.parent_list_id, listId, listId)
    .all()

  return result.results.map((row: any) => ({
    id: row.id,
    packing_list_id: row.packing_list_id,
    item_id: row.item_id,
    quantity: row.quantity,
    notes: row.notes,
    added_by: row.added_by,
    priority: row.priority,
    source: row.source,
    override_type: row.override_type,
    created_at: row.created_at,
    item: {
      id: row.item_id,
      name: row.item_name,
      description: row.item_description,
      category: row.item_category,
      asin: row.item_asin,
      image_url: row.item_image_url,
      unit_name: row.item_unit_name,
      created_at: '',
      updated_at: '',
    },
  }))
}

// Add item override in child list (add, remove, or modify)
export async function addChildListItemOverride(
  db: D1Database,
  listId: number,
  itemId: number,
  overrideType: 'added' | 'removed' | 'modified',
  data?: { quantity?: number; notes?: string; priority?: number }
): Promise<void> {
  if (overrideType === 'removed') {
    // Mark item as removed in child
    await db
      .prepare(`
        INSERT INTO packing_list_items (packing_list_id, item_id, quantity, override_type)
        VALUES (?, ?, 0, 'removed')
        ON CONFLICT DO UPDATE SET override_type = 'removed'
      `)
      .bind(listId, itemId)
      .run()
  } else if (overrideType === 'added') {
    // Add new item to child
    await db
      .prepare(`
        INSERT INTO packing_list_items (packing_list_id, item_id, quantity, notes, priority, override_type)
        VALUES (?, ?, ?, ?, ?, 'added')
      `)
      .bind(listId, itemId, data?.quantity || 1, data?.notes || null, data?.priority || 2)
      .run()
  } else if (overrideType === 'modified') {
    // Modify inherited item in child
    await db
      .prepare(`
        UPDATE packing_list_items
        SET quantity = COALESCE(?, quantity),
            notes = COALESCE(?, notes),
            priority = COALESCE(?, priority),
            override_type = 'modified'
        WHERE packing_list_id = ? AND item_id = ?
      `)
      .bind(data?.quantity, data?.notes, data?.priority, listId, itemId)
      .run()
  }
}
