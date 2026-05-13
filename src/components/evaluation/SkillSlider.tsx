import { useState, useEffect } from 'react'
import type { Skill } from '../../types'

interface SkillSliderProps {
  skill: Skill
  value: number | string | null
  onChange: (value: number | string | null) => void
  notes?: string
  onNotesChange?: (notes: string) => void
}

// Categories that should use Yes/No or Recommended instead of 1-4 slider
const yesNoCategories = ['Programs for Next Season']
const recommendedCategories = ['Suggested Training']

export default function SkillSlider({ skill, value, onChange, notes, onNotesChange }: SkillSliderProps) {
  const isSkipped = value === null
  const [noteOpen, setNoteOpen] = useState(!!notes)

  useEffect(() => {
    if (notes && notes.trim()) {
      setNoteOpen(true)
    }
  }, [notes])

  // Check if this skill should use Yes/No (based on skill name containing category)
  const skillNameLower = skill.name.toLowerCase()
  const skillIdLower = skill.id.toLowerCase()
  
  const isSpinSkill = skill.id.endsWith('-spins')
  const spinDegrees = ['180', '360', '540', '720']

  const isFootForwardSkill = skill.id.endsWith('-forward')
  const slideOptions = ['Box Slide', 'Tube Slide', 'Rail Slide', 'Challenge Rail']

  const is270Skill = skill.id === 'park-270-on-off'
  const twoSeventyOptions = ['Front 270 Out', 'Back 270 Out', 'Switch Up', '270 On']

  const isGrabSkill = skill.id === 'jump-grabs'
  const grabOptions = ['Safety', 'Japan', 'Mute', 'Tip/Tail']

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
  
  // isToggleSkill is implicitly handled by isYesNoSkill and isRecommendedSkill checks
  
  // For toggle skills, default to off (1) instead of 3
  const displayValue = value ?? '-'

  // Handle toggle
  const handleToggle = () => {
    if (isRecommendedSkill) {
      // Toggle between "Recommended" and null (deselect/skip)
      onChange(value === "Recommended" ? null : "Recommended")
    } else {
      // Regular skip/enable
      onChange(isSkipped ? 0 : null)
    }
  }

  if (isYesNoSkill) {
    // Simple Yes toggle for Programs - click to select, click again to deselect
    const isYes = value === "Yes"
    return (
      <div className={`p-2 sm:p-4 rounded-lg shadow transition-colors ${isSkipped ? 'bg-gray-100' : 'bg-white'}`}>
        <div className="flex justify-between items-center">
          <label className={`text-xs sm:text-base font-medium ${isSkipped ? 'text-gray-400' : 'text-gray-900'}`}>
            {skill.name}
          </label>
          <button
            onClick={() => onChange(isYes ? null : "Yes")}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-bold text-sm transition-colors ${
              isYes
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
            }`}
          >
            {isYes && <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
            Yes
          </button>
        </div>
        {skill.description && (
          <p className="text-xs text-gray-500 mt-2">{skill.description}</p>
        )}
        <div className="mt-2">
          {!noteOpen ? (
            <button
              onClick={() => setNoteOpen(true)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Add note
            </button>
          ) : (
            <div className="relative">
              <textarea
                value={notes || ''}
                onChange={(e) => onNotesChange?.(e.target.value)}
                placeholder="Add a note..."
                rows={2}
                className="w-full text-xs p-2 pr-6 border border-gray-200 rounded-lg resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              {(!notes || !notes.trim()) && (
                <button
                  onClick={() => setNoteOpen(false)}
                  className="absolute top-1.5 right-1.5 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isRecommendedSkill) {
    // Single "Recommended" toggle for Training - click to select, click again to deselect
    const isRecommended = value === "Recommended"
    return (
      <div className={`p-2 sm:p-4 rounded-lg shadow transition-colors ${isSkipped ? 'bg-gray-100' : 'bg-white'}`}>
        <div className="flex justify-between items-center">
          <label className={`text-xs sm:text-base font-medium ${isSkipped ? 'text-gray-400' : 'text-gray-900'}`}>
            {skill.name}
          </label>
          <button
            onClick={handleToggle}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-bold text-sm transition-colors ${
              isRecommended
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
            }`}
          >
            {isRecommended && <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
            Recommended
          </button>
        </div>
        {skill.description && (
          <p className="text-xs text-gray-500 mt-2">{skill.description}</p>
        )}
        <div className="mt-2">
          {!noteOpen ? (
            <button
              onClick={() => setNoteOpen(true)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Add note
            </button>
          ) : (
            <div className="relative">
              <textarea
                value={notes || ''}
                onChange={(e) => onNotesChange?.(e.target.value)}
                placeholder="Add a note..."
                rows={2}
                className="w-full text-xs p-2 pr-6 border border-gray-200 rounded-lg resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              {(!notes || !notes.trim()) && (
                <button
                  onClick={() => setNoteOpen(false)}
                  className="absolute top-1.5 right-1.5 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isSpinSkill) {
    // Degree selection buttons for grouped spin skills (multi-select)
    const selectedDegrees = typeof value === 'string' ? value.split(', ') : []
    const toggleDegree = (degree: string) => {
      if (selectedDegrees.includes(degree)) {
        const remaining = selectedDegrees.filter(d => d !== degree)
        onChange(remaining.length > 0 ? remaining.join(', ') : null)
      } else {
        onChange([...selectedDegrees, degree].join(', '))
      }
    }
    return (
      <div className={`p-2 sm:p-4 rounded-lg shadow transition-colors ${isSkipped ? 'bg-gray-100' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-2 gap-2">
          <label className={`text-xs sm:text-base font-medium flex-1 min-w-0 ${isSkipped ? 'text-gray-400' : 'text-gray-900'}`}>
            {skill.name}
          </label>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onChange(isSkipped ? '180' : null)}
              className={`text-xs px-2 py-1 rounded ${
                isSkipped 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {isSkipped ? 'Enable' : 'Skip'}
            </button>
          </div>
        </div>
        {skill.description && !isSkipped && (
          <p className="text-xs text-gray-500 mb-3">{skill.description}</p>
        )}
        {!isSkipped && (
          <div className="flex gap-2">
            {spinDegrees.map((degree) => (
              <button
                key={degree}
                onClick={() => toggleDegree(degree)}
                className={`flex-1 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-colors ${
                  selectedDegrees.includes(degree)
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                }`}
              >
                {degree}
              </button>
            ))}
          </div>
        )}
        <div className="mt-2">
          {!noteOpen ? (
            <button
              onClick={() => setNoteOpen(true)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Add note
            </button>
          ) : (
            <div className="relative">
              <textarea
                value={notes || ''}
                onChange={(e) => onNotesChange?.(e.target.value)}
                placeholder="Add a note..."
                rows={2}
                className="w-full text-xs p-2 pr-6 border border-gray-200 rounded-lg resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              {(!notes || !notes.trim()) && (
                <button
                  onClick={() => setNoteOpen(false)}
                  className="absolute top-1.5 right-1.5 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isFootForwardSkill) {
    // Slide option selection buttons for foot forward skills (multi-select)
    const selectedOptions = typeof value === 'string' ? value.split(', ') : []
    const toggleOption = (option: string) => {
      if (selectedOptions.includes(option)) {
        const remaining = selectedOptions.filter(o => o !== option)
        onChange(remaining.length > 0 ? remaining.join(', ') : null)
      } else {
        onChange([...selectedOptions, option].join(', '))
      }
    }
    return (
      <div className={`p-2 sm:p-4 rounded-lg shadow transition-colors ${isSkipped ? 'bg-gray-100' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-2 gap-2">
          <label className={`text-xs sm:text-base font-medium flex-1 min-w-0 ${isSkipped ? 'text-gray-400' : 'text-gray-900'}`}>
            {skill.name}
          </label>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onChange(isSkipped ? 'Box Slide' : null)}
              className={`text-xs px-2 py-1 rounded ${
                isSkipped 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {isSkipped ? 'Enable' : 'Skip'}
            </button>
          </div>
        </div>
        {!isSkipped && (
          <div className="grid grid-cols-2 gap-2">
            {slideOptions.map((option) => (
              <button
                key={option}
                onClick={() => toggleOption(option)}
                className={`py-2 sm:py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-colors ${
                  selectedOptions.includes(option)
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
        <div className="mt-2">
          {!noteOpen ? (
            <button
              onClick={() => setNoteOpen(true)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Add note
            </button>
          ) : (
            <div className="relative">
              <textarea
                value={notes || ''}
                onChange={(e) => onNotesChange?.(e.target.value)}
                placeholder="Add a note..."
                rows={2}
                className="w-full text-xs p-2 pr-6 border border-gray-200 rounded-lg resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              {(!notes || !notes.trim()) && (
                <button
                  onClick={() => setNoteOpen(false)}
                  className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (is270Skill) {
    // Option selection buttons for 270 On & Off skill (multi-select)
    const selectedOptions = typeof value === 'string' ? value.split(', ') : []
    const toggleOption = (option: string) => {
      if (selectedOptions.includes(option)) {
        const remaining = selectedOptions.filter(o => o !== option)
        onChange(remaining.length > 0 ? remaining.join(', ') : null)
      } else {
        onChange([...selectedOptions, option].join(', '))
      }
    }
    return (
      <div className={`p-2 sm:p-4 rounded-lg shadow transition-colors ${isSkipped ? 'bg-gray-100' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-2 gap-2">
          <label className={`text-xs sm:text-base font-medium flex-1 min-w-0 ${isSkipped ? 'text-gray-400' : 'text-gray-900'}`}>
            {skill.name}
          </label>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onChange(isSkipped ? 'Front 270 Out' : null)}
              className={`text-xs px-2 py-1 rounded ${
                isSkipped 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {isSkipped ? 'Enable' : 'Skip'}
            </button>
          </div>
        </div>
        {!isSkipped && (
          <div className="grid grid-cols-2 gap-2">
            {twoSeventyOptions.map((option) => (
              <button
                key={option}
                onClick={() => toggleOption(option)}
                className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  selectedOptions.includes(option)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (isGrabSkill) {
    // Option selection buttons for Grabs skill (multi-select)
    const selectedOptions = typeof value === 'string' ? value.split(', ') : []
    const toggleOption = (option: string) => {
      if (selectedOptions.includes(option)) {
        const remaining = selectedOptions.filter(o => o !== option)
        onChange(remaining.length > 0 ? remaining.join(', ') : null)
      } else {
        onChange([...selectedOptions, option].join(', '))
      }
    }
    return (
      <div className={`p-2 sm:p-4 rounded-lg shadow transition-colors ${isSkipped ? 'bg-gray-100' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-2 gap-2">
          <label className={`text-xs sm:text-base font-medium flex-1 min-w-0 ${isSkipped ? 'text-gray-400' : 'text-gray-900'}`}>
            {skill.name}
          </label>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onChange(isSkipped ? 'Safety' : null)}
              className={`text-xs px-2 py-1 rounded ${
                isSkipped 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {isSkipped ? 'Enable' : 'Skip'}
            </button>
          </div>
        </div>
        {!isSkipped && (
          <div className="grid grid-cols-2 gap-2">
            {grabOptions.map((option) => (
              <button
                key={option}
                onClick={() => toggleOption(option)}
                className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  selectedOptions.includes(option)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const isAttendance = skillIdLower === 'attendance' || skillIdLower.startsWith('attendance-')
  const isAttitudeEngagement = skillIdLower === 'effort-participation'
  const isParkSafety = skillIdLower === 'park-safety'
  const isTerrain = skillIdLower === 'moguls-terrain'

  // Regular 0-4 slider for other skills
  return (
    <div className={`p-2 sm:p-4 rounded-lg shadow transition-colors ${isSkipped ? 'bg-gray-100' : 'bg-white'}`}>
      <div className="flex justify-between items-center mb-2 gap-2">
        <label className={`text-xs sm:text-base font-medium flex-1 min-w-0 ${isSkipped ? 'text-gray-400' : 'text-gray-900'}`}>
          {skill.name}
        </label>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={`text-lg sm:text-lg font-bold min-w-[1.5rem] text-center ${isSkipped ? 'text-gray-400' : 'text-blue-600'}`}>
            {displayValue}
          </span>
          <button
            onClick={() => onChange(isSkipped ? 0 : null)}
            className={`text-xs px-2 py-1 rounded ${
              isSkipped 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {isSkipped ? 'Enable' : 'Skip'}
          </button>
        </div>
      </div>
      {skill.description && !isSkipped && (
        <p className="text-xs text-gray-500 mb-3">{skill.description}</p>
      )}
      
      {!isSkipped && (
        <>
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-3 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 touch-manipulation max-w-full"
            style={{ touchAction: 'manipulation' }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-2 sm:mt-1 px-1">
            <span>0</span>
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span className="text-left">{isTerrain ? 'Green' : 'N/A'}</span>
            <span className="text-left">{isAttendance || isAttitudeEngagement || isParkSafety || isTerrain ? '' : 'Tried it'}</span>
            <span>{isTerrain ? 'Green | Blue' : ''}</span>
            <span></span>
            <span className="text-right">{isAttendance ? '100%' : isAttitudeEngagement ? 'Stoked' : isParkSafety ? 'Safe' : isTerrain ? 'Blue' : 'Stomped it'}</span>
          </div>
        </>
      )}
      <div className="mt-2">
        {!noteOpen ? (
          <button
            onClick={() => setNoteOpen(true)}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Add note
          </button>
        ) : (
          <div className="relative">
            <textarea
              value={notes || ''}
              onChange={(e) => onNotesChange?.(e.target.value)}
              placeholder="Add a note..."
              rows={2}
              className="w-full text-xs p-2 pr-6 border border-gray-200 rounded-lg resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            {(!notes || !notes.trim()) && (
              <button
                onClick={() => setNoteOpen(false)}
                className="absolute top-1.5 right-1.5 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
