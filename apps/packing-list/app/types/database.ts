export interface School {
  id: number
  name: string
  abbreviation: string | null
  branch: string | null
  location: string | null
  website: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface Base {
  id: number
  name: string
  abbreviation: string | null
  branch: string | null
  location: string | null
  state: string | null
  region: string | null
  website: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface Item {
  id: number
  name: string
  description: string | null
  category: string | null
  asin: string | null
  image_url: string | null
  unit_name: string // 'each', 'pair', 'pack', etc.
  weight_oz?: number | null // weight in ounces for pack weight calc
  brand_preference?: string | null // recommended brand
  created_at: string
  updated_at: string
}

export interface PackingList {
  id: number
  name: string
  description: string | null
  type: string | null
  is_public: number
  contributor_name: string | null
  school_id: number | null
  base_id: number | null
  parent_list_id: number | null // For inheritance - child lists inherit from parent
  created_at: string
  updated_at: string
}

// Junction table: Schools can be at multiple bases
export interface SchoolBase {
  id: number
  school_id: number
  base_id: number
  is_primary: number // 1 = primary location
  notes: string | null // e.g., "Winter cycle only"
  created_at: string
}

export interface SchoolBaseWithBase extends SchoolBase {
  base_name: string
  base_abbreviation: string | null
  base_state: string | null
}

export interface PackingListItem {
  id: number
  packing_list_id: number
  item_id: number
  quantity: number
  notes: string | null
  added_by: string | null
  priority?: number // 1=Required, 2=Recommended, 3=Optional
  source?: string | null // 'official', 'veteran_tip', 'drill_sergeant'
  override_type?: 'inherited' | 'added' | 'removed' | 'modified' // For child lists
  created_at: string
}

export interface Store {
  id: number
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  phone: string | null
  website: string | null
  lat: number | null
  lng: number | null
  is_online: number
  store_type: string | null
  base_id: number | null
  accepts_military_discount?: number // 0 or 1
  military_discount_pct?: number | null // e.g., 10 for 10% off
  created_at: string
  updated_at: string
}

export interface Price {
  id: number
  item_id: number
  store_id: number
  price: number
  in_stock: number
  package_qty: number // How many units per package (e.g., 6 for a 6-pack)
  package_name: string | null // Display name like "6-pack", "box of 12"
  price_type?: string // 'regular', 'sale', 'military'
  military_discount_pct?: number | null // discount applied to get this price
  last_verified: string
  created_at: string
}

export interface Vote {
  id: number
  price_id: number
  vote_type: 'up' | 'down'
  voter_ip: string | null
  created_at: string
}

// Extended types with relationships
export interface PackingListWithRelations extends PackingList {
  school?: School | null
  base?: Base | null
  items?: PackingListItemWithItem[]
  parent_list?: PackingList | null // Parent list if this is a child/variant
  child_lists?: PackingList[] // Child lists that inherit from this one
}

export interface SchoolWithBases extends School {
  bases: SchoolBaseWithBase[]
}

export interface PackingListItemWithItem extends PackingListItem {
  item: Item
}

export interface PriceWithStore extends Price {
  store: Store
  votes_up: number
  votes_down: number
}

export interface Tip {
  id: number
  packing_list_id: number
  item_id: number | null
  title: string
  body: string
  compliance_status: 'allowed' | 'tolerated' | 'not_allowed'
  contributor_name: string | null
  approved: number
  created_at: string
  updated_at: string
}

export interface TipVote {
  id: number
  tip_id: number
  vote_type: 'up' | 'down'
  voter_ip: string | null
  created_at: string
}

export interface TipWithVotes extends Tip {
  votes_up: number
  votes_down: number
  item_name: string | null
  list_name: string | null
}
