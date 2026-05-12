interface EvalHeaderProps {
  athleteName: string
  evaluatedCount: number
  onClose?: () => void
}

export default function EvalHeader({ athleteName, onClose }: EvalHeaderProps) {
  return (
    <div className="flex items-center mb-4 sm:mb-6 pb-4 sm:pb-6 border-b">
      <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-blue-100 flex items-center justify-center">
        <span className="text-xl sm:text-2xl text-blue-600 font-bold">
          {athleteName.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="ml-3 sm:ml-4 flex-1">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900">{athleteName}</h2>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          aria-label="Close evaluation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
