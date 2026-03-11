import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CSVImport from '../components/import/CSVImport'
import type { Athlete, Coach } from '../types'

export default function AdminPanel() {
  const { coach } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'athletes' | 'coaches' | 'import'>('import')
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!coach?.is_admin) {
      navigate('/')
      return
    }
    loadData()
  }, [coach, navigate])

  async function loadData() {
    setLoading(true)
    
    // Load all athletes
    const { data: athletesData } = await supabase
      .from('athletes')
      .select('*')
      .order('full_name')
    
    if (athletesData) setAthletes(athletesData)

    // Load all coaches
    const { data: coachesData } = await supabase
      .from('coaches')
      .select('*')
      .order('full_name')
    
    if (coachesData) setCoaches(coachesData)
    
    setLoading(false)
  }

  async function toggleAdminStatus(coachId: string, currentStatus: boolean) {
    await supabase
      .from('coaches')
      .update({ is_admin: !currentStatus })
      .eq('id', coachId)
    
    loadData()
  }

  async function deleteAthlete(athleteId: string) {
    if (!confirm('Are you sure you want to delete this athlete?')) return
    
    await supabase.from('athletes').delete().eq('id', athleteId)
    loadData()
  }

  function toggleAthleteSelection(athleteId: string) {
    const newSelected = new Set(selectedAthletes)
    if (newSelected.has(athleteId)) {
      newSelected.delete(athleteId)
    } else {
      newSelected.add(athleteId)
    }
    setSelectedAthletes(newSelected)
  }

  function selectAllAthletes() {
    if (selectedAthletes.size === athletes.length) {
      setSelectedAthletes(new Set())
    } else {
      setSelectedAthletes(new Set(athletes.map(a => a.id)))
    }
  }

  async function deleteSelectedAthletes() {
    if (selectedAthletes.size === 0) return
    
    const { error } = await supabase
      .from('athletes')
      .delete()
      .in('id', Array.from(selectedAthletes))
    
    if (error) {
      alert('Error deleting athletes: ' + error.message)
    } else {
      setSelectedAthletes(new Set())
      setShowDeleteConfirm(false)
      loadData()
    }
  }

  if (!coach?.is_admin) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-gray-600 mt-2">You do not have admin privileges.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-gray-500 mb-6">Manage athletes, coaches, and system settings</p>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('import')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Import Athletes
            </button>
            <button
              onClick={() => setActiveTab('athletes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'athletes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All Athletes ({athletes.length})
            </button>
            <button
              onClick={() => setActiveTab('coaches')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'coaches'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Coaches ({coaches.length})
            </button>
          </nav>
        </div>

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">Admin Import Only</h3>
              <p className="text-sm text-blue-700">
                This is the only place to import athletes. All coaches will see the imported athletes in their roster.
              </p>
            </div>
            <CSVImport 
              onImportComplete={() => {
                loadData()
                setActiveTab('athletes')
              }}
              onCancel={() => {}}
            />
          </div>
        )}

        {/* Athletes Tab */}
        {activeTab === 'athletes' && (
          <div>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : athletes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No athletes in the system yet.</p>
                <button
                  onClick={() => setActiveTab('import')}
                  className="mt-4 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Import Athletes
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Bulk Actions Bar */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAthletes.size === athletes.length && athletes.length > 0}
                        onChange={selectAllAthletes}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">
                        {selectedAthletes.size === 0 
                          ? 'Select All' 
                          : `${selectedAthletes.size} selected`}
                      </span>
                    </label>
                  </div>
                  {selectedAthletes.size > 0 && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="py-1.5 px-4 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Delete Selected
                    </button>
                  )}
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Birth</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {athletes.map((athlete) => (
                      <tr key={athlete.id} className={selectedAthletes.has(athlete.id) ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedAthletes.has(athlete.id)}
                            onChange={() => toggleAthleteSelection(athlete.id)}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {athlete.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {athlete.email || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {athlete.date_of_birth || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => deleteAthlete(athlete.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Coaches Tab */}
        {activeTab === 'coaches' && (
          <div>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {coaches.map((c) => (
                      <tr key={c.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {c.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {c.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => toggleAdminStatus(c.id, c.is_admin || false)}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              c.is_admin
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {c.is_admin ? 'Yes' : 'No'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Delete</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete {selectedAthletes.size} athlete{selectedAthletes.size !== 1 ? 's' : ''}? 
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="py-2 px-4 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteSelectedAthletes}
                  className="py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
