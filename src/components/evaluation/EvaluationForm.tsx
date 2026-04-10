import { useState } from 'react'
import type { EvaluationTemplate, SkillScore } from '../../types'
import SkillSlider from './SkillSlider'

interface EvaluationFormProps {
  athleteName: string
  athleteImage?: string
  template: EvaluationTemplate
  onSave: (scores: SkillScore[], notes: string) => void
  onCancel: () => void
}

export default function EvaluationForm({ 
  athleteName, 
  athleteImage, 
  template, 
  onSave, 
  onCancel 
}: EvaluationFormProps) {
  const [scores, setScores] = useState<SkillScore[]>(
    template.skills.map(skill => ({
      skill_id: skill.id,
      skill_name: skill.name,
      score: 3
    }))
  )
  const [notes, setNotes] = useState('')

  function updateScore(skillId: string, value: number | string | null) {
    setScores(prev => prev.map(s => 
      s.skill_id === skillId ? { ...s, score: value } : s
    ))
  }

  function handleSave() {
    onSave(scores, notes)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Athlete Header */}
      <div className="flex items-center mb-6 pb-6 border-b">
        {athleteImage ? (
          <img 
            src={athleteImage} 
            alt={athleteName}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-3xl text-gray-500">
              {athleteName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="ml-4">
          <h2 className="text-2xl font-bold text-gray-900">{athleteName}</h2>
          <p className="text-gray-500">{template.name}</p>
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-4 mb-6">
        {template.skills.map((skill, index) => (
          <SkillSlider
            key={skill.id}
            skill={skill}
            value={scores[index]?.score || 3}
            onChange={(value) => updateScore(skill.id, value)}
          />
        ))}
      </div>

      {/* Notes */}
      <div className="mb-6">
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

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={handleSave}
          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Evaluation
        </button>
        <button
          onClick={onCancel}
          className="py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
