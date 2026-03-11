interface EvalHeaderProps {
  athleteName: string
  evaluatedCount: number
  totalCount: number
  skippedCount: number
}

export default function EvalHeader({ athleteName, evaluatedCount, totalCount, skippedCount }: EvalHeaderProps) {
  return (
    <div className="flex items-center mb-4 sm:mb-6 pb-4 sm:pb-6 border-b">
      <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-blue-100 flex items-center justify-center">
        <span className="text-xl sm:text-2xl text-blue-600 font-bold">
          {athleteName.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="ml-3 sm:ml-4">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900">{athleteName}</h2>
        <p className="text-sm text-gray-500">
          {evaluatedCount} of {totalCount} skills evaluated
          {skippedCount > 0 && ` (${skippedCount} skipped)`}
        </p>
      </div>
    </div>
  )
}
