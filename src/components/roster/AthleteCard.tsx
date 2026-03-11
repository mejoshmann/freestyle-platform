interface AthleteCardProps {
  id: string
  name: string
  imageUrl?: string
  stats: {
    label: string
    value: string
  }[]
  onClick: () => void
  onDelete?: () => void
}

export default function AthleteCard({ name, imageUrl, stats, onClick, onDelete }: AthleteCardProps) {
  return (
    <div 
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden active:bg-gray-50 group"
    >
      <div className="flex items-center p-3 sm:p-4">
        <div 
          onClick={onClick}
          className="flex-shrink-0 cursor-pointer"
        >
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={name}
              className="h-12 w-12 sm:h-16 sm:w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xl sm:text-2xl text-gray-500">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div 
          onClick={onClick}
          className="ml-3 sm:ml-4 flex-1 min-w-0 cursor-pointer"
        >
          <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">{name}</h3>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {stats.map((stat, index) => (
              <div key={index} className="text-xs sm:text-sm">
                <span className="text-gray-500">{stat.label}:</span>
                <span className="ml-1 font-medium text-gray-900">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="ml-2 flex items-center space-x-1">
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100"
              title="Delete athlete"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <div onClick={onClick} className="text-gray-400 cursor-pointer">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
