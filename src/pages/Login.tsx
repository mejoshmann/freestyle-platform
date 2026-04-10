import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import SignInForm from '../components/auth/SignInForm'
import SignUpForm from '../components/auth/SignUpForm'
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm'

type AuthMode = 'signIn' | 'signUp' | 'forgotPassword'

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('signIn')
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

  function handleForgotPassword() {
    setMode('forgotPassword')
    setError('')
  }

  function handleBackToSignIn() {
    setMode('signIn')
    setError('')
  }

  function toggleSignUpMode() {
    setMode(mode === 'signIn' ? 'signUp' : 'signIn')
    setError('')
  }

  const getTitle = () => {
    switch (mode) {
      case 'signUp':
        return 'Create Account'
      case 'forgotPassword':
        return 'Reset Password'
      default:
        return 'Sign In'
    }
  }

  const footerButton = mode !== 'forgotPassword' && (
    <button
      onClick={toggleSignUpMode}
      className="text-blue-600 hover:text-blue-500"
    >
      {mode === 'signUp' ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
    </button>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Logo and Title */}
      <div className="flex flex-col items-center mb-4">
        <img 
          src="/logo.png" 
          alt="Freestyle Vancouver" 
          className="h-30 w-auto mb-1"
        />
        <h1 className="text-2xl font-bold text-gray-900">Freestyle Athlete Evaluation</h1>
      </div>
      
      {/* Auth Card - No grey background */}
      <div className="w-full max-w-md space-y-6 p-6 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">{getTitle()}</h2>
        {mode === 'signUp' ? (
          <SignUpForm onSubmit={handleSignUp} error={error} />
        ) : mode === 'forgotPassword' ? (
          <ForgotPasswordForm onBackToSignIn={handleBackToSignIn} />
        ) : (
          <SignInForm onSubmit={handleSignIn} error={error} onForgotPassword={handleForgotPassword} />
        )}
        <div className="text-center">{footerButton}</div>
      </div>
    </div>
  )
}
