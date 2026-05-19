import { createContext, useContext, useReducer, useEffect, useMemo, useCallback, useRef } from 'react'
import { differenceInCalendarDays, parseISO, format } from 'date-fns'
import {
  DEFAULT_TRIP,
  DEFAULT_ITINERARY,
  DEFAULT_COMMITTED_COSTS,
  DEFAULT_CHECKLIST,
  ACTIVITY_LIBRARY,
  BUDGET_ALERTS,
} from '../lib/constants'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import {
  loadUserTrip,
  createTrip,
  syncExpenseAction,
  syncMemberAction,
  syncTripSettings,
  saveBudgetMilestone,
  expToLocal,
  memberToLocal,
} from '../lib/db'
import { enqueueAction, flushQueue } from '../lib/offlineQueue'
import { triggerBudgetPush } from '../lib/pushNotifications'

const STORAGE_KEY = 'safiri_v1'

const initialState = {
  setupComplete: false,
  tripDbId: null,
  groupSize: 1,
  trip: DEFAULT_TRIP,
  members: [],
  expenses: [],
  contributions: [],
  itinerary: DEFAULT_ITINERARY,
  committedCosts: DEFAULT_COMMITTED_COSTS,
  categoryCaps: { drinks: 5000 },
  monthlyBudget: null,
  cashFloat: 0,
  checklist: DEFAULT_CHECKLIST,
  docs: [],
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw)
    // Merge with initialState so any field added after first run gets its default
    return {
      ...initialState,
      ...parsed,
      members:        Array.isArray(parsed.members)        ? parsed.members        : [],
      expenses:       Array.isArray(parsed.expenses)       ? parsed.expenses       : [],
      contributions:  Array.isArray(parsed.contributions)  ? parsed.contributions  : [],
      committedCosts: Array.isArray(parsed.committedCosts) ? parsed.committedCosts : initialState.committedCosts,
      itinerary:      Array.isArray(parsed.itinerary)      ? parsed.itinerary      : initialState.itinerary,
      checklist:      Array.isArray(parsed.checklist)      ? parsed.checklist      : initialState.checklist,
      docs:           Array.isArray(parsed.docs)           ? parsed.docs           : [],
    }
  } catch {
    return initialState
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'COMPLETE_SETUP': {
      const { memberNames, budgetMode: _budgetMode, groupSize, monthlyBudget, ...tripFields } = action.payload
      const providedNames = (memberNames ?? []).filter(n => n?.trim())
      const existingNames = new Set((state.members ?? []).map(m => m.name.toLowerCase()))
      const newFromSetup  = providedNames
        .filter(name => !existingNames.has(name.trim().toLowerCase()))
        .map(name => ({
          id:       crypto.randomUUID(),
          name:     name.trim(),
          status:   'confirmed',
          role:     'member',
          budget:   null,
          joinedAt: new Date().toISOString(),
        }))
      return {
        ...state,
        setupComplete: true,
        tripDbId:      null, // cleared so the DB-create effect fires
        groupSize:     groupSize     ?? state.groupSize,
        monthlyBudget: monthlyBudget ?? state.monthlyBudget,
        trip:    { ...state.trip, ...tripFields },
        members: [...(state.members ?? []), ...newFromSetup],
      }
    }

    case 'RESET_SETUP':
      return { ...state, setupComplete: false }

    // Replace local state with data loaded from Supabase (keeps itinerary/checklist/docs from localStorage)
    // Keep local members if DB returns none — protects against failed member inserts during migration
    case 'LOAD_FROM_DB':
      return {
        ...state,
        setupComplete: true,
        tripDbId:      action.payload.tripDbId,
        groupSize:     action.payload.groupSize,
        monthlyBudget: action.payload.monthlyBudget,
        cashFloat:     action.payload.cashFloat,
        categoryCaps:  action.payload.categoryCaps,
        contributions: action.payload.contributions ?? [],
        trip:          action.payload.trip,
        members:       action.payload.members.length > 0 ? action.payload.members : state.members,
        expenses:      action.payload.expenses,
      }

    case 'SET_TRIP_DB_ID':
      return { ...state, tripDbId: action.payload }

    // Realtime upserts — add if new, update if already present (deduplicates optimistic writes)
    case 'UPSERT_EXPENSE': {
      const exists = state.expenses.some(e => e.id === action.payload.id)
      if (exists) {
        return { ...state, expenses: state.expenses.map(e => e.id === action.payload.id ? { ...e, ...action.payload } : e) }
      }
      return { ...state, expenses: [action.payload, ...state.expenses] }
    }
    case 'UPSERT_MEMBER': {
      const exists = (state.members ?? []).some(m => m.id === action.payload.id)
      if (exists) {
        return { ...state, members: state.members.map(m => m.id === action.payload.id ? { ...m, ...action.payload } : m) }
      }
      return { ...state, members: [...(state.members ?? []), action.payload] }
    }

    case 'SET_TRIP':
      return { ...state, trip: { ...state.trip, ...action.payload } }

    case 'ADD_MEMBER':
      return { ...state, members: [...(state.members ?? []), action.payload] }
    case 'UPDATE_MEMBER':
      return {
        ...state,
        members: (state.members ?? []).map(m => m.id === action.payload.id ? { ...m, ...action.payload } : m),
      }
    case 'REMOVE_MEMBER':
      return { ...state, members: (state.members ?? []).filter(m => m.id !== action.payload) }

    case 'ADD_CONTRIBUTION':
      return { ...state, contributions: [...(state.contributions ?? []), action.payload] }
    case 'REMOVE_CONTRIBUTION':
      return { ...state, contributions: (state.contributions ?? []).filter(c => c.id !== action.payload) }

    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.payload, ...state.expenses] }
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(e => e.id === action.payload.id ? { ...e, ...action.payload } : e),
      }
    case 'DELETE_EXPENSE':
      return { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) }

    case 'ADD_ITINERARY_ITEM':
      return { ...state, itinerary: [...state.itinerary, action.payload] }
    case 'UPDATE_ITINERARY_ITEM':
      return {
        ...state,
        itinerary: state.itinerary.map(i => i.id === action.payload.id ? { ...i, ...action.payload } : i),
      }
    case 'REMOVE_ITINERARY_ITEM':
      return { ...state, itinerary: state.itinerary.filter(i => i.id !== action.payload) }

    case 'SET_CATEGORY_CAP': {
      const caps = { ...state.categoryCaps }
      if (action.payload.amount == null) {
        delete caps[action.payload.category]
      } else {
        caps[action.payload.category] = action.payload.amount
      }
      return { ...state, categoryCaps: caps }
    }

    case 'SET_MONTHLY_BUDGET':
      return { ...state, monthlyBudget: action.payload }

    case 'SET_CASH_FLOAT':
      return { ...state, cashFloat: action.payload }

    case 'TOGGLE_CHECKLIST_ITEM':
      return {
        ...state,
        checklist: (state.checklist ?? []).map(i =>
          i.id === action.payload ? { ...i, done: !i.done } : i
        ),
      }
    case 'ADD_CHECKLIST_ITEM':
      return { ...state, checklist: [...(state.checklist ?? []), action.payload] }
    case 'UPDATE_CHECKLIST_ITEM':
      return {
        ...state,
        checklist: (state.checklist ?? []).map(i =>
          i.id === action.payload.id ? { ...i, ...action.payload } : i
        ),
      }
    case 'REMOVE_CHECKLIST_ITEM':
      return { ...state, checklist: (state.checklist ?? []).filter(i => i.id !== action.payload) }

    case 'ADD_DOC':
      return { ...state, docs: [...(state.docs ?? []), action.payload] }
    case 'UPDATE_DOC':
      return {
        ...state,
        docs: (state.docs ?? []).map(d => d.id === action.payload.id ? { ...d, ...action.payload } : d),
      }
    case 'REMOVE_DOC':
      return { ...state, docs: (state.docs ?? []).filter(d => d.id !== action.payload) }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

const TripContext = createContext(null)

export function TripProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, load)
  const { user }  = useAuth()
  const userId    = user?.id ?? null
  const syncingRef = useRef(false)

  // Always-current snapshot of state for async callbacks
  const latestStateRef = useRef(state)
  useEffect(() => { latestStateRef.current = state })

  // Persist to localStorage on every state change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Reset sync guard on sign-out so it re-runs when the user signs back in
  useEffect(() => {
    if (!userId) syncingRef.current = false
  }, [userId])

  // Load trip from Supabase when the user signs in
  useEffect(() => {
    if (!supabase || !userId) return
    // Capture local members before async call so we can re-sync if DB is empty
    const localMembers = (latestStateRef.current.members ?? []).filter(m => m.status === 'confirmed')
    loadUserTrip(userId).then(async dbState => {
      if (!dbState) return
      dispatch({ type: 'LOAD_FROM_DB', payload: dbState })
      // Re-sync members if DB returned none (e.g. original insert failed before migration)
      if (dbState.members.length === 0 && localMembers.length > 0) {
        await Promise.all(localMembers.map(m =>
          syncMemberAction({ type: 'ADD_MEMBER', payload: m }, dbState.tripDbId)
        ))
        const refreshed = await loadUserTrip(userId)
        if (refreshed) dispatch({ type: 'LOAD_FROM_DB', payload: refreshed })
      }
    })
  }, [userId])

  // Create trip in Supabase when setup completes (or after migration from localStorage-only)
  useEffect(() => {
    if (!supabase || !userId || !state.setupComplete || state.tripDbId || syncingRef.current) return
    syncingRef.current = true
    createTrip(userId, state).then(async tripId => {
      syncingRef.current = false
      if (!tripId) return
      const dbState = await loadUserTrip(userId)
      if (dbState) dispatch({ type: 'LOAD_FROM_DB', payload: dbState })
      else dispatch({ type: 'SET_TRIP_DB_ID', payload: tripId })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.setupComplete, state.tripDbId, userId])

  // Realtime subscription — live updates from other members
  useEffect(() => {
    if (!supabase || !state.tripDbId) return
    const tripId = state.tripDbId

    const channel = supabase
      .channel(`trip:${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `trip_id=eq.${tripId}` },
        ({ eventType, new: row, old }) => {
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            dispatch({ type: 'UPSERT_EXPENSE', payload: expToLocal(row) })
          } else if (eventType === 'DELETE') {
            dispatch({ type: 'DELETE_EXPENSE', payload: old.id })
          }
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${tripId}` },
        ({ eventType, new: row, old }) => {
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            dispatch({ type: 'UPSERT_MEMBER', payload: memberToLocal(row) })
          } else if (eventType === 'DELETE') {
            dispatch({ type: 'REMOVE_MEMBER', payload: old.id })
          }
        })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [state.tripDbId])

  // Flush offline queue whenever connection is restored
  useEffect(() => {
    if (!userId) return
    function handleOnline() { flushQueue() }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [userId])

  // Wrapped dispatch: updates local state immediately, then syncs to Supabase in background
  const safeDispatch = useCallback((action) => {
    dispatch(action)
    if (!supabase || !userId) return
    const tripId = state.tripDbId
    const isExpense = ['ADD_EXPENSE', 'UPDATE_EXPENSE', 'DELETE_EXPENSE'].includes(action.type)
    const isMember  = ['ADD_MEMBER',  'UPDATE_MEMBER',  'REMOVE_MEMBER' ].includes(action.type)

    if (isExpense || isMember) {
      if (!navigator.onLine) { enqueueAction(action, tripId); return }
      if (isExpense) syncExpenseAction(action, tripId)
      else           syncMemberAction(action, tripId)
    } else if (action.type === 'ADD_CONTRIBUTION' || action.type === 'REMOVE_CONTRIBUTION') {
      if (!navigator.onLine) return
      const s = latestStateRef.current
      const current = s.contributions ?? []
      const newContributions = action.type === 'ADD_CONTRIBUTION'
        ? [...current, action.payload]
        : current.filter(c => c.id !== action.payload)
      syncTripSettings(tripId, {
        destination:      s.trip.destination,
        transportMode:    s.trip.transportMode,
        sgrCostPerPerson: s.trip.sgrCostPerPerson,
        carTotalCost:     s.trip.carTotalCost,
        carType:          s.trip.carType,
        groupSize:        s.groupSize,
        monthlyBudget:    s.monthlyBudget,
        cashFloat:        s.cashFloat,
        categoryCaps:     s.categoryCaps,
        contributions:    newContributions,
      })
    }
  }, [state.tripDbId, userId])

  const computed = useMemo(() => {
    const { trip, members, expenses, committedCosts, categoryCaps: _categoryCaps } = state

    const confirmedMembers = members.filter(m => m.status === 'confirmed')
    const memberCount = confirmedMembers.length > 0 ? confirmedMembers.length : (state.groupSize ?? 1)

    const start = parseISO(trip.startDate)
    const end = parseISO(trip.endDate)
    const tripDays = differenceInCalendarDays(end, start) + 1

    const totalBudget = confirmedMembers.length > 0
      ? confirmedMembers.reduce((sum, m) => sum + (m.budget ?? trip.budgetPerPerson), 0)
      : trip.budgetPerPerson * memberCount
    const dailyBudgetPerPerson = confirmedMembers.length > 0
      ? (totalBudget / confirmedMembers.length) / tripDays
      : trip.budgetPerPerson / tripDays
    const dailyBudget = totalBudget / tripDays

    const pendingExpenses = expenses.filter(e => e.status === 'pending')
    const tripExpenses = expenses.filter(e => !e.isPreTrip && e.status !== 'pending')
    const preTrip = expenses.filter(e => e.isPreTrip && e.status !== 'pending')
    const totalSpent = tripExpenses.reduce((sum, e) => sum + e.amount, 0)
    const totalRemaining = totalBudget - totalSpent
    const spentPercent = totalBudget > 0 ? totalSpent / totalBudget : 0

    const staticCommitted = committedCosts
      .filter(c => c.id !== 'sgr-tickets')
      .reduce((sum, c) => sum + (c.perPerson ? c.amount * memberCount : c.amount), 0)
    let transportCommitted = 0
    if (trip.transportMode === 'sgr' && (trip.sgrCostPerPerson ?? 0) > 0) {
      transportCommitted = trip.sgrCostPerPerson * memberCount
    } else if (trip.transportMode === 'car' && (trip.carTotalCost ?? 0) > 0) {
      transportCommitted = trip.carTotalCost
    }
    const committedTotal = staticCommitted + transportCommitted

    const today = format(new Date(), 'yyyy-MM-dd')
    const todayExpenses = tripExpenses.filter(e => e.date === today)
    const todaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0)
    const todayRemaining = dailyBudget - todaySpent

    // Category + per-member share (splitBetween; falls back to all confirmed members)
    const byCategory = {}
    const memberSpending = {}
    const allConfirmedIds = confirmedMembers.map(m => m.id)
    for (const e of tripExpenses) {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
      const splitIds = e.splitBetween?.length > 0 ? e.splitBetween : allConfirmedIds
      if (splitIds.length > 0) {
        if (e.splitMode === 'custom' && e.customSplits) {
          for (const id of splitIds) {
            memberSpending[id] = (memberSpending[id] || 0) + Number(e.customSplits[id] ?? 0)
          }
        } else {
          const share = e.amount / splitIds.length
          for (const id of splitIds) {
            memberSpending[id] = (memberSpending[id] || 0) + share
          }
        }
      }
    }

    // Cash physically put in per member (paidBy on expenses + direct contributions)
    const cashContributed = {}
    for (const m of confirmedMembers) cashContributed[m.id] = 0
    for (const e of tripExpenses) {
      if (e.paidBy && cashContributed[e.paidBy] !== undefined) {
        cashContributed[e.paidBy] += e.amount
      }
    }
    for (const c of (state.contributions ?? [])) {
      if (cashContributed[c.memberId] !== undefined) {
        cashContributed[c.memberId] = (cashContributed[c.memberId] || 0) + c.amount
      }
    }

    // Alert level
    let alertLevel = null
    if (spentPercent >= BUDGET_ALERTS.DANGER) alertLevel = 'danger'
    else if (spentPercent >= BUDGET_ALERTS.WARNING) alertLevel = 'warning'

    // Days remaining
    const today2 = new Date()
    const daysToTrip = differenceInCalendarDays(start, today2)
    const daysSinceStart = differenceInCalendarDays(today2, start)
    const tripDaysRemaining = Math.max(0, tripDays - daysSinceStart)

    // Month context
    let tripAsMonthPercent = null
    if (state.monthlyBudget) {
      tripAsMonthPercent = (trip.budgetPerPerson / state.monthlyBudget) * 100
    }

    return {
      confirmedMembers,
      memberCount,
      tripDays,
      totalBudget,
      dailyBudget,
      dailyBudgetPerPerson,
      totalSpent,
      totalRemaining,
      spentPercent,
      committedTotal,
      flexibleRemaining: totalRemaining - committedTotal,
      todaySpent,
      todayRemaining,
      byCategory,
      memberSpending,
      cashContributed,
      alertLevel,
      daysToTrip,
      tripDaysRemaining,
      tripAsMonthPercent,
      preTripExpenses: preTrip,
      preTripTotal: preTrip.reduce((s, e) => s + e.amount, 0),
      pendingExpenses,
      pendingCount: pendingExpenses.length,
    }
  }, [state])

  // Fire push when budget first crosses 75% or 90%
  const prevAlertRef = useRef(null)
  useEffect(() => {
    const current  = computed.alertLevel
    const previous = prevAlertRef.current
    prevAlertRef.current = current

    if (!current || current === previous || !state.tripDbId) return

    const title = current === 'danger'
      ? `⚠️ ${state.trip.name} — over 90% spent!`
      : `⚡ ${state.trip.name} — 75% of budget used`
    const body = current === 'danger'
      ? `Only KES ${Math.round(computed.totalRemaining).toLocaleString()} remaining. Review spending now.`
      : `Time to review your group spending.`

    triggerBudgetPush(state.tripDbId, title, body)
    saveBudgetMilestone(state.tripDbId, current, Math.round(computed.totalSpent))
  }, [computed.alertLevel, computed.totalRemaining, computed.totalSpent, state.tripDbId, state.trip.name])

  return (
    <TripContext.Provider value={{ state, dispatch: safeDispatch, computed }}>
      {children}
    </TripContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTrip() {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('useTrip must be used within TripProvider')
  return ctx
}

// eslint-disable-next-line react-refresh/only-export-components
export function useActivityById(id) {
  return ACTIVITY_LIBRARY.find(a => a.id === id) ?? null
}
