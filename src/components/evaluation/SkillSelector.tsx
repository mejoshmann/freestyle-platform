import type { Skill } from '../../types'

interface SkillSelectorProps {
  skills: Skill[]
  selectedSkills: string[]
  onToggle: (skillId: string) => void
}

export default function SkillSelector({ skills, selectedSkills, onToggle }: SkillSelectorProps) {
  return (
    <div className="space-y-2">
      {skills.map((skill) => {
        const isSelected = selectedSkills.includes(skill.id)
        return (
          <label
            key={skill.id}
            className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
              isSelected ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border-2 border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggle(skill.id)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div className="ml-3">
              <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                {skill.name}
              </span>
              {skill.description && (
                <p className={`text-sm ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                  {skill.description}
                </p>
              )}
            </div>
          </label>
        )
      })}
    </div>
  )
}
