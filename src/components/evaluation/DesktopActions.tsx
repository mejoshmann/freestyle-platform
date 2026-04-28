import { MediaCaptureButton, MediaUploadButton } from './MediaCapture'

interface DesktopActionsProps {
  onSave: () => void
  onCancel: () => void
  onCaptureMedia?: (file: File) => void
  onUploadMedia?: (file: File) => void
}

export default function DesktopActions({ onSave, onCancel, onCaptureMedia, onUploadMedia }: DesktopActionsProps) {
  return (
    <div className="hidden sm:flex flex-col space-y-4">
      {/* Media Actions */}
      {(onCaptureMedia || onUploadMedia) && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <span className="block text-sm font-medium text-gray-700 mb-3">Add Media</span>
          <div className="flex items-center space-x-3">
            {onCaptureMedia && <MediaCaptureButton onCapture={onCaptureMedia} />}
            {onUploadMedia && <MediaUploadButton onCapture={onUploadMedia} />}
          </div>
        </div>
      )}
      
      {/* Save/Cancel Actions */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
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
    </div>
  )
}
