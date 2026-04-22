import type { D1Database } from '@cloudflare/workers-types'
import type { School, PackingList } from '~/types/database'

// ==========================================
// Schools CRUD
// ==========================================

export async function getSchools(db: D1Database, { limit = 100, offset = 0, all = false } = {}): Promise<School[]> {
  if (all) {
    const result = await db.prepare('SELECT * FROM schools ORDER BY name').all<School>()
    return result.results
  }
  const result = await db
    .prepare('SELECT * FROM schools ORDER BY name LIMIT ? OFFSET ?')
    .bind(limit, offset)
    .all<School>()
  return result.results
}

export interface SchoolFilters {
  branch?: string
  search?: string
  sort?: 'name' | 'branch' | 'created_at'
  direction?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface SchoolWithListCount extends School {
  list_count: number
}

export interface SchoolsWithFiltersResult {
  schools: SchoolWithListCount[]
  total: number
  page: number
  totalPages: number
}

export async function getSchoolsWithFilters(
  db: D1Database,
  filters: SchoolFilters
): Promise<SchoolsWithFiltersResult> {
  const {
    branch,
    search,
    sort = 'name',
    direction = 'asc',
    page = 1,
    limit = 25,
  } = filters

  const conditions: string[] = []
  const params: (string | number)[] = []

  if (branch) {
    conditions.push('s.branch = ?')
    params.push(branch)
  }

  if (search) {
    conditions.push('(s.name LIKE ? OR s.abbreviation LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const validSorts = ['name', 'branch', 'created_at']
  const sortCol = validSorts.includes(sort) ? sort : 'name'
  const sortDir = direction === 'desc' ? 'DESC' : 'ASC'

  const countResult = await db
    .prepare(`SELECT COUNT(*) as count FROM schools s ${whereClause}`)
    .bind(...params)
    .first<{ count: number }>()

  const total = countResult?.count ?? 0
  const totalPages = Math.ceil(total / limit)
  const offset = (page - 1) * limit

  const schoolsResult = await db
    .prepare(`
      SELECT
        s.*,
        (SELECT COUNT(*) FROM packing_lists WHERE school_id = s.id) as list_count
      FROM schools s
      ${whereClause}
      ORDER BY s.${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `)
    .bind(...params, limit, offset)
    .all<SchoolWithListCount>()

  return {
    schools: schoolsResult.results,
    total,
    page,
    totalPages,
  }
}

export async function getSchoolById(db: D1Database, id: number): Promise<School | null> {
  const result = await db
    .prepare('SELECT * FROM schools WHERE id = ?')
    .bind(id)
    .first<School>()
  return result
}

export async function createSchool(
  db: D1Database,
  data: Omit<School, 'id' | 'created_at' | 'updated_at'>
): Promise<School> {
  const result = await db
    .prepare(`
      INSERT INTO schools (name, abbreviation, branch, location, website, description)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `)
    .bind(
      data.name,
      data.abbreviation,
      data.branch,
      data.location,
      data.website,
      data.description
    )
    .first<School>()

  return result!
}

export async function updateSchool(
  db: D1Database,
  id: number,
  data: Partial<Omit<School, 'id' | 'created_at' | 'updated_at'>>
): Promise<School> {
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (data.name !== undefined) {
    fields.push('name = ?')
    values.push(data.name)
  }
  if (data.abbreviation !== undefined) {
    fields.push('abbreviation = ?')
    values.push(data.abbreviation)
  }
  if (data.branch !== undefined) {
    fields.push('branch = ?')
    values.push(data.branch)
  }
  if (data.location !== undefined) {
    fields.push('location = ?')
    values.push(data.location)
  }
  if (data.website !== undefined) {
    fields.push('website = ?')
    values.push(data.website)
  }
  if (data.description !== undefined) {
    fields.push('description = ?')
    values.push(data.description)
  }

  fields.push("updated_at = datetime('now')")
  values.push(id)

  const result = await db
    .prepare(`
      UPDATE schools
      SET ${fields.join(', ')}
      WHERE id = ?
      RETURNING *
    `)
    .bind(...values)
    .first<School>()

  return result!
}

export async function deleteSchool(db: D1Database, id: number): Promise<void> {
  // First, set school_id to null for any packing lists referencing this school
  await db.prepare('UPDATE packing_lists SET school_id = NULL WHERE school_id = ?').bind(id).run()
  // Then delete the school
  await db.prepare('DELETE FROM schools WHERE id = ?').bind(id).run()
}

export async function getPackingListsBySchoolId(
  db: D1Database,
  schoolId: number
): Promise<PackingList[]> {
  const result = await db
    .prepare('SELECT * FROM packing_lists WHERE school_id = ? ORDER BY name')
    .bind(schoolId)
    .all<PackingList>()
  return result.results
}

export async function getDistinctSchoolBranches(db: D1Database): Promise<string[]> {
  const result = await db
    .prepare(`
      SELECT DISTINCT branch FROM schools
      WHERE branch IS NOT NULL AND branch != ''
      ORDER BY branch
    `)
    .all<{ branch: string }>()
  return result.results.map((r) => r.branch)
}

// ============================================
// SCHOOL-BASE RELATIONSHIPS (Many-to-Many)
// ============================================

export interface SchoolBaseRow {
  id: number
  school_id: number
  base_id: number
  is_primary: number
  notes: string | null
  created_at: string
  base_name: string
  base_abbreviation: string | null
  base_state: string | null
}

// Get all bases where a school is located
export async function getSchoolBases(db: D1Database, schoolId: number): Promise<SchoolBaseRow[]> {
  const result = await db
    .prepare(`
      SELECT
        sb.*,
        b.name as base_name,
        b.abbreviation as base_abbreviation,
        b.state as base_state
      FROM school_bases sb
      JOIN bases b ON sb.base_id = b.id
      WHERE sb.school_id = ?
      ORDER BY sb.is_primary DESC, b.name ASC
    `)
    .bind(schoolId)
    .all<SchoolBaseRow>()
  return result.results
}

// Get all schools at a specific base
export async function getBaseSchools(db: D1Database, baseId: number): Promise<(School & { is_primary: number; notes: string | null })[]> {
  const result = await db
    .prepare(`
      SELECT
        s.*,
        sb.is_primary,
        sb.notes
      FROM school_bases sb
      JOIN schools s ON sb.school_id = s.id
      WHERE sb.base_id = ?
      ORDER BY sb.is_primary DESC, s.name ASC
    `)
    .bind(baseId)
    .all<School & { is_primary: number; notes: string | null }>()
  return result.results
}

// Add a base to a school
export async function addSchoolBase(
  db: D1Database,
  schoolId: number,
  baseId: number,
  isPrimary: boolean = false,
  notes: string | null = null
): Promise<void> {
  // If setting as primary, first clear other primaries
  if (isPrimary) {
    await db
      .prepare(`UPDATE school_bases SET is_primary = 0 WHERE school_id = ?`)
      .bind(schoolId)
      .run()
  }

  await db
    .prepare(`
      INSERT INTO school_bases (school_id, base_id, is_primary, notes)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(school_id, base_id) DO UPDATE SET
        is_primary = excluded.is_primary,
        notes = excluded.notes
    `)
    .bind(schoolId, baseId, isPrimary ? 1 : 0, notes)
    .run()
}

// Remove a base from a school
export async function removeSchoolBase(db: D1Database, schoolId: number, baseId: number): Promise<void> {
  await db
    .prepare(`DELETE FROM school_bases WHERE school_id = ? AND base_id = ?`)
    .bind(schoolId, baseId)
    .run()
}

// Set primary location for a school
export async function setSchoolPrimaryBase(db: D1Database, schoolId: number, baseId: number): Promise<void> {
  await db.batch([
    db.prepare(`UPDATE school_bases SET is_primary = 0 WHERE school_id = ?`).bind(schoolId),
    db.prepare(`UPDATE school_bases SET is_primary = 1 WHERE school_id = ? AND base_id = ?`).bind(schoolId, baseId),
  ])
}

// Get schools with their base locations
export async function getSchoolsWithBases(db: D1Database): Promise<(School & { bases: SchoolBaseRow[] })[]> {
  const schools = await db.prepare(`SELECT * FROM schools ORDER BY name`).all<School>()

  const schoolsWithBases = await Promise.all(
    schools.results.map(async (school) => {
      const bases = await getSchoolBases(db, school.id)
      return { ...school, bases }
    })
  )

  return schoolsWithBases
}

// Get packing lists for a school, optionally filtered by base
export async function getSchoolPackingLists(
  db: D1Database,
  schoolId: number,
  baseId?: number
): Promise<PackingList[]> {
  if (baseId) {
    // Get location-specific list if exists, otherwise generic
    const specific = await db
      .prepare(`
        SELECT * FROM packing_lists
        WHERE school_id = ? AND base_id = ? AND is_public = 1
        ORDER BY created_at DESC
      `)
      .bind(schoolId, baseId)
      .all<PackingList>()

    if (specific.results.length > 0) {
      return specific.results
    }

    // Fall back to generic (no base_id)
    const generic = await db
      .prepare(`
        SELECT * FROM packing_lists
        WHERE school_id = ? AND base_id IS NULL AND is_public = 1
        ORDER BY created_at DESC
      `)
      .bind(schoolId)
      .all<PackingList>()

    return generic.results
  }

  // No base specified - return all lists for school
  const all = await db
    .prepare(`
      SELECT * FROM packing_lists
      WHERE school_id = ? AND is_public = 1
      ORDER BY base_id IS NULL DESC, created_at DESC
    `)
    .bind(schoolId)
    .all<PackingList>()

  return all.results
}
