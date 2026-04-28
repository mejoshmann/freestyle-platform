import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar() {
  const { coach, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const navItems = [
    { path: '/', label: 'Home', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" /></svg> },
    { path: '/roster', label: 'Roster', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    ...(coach?.is_admin ? [{ path: '/admin', label: 'Admin', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> }] : []),
  ]

  const bottomNavItems = [
    { path: '/settings', label: 'Settings', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ]

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-freestyle-red shadow-lg z-50">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-bold text-white">Freestyle Coach Platform</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-white/10 text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="bg-white border-t border-gray-100 px-4 py-2 shadow-lg">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-freestyle-red/10 text-freestyle-red font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
            {bottomNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-freestyle-red/10 text-freestyle-red font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
            <button
              onClick={signOut}
              className="w-full mt-2 py-3 px-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              Sign Out
            </button>
            <button
              onClick={() => { setShowHelp(true); setMobileMenuOpen(false) }}
              className="w-full mt-1 py-3 px-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg flex items-center"
            >
              <span className="mr-3"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
              Help
            </button>
          </nav>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-gray-900 flex-col h-screen">
        {/* Logo/Header */}
        <div className="p-6 border-b border-freestyle-red/30">
          <h1 className="text-xl font-bold text-white">Freestyle Coach Platform</h1>
          <p className="text-sm text-gray-400 mt-1">Coach Portal</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-freestyle-red/20 text-freestyle-red font-medium'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          <div className="pt-4 mt-4 border-t border-gray-700">
            {bottomNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-freestyle-red/20 text-freestyle-red font-medium'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center mb-4">
            <div className="h-10 w-10 rounded-full bg-freestyle-red/20 flex items-center justify-center">
              <span className="text-freestyle-red font-medium">
                {coach?.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-200">{coach?.full_name}</p>
              <p className="text-xs text-gray-400">{coach?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full py-2 px-4 border border-gray-600 text-gray-300 rounded hover:bg-gray-800 text-sm"
          >
            Sign Out
          </button>
          <button
            onClick={() => setShowHelp(true)}
            className="w-full mt-2 py-2 px-4 text-gray-400 hover:text-gray-200 text-sm flex items-center justify-center"
          >
            <span className="mr-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
            Help
          </button>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">How to Use This App</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <ul className="text-sm text-gray-700 space-y-3">
              <li className="flex items-start">
                <span className="mr-2 mt-0.5">1.</span>
                <span>Add the athletes you have coached to your roster from the "All Athletes" tab</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5">2.</span>
                <span>Evaluate them on their performance using the built-in metrics</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5">3.</span>
                <span>Upload photos and videos during evaluations or from the roster</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-0.5">4.</span>
                <span>Save evaluations to be sent out as report cards for parents to see</span>
              </li>
            </ul>
            <button
              onClick={() => setShowHelp(false)}
              className="w-full mt-6 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  )
}
