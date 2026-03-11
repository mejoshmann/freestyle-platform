import { useState } from 'react'
import SkillSlider from '../components/evaluation/SkillSlider'
import type { Skill } from '../types'

const sampleSkill: Skill = {
  id: 'preview-skill',
  name: 'Sample Skill',
  description: 'This is a preview of the 1-5 slider component for evaluating athlete skills',
}

export default function SliderPreview() {
  const [value, setValue] = useState<number | null>(3)

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Skill Slider Preview</h2>
          
          <div className="max-w-md">
            <SkillSlider
              skill={sampleSkill}
              value={value}
              onChange={setValue}
            />
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Current value: <strong>{value}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
