import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CSVImport from '../components/import/CSVImport'
import { generateReportCardPDF } from '../components/report/ReportCardPDF'
import { sendReportCardEmail } from '../lib/email'
import type { Athlete, Coach } from '../types'

interface ReportCard {
  id: string
  evaluation_id: string
  athlete_id: string
  coach_id: string
  status: 'pending' | 'approved' | 'rejected' | 'sent'
  admin_notes?: string
  sent_to_parents: boolean
  sent_at?: string
  created_at: string
  athlete_name?: string
  coach_name?: string
}

export default function AdminPanel() {
  const { coach } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'athletes' | 'coaches' | 'import' | 'report-cards' | 'evaluations'>('import')
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedReportCard, setSelectedReportCard] = useState<ReportCard | null>(null)
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [editableScores, setEditableScores] = useState<any[]>([])
  const [editableNotes, setEditableNotes] = useState('')
  const [previewReportCard, setPreviewReportCard] = useState<ReportCard | null>(null)
  const [previewEvaluation, setPreviewEvaluation] = useState<any>(null)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)

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
    
    // Load report cards for review
    const { data: reportCardsData } = await supabase
      .from('report_cards')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (reportCardsData) {
      // Enrich with athlete and coach names
      const enrichedReportCards = reportCardsData.map((rc: ReportCard) => ({
        ...rc,
        athlete_name: athletesData?.find(a => a.id === rc.athlete_id)?.full_name || 'Unknown',
        coach_name: coachesData?.find(c => c.id === rc.coach_id)?.full_name || 'Unknown'
      }))
      setReportCards(enrichedReportCards)
    }
    
    // Load all evaluations
    const { data: evaluationsData } = await supabase
      .from('evaluations')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (evaluationsData) {
      // Enrich with athlete and coach names
      const enrichedEvaluations = evaluationsData.map((ev: any) => ({
        ...ev,
        athlete_name: athletesData?.find(a => a.id === ev.athlete_id)?.full_name || 'Unknown',
        coach_name: coachesData?.find(c => c.id === ev.coach_id)?.full_name || 'Unknown'
      }))
      setEvaluations(enrichedEvaluations)
    }
    
    setLoading(false)
  }

  async function approveReportCard(reportCardId: string) {
    await supabase
      .from('report_cards')
      .update({ 
        status: 'approved',
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportCardId)
    
    setSelectedReportCard(null)
    setAdminNotes('')
    loadData()
  }

  async function rejectReportCard(reportCardId: string) {
    await supabase
      .from('report_cards')
      .update({ 
        status: 'rejected',
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportCardId)
    
    setSelectedReportCard(null)
    setAdminNotes('')
    loadData()
  }

  async function sendReportCard(reportCardId: string) {
    // Fetch the report card with evaluation details
    const { data: reportCard } = await supabase
      .from('report_cards')
      .select('*, evaluation:evaluation_id(*)')
      .eq('id', reportCardId)
      .single()
    
    if (!reportCard) {
      alert('Report card not found')
      return
    }

    // Get athlete details
    const athlete = athletes.find(a => a.id === reportCard.athlete_id)
    const coach = coaches.find(c => c.id === reportCard.coach_id)
    
    if (!athlete || !coach) {
      alert('Athlete or coach information not found')
      return
    }

    // Check if athlete has parent email
    const parentEmail = athlete.metadata?.parent_email || athlete.email
    if (!parentEmail) {
      alert('No parent email on file for this athlete. Please add a parent email before sending.')
      return
    }

    // Generate PDF as base64
    const pdfBase64 = generateReportCardPDF({
      athlete,
      coachName: coach.full_name,
      skillScores: reportCard.evaluation?.skill_scores || [],
      notes: reportCard.evaluation?.notes || '',
      season: '2025/26',
      date: new Date().toLocaleDateString()
    })

    // Send email
    const emailResult = await sendReportCardEmail({
      to: parentEmail,
      athleteName: athlete.full_name,
      coachName: coach.full_name,
      pdfBase64,
      season: '2025/26'
    })

    if (!emailResult.success) {
      alert('Failed to send email: ' + emailResult.error)
      return
    }

    // Mark as sent
    await supabase
      .from('report_cards')
      .update({ 
        status: 'sent',
        sent_to_parents: true,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reportCardId)
    
    alert(`Report card sent successfully to ${parentEmail}!`)
    loadData()
  }

  async function loadReportCardPreview(reportCard: ReportCard) {
    if (!reportCard.evaluation_id) {
      alert('No evaluation associated with this report card')
      return
    }

    // Fetch the full evaluation data
    const { data: evaluation, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('id', reportCard.evaluation_id)
      .single()
    
    if (error) {
      console.error('Error loading evaluation:', error)
      alert('Could not load evaluation data. Please try again.')
      return
    }
    
    if (evaluation) {
      setPreviewEvaluation(evaluation)
      setPreviewReportCard(reportCard)
      
      // Generate PDF preview
      const athlete = athletes.find(a => a.id === reportCard.athlete_id)
      const coach = coaches.find(c => c.id === reportCard.coach_id)
      
      if (athlete && coach) {
        const pdfBase64 = generateReportCardPDF({
          athlete,
          coachName: coach.full_name,
          skillScores: evaluation.skill_scores || [],
          notes: evaluation.notes || '',
          season: '2025/26',
          date: new Date().toLocaleDateString()
        })
        setPdfPreviewUrl('data:application/pdf;base64,' + pdfBase64)
      }
    } else {
      alert('Evaluation not found')
    }
  }

  async function openReviewModal(reportCard: ReportCard) {
    if (!reportCard.evaluation_id) {
      alert('No evaluation associated with this report card')
      return
    }

    const { data: evaluation, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('id', reportCard.evaluation_id)
      .single()
    
    if (error || !evaluation) {
      console.error('Error loading evaluation:', error)
      alert('Could not load evaluation data. Please try again.')
      return
    }
    
    setSelectedReportCard(reportCard)
    setSelectedEvaluation(evaluation)
    setEditableScores(evaluation.skill_scores || [])
    setEditableNotes(evaluation.notes || '')
    setAdminNotes(reportCard.admin_notes || '')
  }

  async function updateEvaluationAndApprove() {
    if (!selectedReportCard || !selectedEvaluation) return

    // Update the evaluation with admin edits
    const { error: evalError } = await supabase
      .from('evaluations')
      .update({
        skill_scores: editableScores,
        notes: editableNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedEvaluation.id)

    if (evalError) {
      alert('Error updating evaluation: ' + evalError.message)
      return
    }

    // Approve the report card
    await approveReportCard(selectedReportCard.id)
    
    // Clear state
    setSelectedReportCard(null)
    setSelectedEvaluation(null)
    setEditableScores([])
    setEditableNotes('')
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
            <button
              onClick={() => setActiveTab('report-cards')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'report-cards'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Report Cards ({reportCards.filter(rc => rc.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('evaluations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'evaluations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Evaluations ({evaluations.length})
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

        {/* Evaluations Tab */}
        {activeTab === 'evaluations' && (
          <div>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : evaluations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No evaluations yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Athlete</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills Evaluated</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {evaluations.map((ev) => (
                      <tr key={ev.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ev.athlete_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ev.coach_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ev.skill_scores?.length || 0} skills
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ev.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {ev.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Report Cards Tab */}
        {activeTab === 'report-cards' && (
          <div>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : reportCards.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No report cards submitted yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Athlete</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportCards.map((rc) => (
                      <tr key={rc.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {rc.athlete_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rc.coach_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            rc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            rc.status === 'approved' ? 'bg-green-100 text-green-800' :
                            rc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {rc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(rc.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => loadReportCardPreview(rc)}
                            className="text-gray-600 hover:text-gray-900 mr-3"
                          >
                            Preview
                          </button>
                          {rc.status === 'pending' && (
                            <button
                              onClick={() => openReviewModal(rc)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Review
                            </button>
                          )}
                          {rc.status === 'approved' && !rc.sent_to_parents && (
                            <button
                              onClick={() => sendReportCard(rc.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Send to Parents
                            </button>
                          )}
                          {rc.sent_to_parents && (
                            <span className="text-gray-400 text-xs">Sent {new Date(rc.sent_at!).toLocaleDateString()}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Report Card Review Modal */}
        {selectedReportCard && selectedEvaluation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 my-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Review Report Card</h3>
              
              {/* Athlete & Coach Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-gray-700">
                  <strong>Athlete:</strong> {selectedReportCard.athlete_name}<br/>
                  <strong>Coach:</strong> {selectedReportCard.coach_name}<br/>
                  <strong>Submitted:</strong> {new Date(selectedReportCard.created_at).toLocaleString()}
                </p>
              </div>

              {/* Editable Skill Scores */}
              <div className="mb-6">
                <h4 className="font-bold text-lg mb-3 border-b pb-2">Skill Evaluations (Editable)</h4>
                {editableScores.length > 0 ? (
                  <div className="space-y-3">
                    {editableScores.map((score: any, index: number) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="font-medium flex-1">{score.skill_name}</span>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4].map((num) => (
                            <button
                              key={num}
                              onClick={() => {
                                const newScores = [...editableScores]
                                newScores[index].score = num
                                setEditableScores(newScores)
                              }}
                              className={`w-10 h-10 flex items-center justify-center border rounded font-medium transition-colors ${
                                score.score === num 
                                  ? 'bg-blue-500 text-white border-blue-500' 
                                  : 'bg-white text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No skills evaluated</p>
                )}
              </div>

              {/* Editable Notes */}
              <div className="mb-6">
                <label className="block font-bold text-lg mb-3 border-b pb-2">Coach Notes (Editable)</label>
                <textarea
                  value={editableNotes}
                  onChange={(e) => setEditableNotes(e.target.value)}
                  placeholder="Edit coach notes..."
                  className="w-full border border-gray-300 rounded p-3 text-sm"
                  rows={4}
                />
              </div>
              
              {/* Admin Notes */}
              <div className="mb-6">
                <label className="block font-bold text-lg mb-3 border-b pb-2">Admin Notes (Internal)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes for the coach (optional)..."
                  className="w-full border border-gray-300 rounded p-3 text-sm"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setSelectedReportCard(null)
                    setSelectedEvaluation(null)
                    setEditableScores([])
                    setEditableNotes('')
                    setAdminNotes('')
                  }}
                  className="py-2 px-4 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => rejectReportCard(selectedReportCard.id)}
                  className="py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={updateEvaluationAndApprove}
                  className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save Changes & Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Card Preview Modal */}
        {previewReportCard && previewEvaluation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 my-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Report Card Preview</h3>
                <button
                  onClick={() => {
                    setPreviewReportCard(null)
                    setPreviewEvaluation(null)
                    setPdfPreviewUrl(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* PDF Preview */}
              {pdfPreviewUrl && (
                <div className="mb-6">
                  <iframe
                    src={pdfPreviewUrl}
                    className="w-full h-[600px] border border-gray-300 rounded"
                    title="Report Card PDF Preview"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setPreviewReportCard(null)
                    setPreviewEvaluation(null)
                    setPdfPreviewUrl(null)
                  }}
                  className="py-2 px-4 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                {previewReportCard.status === 'approved' && !previewReportCard.sent_to_parents && (
                  <button
                    onClick={() => {
                      sendReportCard(previewReportCard.id)
                      setPreviewReportCard(null)
                      setPreviewEvaluation(null)
                      setPdfPreviewUrl(null)
                    }}
                    className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Send to Parents
                  </button>
                )}
              </div>
            </div>
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
