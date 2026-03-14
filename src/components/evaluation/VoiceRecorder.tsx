import { useState, useRef, useCallback } from 'react'

interface VoiceRecorderProps {
  onRecordingComplete: (audioUrl: string, transcription?: string) => void
}

export default function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef('')

  const startRecording = useCallback(async () => {
    try {
      // Initialize Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'
        
        transcriptRef.current = ''
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' '
            }
          }
          if (finalTranscript) {
            transcriptRef.current += finalTranscript
          }
        }
        
        recognitionRef.current.start()
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(blob)
        
        // Stop speech recognition
        if (recognitionRef.current) {
          recognitionRef.current.stop()
        }
        
        // Return both audio and transcription
        onRecordingComplete(audioUrl, transcriptRef.current.trim() || undefined)
        stream.getTracks().forEach(track => track.stop())
        setIsTranscribing(false)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsTranscribing(!!recognitionRef.current)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
      alert('Could not access microphone. Please check permissions.')
    }
  }, [onRecordingComplete])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setRecordingTime(0)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <button
      onClick={toggleRecording}
      disabled={isTranscribing && !isRecording}
      className={`flex flex-col items-center p-2 transition-colors ${
        isRecording 
          ? 'text-red-600' 
          : isTranscribing
          ? 'text-amber-600'
          : 'text-red-500 hover:text-red-600'
      }`}
    >
      <div className={`rounded-full p-2 ${
        isRecording ? 'bg-red-200 animate-pulse' : 
        isTranscribing ? 'bg-amber-100' : 
        'bg-red-100'
      }`}>
        {isTranscribing && !isRecording ? (
          <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </div>
      <span className="text-xs mt-1 font-medium">
        {isRecording ? formatTime(recordingTime) : 
         isTranscribing ? 'Processing...' : 
         'Voice'}
      </span>
    </button>
  )
}

export function RecordingIndicator() {
  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full flex items-center space-x-2 z-50 animate-pulse">
      <div className="w-2 h-2 bg-white rounded-full" />
      <span className="text-sm font-medium">Recording...</span>
    </div>
  )
}
