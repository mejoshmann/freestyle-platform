import { useState, useEffect } from 'react'
import { getAthleteVideos, deleteAthleteVideo } from '../../lib/video'
import { useAuth } from '../../context/AuthContext'
import type { AthleteVideo } from '../../types'

interface VideoGalleryProps {
  athleteId: string
  isCoach: boolean
}

export default function VideoGallery({ athleteId, isCoach }: VideoGalleryProps) {
  const { coach } = useAuth()
  const [videos, setVideos] = useState<AthleteVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<AthleteVideo | null>(null)
  const [videoError, setVideoError] = useState(false)

  useEffect(() => {
    loadVideos()
  }, [athleteId])

  const loadVideos = async () => {
    setLoading(true)
    const data = await getAthleteVideos(athleteId)
    setVideos(data)
    setLoading(false)
  }

  const handleDelete = async (video: AthleteVideo) => {
    if (!confirm('Are you sure you want to delete this video?')) return
    
    try {
      const result = await deleteAthleteVideo(video.id, video.storage_path)
      if (result.success) {
        setVideos(prev => prev.filter(v => v.id !== video.id))
      } else {
        alert('Failed to delete video: ' + result.error)
      }
    } catch (err) {
      console.error('Unexpected delete error:', err)
      alert('Failed to delete video: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg mb-2">No videos yet</p>
        <p className="text-sm">Record videos during evaluations to see them here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Videos ({videos.length})</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {videos.map((video) => (
          <div key={video.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div 
              className="relative aspect-video bg-black cursor-pointer"
              onClick={() => {
                setVideoError(false)
                setSelectedVideo(video)
              }}
            >
              <video
                src={video.public_url}
                className="w-full h-full object-cover"
                preload="metadata"
                playsInline
                muted
                onError={(e) => console.error('Video thumbnail error:', e.currentTarget.error?.code, e.currentTarget.error?.message, video.public_url)}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors">
                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 5.84a.75.75 0 00-1.06 1.06l4.78 4.78-4.78 4.78a.75.75 0 101.06 1.06l5.25-5.25a.75.75 0 000-1.06L6.3 5.84z" />
                    <path d="M13.3 5.84a.75.75 0 00-1.06 1.06l4.78 4.78-4.78 4.78a.75.75 0 101.06 1.06l5.25-5.25a.75.75 0 000-1.06L13.3 5.84z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="p-3">
              <p className="text-sm text-gray-600">{formatDate(video.created_at)}</p>
              {video.description && (
                <p className="text-sm text-gray-800 mt-1 line-clamp-2">{video.description}</p>
              )}
              {isCoach && video.coach_id === coach?.id && (
                <button
                  onClick={() => handleDelete(video)}
                  className="mt-2 text-xs text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div className="max-w-4xl w-full">
            {videoError ? (
              <div className="bg-gray-900 rounded-lg p-8 text-center" onClick={(e) => e.stopPropagation()}>
                <p className="text-white text-lg mb-4">This video format is not supported in your browser</p>
                <a
                  href={selectedVideo.public_url}
                  download
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Download Video
                </a>
              </div>
            ) : (
              <video
                src={selectedVideo.public_url}
                controls
                autoPlay
                playsInline
                className="w-full rounded-lg"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  console.error('Video playback error:', e.currentTarget.error?.code, e.currentTarget.error?.message)
                  setVideoError(true)
                }}
              />
            )}
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
