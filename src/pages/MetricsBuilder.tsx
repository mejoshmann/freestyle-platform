import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { defaultTemplates } from '../data/defaultTemplates'
import type { Skill, TemplateCategory } from '../types'

interface CustomCategory {
  id: string
  name: string
  skills: Skill[]
  isCustom: true
}

export default function MetricsBuilder() {
  const { coach } = useAuth()
  const navigate = useNavigate()
  const [templateName, setTemplateName] = useState('')
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  
  // Custom categories state
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newMetricName, setNewMetricName] = useState('')
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)

  // Get all available categories with their skills
  const allCategories: TemplateCategory[] = defaultTemplates.map(t => ({
    id: t.name.toLowerCase().replace(/\s+/g, '-'),
    name: t.name,
    skills: t.skills
  }))

  function toggleMetric(skillId: string) {
    setSelectedMetrics(prev => 
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    )
  }

  function selectAllInCategory(skills: Skill[]) {
    const skillIds = skills.map(s => s.id)
    const allSelected = skillIds.every(id => selectedMetrics.includes(id))
    
    if (allSelected) {
      setSelectedMetrics(prev => prev.filter(id => !skillIds.includes(id)))
    } else {
      setSelectedMetrics(prev => [...new Set([...prev, ...skillIds])])
    }
  }

  async function saveMetrics() {
    if (!coach || !templateName || selectedMetrics.length === 0) return

    setSaving(true)
    
    // Build categories with only selected skills (including custom ones)
    const allAvailableCategories = [...allCategories, ...customCategories]
    const selectedCategories: TemplateCategory[] = allAvailableCategories
      .map(cat => ({
        ...cat,
        skills: cat.skills.filter(s => selectedMetrics.includes(s.id))
      }))
      .filter(cat => cat.skills.length > 0)

    const { error } = await supabase.from('evaluation_templates').insert({
      coach_id: coach.id,
      name: templateName,
      categories: selectedCategories,
      skills: selectedCategories.flatMap(c => c.skills),
    })

    if (error) {
      alert('Error saving metrics: ' + error.message)
      setSaving(false)
      return
    }

    setSaving(false)
    navigate('/metrics')
  }

  // Get selected categories for preview
  const selectedCategories = [...allCategories, ...customCategories]
    .map(cat => ({
      ...cat,
      skills: cat.skills.filter(s => selectedMetrics.includes(s.id))
    }))
    .filter(cat => cat.skills.length > 0)

  function addCustomCategory() {
    if (!newCategoryName.trim()) return
    
    const newCategory: CustomCategory = {
      id: `custom-${Date.now()}`,
      name: newCategoryName.trim(),
      skills: [],
      isCustom: true
    }
    
    setCustomCategories([...customCategories, newCategory])
    setNewCategoryName('')
    setShowAddCategory(false)
    setActiveCategoryId(newCategory.id)
  }

  function addCustomMetric(categoryId: string) {
    if (!newMetricName.trim()) return
    
    const newSkill: Skill = {
      id: `skill-${Date.now()}`,
      name: newMetricName.trim(),
      description: ''
    }
    
    setCustomCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, skills: [...cat.skills, newSkill] }
        : cat
    ))
    
    // Auto-select the new metric
    setSelectedMetrics(prev => [...prev, newSkill.id])
    setNewMetricName('')
  }

  function removeCustomCategory(categoryId: string) {
    const category = customCategories.find(c => c.id === categoryId)
    if (category) {
      // Remove all skills in this category from selection
      const skillIds = category.skills.map(s => s.id)
      setSelectedMetrics(prev => prev.filter(id => !skillIds.includes(id)))
    }
    setCustomCategories(prev => prev.filter(c => c.id !== categoryId))
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Build Your Metrics</h1>
        <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">Select and customize the metrics for evaluating your athletes</p>

        {/* Metrics Set Name */}
        <div className="mb-6 sm:mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Metrics Set Name
          </label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g., Competition Evaluation"
            className="w-full sm:max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Metrics Selection */}
          <div>
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Available Metrics</h2>
            <div className="space-y-4 sm:space-y-6">
              {/* Add Custom Category Button */}
              {!showAddCategory ? (
                <button
                  onClick={() => setShowAddCategory(true)}
                  className="w-full py-3 px-4 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
                >
                  + Create Custom Category
                </button>
              ) : (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Title
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., My Custom Skills"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={addCustomCategory}
                      disabled={!newCategoryName.trim()}
                      className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
                    >
                      Add Category
                    </button>
                    <button
                      onClick={() => {
                        setShowAddCategory(false)
                        setNewCategoryName('')
                      }}
                      className="py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Default Categories */}
              {allCategories.map((category) => {
                const allSelected = category.skills.every(s => selectedMetrics.includes(s.id))
                const someSelected = category.skills.some(s => selectedMetrics.includes(s.id)) && !allSelected
                
                return (
                  <div key={category.name} className="bg-white rounded-lg shadow p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base">{category.name}</h3>
                      <button
                        onClick={() => selectAllInCategory(category.skills)}
                        className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded ${
                          allSelected
                            ? 'bg-blue-100 text-blue-700'
                            : someSelected
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {allSelected ? 'Deselect All' : someSelected ? 'Select Rest' : 'Select All'}
                      </button>
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      {category.skills.map((skill) => (
                        <label
                          key={skill.id}
                          className={`flex items-center p-2 sm:p-2 rounded cursor-pointer transition-colors ${
                            selectedMetrics.includes(skill.id)
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedMetrics.includes(skill.id)}
                            onChange={() => toggleMetric(skill.id)}
                            className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 rounded border-gray-300"
                          />
                          <span className="ml-2 sm:ml-3 text-sm text-gray-700">{skill.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Custom Categories */}
              {customCategories.map((category) => {
                const allSelected = category.skills.every(s => selectedMetrics.includes(s.id))
                const someSelected = category.skills.some(s => selectedMetrics.includes(s.id)) && !allSelected
                const isAddingMetric = activeCategoryId === category.id
                
                return (
                  <div key={category.id} className="bg-white rounded-lg shadow p-3 sm:p-4 border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base">{category.name}</h3>
                      <div className="flex space-x-2">
                        {category.skills.length > 0 && (
                          <button
                            onClick={() => selectAllInCategory(category.skills)}
                            className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded ${
                              allSelected
                                ? 'bg-blue-100 text-blue-700'
                                : someSelected
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {allSelected ? 'Deselect All' : someSelected ? 'Select Rest' : 'Select All'}
                          </button>
                        )}
                        <button
                          onClick={() => removeCustomCategory(category.id)}
                          className="text-xs sm:text-sm px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Existing custom metrics */}
                    <div className="space-y-1 sm:space-y-2 mb-3">
                      {category.skills.map((skill) => (
                        <label
                          key={skill.id}
                          className={`flex items-center p-2 sm:p-2 rounded cursor-pointer transition-colors ${
                            selectedMetrics.includes(skill.id)
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedMetrics.includes(skill.id)}
                            onChange={() => toggleMetric(skill.id)}
                            className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 rounded border-gray-300"
                          />
                          <span className="ml-2 sm:ml-3 text-sm text-gray-700">{skill.name}</span>
                        </label>
                      ))}
                    </div>

                    {/* Add metric to this category */}
                    {!isAddingMetric ? (
                      <button
                        onClick={() => setActiveCategoryId(category.id)}
                        className="w-full py-2 px-3 border border-dashed border-green-300 text-green-600 rounded hover:bg-green-50 text-sm"
                      >
                        + Add Metric
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMetricName}
                          onChange={(e) => setNewMetricName(e.target.value)}
                          placeholder="Metric name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addCustomMetric(category.id)
                            }
                          }}
                        />
                        <button
                          onClick={() => addCustomMetric(category.id)}
                          disabled={!newMetricName.trim()}
                          className="py-2 px-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 text-sm"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setActiveCategoryId(null)
                            setNewMetricName('')
                          }}
                          className="py-2 px-3 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
              Selected ({selectedMetrics.length})
            </h2>
            <div className="bg-white rounded-lg shadow p-3 sm:p-4">
              {selectedCategories.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">No metrics selected yet</p>
              ) : (
                <div className="space-y-4 max-h-64 sm:max-h-96 overflow-y-auto">
                  {selectedCategories.map((category) => (
                    <div key={category.id}>
                      <h4 className="font-medium text-gray-900 text-sm mb-2">{category.name}</h4>
                      <div className="space-y-1">
                        {category.skills.map((skill: Skill) => (
                          <div key={skill.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700">{skill.name}</span>
                            <button
                              onClick={() => toggleMetric(skill.id)}
                              className="text-red-500 hover:text-red-700 text-xs sm:text-sm px-2 py-1"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={saveMetrics}
              disabled={!templateName || selectedMetrics.length === 0 || saving}
              className="w-full mt-4 sm:mt-6 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Saving...' : `Save (${selectedMetrics.length} metrics)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
