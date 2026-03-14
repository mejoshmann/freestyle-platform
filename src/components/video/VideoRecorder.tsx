import { useState, useRef, useCallback } from 'react'

interface VideoRecorderProps {
  onVideoRecorded: (videoBlob: Blob) => void
  onCancel: () => void
}

export default function VideoRecorder({ onVideoRecorded, onCancel }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)

  const startRecording = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true
      })
      
      streamRef.current = mediaStream
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }

      const mediaRecorder = new MediaRecorder(mediaStream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const videoUrl = URL.createObjectURL(blob)
        setRecordedVideo(videoUrl)
        
        // Stop all tracks
        mediaStream.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Could not access camera. Please ensure you have given permission.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const saveVideo = useCallback(() => {
    if (chunksRef.current.length > 0) {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      onVideoRecorded(blob)
    }
  }, [onVideoRecorded])

  const retake = useCallback(() => {
    setRecordedVideo(null)
    chunksRef.current = []
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-bold mb-4">Record Video</h3>
      
      <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '16/9' }}>
        {recordedVideo ? (
          <video
            src={recordedVideo}
            controls
            className="w-full h-full"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
        
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-bold">REC</span>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-4">
        {!recordedVideo ? (
          <>
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 font-bold"
              >
                <div className="w-4 h-4 bg-white rounded-full" />
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-full hover:bg-gray-900 font-bold"
              >
                <div className="w-4 h-4 bg-red-500 rounded-sm" />
                Stop
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={retake}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 font-bold"
            >
              Retake
            </button>
            <button
              onClick={saveVideo}
              className="px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 font-bold"
            >
              Save Video
            </button>
          </>
        )}
        
        <button
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
