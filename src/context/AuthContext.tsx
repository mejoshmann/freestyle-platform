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
        fetchCoach(session.user.id, session.user.email, session.user.user_metadata?.full_name)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchCoach(session.user.id, session.user.email, session.user.user_metadata?.full_name)
      } else {
        setCoach(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchCoach(userId: string, email?: string, fullName?: string) {
    const { data, error } = await supabase
      .from('coaches')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (data) {
      setCoach(data)
    } else if (email && (error?.code === 'PGRST116' || !data)) {
      // Coach record doesn't exist (PGRST116 = no rows returned), create it
      await createCoachRecordIfNeeded(userId, email, fullName || email)
      // Fetch again
      const { data: newData } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', userId)
        .single()
      if (newData) setCoach(newData)
    }
  }

  async function signUp(email: string, password: string, fullName: string) {
    // Sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })
    if (signUpError) throw signUpError

    // Store full name in localStorage for later use (in case email confirmation is needed)
    if (signUpData.user) {
      localStorage.setItem('pendingCoachName', fullName)
      localStorage.setItem('pendingCoachEmail', email)
    }
  }

  async function createCoachRecordIfNeeded(userId: string, email: string, fullName: string) {
    // Check if coach record exists (use maybeSingle to avoid 406 error)
    const { data: existingCoach } = await supabase
      .from('coaches')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    
    if (existingCoach) return // Already exists
    
    // Create the coach record
    const { error: coachError } = await supabase
      .from('coaches')
      .upsert({
        id: userId,
        email,
        full_name: fullName,
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
    
    if (coachError) {
      console.error('Failed to create coach record:', coachError)
    } else {
      // Clear pending data
      localStorage.removeItem('pendingCoachName')
      localStorage.removeItem('pendingCoachEmail')
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    
    // After successful sign in, create coach record if needed
    if (data.user) {
      const pendingName = localStorage.getItem('pendingCoachName') || data.user.user_metadata?.full_name || email
      const pendingEmail = localStorage.getItem('pendingCoachEmail') || email
      await createCoachRecordIfNeeded(data.user.id, pendingEmail, pendingName)
    }
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
