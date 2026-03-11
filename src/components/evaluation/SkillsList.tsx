import { useMemo } from 'react'
import type { Skill, SkillScore, TemplateCategory } from '../../types'
import SkillSlider from './SkillSlider'

interface SkillsListProps {
  skills: Skill[]
  categories?: TemplateCategory[]
  scores: SkillScore[]
  onScoreChange: (skillId: string, value: number | null) => void
}

export default function SkillsList({ skills, categories, scores, onScoreChange }: SkillsListProps) {
  // Derive categories from skill IDs if not provided
  const derivedCategories = useMemo(() => {
    if (categories && categories.length > 0) return categories
    
    // Group skills by their prefix (e.g., 'moguls-turns' -> 'Moguls')
    const grouped = skills.reduce((acc, skill) => {
      const prefix = skill.id.split('-')[0]
      const categoryName = prefix.charAt(0).toUpperCase() + prefix.slice(1)
      if (!acc[prefix]) {
        acc[prefix] = { id: prefix, name: categoryName, skills: [] }
      }
      acc[prefix].skills.push(skill)
      return acc
    }, {} as Record<string, TemplateCategory>)
    
    return Object.values(grouped)
  }, [categories, skills])

  return (
    <div className="mb-4 sm:mb-6 max-h-[50vh] sm:max-h-96 overflow-y-auto">
      {derivedCategories.map((category) => (
        <div key={category.id} className="mb-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 pb-2 border-b border-gray-200">
            {category.name}
          </h3>
          <div className="space-y-3">
            {category.skills.map((skill) => {
              const scoreIndex = skills.findIndex(s => s.id === skill.id)
              return (
                <SkillSlider
                  key={skill.id}
                  skill={skill}
                  value={scores[scoreIndex]?.score ?? null}
                  onChange={(value) => onScoreChange(skill.id, value)}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
