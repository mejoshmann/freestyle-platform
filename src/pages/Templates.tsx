import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { EvaluationTemplate } from '../types'
import { defaultTemplates } from '../data/defaultTemplates'
import TemplateCard from '../components/evaluation/TemplateCard'

export default function Templates() {
  const { coach } = useAuth()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    const { data } = await supabase
      .from('evaluation_templates')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) {
      setTemplates(data)
    }
    setLoading(false)
  }

  async function createDefaultTemplates() {
    if (!coach) return

    for (const template of defaultTemplates) {
      const category = {
        id: template.name.toLowerCase().replace(/\s+/g, '-'),
        name: template.name,
        skills: template.skills
      }
      
      await supabase.from('evaluation_templates').insert({
        coach_id: coach.id,
        name: template.name,
        description: template.description,
        skills: template.skills,
        categories: [category],
      })
    }

    loadTemplates()
  }

  async function deleteTemplate(id: string) {
    await supabase.from('evaluation_templates').delete().eq('id', id)
    loadTemplates()
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Evaluation Templates</h2>
            <div className="space-x-3">
              <button
                onClick={() => navigate('/templates/build')}
                className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
              >
                + Build Custom Template
              </button>
              {templates.length === 0 && (
                <button
                  onClick={createDefaultTemplates}
                  className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Load Defaults
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No templates yet. Click "Load Default Templates" to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => {}}
                  onDelete={() => deleteTemplate(template.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
