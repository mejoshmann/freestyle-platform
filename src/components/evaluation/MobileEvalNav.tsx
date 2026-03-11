import VoiceRecorder from './VoiceRecorder'
import MediaCapture from './MediaCapture'

interface MobileEvalNavProps {
  onBackToRoster: () => void
  onVoiceNote: (audioUrl: string) => void
  onCaptureMedia: (file: File) => void
}

export default function MobileEvalNav({ onBackToRoster, onVoiceNote, onCaptureMedia }: MobileEvalNavProps) {
  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 pb-safe z-50 lg:hidden">
        <div className="flex items-center justify-around">
          {/* Back to Roster */}
          <button
            onClick={onBackToRoster}
            className="flex flex-col items-center p-2 text-gray-600 hover:text-blue-600 active:text-blue-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="text-xs mt-1">Roster</span>
          </button>

          {/* Voice Note */}
          <VoiceRecorder onRecordingComplete={onVoiceNote} />

          {/* Capture Media */}
          <MediaCapture onCapture={onCaptureMedia} />
        </div>
      </div>

      {/* Spacer for bottom nav */}
      <div className="h-20 lg:hidden" />
    </>
  )
}
