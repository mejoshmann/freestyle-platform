import { supabase } from './supabase'

export interface MediaUploadResult {
  url: string
  path: string
  error?: string
}

export interface MediaItem {
  id: string
  athlete_id: string
  athlete_name?: string
  coach_id?: string
  storage_path: string
  public_url: string
  description?: string
  tags: string[]
  created_at: string
  type: 'image' | 'video'
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
}

export async function uploadAthleteMedia(
  athleteId: string,
  athleteName: string,
  file: File,
  metadata?: {
    coachId?: string
    description?: string
    tags?: string[]
  }
): Promise<MediaUploadResult> {
  const isVideo = file.type.startsWith('video/')
  const isImage = file.type.startsWith('image/')
  
  if (!isVideo && !isImage) {
    return { url: '', path: '', error: 'File must be an image or video' }
  }
  
  const bucket = isVideo ? 'athlete-videos' : 'athlete-photos'
  const table = isVideo ? 'athlete_videos' : 'athlete_photos'
  const timestamp = Date.now()
  const sanitizedName = sanitizeFileName(athleteName)
  const extension = file.name.split('.').pop() || (isVideo ? 'webm' : 'jpg')
  const filename = `${athleteId}/${sanitizedName}_${timestamp}.${extension}`
  
  // Upload to Supabase Storage
  let uploadResult
  try {
    uploadResult = await supabase
      .storage
      .from(bucket)
      .upload(filename, file, {
        contentType: file.type,
        upsert: false
      })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown upload error'
    console.error('Upload error (exception):', err)
    throw new Error(`Storage upload failed: ${errorMsg}`)
  }
  
  if (uploadResult.error) {
    console.error('Upload error:', uploadResult.error)
    throw new Error(`Storage upload failed: ${uploadResult.error.message}`)
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from(bucket)
    .getPublicUrl(filename)
  
  // Save metadata to database
  let dbResult
  try {
    dbResult = await supabase
      .from(table)
      .insert({
        athlete_id: athleteId,
        storage_path: filename,
        public_url: publicUrl,
        coach_id: metadata?.coachId,
        description: metadata?.description || `${sanitizedName}_${timestamp}`,
        tags: metadata?.tags || [sanitizedName],
        created_at: new Date().toISOString()
      })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown database error'
    console.error('Database error (exception):', err)
    console.error(`CRITICAL: Storage upload succeeded but database insert failed. File: ${filename} in bucket: ${bucket}`)
    throw new Error(`Database insert failed after successful upload: ${errorMsg}`)
  }
  
  if (dbResult.error) {
    console.error('Database error:', dbResult.error)
    console.error(`CRITICAL: Storage upload succeeded but database insert failed. File: ${filename} in bucket: ${bucket}`)
    throw new Error(`Database insert failed after successful upload: ${dbResult.error.message}`)
  }
  
  return { url: publicUrl, path: filename }
}

export async function getAthleteMedia(athleteId: string): Promise<MediaItem[]> {
  // Fetch videos
  const { data: videos, error: videoError } = await supabase
    .from('athlete_videos')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false })
  
  if (videoError) {
    console.error('Error fetching videos:', videoError)
  }
  
  // Fetch photos
  const { data: photos, error: photoError } = await supabase
    .from('athlete_photos')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false })
  
  if (photoError) {
    console.error('Error fetching photos:', photoError)
  }
  
  // Combine and sort by date
  const mediaItems: MediaItem[] = [
    ...(videos || []).map(v => ({ ...v, type: 'video' as const })),
    ...(photos || []).map(p => ({ ...p, type: 'image' as const }))
  ]
  
  return mediaItems.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export async function deleteAthleteMedia(
  mediaId: string, 
  storagePath: string, 
  type: 'image' | 'video'
): Promise<{ success: boolean; error?: string }> {
  const bucket = type === 'video' ? 'athlete-videos' : 'athlete-photos'
  const table = type === 'video' ? 'athlete_videos' : 'athlete_photos'
  
  // Delete from storage
  const { error: storageError } = await supabase
    .storage
    .from(bucket)
    .remove([storagePath])
  
  if (storageError) {
    console.error('Storage delete error:', storageError)
    return { success: false, error: storageError.message }
  }
  
  // Delete from database
  const { error: dbError } = await supabase
    .from(table)
    .delete()
    .eq('id', mediaId)
  
  if (dbError) {
    console.error('Database delete error:', dbError)
    return { success: false, error: dbError.message }
  }
  
  return { success: true }
}

export default { uploadAthleteMedia, getAthleteMedia, deleteAthleteMedia }
