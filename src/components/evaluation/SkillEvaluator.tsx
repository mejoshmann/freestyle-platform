import { useState, useCallback } from 'react'
import type { Skill, SkillScore, TemplateCategory } from '../../types'
import { uploadAthleteMedia } from '../../lib/media'
import { useAuth } from '../../context/AuthContext'
import EvalHeader from './EvalHeader'
import SkillsList from './SkillsList'
import DesktopActions from './DesktopActions'
import MobileEvalNav from './MobileEvalNav'

// Categories that should use Yes/No or Recommended instead of 1-4 slider
const yesNoCategories = ['Programs for Next Season']
const recommendedCategories = ['Suggested Training']

function isToggleSkill(skill: Skill): boolean {
  const skillNameLower = skill.name.toLowerCase()
  const skillIdLower = skill.id.toLowerCase()
  
  const isYesNoSkill = yesNoCategories.some(cat => {
    const catLower = cat.toLowerCase()
    return skillNameLower.includes(catLower) || 
           skillIdLower.startsWith('program-')
  })
  
  const isRecommendedSkill = recommendedCategories.some(cat => {
    const catLower = cat.toLowerCase()
    return skillNameLower.includes(catLower) || 
           skillIdLower.startsWith('training-')
  })
  
  return isYesNoSkill || isRecommendedSkill
}

interface SkillEvaluatorProps {
  athleteId: string
  athleteName: string
  skills: Skill[]
  categories?: TemplateCategory[]
  onSave: (scores: SkillScore[], notes: string, groupName: string, categoryNotes?: Record<string, string>, voiceNotes?: string[]) => void
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
      score: isToggleSkill(skill) ? null : 0  // Toggle skills default to null, regular skills default to 0
    }))
  )
  const [notes, setNotes] = useState('')
  const [groupName, setGroupName] = useState('')
  const [categoryNotes, setCategoryNotes] = useState<Record<string, string>>({})

  // Computed values
  const evaluatedCount = scores.filter(s => s.score !== null).length
  const skippedCount = scores.filter(s => s.score === null).length

  // Handlers
  const updateScore = useCallback((skillId: string, value: number | string | null) => {
    setScores(prev => prev.map(s => 
      s.skill_id === skillId ? { ...s, score: value } : s
    ))
  }, [])

  const handleCategoryNoteChange = useCallback((category: string, note: string) => {
    setCategoryNotes(prev => ({ ...prev, [category]: note }))
  }, [])

  const handleSave = useCallback(() => {
    const evaluatedScores = scores.filter(s => s.score !== null)
    onSave(evaluatedScores, notes, groupName, categoryNotes)
  }, [scores, notes, groupName, categoryNotes, onSave])



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

  // Upload handler - same as capture but for gallery uploads
  const handleUploadMedia = useCallback(async (file: File) => {
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
        description: `Uploaded during evaluation - ${athleteName}`,
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
    <div className="bg-white rounded-t-lg sm:rounded-lg shadow-lg p-3 sm:p-6 max-w-full">
      {/* Header */}
      <EvalHeader 
        athleteName={athleteName}
        evaluatedCount={evaluatedCount}
        totalCount={skills.length}
        skippedCount={skippedCount}
        onClose={onCancel}
      />

      {/* Group Name Input */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Group Name
        </label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Snow Riders, Mountain Hawks"
        />
        <p className="text-xs text-gray-500 mt-1">Optional: Enter a custom name for your group</p>
      </div>

      {/* Skills by Category */}
      <SkillsList 
        skills={skills}
        categories={categories}
        scores={scores}
        onScoreChange={updateScore}
        categoryNotes={categoryNotes}
        onCategoryNoteChange={handleCategoryNoteChange}
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
      <DesktopActions 
        onSave={handleSave} 
        onCancel={onCancel} 
        onCaptureMedia={handleCaptureMedia}
        onUploadMedia={handleUploadMedia}
      />

      {/* Mobile Bottom Navigation */}
      <MobileEvalNav
        onBackToRoster={handleBackToRoster}
        onCaptureMedia={handleCaptureMedia}
        onUploadMedia={handleUploadMedia}
        onSave={handleSave}
      />
    </div>
  )
}
