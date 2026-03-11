import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AuthCard from '../components/auth/AuthCard'
import SignInForm from '../components/auth/SignInForm'
import SignUpForm from '../components/auth/SignUpForm'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const { signIn, signUp } = useAuth()

  async function handleSignIn(email: string, password: string) {
    setError('')
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  async function handleSignUp(email: string, password: string, fullName: string) {
    setError('')
    try {
      await signUp(email, password, fullName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const toggleMode = (
    <button
      onClick={() => setIsSignUp(!isSignUp)}
      className="text-blue-600 hover:text-blue-500"
    >
      {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
    </button>
  )

  return (
    <AuthCard
      title={isSignUp ? 'Create Account' : 'Sign In'}
      footer={toggleMode}
    >
      {isSignUp ? (
        <SignUpForm onSubmit={handleSignUp} error={error} />
      ) : (
        <SignInForm onSubmit={handleSignIn} error={error} />
      )}
    </AuthCard>
  )
}
