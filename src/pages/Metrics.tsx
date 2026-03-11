import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Skill, TemplateCategory } from '../types'
import { defaultTemplates } from '../data/defaultTemplates'

interface MetricSet {
  id: string
  name: string
  categories: TemplateCategory[]
  skills: Skill[]
  coach_id: string
}

export default function Metrics() {
  const { coach } = useAuth()
  const navigate = useNavigate()
  const [metricSets, setMetricSets] = useState<MetricSet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [])

  async function loadMetrics() {
    const { data } = await supabase
      .from('evaluation_templates')
      .select('*')
    
    if (data) {
      setMetricSets(data)
    }
    setLoading(false)
  }

  async function createDefaultMetrics() {
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

    loadMetrics()
  }

  async function deleteMetricSet(id: string) {
    await supabase.from('evaluation_templates').delete().eq('id', id)
    loadMetrics()
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Metrics</h2>
              <p className="text-gray-500 text-sm">Manage evaluation metrics for your athletes</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/metrics/build')}
                className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
              >
                + Create Custom Metrics
              </button>
              {metricSets.length === 0 && (
                <button
                  onClick={createDefaultMetrics}
                  className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Load Defaults
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : metricSets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 mb-4">No metrics yet.</p>
              <button
                onClick={createDefaultMetrics}
                className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Load Default Metrics
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {metricSets.map((metricSet) => (
                <div key={metricSet.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{metricSet.name}</h3>
                      <p className="text-sm text-gray-500">
                        {metricSet.skills?.length || 0} metrics • {metricSet.categories?.length || 0} categories
                      </p>
                    </div>
                    <button
                      onClick={() => deleteMetricSet(metricSet.id)}
                      className="text-red-600 hover:text-red-800 text-sm px-3 py-1 hover:bg-red-50 rounded"
                    >
                      Delete
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {metricSet.categories?.map((category: TemplateCategory) => (
                      <div key={category.id}>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">{category.name}</h4>
                        <div className="flex flex-wrap gap-2">
                          {category.skills.map((skill: Skill) => (
                            <span
                              key={skill.id}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
