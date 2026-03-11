import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { coach, signOut } = useAuth()

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">Freestyle Vancouver</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{coach?.full_name}</span>
            <button
              onClick={signOut}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
