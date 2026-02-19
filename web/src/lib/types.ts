export interface Installation {
  id: string
  name: string
  slug: string
  state: string | null
  center_latitude: number
  center_longitude: number
  default_zoom: number
}

export interface Building {
  id: string
  installation_id: string
  building_number: string
  name: string | null
  description: string | null
  latitude: number
  longitude: number
  address: string | null
  category: string | null
  floor_count: number | null
  verified: number
  source: string | null
}

export const BUILDING_CATEGORIES: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrative', color: '#3B82F6' },
  medical: { label: 'Medical', color: '#EF4444' },
  dining: { label: 'Dining', color: '#22C55E' },
  barracks: { label: 'Barracks', color: '#6B7280' },
  housing: { label: 'Housing', color: '#8B5CF6' },
  training: { label: 'Training', color: '#F97316' },
  recreation: { label: 'Recreation', color: '#EC4899' },
  motor_pool: { label: 'Motor Pool', color: '#78716C' },
  supply: { label: 'Supply', color: '#EAB308' },
  other: { label: 'Other', color: '#94A3B8' },
}
