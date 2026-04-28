interface MediaCaptureProps {
  onCapture: (file: File) => void
}

export function MediaCaptureButton({ onCapture }: MediaCaptureProps) {
  function handleCapture() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,video/*'
    input.capture = 'environment'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        onCapture(file)
      }
    }
    input.click()
  }

  return (
    <button
      onClick={handleCapture}
      className="flex flex-col items-center p-2 text-gray-600 hover:text-blue-600 active:text-blue-700 transition-colors"
      title="Capture photo/video with camera"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      <span className="text-xs mt-1">Record</span>
    </button>
  )
}

export function MediaUploadButton({ onCapture }: MediaCaptureProps) {
  function handleUpload() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,video/*'
    // No capture attribute - opens device gallery/file picker
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        onCapture(file)
      }
    }
    input.click()
  }

  return (
    <button
      onClick={handleUpload}
      className="flex flex-col items-center p-2 text-gray-600 hover:text-blue-600 active:text-blue-700 transition-colors"
      title="Upload from gallery"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span className="text-xs mt-1">Upload</span>
    </button>
  )
}

// Default export for backward compatibility
export default function MediaCapture({ onCapture }: MediaCaptureProps) {
  return <MediaCaptureButton onCapture={onCapture} />
}
