import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import type { Athlete } from '../types'

export default function AddAthletes() {
  const { coach } = useAuth()
  const navigate = useNavigate()
  const [availableAthletes, setAvailableAthletes] = useState<Athlete[]>([])
  const [myAthletes, setMyAthletes] = useState<Athlete[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [coach])

  async function loadData() {
    if (!coach) {
      setLoading(false)
      return
    }

    // Load all athletes (pool)
    const { data: allAthletes } = await supabase
      .from('athletes')
      .select('*')
      .order('full_name')

    // Load my current roster
    const { data: myRoster } = await supabase
      .from('coach_athletes')
      .select('athlete_id')
      .eq('coach_id', coach.id)

    const myAthleteIds = new Set(myRoster?.map(r => r.athlete_id) || [])
    
    // Filter out athletes already on my roster
    const available = (allAthletes || []).filter(a => !myAthleteIds.has(a.id))
    
    setAvailableAthletes(available)
    setMyAthletes((allAthletes || []).filter(a => myAthleteIds.has(a.id)))
    setLoading(false)
  }

  function toggleSelection(athleteId: string) {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(athleteId)) {
        newSet.delete(athleteId)
      } else {
        newSet.add(athleteId)
      }
      return newSet
    })
  }

  async function addToMyRoster() {
    if (!coach || selectedIds.size === 0) return

    const entries = Array.from(selectedIds).map(athleteId => ({
      coach_id: coach.id,
      athlete_id: athleteId
    }))

    const { error } = await supabase.from('coach_athletes').insert(entries)

    if (!error) {
      navigate('/roster')
    } else {
      alert('Error adding athletes: ' + error.message)
    }
  }

  const filteredAthletes = availableAthletes.filter(athlete =>
    athlete.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Athletes to Roster</h2>
            <p className="text-gray-500 text-sm mt-1">
              Select up to 10 athletes for your roster
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {myAthletes.length} on roster
            </span>
            <button
              onClick={() => navigate('/roster')}
              className="py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search athletes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Selection Info */}
        {selectedIds.size > 0 && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
            <span className="text-blue-800">
              {selectedIds.size} athlete{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={addToMyRoster}
              className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add to My Roster
            </button>
          </div>
        )}

        {/* Athletes Grid */}
        {filteredAthletes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">
              {searchTerm ? 'No athletes match your search.' : 'No available athletes to add.'}
            </p>
            <button
              onClick={() => navigate('/import')}
              className="mt-4 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Import New Athletes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAthletes.map(athlete => {
              const isSelected = selectedIds.has(athlete.id)
              return (
                <div
                  key={athlete.id}
                  onClick={() => toggleSelection(athlete.id)}
                  className={`bg-white rounded-lg shadow cursor-pointer overflow-hidden transition-all ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center p-4">
                    <div className="flex-shrink-0">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {isSelected ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-xl">{athlete.full_name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-base font-medium text-gray-900">{athlete.full_name}</h3>
                      <p className="text-sm text-gray-500">
                        {athlete.date_of_birth ? calculateAge(athlete.date_of_birth) + ' years old' : 'Age unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function calculateAge(dateOfBirth: string): string {
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age.toString()
}
