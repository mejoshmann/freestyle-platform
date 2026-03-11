import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Coach } from '../types'

interface AuthContextType {
  coach: Coach | null
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [coach, setCoach] = useState<Coach | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchCoach(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchCoach(session.user.id)
      } else {
        setCoach(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchCoach(userId: string) {
    const { data } = await supabase
      .from('coaches')
      .select('*')
      .eq('id', userId)
      .single()
    setCoach(data)
  }

  async function signUp(email: string, password: string, fullName: string) {
    // Sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })
    if (signUpError) throw signUpError

    // If signup succeeded, immediately sign in to get an authenticated session
    if (signUpData.user) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (signInError) {
        console.error('Auto sign-in failed:', signInError)
        // Don't throw - user was created, they can manually sign in
        return
      }
      
      // Now we're authenticated, create the coach record
      const { error: coachError } = await supabase
        .from('coaches')
        .upsert({
          id: signUpData.user.id,
          email,
          full_name: fullName,
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
      
      if (coachError) {
        console.error('Failed to create coach record:', coachError)
        // Don't throw - user can still use the app
      }
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    setCoach(null)
  }

  return (
    <AuthContext.Provider value={{ coach, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
