import { supabase } from './supabase'

// ── Shape converters ────────────────────────────────────────────────────────

export function expToLocal(e) {
  return {
    id:            e.id,
    description:   e.description,
    amount:        Number(e.amount),
    category:      e.category,
    date:          e.date,
    paidBy:        e.paid_by ?? null,
    splitBetween:  e.split_between ?? [],
    splitMode:     e.split_mode ?? 'equal',
    customSplits:  e.custom_splits ?? null,
    isPreTrip:     e.is_pre_trip,
    paymentMethod: e.payment_method ?? null,
    paymentSource: e.payment_source ?? 'personal',
    status:        e.status ?? 'approved',
    receiptUrl:    e.receipt_url ?? null,
    createdAt:     e.created_at,
  }
}

export function memberToLocal(m) {
  return {
    id:       m.id,
    name:     m.name,
    status:   m.confirmed ? 'confirmed' : 'invited',
    budget:   m.budget != null ? Number(m.budget) : null,
    role:     m.role,
    joinedAt: m.created_at,
  }
}

// ── Queries ─────────────────────────────────────────────────────────────────

// Load the most recent active trip owned by userId → local state shape, or null
export async function loadUserTrip(userId) {
  if (!supabase) return null

  const { data: trip, error } = await supabase
    .from('trips')
    .select('*')
    .eq('owner_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !trip) return null

  const [{ data: members }, { data: expenses }] = await Promise.all([
    supabase.from('trip_members').select('*').eq('trip_id', trip.id).order('created_at'),
    supabase.from('expenses').select('*').eq('trip_id', trip.id).order('created_at', { ascending: false }),
  ])

  const s = trip.settings ?? {}
  return {
    tripDbId:      trip.id,
    setupComplete: true,
    groupSize:     s.groupSize ?? 1,
    monthlyBudget: s.monthlyBudget ?? null,
    cashFloat:     Number(s.cashFloat ?? 0),
    categoryCaps:  s.categoryCaps ?? { drinks: 5000 },
    contributions: Array.isArray(s.contributions) ? s.contributions : [],
    trip: {
      name:             trip.name,
      destination:      s.destination ?? '',
      startDate:        trip.start_date,
      endDate:          trip.end_date,
      budgetPerPerson:  Number(trip.budget_per_person),
      transportMode:    s.transportMode  ?? 'car',
      sgrCostPerPerson: Number(s.sgrCostPerPerson ?? 0),
      carTotalCost:     Number(s.carTotalCost  ?? 0),
      carType:          s.carType ?? 'sedan',
    },
    members:  (members  ?? []).map(memberToLocal),
    expenses: (expenses ?? []).map(expToLocal),
  }
}

export async function syncTripSettings(tripId, settings) {
  if (!supabase || !tripId) return
  const { error } = await supabase.from('trips').update({ settings }).eq('id', tripId)
  if (error) console.error('syncTripSettings:', error)
}

// Insert a new trip + its confirmed members → return the Supabase trip UUID
export async function createTrip(userId, state) {
  if (!supabase) return null

  const { trip, members, groupSize, monthlyBudget, cashFloat, categoryCaps } = state

  const { data, error } = await supabase
    .from('trips')
    .insert({
      owner_id:         userId,
      name:             trip.name,
      start_date:       trip.startDate,
      end_date:         trip.endDate,
      budget_per_person: trip.budgetPerPerson,
      settings: {
        destination:      trip.destination,
        transportMode:    trip.transportMode,
        sgrCostPerPerson: trip.sgrCostPerPerson,
        carTotalCost:     trip.carTotalCost,
        carType:          trip.carType,
        groupSize:        groupSize   ?? 1,
        monthlyBudget:    monthlyBudget ?? null,
        cashFloat:        cashFloat   ?? 0,
        categoryCaps:     categoryCaps ?? {},
      },
    })
    .select('id')
    .single()

  if (error) { console.error('createTrip:', error); return null }

  const tripId = data.id
  const confirmed = (members ?? []).filter(m => m.status === 'confirmed')

  if (confirmed.length > 0) {
    // Let Supabase generate member UUIDs — we reload after to get them
    const { error: mErr } = await supabase.from('trip_members').insert(
      confirmed.map(m => ({
        trip_id:   tripId,
        name:      m.name,
        confirmed: true,
        budget:    m.budget ?? null,
        role:      'member',
      }))
    )
    if (mErr) console.error('createTrip members:', mErr)
  }

  return tripId
}

// ── Per-action sync (fire-and-forget) ───────────────────────────────────────

export async function syncExpenseAction(action, tripId) {
  if (!supabase || !tripId) return
  const { type, payload } = action

  if (type === 'ADD_EXPENSE') {
    const { error } = await supabase.from('expenses').insert({
      id:             payload.id,
      trip_id:        tripId,
      description:    payload.description,
      amount:         payload.amount,
      category:       payload.category,
      date:           payload.date,
      paid_by:        payload.paidBy        ?? null,
      split_between:  payload.splitBetween  ?? [],
      split_mode:     payload.splitMode     ?? 'equal',
      custom_splits:  payload.customSplits  ?? null,
      is_pre_trip:    payload.isPreTrip      ?? false,
      payment_method: payload.paymentMethod ?? null,
      payment_source: payload.paymentSource ?? 'personal',
      status:         payload.status        ?? 'approved',
      receipt_url:    payload.receiptUrl    ?? null,
    })
    if (error) console.error('syncExpense INSERT:', error)
  } else if (type === 'UPDATE_EXPENSE') {
    const { id, ...rest } = payload
    const { error } = await supabase.from('expenses').update({
      description:    rest.description,
      amount:         rest.amount,
      category:       rest.category,
      date:           rest.date,
      paid_by:        rest.paidBy        ?? null,
      split_between:  rest.splitBetween  ?? [],
      split_mode:     rest.splitMode     ?? 'equal',
      custom_splits:  rest.customSplits  ?? null,
      is_pre_trip:    rest.isPreTrip     ?? false,
      payment_source: rest.paymentSource ?? 'personal',
      status:         rest.status,
      receipt_url:    rest.receiptUrl    ?? null,
    }).eq('id', id)
    if (error) console.error('syncExpense UPDATE:', error)
  } else if (type === 'DELETE_EXPENSE') {
    const { error } = await supabase.from('expenses').delete().eq('id', payload)
    if (error) console.error('syncExpense DELETE:', error)
  }
}

// Archive a trip — mark complete and snapshot spend totals into settings
export async function archiveTrip(tripId, snapshot = {}) {
  if (!supabase || !tripId) return
  const { data: trip } = await supabase
    .from('trips')
    .select('settings')
    .eq('id', tripId)
    .single()
  const merged = { ...(trip?.settings ?? {}), ...snapshot, archivedAt: new Date().toISOString() }
  const { error } = await supabase
    .from('trips')
    .update({ status: 'complete', settings: merged })
    .eq('id', tripId)
  if (error) console.error('archiveTrip:', error)
}

// Fetch all trips (active + complete) for a user — lightweight, no expenses
export async function fetchAllUserTrips(userId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('trips')
    .select('id, name, start_date, end_date, budget_per_person, status, settings, created_at')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
  if (error) { console.error('fetchAllUserTrips:', error); return [] }
  return (data ?? []).map(t => ({
    id:                 t.id,
    name:               t.name,
    destination:        t.settings?.destination ?? '',
    startDate:          t.start_date,
    endDate:            t.end_date,
    budgetPerPerson:    Number(t.budget_per_person),
    groupSize:          Number(t.settings?.groupSize ?? 1),
    status:             t.status ?? 'active',
    transportMode:      t.settings?.transportMode ?? 'car',
    sgrCostPerPerson:   Number(t.settings?.sgrCostPerPerson ?? 0),
    carTotalCost:       Number(t.settings?.carTotalCost ?? 0),
    carType:            t.settings?.carType ?? 'sedan',
    archivedTotalSpent: t.settings?.archivedTotalSpent ?? null,
    archivedMemberCount: Number(t.settings?.archivedMemberCount ?? 0) || null,
    createdAt:          t.created_at,
  }))
}

// Fetch confirmed member names for a trip (used for clone / recurring group)
export async function fetchTripMemberNames(tripId) {
  if (!supabase) return []
  const { data } = await supabase
    .from('trip_members')
    .select('name')
    .eq('trip_id', tripId)
    .eq('confirmed', true)
    .order('created_at')
  return (data ?? []).map(m => m.name)
}

// ── Invite join (no auth required — calls SECURITY DEFINER RPCs) ─────────────

export async function fetchTripForJoin(tripId) {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('trip_preview', { p_trip_id: tripId })
  if (error || !data || data.error) return null
  return data
}

export async function joinTripById(tripId, name) {
  if (!supabase) return { error: 'Unavailable' }
  const { data, error } = await supabase.rpc('join_trip', { p_trip_id: tripId, p_name: name })
  if (error) return { error: error.message }
  return data
}

export async function setJoinMemberBudget(memberId, budget) {
  if (!supabase || !memberId || !budget) return
  const { error } = await supabase.rpc('set_member_budget', {
    p_member_id: memberId,
    p_budget:    budget,
  })
  if (error) console.error('setJoinMemberBudget:', error)
}

export async function syncMemberAction(action, tripId) {
  if (!supabase || !tripId) return
  const { type, payload } = action

  if (type === 'ADD_MEMBER') {
    const { error } = await supabase.from('trip_members').insert({
      id:        payload.id,
      trip_id:   tripId,
      name:      payload.name,
      confirmed: payload.status === 'confirmed',
      budget:    payload.budget ?? null,
      role:      'member',
    })
    if (error) console.error('syncMember INSERT:', error)
  } else if (type === 'UPDATE_MEMBER') {
    const { id, ...rest } = payload
    const updates = {}
    if (rest.name   !== undefined) updates.name      = rest.name
    if (rest.status !== undefined) updates.confirmed = rest.status === 'confirmed'
    if (rest.budget !== undefined) updates.budget    = rest.budget ?? null
    if (rest.role   !== undefined) updates.role      = rest.role
    if (Object.keys(updates).length === 0) return
    const { error } = await supabase.from('trip_members').update(updates).eq('id', id)
    if (error) console.error('syncMember UPDATE:', error)
  } else if (type === 'REMOVE_MEMBER') {
    const { error } = await supabase.from('trip_members').delete().eq('id', payload)
    if (error) console.error('syncMember DELETE:', error)
  }
}
