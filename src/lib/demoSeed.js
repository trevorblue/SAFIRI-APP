// Full demo state exercising all 13 Safiri features.
// Loaded via "Load demo data" button in Trip Setup.

export const DEMO_STATE = {
  setupComplete: true,
  groupSize: 6,
  monthlyBudget: 60000,
  cashFloat: 5000,

  trip: {
    name: 'Mombasa 🇰🇪',
    destination: 'Mombasa, Kenya',
    startDate: '2026-07-03',
    endDate: '2026-07-05',
    preTripDate: '2026-07-02',
    budgetPerPerson: 25000,
    currency: 'KES',
    transportMode: 'sgr',
    sgrCostPerPerson: 1000,
    carTotalCost: 4500, // used in Transport Simulator tab
    anchorEvent: 'AWS Community Day Kenya – Pwani Edition',
    anchorEventDate: '2026-07-04',
    anchorEventTicket: 500,
  },

  // 5 confirmed + 1 maybe → memberCount = 5, totalBudget = 125,000
  members: [
    { id: 'm-erick',   name: 'Erick',   status: 'confirmed', budget: 25000, joinedAt: '2026-05-01T08:00:00.000Z' },
    { id: 'm-amara',   name: 'Amara',   status: 'confirmed', budget: 25000, joinedAt: '2026-05-01T08:00:00.000Z' },
    { id: 'm-brian',   name: 'Brian',   status: 'confirmed', budget: 25000, joinedAt: '2026-05-01T08:00:00.000Z' },
    { id: 'm-cynthia', name: 'Cynthia', status: 'confirmed', budget: 25000, joinedAt: '2026-05-02T08:00:00.000Z' },
    { id: 'm-david',   name: 'David',   status: 'confirmed', budget: 25000, joinedAt: '2026-05-02T08:00:00.000Z' },
    { id: 'm-fatma',   name: 'Fatma',   status: 'maybe',     budget: null,  joinedAt: '2026-05-03T08:00:00.000Z' },
  ],

  // Total trip spend: 113,400 / 125,000 = 90.7% → DANGER (red bar)
  // Drinks: 4,200 / 5,000 cap = 84% → near-cap warning
  // Activities: 53,500 / 60,000 cap = 89.2% → near-cap warning
  // SettleUp: 4 transactions — Cynthia→Brian 9,480 · David→Brian 1,340 · David→Erick 5,840 · Amara→Erick 2,180
  expenses: [
    // ── Pre-trip ──────────────────────────────────────────────────────────────
    { id: 'exp-pretip', amount: 5000,  category: 'transport',     paidBy: 'm-erick',   description: 'SGR tickets × 5 (economy class)',    date: '2026-07-02', paymentMethod: 'mpesa', isPreTrip: true,  createdAt: '2026-05-01T10:00:00.000Z' },

    // ── Day 1 — Jul 3 ────────────────────────────────────────────────────────
    { id: 'exp-01',     amount: 24000, category: 'accommodation', paidBy: 'm-erick',   description: 'Nyali International Hotel – 2 nights × 3 rooms', date: '2026-07-03', paymentMethod: 'card',  isPreTrip: false, createdAt: '2026-07-03T08:30:00.000Z' },
    { id: 'exp-02',     amount: 2000,  category: 'food',          paidBy: 'm-david',   description: 'Breakfast Day 1 – group',             date: '2026-07-03', paymentMethod: 'cash',  isPreTrip: false, createdAt: '2026-07-03T09:00:00.000Z' },
    { id: 'exp-03',     amount: 5000,  category: 'activities',    paidBy: 'm-brian',   description: 'Camel rides – Bamburi Beach × 5',    date: '2026-07-03', paymentMethod: 'cash',  isPreTrip: false, createdAt: '2026-07-03T11:00:00.000Z' },
    { id: 'exp-04',     amount: 3000,  category: 'photography',   paidBy: 'm-erick',   description: 'Photography session – Nyali Beach',  date: '2026-07-03', paymentMethod: 'mpesa', isPreTrip: false, createdAt: '2026-07-03T16:00:00.000Z' },
    { id: 'exp-05',     amount: 25000, category: 'activities',    paidBy: 'm-brian',   description: 'Dhow dinner cruise – Tamarind × 5',  date: '2026-07-03', paymentMethod: 'card',  isPreTrip: false, createdAt: '2026-07-03T19:30:00.000Z' },
    { id: 'exp-06',     amount: 2000,  category: 'drinks',        paidBy: 'm-cynthia', description: 'Drinks – hotel bar, after dinner',   date: '2026-07-03', paymentMethod: 'cash',  isPreTrip: false, createdAt: '2026-07-03T22:00:00.000Z' },

    // ── Day 2 — Jul 4 ────────────────────────────────────────────────────────
    { id: 'exp-07',     amount: 2000,  category: 'food',          paidBy: 'm-david',   description: 'Breakfast Day 2 – group',             date: '2026-07-04', paymentMethod: 'cash',  isPreTrip: false, createdAt: '2026-07-04T09:00:00.000Z' },
    { id: 'exp-08',     amount: 1200,  category: 'transport',     paidBy: 'm-david',   description: 'Matatu – Nyali to Old Town & back',  date: '2026-07-04', paymentMethod: 'cash',  isPreTrip: false, createdAt: '2026-07-04T08:45:00.000Z' },
    { id: 'exp-09',     amount: 6000,  category: 'activities',    paidBy: 'm-amara',   description: 'Fort Jesus entrance × 5',            date: '2026-07-04', paymentMethod: 'cash',  isPreTrip: false, createdAt: '2026-07-04T09:30:00.000Z' },
    { id: 'exp-10',     amount: 2500,  category: 'activities',    paidBy: 'm-erick',   description: 'AWS Community Day tickets × 5',      date: '2026-07-04', paymentMethod: 'card',  isPreTrip: false, createdAt: '2026-07-04T12:00:00.000Z' },
    { id: 'exp-11',     amount: 3500,  category: 'food',          paidBy: 'm-brian',   description: 'Lunch – Old Town restaurant',        date: '2026-07-04', paymentMethod: 'mpesa', isPreTrip: false, createdAt: '2026-07-04T13:30:00.000Z' },
    { id: 'exp-12',     amount: 7500,  category: 'food',          paidBy: 'm-amara',   description: 'Seafood dinner – Tamarind waterfront', date: '2026-07-04', paymentMethod: 'card',  isPreTrip: false, createdAt: '2026-07-04T20:00:00.000Z' },
    { id: 'exp-13',     amount: 2200,  category: 'drinks',        paidBy: 'm-cynthia', description: 'Drinks – nyama choma evening',       date: '2026-07-04', paymentMethod: 'cash',  isPreTrip: false, createdAt: '2026-07-04T21:30:00.000Z' },
    { id: 'exp-14',     amount: 1200,  category: 'tips',          paidBy: 'm-erick',   description: 'Tips – Fort Jesus guide & restaurant', date: '2026-07-04', paymentMethod: 'cash',  isPreTrip: false, createdAt: '2026-07-04T22:00:00.000Z' },

    // ── Day 3 — Jul 5 ────────────────────────────────────────────────────────
    { id: 'exp-15',     amount: 2000,  category: 'food',          paidBy: 'm-david',   description: 'Breakfast Day 3 – group',             date: '2026-07-05', paymentMethod: 'cash',  isPreTrip: false, createdAt: '2026-07-05T09:00:00.000Z' },
    { id: 'exp-16',     amount: 7500,  category: 'activities',    paidBy: 'm-cynthia', description: 'Splash Water World × 5',             date: '2026-07-05', paymentMethod: 'card',  isPreTrip: false, createdAt: '2026-07-05T09:30:00.000Z' },
    { id: 'exp-17',     amount: 7500,  category: 'activities',    paidBy: 'm-david',   description: 'Go-Karting × 5 – Mamba Village',    date: '2026-07-05', paymentMethod: 'cash',  isPreTrip: false, createdAt: '2026-07-05T13:30:00.000Z' },
    { id: 'exp-18',     amount: 7000,  category: 'shopping',      paidBy: 'm-amara',   description: 'Souvenirs – Biashara St & Old Town', date: '2026-07-05', paymentMethod: 'cash',  isPreTrip: false, createdAt: '2026-07-05T15:30:00.000Z' },
    { id: 'exp-19',     amount: 1500,  category: 'food',          paidBy: 'm-cynthia', description: 'Snacks & ice cream – afternoon',     date: '2026-07-05', paymentMethod: 'cash',  isPreTrip: false, createdAt: '2026-07-05T17:00:00.000Z' },
    { id: 'exp-20',     amount: 800,   category: 'transport',     paidBy: 'm-david',   description: 'Tuk-tuk – hotel to SGR station',     date: '2026-07-05', paymentMethod: 'cash',  isPreTrip: false, createdAt: '2026-07-05T19:00:00.000Z' },
  ],

  // Full itinerary with: 2 cancelled items (triggers adaptive schedule)
  // sat-movies cancelled → 20:30–23:00 evening gap on Day 2
  // sun-gokarting cancelled → 13:00–14:30 afternoon gap on Day 3
  itinerary: [
    // Pre-trip
    { id: 'sgr-depart',    date: '2026-07-02', startTime: '19:00', endTime: '23:00', activityId: null, customName: 'SGR departure — Nairobi to Mombasa', location: 'Nairobi SGR Station, Syokimau', area: null, status: 'done', isPreTrip: true, costPerPerson: 1000, notes: 'Seat 14C confirmed. Economy class.' },
    // Day 1
    { id: 'fri-checkin',   date: '2026-07-03', startTime: '08:00', endTime: '10:00', activityId: null, customName: 'Arrive & check in', location: 'Nyali International Hotel', area: 'North Coast', status: 'done',      costPerPerson: 0 },
    { id: 'fri-beach',     date: '2026-07-03', startTime: '10:00', endTime: '13:00', activityId: 'bamburi-beach',      status: 'done',      costPerPerson: 0 },
    { id: 'fri-camel',     date: '2026-07-03', startTime: '10:30', endTime: '11:30', activityId: 'camel-riding',       status: 'done',      costPerPerson: 1000 },
    { id: 'fri-photo',     date: '2026-07-03', startTime: '16:00', endTime: '17:00', activityId: 'beach-photography',  status: 'done',      costPerPerson: 0 },
    { id: 'fri-dhow',      date: '2026-07-03', startTime: '19:00', endTime: '22:00', activityId: 'dhow-dinner-cruise', status: 'done',      costPerPerson: 5000 },
    // Day 2
    { id: 'sat-fort-jesus',date: '2026-07-04', startTime: '09:00', endTime: '11:30', activityId: 'fort-jesus',         status: 'done',      costPerPerson: 1200 },
    { id: 'sat-aws',       date: '2026-07-04', startTime: '12:00', endTime: '20:00', activityId: 'aws-community-day',  status: 'done',      costPerPerson: 500,  notes: 'Great sessions. Left at 19:30.' },
    { id: 'sat-movies',    date: '2026-07-04', startTime: '20:30', endTime: '23:00', activityId: 'movies',             status: 'cancelled', costPerPerson: 700,  notes: 'Too tired after AWS day — tap ⚡ to find alternative.' },
    // Day 3
    { id: 'sun-splash',    date: '2026-07-05', startTime: '09:00', endTime: '12:00', activityId: 'splash-water-world', status: 'done',      costPerPerson: 1500 },
    { id: 'sun-gokarting', date: '2026-07-05', startTime: '13:00', endTime: '14:30', activityId: 'go-karting',         status: 'cancelled', costPerPerson: 1500, notes: 'Track closed for maintenance — tap ⚡ to find alternative.' },
    { id: 'sun-shopping',  date: '2026-07-05', startTime: '15:00', endTime: '16:30', activityId: 'souvenir-shopping',  status: 'done',      costPerPerson: 1500 },
    { id: 'sun-return',    date: '2026-07-05', startTime: '20:00', endTime: '00:00', activityId: null, customName: 'SGR return — Mombasa to Nairobi', location: 'Mombasa SGR Station', area: 'Island / Old Town', status: 'planned', costPerPerson: 1000, notes: 'Arrive Nairobi Monday morning.' },
  ],

  committedCosts: [
    { id: 'aws-ticket', description: 'AWS Community Day ticket', amount: 500, category: 'activities', perPerson: true, notes: 'Already purchased' },
  ],

  // drinks at 84% of cap → warning · activities at 89% → warning
  categoryCaps: { drinks: 5000, activities: 60000 },

  checklist: [
    { id: 'cl-sgr-book',       text: 'Book SGR tickets',                   category: 'transport',     done: true,  dueDate: '2026-06-25' },
    { id: 'cl-hotel',          text: 'Book hotel / accommodation',          category: 'accommodation', done: true,  dueDate: '2026-06-20' },
    { id: 'cl-aws-ticket',     text: 'Register for AWS Community Day',      category: 'planning',      done: true,  dueDate: '2026-06-30' },
    { id: 'cl-confirm',        text: 'Confirm who is coming',               category: 'planning',      done: true,  dueDate: '2026-06-28' },
    { id: 'cl-group-chat',     text: 'Set up group chat',                   category: 'planning',      done: true },
    { id: 'cl-early-checkin',  text: 'Confirm hotel early check-in',        category: 'accommodation', done: true,  dueDate: '2026-07-01' },
    { id: 'cl-id',             text: 'Check national ID / passport',        category: 'documents',     done: true,  dueDate: '2026-07-01' },
    { id: 'cl-mpesa',          text: 'Load M-Pesa float (KES 5,000+)',      category: 'money',         done: false, dueDate: '2026-07-02' },
    { id: 'cl-cash',           text: 'Withdraw cash for activities',        category: 'money',         done: false, dueDate: '2026-07-02' },
    { id: 'cl-swimwear',       text: 'Pack swimwear & sunscreen',           category: 'packing',       done: false },
    { id: 'cl-reef-safe',      text: 'Buy reef-safe sunscreen',             category: 'packing',       done: false },
    { id: 'cl-charger',        text: 'Pack phone charger & power bank',     category: 'packing',       done: false },
    { id: 'cl-share-contacts', text: 'Share emergency contacts with group', category: 'safety',        done: false },
  ],

  docs: [
    {
      id: 'doc-sgr',
      type: 'sgr',
      title: 'SGR Tickets – Economy',
      ref: 'SGR/NBI-MSA/EC0727/2026',
      notes: 'Nairobi Terminus → Mombasa. Seat 14C. Dep 19:00 Jul 2. Arrive ~23:00.\nReturn: Jul 5 20:00 → Nairobi ~00:00.',
      createdAt: '2026-05-10T10:00:00.000Z',
    },
    {
      id: 'doc-hotel',
      type: 'hotel',
      title: 'Nyali International Hotel',
      ref: 'NIH-BKG-2026-892',
      notes: '3 standard rooms × 2 nights. Check-in Jul 3 08:00 (early arranged). Check-out Jul 5 12:00. Pool + breakfast included.',
      createdAt: '2026-05-10T10:05:00.000Z',
    },
    {
      id: 'doc-aws',
      type: 'event',
      title: 'AWS Community Day Kenya',
      ref: 'AWSKE-PWN-2026-EW001',
      notes: 'Sat Jul 4, 2026. Venue TBA (check awsug.co.ke). Badge + lunch included. KES 500/person. Contact: awsug.ke@gmail.com.',
      createdAt: '2026-05-10T10:10:00.000Z',
    },
    {
      id: 'doc-id',
      type: 'id',
      title: 'National ID – Erick Were',
      ref: '12345678',
      notes: 'Valid until 2030. Photo copy saved in Google Drive. Kenya National ID issued 2018.',
      createdAt: '2026-05-10T10:15:00.000Z',
    },
    {
      id: 'doc-insurance',
      type: 'contact',
      title: 'Jubilee Travel Insurance',
      ref: 'JI-TRAVEL-2026-77221',
      notes: 'Covers 5 pax Jul 2–6. Emergency line: +254 711 082 030 (24hr). Medical evacuation included.',
      createdAt: '2026-05-10T10:20:00.000Z',
    },
    {
      id: 'doc-emergency',
      type: 'contact',
      title: 'Kenya Red Cross – Emergency',
      ref: '+254 700 000 911',
      notes: 'Mombasa district coordinator: +254 722 481 601. Nearest hospital: Coast General, Mvita Rd, Mombasa.',
      createdAt: '2026-05-10T10:25:00.000Z',
    },
  ],
}

export function seedDemoData() {
  localStorage.setItem('safiri_v1', JSON.stringify(DEMO_STATE))
  window.location.href = '/'
}
