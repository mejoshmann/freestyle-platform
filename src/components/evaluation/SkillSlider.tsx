import type { Skill } from '../../types'

interface SkillSliderProps {
  skill: Skill
  value: number | null
  onChange: (value: number | null) => void
}

// Categories that should use Yes/No instead of 1-4 slider
const yesNoCategories = ['Suggested Training', 'Programs for Next Season']

export default function SkillSlider({ skill, value, onChange }: SkillSliderProps) {
  const isSkipped = value === null
  
  // Check if this skill should use Yes/No (based on skill name containing category)
  const isYesNoSkill = yesNoCategories.some(cat => 
    skill.name.toLowerCase().includes(cat.toLowerCase()) ||
    skill.id.toLowerCase().includes(cat.toLowerCase().replace(/\s+/g, '-'))
  )
  
  // For Yes/No skills, default to No (1) instead of 3
  const displayValue = value ?? '-'

  // Handle Yes/No toggle
  const handleYesNoToggle = () => {
    if (isYesNoSkill) {
      // Toggle between Yes (4) and No (1)
      onChange(value && value >= 3 ? 1 : 4)
    } else {
      // Regular skip/enable
      onChange(isSkipped ? 3 : null)
    }
  }

  if (isYesNoSkill) {
    // Yes/No toggle button style
    const isYes = value && value >= 3
    return (
      <div className={`p-3 sm:p-4 rounded-lg shadow transition-colors ${isSkipped ? 'bg-gray-100' : 'bg-white'}`}>
        <div className="flex justify-between items-center">
          <label className={`text-sm sm:text-base font-medium ${isSkipped ? 'text-gray-400' : 'text-gray-900'}`}>
            {skill.name}
          </label>
          <button
            onClick={handleYesNoToggle}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
              isYes
                ? 'bg-green-500 text-white hover:bg-green-600'
                : isSkipped
                ? 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            {isYes ? 'YES' : isSkipped ? 'N/A' : 'NO'}
          </button>
        </div>
        {skill.description && (
          <p className="text-xs text-gray-500 mt-2">{skill.description}</p>
        )}
      </div>
    )
  }

  // Regular 1-4 slider for other skills
  return (
    <div className={`p-3 sm:p-4 rounded-lg shadow transition-colors ${isSkipped ? 'bg-gray-100' : 'bg-white'}`}>
      <div className="flex justify-between items-center mb-2">
        <label className={`text-sm sm:text-base font-medium ${isSkipped ? 'text-gray-400' : 'text-gray-900'}`}>
          {skill.name}
        </label>
        <div className="flex items-center space-x-2">
          <span className={`text-xl sm:text-lg font-bold min-w-[2rem] text-center ${isSkipped ? 'text-gray-400' : 'text-blue-600'}`}>
            {displayValue}
          </span>
          <button
            onClick={() => onChange(isSkipped ? 3 : null)}
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
            min={1}
            max={4}
            step={1}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-3 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 touch-manipulation"
            style={{ touchAction: 'manipulation' }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-2 sm:mt-1">
            <span className="py-1 px-2">1</span>
            <span className="py-1 px-2">2</span>
            <span className="py-1 px-2">3</span>
            <span className="py-1 px-2">4</span>
          </div>
        </>
      )}
    </div>
  )
}
