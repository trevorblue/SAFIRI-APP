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
  expToLocal,
  memberToLocal,
} from '../lib/db'

const STORAGE_KEY = 'safiri_v1'

const initialState = {
  setupComplete: false,
  tripDbId: null,
  groupSize: 1,
  trip: DEFAULT_TRIP,
  members: [],
  expenses: [],
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

  // Persist to localStorage on every state change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Load trip from Supabase when the user signs in
  useEffect(() => {
    if (!supabase || !userId) return
    loadUserTrip(userId).then(dbState => {
      if (dbState) dispatch({ type: 'LOAD_FROM_DB', payload: dbState })
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

  // Wrapped dispatch: updates local state immediately, then syncs to Supabase in background
  const safeDispatch = useCallback((action) => {
    dispatch(action)
    if (!supabase || !userId) return
    const tripId = state.tripDbId
    if (['ADD_EXPENSE', 'UPDATE_EXPENSE', 'DELETE_EXPENSE'].includes(action.type)) {
      syncExpenseAction(action, tripId)
    } else if (['ADD_MEMBER', 'UPDATE_MEMBER', 'REMOVE_MEMBER'].includes(action.type)) {
      syncMemberAction(action, tripId)
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

    const tripExpenses = expenses.filter(e => !e.isPreTrip)
    const preTrip = expenses.filter(e => e.isPreTrip)
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

    // Category + per-member spending
    const byCategory = {}
    const memberSpending = {}
    for (const e of tripExpenses) {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
      if (e.paidBy) memberSpending[e.paidBy] = (memberSpending[e.paidBy] || 0) + e.amount
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
      alertLevel,
      daysToTrip,
      tripDaysRemaining,
      tripAsMonthPercent,
      preTripExpenses: preTrip,
      preTripTotal: preTrip.reduce((s, e) => s + e.amount, 0),
    }
  }, [state])

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
