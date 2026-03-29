import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Athlete, Skill, TemplateCategory } from '../types'

import { defaultTemplates } from '../data/defaultTemplates'
import AthleteCard from '../components/roster/AthleteCard'
import SkillEvaluator from '../components/evaluation/SkillEvaluator'
import { useNavigate } from 'react-router-dom'

interface MetricsSet {
  id: string
  name: string
  categories: TemplateCategory[]
  skills: Skill[]
}

export default function Roster() {
  const { coach } = useAuth()
  const navigate = useNavigate()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [evaluationCounts, setEvaluationCounts] = useState<Record<string, number>>({})
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)
  const [showEvaluation, setShowEvaluation] = useState(false)
  const [showMetricsSelector, setShowMetricsSelector] = useState(false)
  const [metricsSets, setMetricsSets] = useState<MetricsSet[]>([])
  const [selectedMetricsSet, setSelectedMetricsSet] = useState<MetricsSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | 'all' | null>(null)
  
  // Filters
  const [filterCoach, setFilterCoach] = useState<string>('')
  
  // View mode: 'my roster' or 'all athletes'
  const [viewMode, setViewMode] = useState<'my roster' | 'all athletes'>('my roster')
  const [myRosterIds, setMyRosterIds] = useState<Set<string>>(new Set())

  // All skills from all categories (default)
  const allSkills: Skill[] = defaultTemplates.flatMap(t => t.skills)

  useEffect(() => {
    loadData()
  }, [coach])

  async function loadData() {
    if (!coach) {
      setLoading(false)
      return
    }

    // Load ALL athletes (master list for all coaches)
    const { data: athletesData } = await supabase
      .from('athletes')
      .select('*')
      .order('full_name')
    
    if (athletesData) {
      setAthletes(athletesData)
      
      // Fetch evaluation counts for each athlete (for this coach)
      const athleteIds = athletesData.map(a => a.id)
      const { data: evaluationsData } = await supabase
        .from('evaluations')
        .select('athlete_id')
        .eq('coach_id', coach.id)
        .in('athlete_id', athleteIds)
      
      const counts: Record<string, number> = {}
      evaluationsData?.forEach(evaluation => {
        counts[evaluation.athlete_id] = (counts[evaluation.athlete_id] || 0) + 1
      })
      setEvaluationCounts(counts)
    }
    
    // Load this coach's roster selections
    const { data: rosterData } = await supabase
      .from('coach_roster')
      .select('athlete_id')
      .eq('coach_id', coach.id)
    
    if (rosterData) {
      setMyRosterIds(new Set(rosterData.map(r => r.athlete_id)))
    }

    // Load custom metrics sets
    const { data: metricsData } = await supabase
      .from('evaluation_templates')
      .select('*')
      .eq('coach_id', coach.id)
    
    if (metricsData) {
      setMetricsSets(metricsData)
    }

    setLoading(false)
  }

  async function handleSaveEvaluation(
    scores: { skill_id: string; skill_name: string; score: number | null }[], 
    notes: string
  ) {
    if (!coach || !selectedAthlete) return

    const insertData = {
      athlete_id: selectedAthlete.id,
      coach_id: coach.id,
      skill_scores: scores,
      notes
    }

    const { data: evaluationData, error } = await supabase.from('evaluations').insert(insertData).select()

    if (error) {
      alert('Error saving evaluation: ' + error.message)
      return
    }
    
    console.log('Evaluation saved:', evaluationData)
    
    // Create report card for admin review
    if (evaluationData && evaluationData[0]) {
      console.log('Creating report card for evaluation:', evaluationData[0].id)
      const { data: reportCardData, error: reportCardError } = await supabase.from('report_cards').insert({
        evaluation_id: evaluationData[0].id,
        athlete_id: selectedAthlete.id,
        coach_id: coach.id,
        status: 'pending'
      }).select()
      
      if (reportCardError) {
        console.error('Error creating report card:', reportCardError)
        alert('Evaluation saved but report card creation failed: ' + reportCardError.message)
      } else {
        console.log('Report card created:', reportCardData)
      }
    } else {
      console.error('No evaluation data returned after insert')
      alert('Error: Evaluation was not saved properly')
      return
    }
    
    // Refresh evaluation counts
    await loadData()
    
    setSelectedAthlete(null)
    setShowEvaluation(false)
    alert('Evaluation submitted for admin review!')
  }

  async function addToMyRoster(athleteId: string) {
    if (!coach) return
    
    const { error } = await supabase
      .from('coach_roster')
      .insert({ coach_id: coach.id, athlete_id: athleteId })
    
    if (!error) {
      setMyRosterIds(prev => new Set([...prev, athleteId]))
    }
  }

  async function removeFromMyRoster(athleteId: string) {
    if (!coach) return
    
    const { error } = await supabase
      .from('coach_roster')
      .delete()
      .eq('coach_id', coach.id)
      .eq('athlete_id', athleteId)

    if (!error) {
      setMyRosterIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(athleteId)
        return newSet
      })
    }
    setShowDeleteConfirm(null)
  }

  async function deleteAllAthletes() {
    if (!coach) return
    
    // Remove all from coach_athletes
    const { error } = await supabase
      .from('coach_athletes')
      .delete()
      .eq('coach_id', coach.id)

    if (!error) {
      setAthletes([])
    }
    setShowDeleteConfirm(null)
  }


  // Compute unique filter values (from all athletes or just my roster)
  const athletesToFilter = viewMode === 'my roster' 
    ? athletes.filter(a => myRosterIds.has(a.id))
    : athletes
  
  const uniqueCoaches = Array.from(new Set(athletesToFilter.map(a => a.coach_name).filter(Boolean))).sort()

  // Filter athletes
  const filteredAthletes = athletesToFilter.filter(athlete => {
    if (filterCoach && athlete.coach_name !== filterCoach) return false
    return true
  })

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-2 sm:p-4 lg:p-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="py-4 sm:py-6">
          {/* Coach Instructions Panel */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Use This App</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Add the athletes you have coached to your roster from the &quot;All Athletes&quot; tab</li>
              <li>Evaluate them on their performance using the built-in metrics</li>
              <li>Save evaluations to be sent out as report cards for parents to see</li>
            </ul>
          </div>

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {viewMode === 'my roster' ? 'My Roster' : 'All Athletes'}
              </h2>
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('my roster')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'my roster'
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  My Roster ({myRosterIds.size})
                </button>
                <button
                  onClick={() => setViewMode('all athletes')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'all athletes'
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Athletes ({athletes.length})
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {filteredAthletes.length} athletes
              </span>
              {/* Only show Clear All for admins */}
              {coach?.is_admin && viewMode === 'my roster' && myRosterIds.size > 0 && (
                <button 
                  onClick={() => setShowDeleteConfirm('all')}
                  className="py-2 px-4 border border-red-300 text-red-600 rounded hover:bg-red-50"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Filters - Coach only sees Coach filter */}
          {athletes.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coach</label>
                  <select
                    value={filterCoach}
                    onChange={(e) => setFilterCoach(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  >
                    <option value="">Coaches</option>
                    {uniqueCoaches.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {filterCoach && (
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setFilterCoach('')
                      }}
                      className="py-2 px-4 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Clear Filter
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}



          {/* Athletes Grid */}
          {filteredAthletes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow px-4">
              <p className="text-gray-500 mb-4">
                {viewMode === 'my roster' 
                  ? 'No athletes in your roster yet. Switch to "All Athletes" to add some!'
                  : 'No athletes match the selected filters.'}
              </p>
              {viewMode === 'my roster' && athletes.length > 0 && (
                <button
                  onClick={() => setViewMode('all athletes')}
                  className="inline-block py-3 sm:py-2 px-4 bg-blue-600 text-white rounded-lg sm:rounded hover:bg-blue-700"
                >
                  Browse All Athletes
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredAthletes.map(athlete => {
                const evalCount = evaluationCounts[athlete.id] || 0
                const isInMyRoster = myRosterIds.has(athlete.id)
                const stats = [
                  { label: 'Age', value: athlete.date_of_birth ? calculateAge(athlete.date_of_birth) : 'N/A' },
                  { label: 'Evaluations', value: String(evalCount) },
                ]
                // Add group info if available
                if (athlete.mountain) stats.push({ label: 'Mountain', value: athlete.mountain })
                if (athlete.day) stats.push({ label: 'Day', value: athlete.day })
                if (athlete.coach_name) stats.push({ label: 'Coach', value: athlete.coach_name })
                
                return (
                  <div key={athlete.id} className="relative">
                    <AthleteCard
                      id={athlete.id}
                      name={athlete.full_name}
                      stats={stats}
                      onClick={() => {
                        setSelectedAthlete(athlete)
                        setShowMetricsSelector(true)
                      }}
                      onDelete={viewMode === 'my roster' ? () => setShowDeleteConfirm(athlete.id) : undefined}
                    />
                    {/* Add/Remove button for All Athletes view */}
                    {viewMode === 'all athletes' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isInMyRoster) {
                            removeFromMyRoster(athlete.id)
                          } else {
                            addToMyRoster(athlete.id)
                          }
                        }}
                        className={`absolute top-2 right-2 text-xs px-2 py-1 rounded ${
                          isInMyRoster
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {isInMyRoster ? '✓ Added' : '+ Add'}
                      </button>
                    )}
                    {evalCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/evaluations/${athlete.id}`)
                        }}
                        className="absolute top-2 right-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        View
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Metrics Selector Modal */}
      {selectedAthlete && showMetricsSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Evaluate {selectedAthlete.full_name}
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              Choose metrics to evaluate with
            </p>

            <div className="space-y-3 mb-6">
              {/* Default: All Metrics */}
              <button
                onClick={() => {
                  setSelectedMetricsSet(null)
                  setShowMetricsSelector(false)
                  setShowEvaluation(true)
                }}
                className="w-full p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 text-left"
              >
                <h3 className="font-medium text-gray-900">All Metrics</h3>
                <p className="text-sm text-gray-500">{allSkills.length} skills from all categories</p>
              </button>

              {/* Custom Metrics Sets */}
              {metricsSets.map((metricsSet: MetricsSet) => (
                <button
                  key={metricsSet.id}
                  onClick={() => {
                    setSelectedMetricsSet(metricsSet)
                    setShowMetricsSelector(false)
                    setShowEvaluation(true)
                  }}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                >
                  <h3 className="font-medium text-gray-900">{metricsSet.name}</h3>
                  <p className="text-sm text-gray-500">
                    {metricsSet.skills?.length || 0} metrics • {metricsSet.categories?.length || 0} categories
                  </p>
                </button>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowMetricsSelector(false)
                  setSelectedAthlete(null)
                }}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Modal */}
      {selectedAthlete && showEvaluation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="w-full sm:max-w-2xl bg-white rounded-t-lg sm:rounded-lg shadow-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <SkillEvaluator
              athleteId={selectedAthlete.id}
              athleteName={selectedAthlete.full_name}
              skills={selectedMetricsSet?.skills || allSkills}
              categories={selectedMetricsSet?.categories}
              onSave={handleSaveEvaluation}
              onCancel={() => {
                setSelectedAthlete(null)
                setShowEvaluation(false)
                setSelectedMetricsSet(null)
              }}
              onBackToRoster={() => {
                setSelectedAthlete(null)
                setShowEvaluation(false)
                setSelectedMetricsSet(null)
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {showDeleteConfirm === 'all' ? 'Clear All Athletes?' : 'Delete Athlete?'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {showDeleteConfirm === 'all' 
                ? `This will permanently delete all ${athletes.length} athletes from your roster.` 
                : 'This will permanently delete this athlete from your roster.'}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showDeleteConfirm === 'all') {
                    deleteAllAthletes()
                  } else {
                    removeFromMyRoster(showDeleteConfirm)
                  }
                }}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
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
