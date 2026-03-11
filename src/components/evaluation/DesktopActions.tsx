interface DesktopActionsProps {
  onSave: () => void
  onCancel: () => void
}

export default function DesktopActions({ onSave, onCancel }: DesktopActionsProps) {
  return (
    <div className="hidden sm:flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
      <button
        onClick={onSave}
        className="flex-1 py-3 sm:py-2 px-4 bg-blue-600 text-white rounded-lg sm:rounded hover:bg-blue-700 font-medium"
      >
        Save Evaluation
      </button>
      <button
        onClick={onCancel}
        className="py-3 sm:py-2 px-4 border border-gray-300 text-gray-700 rounded-lg sm:rounded hover:bg-gray-50"
      >
        Cancel
      </button>
    </div>
  )
}
