import { useState, useCallback } from 'react'
import type { Skill, SkillScore, TemplateCategory } from '../../types'
import { uploadAthleteMedia } from '../../lib/media'
import { useAuth } from '../../context/AuthContext'
import EvalHeader from './EvalHeader'
import SkillsList from './SkillsList'
import DesktopActions from './DesktopActions'
import MobileEvalNav from './MobileEvalNav'

interface SkillEvaluatorProps {
  athleteId: string
  athleteName: string
  skills: Skill[]
  categories?: TemplateCategory[]
  onSave: (scores: SkillScore[], notes: string, voiceNotes?: string[]) => void
  onCancel: () => void
  onBackToRoster?: () => void
}

export default function SkillEvaluator({ 
  athleteId,
  athleteName, 
  skills, 
  categories, 
  onSave, 
  onCancel, 
  onBackToRoster 
}: SkillEvaluatorProps) {
  const { coach } = useAuth()
  // State
  const [scores, setScores] = useState<SkillScore[]>(
    skills.map(skill => ({
      skill_id: skill.id,
      skill_name: skill.name,
      score: 3  // Default to 3, coach can skip if not applicable
    }))
  )
  const [notes, setNotes] = useState('')

  // Computed values
  const evaluatedCount = scores.filter(s => s.score !== null).length
  const skippedCount = scores.filter(s => s.score === null).length

  // Handlers
  const updateScore = useCallback((skillId: string, value: number | null) => {
    setScores(prev => prev.map(s => 
      s.skill_id === skillId ? { ...s, score: value } : s
    ))
  }, [])

  const handleSave = useCallback(() => {
    const evaluatedScores = scores.filter(s => s.score !== null)
    onSave(evaluatedScores, notes)
  }, [scores, notes, onSave])



  const handleCaptureMedia = useCallback(async (file: File) => {
    if (!coach || !athleteId) {
      alert('Cannot upload media: missing coach or athlete information')
      return
    }
    
    const result = await uploadAthleteMedia(
      athleteId,
      athleteName,
      file,
      {
        coachId: coach.id,
        description: `Captured during evaluation - ${athleteName}`,
        tags: [athleteName, 'evaluation']
      }
    )
    
    if (result.error) {
      alert('Failed to upload media: ' + result.error)
    } else {
      console.log('Media uploaded successfully:', result.url)
    }
  }, [athleteId, athleteName, coach])

  const handleBackToRoster = useCallback(() => {
    if (onBackToRoster) {
      onBackToRoster()
    } else {
      onCancel()
    }
  }, [onBackToRoster, onCancel])

  return (
    <div className="bg-white rounded-t-lg sm:rounded-lg shadow-lg p-4 sm:p-6">
      {/* Header */}
      <EvalHeader 
        athleteName={athleteName}
        evaluatedCount={evaluatedCount}
        totalCount={skills.length}
        skippedCount={skippedCount}
      />

      {/* Skills by Category */}
      <SkillsList 
        skills={skills}
        categories={categories}
        scores={scores}
        onScoreChange={updateScore}
      />

      {/* Notes */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add any notes about this evaluation..."
        />
      </div>

      {/* Desktop Actions */}
      <DesktopActions onSave={handleSave} onCancel={onCancel} />

      {/* Mobile Bottom Navigation */}
      <MobileEvalNav
        onBackToRoster={handleBackToRoster}
        onCaptureMedia={handleCaptureMedia}
        onSave={handleSave}
      />
    </div>
  )
}
