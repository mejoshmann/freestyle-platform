import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import MediaGallery from '../components/media/MediaGallery'
import type { Athlete } from '../types'

interface Evaluation {
  id: string
  athlete_id: string
  coach_id: string
  skill_scores: { skill_id: string; skill_name: string; score: number | null }[]
  notes: string
  created_at: string
}

export default function Evaluations() {
  const { athleteId } = useParams<{ athleteId: string }>()
  const { coach } = useAuth()
  const navigate = useNavigate()
  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [athleteId, coach])

  async function loadData() {
    if (!coach || !athleteId) {
      setLoading(false)
      return
    }



    // Load athlete details
    const { data: athleteData } = await supabase
      .from('athletes')
      .select('*')
      .eq('id', athleteId)
      .single()


    if (athleteData) setAthlete(athleteData)

    // Load evaluations
    const { data: evaluationsData } = await supabase
      .from('evaluations')
      .select('*')
      .eq('athlete_id', athleteId)
      .eq('coach_id', coach.id)


    if (evaluationsData) setEvaluations(evaluationsData)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  if (!athlete) {
    return (
      <div className="p-8">
        <div className="text-center py-8 text-gray-500">Athlete not found</div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{athlete.full_name}</h2>
            <p className="text-gray-500 text-sm">
              {evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/roster')}
              className="py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Back to Roster
            </button>
          </div>
        </div>

        {/* Media Gallery */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Media Gallery</h3>
          <MediaGallery athleteId={athleteId!} isCoach={true} />
        </div>

        {/* Evaluations List */}
        {evaluations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No evaluations yet.</p>
            <button
              onClick={() => navigate('/roster')}
              className="mt-4 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Evaluation
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {evaluations.map((evaluation, index) => (
              <div key={evaluation.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Evaluation #{evaluations.length - index}
                  </h3>
                  {evaluation.created_at && (
                    <span className="text-sm text-gray-500">
                      {new Date(evaluation.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>

                {/* Skill Scores */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Skill Scores</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {evaluation.skill_scores?.filter((s: any) => s.score !== null).map((skill: any) => (
                      <div key={skill.skill_id} className="flex justify-between bg-gray-50 rounded px-3 py-2">
                        <span className="text-sm text-gray-600 truncate mr-2">{skill.skill_name}</span>
                        <span className="text-sm font-medium text-blue-600">{skill.score}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {evaluation.notes && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">{evaluation.notes}</p>
                  </div>
                )}

                {/* Report Card Button */}
                <button
                  onClick={() => alert('Report card generation coming soon!')}
                  className="w-full py-2 px-4 border border-blue-300 text-blue-600 rounded hover:bg-blue-50"
                >
                  Generate Report Card
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
