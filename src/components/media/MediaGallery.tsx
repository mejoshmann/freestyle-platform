import { useState, useEffect } from 'react'
import { getAthleteMedia, deleteAthleteMedia, type MediaItem } from '../../lib/media'

interface MediaGalleryProps {
  athleteId: string
  isCoach: boolean
}

export default function MediaGallery({ athleteId, isCoach }: MediaGalleryProps) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)

  const loadMedia = async () => {
    setLoading(true)
    const data = await getAthleteMedia(athleteId)
    setMedia(data)
    setLoading(false)
  }

  useEffect(() => {
    loadMedia()
  }, [athleteId])

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Are you sure you want to delete this ${item.type}?`)) return
    
    const result = await deleteAthleteMedia(item.id, item.storage_path, item.type)
    if (result.success) {
      setMedia(media.filter(m => m.id !== item.id))
    } else {
      alert(`Failed to delete ${item.type}: ` + result.error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const images = media.filter(m => m.type === 'image')
  const videos = media.filter(m => m.type === 'video')

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg mb-2">No media yet</p>
        <p className="text-sm">Capture photos or videos during evaluations to see them here</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Images Section */}
      {images.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3">Photos ({images.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((image) => (
              <div key={image.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div 
                  className="relative aspect-square bg-gray-100 cursor-pointer"
                  onClick={() => setSelectedMedia(image)}
                >
                  <img
                    src={image.public_url}
                    alt={image.description || 'Athlete photo'}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="p-2">
                  <p className="text-xs text-gray-600">{formatDate(image.created_at)}</p>
                  {isCoach && (
                    <button
                      onClick={() => handleDelete(image)}
                      className="mt-1 text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videos Section */}
      {videos.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3">Videos ({videos.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {videos.map((video) => (
              <div key={video.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div 
                  className="relative aspect-video bg-black cursor-pointer"
                  onClick={() => setSelectedMedia(video)}
                >
                  <video
                    src={video.public_url}
                    className="w-full h-full object-cover"
                    preload="metadata"
                    crossOrigin="anonymous"
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
                  {isCoach && (
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
        </div>
      )}

      {/* Media Modal */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div className="max-w-4xl w-full">
            {selectedMedia.type === 'video' ? (
              <video
                src={selectedMedia.public_url}
                controls
                autoPlay
                className="w-full rounded-lg"
                crossOrigin="anonymous"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={selectedMedia.public_url}
                alt={selectedMedia.description || 'Athlete photo'}
                className="w-full rounded-lg max-h-[80vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <button
              onClick={() => setSelectedMedia(null)}
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
