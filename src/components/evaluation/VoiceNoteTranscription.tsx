import { useState, useCallback } from 'react'
import { transcribeWithWebSpeech, transcribeWithWhisper } from '../../lib/speechToText'

interface VoiceNoteTranscriptionProps {
  voiceNoteUrl: string
  evaluationId: string
  existingTranscription?: string
  onTranscriptionSaved?: (text: string) => void
}

export default function VoiceNoteTranscription({
  voiceNoteUrl,
  existingTranscription,
  onTranscriptionSaved
}: VoiceNoteTranscriptionProps) {
  const [transcription, setTranscription] = useState(existingTranscription || '')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useWhisper, setUseWhisper] = useState(false)

  const handleTranscribe = useCallback(async () => {
    setIsTranscribing(true)
    setError(null)

    try {
      const response = await fetch(voiceNoteUrl)
      const blob = await response.blob()

      let text: string
      if (useWhisper) {
        text = await transcribeWithWhisper(blob)
      } else {
        text = await transcribeWithWebSpeech(blob)
      }

      setTranscription(text)
      onTranscriptionSaved?.(text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed')
    } finally {
      setIsTranscribing(false)
    }
  }, [voiceNoteUrl, useWhisper, onTranscriptionSaved])

  const handleEdit = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTranscription(e.target.value)
  }, [])

  const handleSave = useCallback(() => {
    onTranscriptionSaved?.(transcription)
  }, [transcription, onTranscriptionSaved])

  return (
    <div className="bg-gray-50 rounded-lg p-4 mt-2">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-700">Voice Transcription</h4>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useWhisper}
              onChange={(e) => setUseWhisper(e.target.checked)}
              className="rounded"
            />
            Use Whisper (better accuracy)
          </label>
          
          {!transcription && (
            <button
              onClick={handleTranscribe}
              disabled={isTranscribing}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isTranscribing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Transcribing...
                </span>
              ) : (
                'Transcribe'
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-3 text-sm">
          {error}
        </div>
      )}

      {transcription ? (
        <div className="space-y-3">
          <textarea
            value={transcription}
            onChange={handleEdit}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Transcription will appear here..."
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={handleTranscribe}
              disabled={isTranscribing}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
            >
              Retranscribe
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm italic">
          Click "Transcribe" to convert voice note to text
        </p>
      )}

      <div className="mt-3 text-xs text-gray-500">
        {useWhisper ? (
          <span>Uses OpenAI Whisper API (requires API key)</span>
        ) : (
          <span>Uses browser's built-in speech recognition (free, works offline)</span>
        )}
      </div>
    </div>
  )
}
