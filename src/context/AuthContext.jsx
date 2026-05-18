import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading, null = signed out

  useEffect(() => {
    if (!supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSession(null)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => setSession(session ?? null))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithPassword(email, password) {
    if (!supabase) return { error: new Error('Supabase not configured') }
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signUpWithPassword(email, password) {
    if (!supabase) return { error: new Error('Supabase not configured') }
    return supabase.auth.signUp({ email, password })
  }

  async function signInWithGoogle() {
    if (!supabase) return { error: new Error('Supabase not configured') }
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
