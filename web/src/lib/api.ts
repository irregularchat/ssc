import type { Building } from './types'

const BASE = '/api'

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchBuildings(installation: string, category?: string): Promise<{ data: Building[]; total: number }> {
  const params = new URLSearchParams({ installation })
  if (category && category !== 'all') params.set('category', category)
  params.set('limit', '10000')
  return fetchJSON<{ data: Building[]; total: number }>(`${BASE}/buildings?${params}`)
}

export async function searchBuildings(installation: string, query: string): Promise<Building[]> {
  const params = new URLSearchParams({ installation, q: query })
  const res = await fetchJSON<{ data: Building[] }>(`${BASE}/buildings/search?${params}`)
  return res.data
}

export async function fetchBuildingCategories(installation: string): Promise<{ category: string; count: number }[]> {
  const params = new URLSearchParams({ installation })
  const res = await fetchJSON<{ data: { category: string; count: number }[] }>(`${BASE}/buildings/categories?${params}`)
  return res.data
}

export async function submitBuilding(data: {
  installation_id: string
  building_number: string
  name?: string
  description?: string
  latitude: number
  longitude: number
  category?: string
  submitted_by?: string
}): Promise<{ id: string; status: string }> {
  const res = await fetch(`${BASE}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Submit error: ${res.status}`)
  const json = await res.json()
  return json.data
}
