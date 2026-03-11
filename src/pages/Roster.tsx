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

    // Load athletes through coach_athletes join table
    const { data: coachAthletes } = await supabase
      .from('coach_athletes')
      .select('athlete_id')
      .eq('coach_id', coach.id)

    if (coachAthletes && coachAthletes.length > 0) {
      const athleteIds = coachAthletes.map(ca => ca.athlete_id)
      const { data: athletesData } = await supabase
        .from('athletes')
        .select('*')
        .in('id', athleteIds)
        .order('full_name')
      
      if (athletesData) {
        setAthletes(athletesData)
        
        // Fetch evaluation counts for each athlete
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
    } else {
      setAthletes([])
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
    notes: string,
    voiceNotes?: string[]
  ) {
    if (!coach || !selectedAthlete) return

    const insertData: any = {
      athlete_id: selectedAthlete.id,
      coach_id: coach.id,
      skill_scores: scores,
      notes
    }
    
    // Only add voice_notes if the column exists
    // TODO: Add voice_notes column to evaluations table
    // if (voiceNotes && voiceNotes.length > 0) insertData.voice_notes = voiceNotes

    const { data, error } = await supabase.from('evaluations').insert(insertData).select()

    if (error) {
      alert('Error saving evaluation: ' + error.message)
      return
    }
    
    // Refresh evaluation counts
    await loadData()
    
    setSelectedAthlete(null)
    setShowEvaluation(false)
    alert('Evaluation saved successfully!')
  }

  async function deleteAthlete(athleteId: string) {
    if (!coach) return
    
    // Remove from coach_athletes (not delete the athlete)
    const { error } = await supabase
      .from('coach_athletes')
      .delete()
      .eq('coach_id', coach.id)
      .eq('athlete_id', athleteId)

    if (!error) {
      setAthletes(prev => prev.filter(a => a.id !== athleteId))
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


  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Roster</h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {athletes.length} athletes
              </span>
              {athletes.length > 0 && (
                <button 
                  onClick={() => setShowDeleteConfirm('all')}
                  className="py-2 px-4 border border-red-300 text-red-600 rounded hover:bg-red-50"
                >
                  Clear All
                </button>
              )}
              <button 
                onClick={() => navigate('/add-athletes')}
                className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
              >
                + Add Athletes
              </button>
              <button 
                onClick={() => navigate('/import')}
                className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Import
              </button>
            </div>
          </div>



          {/* Athletes Grid */}
          {athletes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow px-4">
              <p className="text-gray-500 mb-4">No athletes in your roster yet.</p>
              <button
                onClick={() => navigate('/import')}
                className="inline-block py-3 sm:py-2 px-4 bg-blue-600 text-white rounded-lg sm:rounded hover:bg-blue-700"
              >
                Import Athletes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {athletes.map(athlete => {
                const evalCount = evaluationCounts[athlete.id] || 0
                return (
                  <div key={athlete.id} className="relative">
                    <AthleteCard
                      id={athlete.id}
                      name={athlete.full_name}
                      stats={[
                        { label: 'Age', value: athlete.date_of_birth ? calculateAge(athlete.date_of_birth) : 'N/A' },
                        { label: 'Evaluations', value: String(evalCount) },
                      ]}
                      onClick={() => {
                        setSelectedAthlete(athlete)
                        setShowMetricsSelector(true)
                      }}
                      onDelete={() => setShowDeleteConfirm(athlete.id)}
                    />
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
              <button
                onClick={() => navigate('/metrics/build')}
                className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
              >
                + New Metrics
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
                    deleteAthlete(showDeleteConfirm)
                  }
                }}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
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
