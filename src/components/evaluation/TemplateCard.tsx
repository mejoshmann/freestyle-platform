import type { EvaluationTemplate } from '../../types'

interface TemplateCardProps {
  template: EvaluationTemplate
  onSelect?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export default function TemplateCard({ template, onSelect, onEdit, onDelete }: TemplateCardProps) {
  // Group skills by category if available
  const categories = template.categories || []
  
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
        {template.description && (
          <p className="mt-1 text-sm text-gray-500">{template.description}</p>
        )}
        
        {/* Show categories with skills */}
        <div className="mt-3 space-y-2">
          {categories.length > 0 ? (
            categories.map((cat) => (
              <div key={cat.id} className="text-sm">
                <span className="font-medium text-gray-700">{cat.name}:</span>
                <span className="text-gray-500 ml-1">
                  {cat.skills.map(s => s.name).join(', ')}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400">
              {template.skills.length} metrics
            </p>
          )}
        </div>
        
        <div className="mt-4 flex space-x-2">
          {onSelect && (
            <button
              onClick={onSelect}
              className="flex-1 py-2 px-3 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Use Template
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="py-2 px-3 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="py-2 px-3 border border-red-300 text-red-600 text-sm rounded hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
