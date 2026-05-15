// Default trip: Mombasa, July 2026
export const DEFAULT_TRIP = {
  name: 'Mombasa 🇰🇪',
  destination: 'Mombasa, Kenya',
  startDate: '2026-07-03',
  endDate: '2026-07-05',
  preTripDate: '2026-07-02',
  budgetPerPerson: 25000,
  currency: 'KES',
  transportMode: 'sgr', // 'sgr' | 'car'
  sgrCostPerPerson: 1000,
  carTotalCost: 0,
  anchorEvent: 'AWS Community Day Kenya – Pwani Edition',
  anchorEventDate: '2026-07-04',
  anchorEventTicket: 500,
}

export const AREAS = {
  NORTH_COAST: 'North Coast',
  ISLAND: 'Island / Old Town',
  SOUTH_COAST: 'South Coast',
  TBC: 'TBC',
}

export const AREA_COLORS = {
  [AREAS.NORTH_COAST]: '#0ABFB0',   // teal
  [AREAS.ISLAND]: '#A78BFA',         // violet
  [AREAS.SOUTH_COAST]: '#F97316',    // orange
  [AREAS.TBC]: '#64748B',            // muted
}

export const TIME_OF_DAY = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  NIGHT: 'night',
  ANY: 'any',
}

// Full Mombasa activity library
export const ACTIVITY_LIBRARY = [
  {
    id: 'aws-community-day',
    name: 'AWS Community Day',
    location: 'TBC (venue not yet announced)',
    area: AREAS.TBC,
    durationHours: 8,
    costPerPerson: 500,
    timeOfDay: TIME_OF_DAY.AFTERNOON,
    description: 'AWS Community Day Kenya – Pwani Edition. Networking, sessions, community.',
    isAnchorEvent: true,
  },
  {
    id: 'bamburi-beach',
    name: 'Beach day',
    location: 'Bamburi Beach or Nyali Beach',
    area: AREAS.NORTH_COAST,
    durationHours: 3,
    costPerPerson: 0,
    timeOfDay: TIME_OF_DAY.MORNING,
    description: 'Relax at the beach. Entry may be free or nominal at some spots.',
  },
  {
    id: 'camel-riding',
    name: 'Camel riding',
    location: 'Bamburi Beach',
    area: AREAS.NORTH_COAST,
    durationHours: 1,
    costPerPerson: 1000,
    timeOfDay: TIME_OF_DAY.MORNING,
    description: 'Short camel ride along the beach. Easy, fun, photogenic.',
  },
  {
    id: 'jet-ski',
    name: 'Jet ski',
    location: 'Bamburi Beach',
    area: AREAS.NORTH_COAST,
    durationHours: 1,
    costPerPerson: 2000,
    timeOfDay: TIME_OF_DAY.MORNING,
    description: 'Jet skiing on the Indian Ocean. High energy, popular with groups.',
  },
  {
    id: 'splash-water-world',
    name: 'Splash Water World',
    location: 'Bamburi Beach, Mombasa',
    area: AREAS.NORTH_COAST,
    durationHours: 3,
    costPerPerson: 1500,
    timeOfDay: TIME_OF_DAY.MORNING,
    description: 'Water park with slides, pools, and wave pool. Great for a morning.',
  },
  {
    id: 'go-karting',
    name: 'Go-karting',
    location: 'Mamba Village, Nyali',
    area: AREAS.NORTH_COAST,
    durationHours: 1.5,
    costPerPerson: 1500,
    timeOfDay: TIME_OF_DAY.AFTERNOON,
    description: 'Go-kart racing at Mamba Village, Nyali. Also has crocodile farm nearby.',
  },
  {
    id: 'fort-jesus',
    name: 'Fort Jesus + Old Town walk',
    location: 'Old Town, Mombasa Island',
    area: AREAS.ISLAND,
    durationHours: 2.5,
    costPerPerson: 1200,
    timeOfDay: TIME_OF_DAY.MORNING,
    description: 'UNESCO World Heritage fort + walk through Old Town narrow streets. Rich history.',
  },
  {
    id: 'haller-park',
    name: 'Haller Park',
    location: 'Bamburi, North Coast',
    area: AREAS.NORTH_COAST,
    durationHours: 2,
    costPerPerson: 800,
    timeOfDay: TIME_OF_DAY.ANY,
    description: 'Rehabilitated quarry turned wildlife sanctuary. Giraffes, hippos, tortoises.',
  },
  {
    id: 'marine-park',
    name: 'Mombasa Marine Park',
    location: 'Nyali Beach (glass-bottom boat)',
    area: AREAS.NORTH_COAST,
    durationHours: 2,
    costPerPerson: 1500,
    timeOfDay: TIME_OF_DAY.AFTERNOON,
    description: 'Glass-bottom boat ride and snorkelling in the Marine National Park. Coral, fish, sea turtles.',
  },
  {
    id: 'diani-beach',
    name: 'Diani Beach day',
    location: 'Diani, South Coast',
    area: AREAS.SOUTH_COAST,
    durationHours: 6,
    costPerPerson: 500,
    timeOfDay: TIME_OF_DAY.MORNING,
    description: 'Stunning white sand beach on the south coast. Requires Likoni Ferry crossing (~30 min).',
    travelNote: 'Requires Likoni Ferry crossing. Allow 45–60 min travel from north coast.',
  },
  {
    id: 'dhow-dinner-cruise',
    name: 'Dhow dinner cruise',
    location: 'Tamarind, Old Town waterfront',
    area: AREAS.ISLAND,
    durationHours: 3,
    costPerPerson: 5000,
    timeOfDay: TIME_OF_DAY.EVENING,
    description: 'Sunset/dinner dhow cruise on the Tamarind. Seafood, live music, ocean views.',
  },
  {
    id: 'movies',
    name: 'Movies',
    location: 'Nyali Cinemax, Nyali',
    area: AREAS.NORTH_COAST,
    durationHours: 2.5,
    costPerPerson: 700,
    timeOfDay: TIME_OF_DAY.EVENING,
    description: 'Cinema at Nyali Centre. Good indoor option for rainy weather or downtime.',
  },
  {
    id: 'mama-ngina-nyama',
    name: 'Mama Ngina Drive nyama choma',
    location: 'Mama Ngina Drive, Mombasa Island',
    area: AREAS.ISLAND,
    durationHours: 2,
    costPerPerson: 800,
    timeOfDay: TIME_OF_DAY.EVENING,
    description: 'Nyama choma, chips, and drinks along the seafront road. Classic Mombasa night out.',
  },
  {
    id: 'rooftop-bar',
    name: 'Rooftop bar',
    location: 'Various (hotel dependent)',
    area: AREAS.NORTH_COAST,
    durationHours: 2,
    costPerPerson: 1000,
    timeOfDay: TIME_OF_DAY.EVENING,
    description: 'Sundowner drinks at a hotel rooftop bar. Views over the Indian Ocean.',
  },
  {
    id: 'souvenir-shopping',
    name: 'Souvenir shopping',
    location: 'Old Town / Biashara Street',
    area: AREAS.ISLAND,
    durationHours: 1.5,
    costPerPerson: 1500,
    timeOfDay: TIME_OF_DAY.AFTERNOON,
    description: 'Kanga fabric, carvings, spices, kikois. Old Town has the best variety.',
  },
  {
    id: 'beach-photography',
    name: 'Beachside photography',
    location: 'Bamburi or Nyali Beach',
    area: AREAS.NORTH_COAST,
    durationHours: 1,
    costPerPerson: 0,
    timeOfDay: TIME_OF_DAY.ANY,
    description: 'Sunrise or golden hour photos at the beach. Free.',
  },
  {
    id: 'night-beach-walk',
    name: 'Night beach walk',
    location: 'Bamburi or Nyali Beach',
    area: AREAS.NORTH_COAST,
    durationHours: 1,
    costPerPerson: 0,
    timeOfDay: TIME_OF_DAY.NIGHT,
    description: 'Walk along the beach at night. Free, atmospheric.',
  },
  {
    id: 'likoni-ferry',
    name: 'Likoni Ferry crossing',
    location: 'Likoni, Mombasa',
    area: AREAS.ISLAND,
    durationHours: 0.5,
    costPerPerson: 0,
    timeOfDay: TIME_OF_DAY.ANY,
    description: 'Free ferry crossing between Mombasa Island and the south coast. An experience in itself.',
  },
]

export const EXPENSE_CATEGORIES = [
  { id: 'activities', label: 'Activities', icon: '🎯' },
  { id: 'transport', label: 'Transport', icon: '🚌' },
  { id: 'food', label: 'Food', icon: '🍽️' },
  { id: 'drinks', label: 'Drinks', icon: '🍺' },
  { id: 'accommodation', label: 'Accommodation', icon: '🏨' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'tips', label: 'Tips', icon: '💰' },
  { id: 'photography', label: 'Photography', icon: '📸' },
  { id: 'data', label: 'Data / Airtime', icon: '📱' },
  { id: 'other', label: 'Other', icon: '📌' },
]

export const PAYMENT_METHODS = [
  { id: 'card', label: 'KCB Card' },
  { id: 'mpesa', label: 'M-Pesa' },
  { id: 'cash', label: 'Cash' },
]

export const MEMBER_STATUS = {
  CONFIRMED: 'confirmed',
  MAYBE: 'maybe',
  DROPPED: 'dropped',
}

export const ACTIVITY_STATUS = {
  PLANNED: 'planned',
  ACTIVE: 'active',
  DONE: 'done',
  CANCELLED: 'cancelled',
  SWAPPED: 'swapped',
}

// SGR pricing
export const SGR = {
  ECONOMY_ONE_WAY: 1000,
  ECONOMY_RETURN: 2000,
  FIRST_ONE_WAY: 3000,
  FIRST_RETURN: 6000,
}

// Budget alert thresholds
export const BUDGET_ALERTS = {
  WARNING: 0.75,
  DANGER: 0.90,
}

// Pre-loaded itinerary for the Mombasa trip
export const DEFAULT_ITINERARY = [
  {
    id: 'sgr-depart',
    date: '2026-07-02',
    startTime: '19:00',
    endTime: '23:00',
    activityId: null,
    customName: 'SGR departure — Nairobi to Mombasa',
    location: 'Nairobi SGR Station, Syokimau',
    area: null,
    status: 'planned',
    isPreTrip: true,
    costPerPerson: 1000,
    notes: 'Economy class. Confirm exact train time.',
  },
  {
    id: 'fri-checkin',
    date: '2026-07-03',
    startTime: '08:00',
    endTime: '10:00',
    activityId: null,
    customName: 'Arrive & check in',
    location: 'Nyali / Bamburi hotel',
    area: AREAS.NORTH_COAST,
    status: 'planned',
    costPerPerson: 0,
  },
  {
    id: 'fri-beach',
    date: '2026-07-03',
    startTime: '10:00',
    endTime: '13:00',
    activityId: 'bamburi-beach',
    status: 'planned',
    costPerPerson: 0,
  },
  {
    id: 'fri-camel',
    date: '2026-07-03',
    startTime: '10:30',
    endTime: '11:30',
    activityId: 'camel-riding',
    status: 'planned',
    costPerPerson: 1000,
  },
  {
    id: 'fri-dhow',
    date: '2026-07-03',
    startTime: '19:00',
    endTime: '22:00',
    activityId: 'dhow-dinner-cruise',
    status: 'planned',
    costPerPerson: 5000,
  },
  {
    id: 'sat-fort-jesus',
    date: '2026-07-04',
    startTime: '09:00',
    endTime: '11:30',
    activityId: 'fort-jesus',
    status: 'planned',
    costPerPerson: 1200,
  },
  {
    id: 'sat-aws',
    date: '2026-07-04',
    startTime: '12:00',
    endTime: '20:00',
    activityId: 'aws-community-day',
    status: 'planned',
    costPerPerson: 500,
    notes: 'Flexible exit time. Group can leave earlier.',
  },
  {
    id: 'sat-movies',
    date: '2026-07-04',
    startTime: '20:30',
    endTime: '23:00',
    activityId: 'movies',
    status: 'planned',
    costPerPerson: 700,
  },
  {
    id: 'sun-splash',
    date: '2026-07-05',
    startTime: '09:00',
    endTime: '12:00',
    activityId: 'splash-water-world',
    status: 'planned',
    costPerPerson: 1500,
  },
  {
    id: 'sun-gokarting',
    date: '2026-07-05',
    startTime: '13:00',
    endTime: '14:30',
    activityId: 'go-karting',
    status: 'planned',
    costPerPerson: 1500,
  },
  {
    id: 'sun-shopping',
    date: '2026-07-05',
    startTime: '15:00',
    endTime: '16:30',
    activityId: 'souvenir-shopping',
    status: 'planned',
    costPerPerson: 1500,
  },
  {
    id: 'sun-return',
    date: '2026-07-05',
    startTime: '20:00',
    endTime: '00:00',
    activityId: null,
    customName: 'SGR return — Mombasa to Nairobi',
    location: 'Mombasa SGR Station',
    area: AREAS.ISLAND,
    status: 'planned',
    costPerPerson: 1000,
    notes: 'Arrive Nairobi Monday morning.',
  },
]

export const DEFAULT_COMMITTED_COSTS = [
  {
    id: 'aws-ticket',
    description: 'AWS Community Day ticket',
    amount: 500,
    category: 'activities',
    perPerson: true,
    notes: 'Already purchased',
  },
]

export const CHECKLIST_CATEGORIES = [
  { id: 'transport',     label: 'Transport',     icon: '🚆' },
  { id: 'accommodation', label: 'Accommodation', icon: '🏨' },
  { id: 'money',         label: 'Money',         icon: '💰' },
  { id: 'documents',     label: 'Documents',     icon: '🪪' },
  { id: 'packing',       label: 'Packing',       icon: '🎒' },
  { id: 'planning',      label: 'Planning',      icon: '📋' },
  { id: 'safety',        label: 'Safety',        icon: '⚠️' },
]

export const DEFAULT_CHECKLIST = [
  { id: 'cl-sgr-book',      text: 'Book SGR tickets',                    category: 'transport',     done: false, dueDate: '2026-06-25' },
  { id: 'cl-hotel',         text: 'Book hotel / accommodation',           category: 'accommodation', done: false, dueDate: '2026-06-20' },
  { id: 'cl-aws-ticket',    text: 'Register for AWS Community Day',       category: 'planning',      done: false, dueDate: '2026-06-30' },
  { id: 'cl-confirm',       text: 'Confirm who is coming',                category: 'planning',      done: false, dueDate: '2026-06-28' },
  { id: 'cl-group-chat',    text: 'Set up group chat',                    category: 'planning',      done: false },
  { id: 'cl-mpesa',         text: 'Load M-Pesa float (KES 5,000+)',       category: 'money',         done: false, dueDate: '2026-07-02' },
  { id: 'cl-cash',          text: 'Withdraw cash for activities',         category: 'money',         done: false, dueDate: '2026-07-02' },
  { id: 'cl-id',            text: 'Check national ID / passport',         category: 'documents',     done: false, dueDate: '2026-07-01' },
  { id: 'cl-swimwear',      text: 'Pack swimwear & sunscreen',            category: 'packing',       done: false },
  { id: 'cl-charger',       text: 'Pack phone charger & power bank',      category: 'packing',       done: false },
  { id: 'cl-share-contacts',text: 'Share emergency contacts with group',  category: 'safety',        done: false },
]

export const formatKES = (amount) =>
  `KES ${Number(amount).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`
