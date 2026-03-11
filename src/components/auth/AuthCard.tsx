import type { ReactNode } from 'react'

interface AuthCardProps {
  title: string
  children: ReactNode
  footer: ReactNode
}

export default function AuthCard({ title, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">{title}</h2>
        {children}
        <div className="text-center">{footer}</div>
      </div>
    </div>
  )
}
