/** Database row types */

export interface Person {
  id: number
  name: string
  is_active: boolean
  created_at: string
}

export interface Trip {
  id: number
  trip_date: string         // 'YYYY-MM-DD'
  trip_type: 'morning' | 'evening'
  total_amount_paise: number
  created_at: string
}

export interface TripParticipant {
  id: number
  trip_id: number
  person_id: number
  amount_paise: number
  created_at: string
}

/** Joined trip with participants */
export interface TripWithParticipants extends Trip {
  participants: (TripParticipant & { person: Person })[]
}

/** Settings keys */
export type SettingKey = 'default_trip_price_paise' | 'driver_person_id'

export interface Setting {
  key: SettingKey
  value: string
  updated_at: string
}

/** App settings parsed */
export interface AppSettings {
  defaultTripPricePaise: number
  driverPersonId: number
}

/** Monthly summary per person */
export interface PersonMonthlySummary {
  person: Person
  totalPaise: number
  tripCount: number
}

/** View tabs */
export type AppView = 'trips' | 'summary' | 'settings'

export type TripType = 'morning' | 'evening'
