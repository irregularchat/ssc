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
  mgrs: string | null
  plus_code: string | null
}

export const BUILDING_CATEGORIES: Record<string, { label: string; color: string; icon: string }> = {
  admin: { label: 'Administrative', color: '#3B82F6', icon: '🏛' },
  barracks: { label: 'Barracks', color: '#6B7280', icon: '🏘' },
  dining: { label: 'Dining', color: '#22C55E', icon: '🍽' },
  medical: { label: 'Medical', color: '#EF4444', icon: '🏥' },
  housing: { label: 'Housing', color: '#8B5CF6', icon: '🏠' },
  training: { label: 'Training', color: '#F97316', icon: '🎯' },
  recreation: { label: 'Recreation', color: '#EC4899', icon: '🏋' },
  retail: { label: 'Retail/PX', color: '#A855F7', icon: '🛒' },
  storage: { label: 'Storage', color: '#EAB308', icon: '📦' },
  maintenance: { label: 'Maintenance', color: '#78716C', icon: '🔧' },
  parking: { label: 'Parking', color: '#64748B', icon: '🅿' },
  security: { label: 'Security', color: '#DC2626', icon: '🛡' },
  religious: { label: 'Religious', color: '#7C3AED', icon: '⛪' },
  education: { label: 'Education', color: '#0EA5E9', icon: '🎓' },
  childcare: { label: 'Childcare', color: '#F472B6', icon: '👶' },
  hazmat: { label: 'Hazmat', color: '#B91C1C', icon: '⚠' },
  other: { label: 'Other', color: '#94A3B8', icon: '📍' },
}
