import { supabase } from './supabase'

export interface VideoUploadResult {
  url: string
  path: string
  error?: string
}

export async function uploadAthleteVideo(
  athleteId: string,
  videoBlob: Blob,
  metadata?: {
    coachId?: string
    description?: string
    tags?: string[]
  }
): Promise<VideoUploadResult> {
  // Generate unique filename
  const timestamp = Date.now()
  const filename = `${athleteId}/${timestamp}.webm`
  
  // Upload to Supabase Storage
  let uploadResult
  try {
    uploadResult = await supabase
      .storage
      .from('athlete-videos')
      .upload(filename, videoBlob, {
        contentType: 'video/webm',
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
    .from('athlete-videos')
    .getPublicUrl(filename)
  
  // Save video metadata to database
  let dbResult
  try {
    dbResult = await supabase
      .from('athlete_videos')
      .insert({
        athlete_id: athleteId,
        storage_path: filename,
        public_url: publicUrl,
        coach_id: metadata?.coachId,
        description: metadata?.description,
        tags: metadata?.tags || [],
        created_at: new Date().toISOString()
      })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown database error'
    console.error('Database error (exception):', err)
    console.error(`CRITICAL: Storage upload succeeded but database insert failed. File: ${filename} in bucket: athlete-videos`)
    throw new Error(`Database insert failed after successful upload: ${errorMsg}`)
  }
  
  if (dbResult.error) {
    console.error('Database error:', dbResult.error)
    console.error(`CRITICAL: Storage upload succeeded but database insert failed. File: ${filename} in bucket: athlete-videos`)
    throw new Error(`Database insert failed after successful upload: ${dbResult.error.message}`)
  }
  
  return { url: publicUrl, path: filename }
}

export async function getAthleteVideos(athleteId: string) {
  const { data, error } = await supabase
    .from('athlete_videos')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching videos:', error)
    return []
  }
  
  return data || []
}

export async function deleteAthleteVideo(videoId: string, storagePath: string) {
  // Delete from database FIRST — if RLS blocks this, we don't want to orphan the storage file
  const { data: deletedRows, error: dbError } = await supabase
    .from('athlete_videos')
    .delete()
    .eq('id', videoId)
    .select('id')  // returns deleted rows so we can verify the delete succeeded
  
  if (dbError) {
    console.error('Database delete error:', dbError)
    return { success: false, error: dbError.message }
  }
  
  // If no rows were deleted, RLS policy blocked the operation (returns 200 with empty array, no error)
  if (!deletedRows || deletedRows.length === 0) {
    return { success: false, error: 'Permission denied — you can only delete videos you uploaded.' }
  }
  
  // Now delete the file from storage
  const { error: storageError } = await supabase
    .storage
    .from('athlete-videos')
    .remove([storagePath])
  
  if (storageError) {
    // DB record is already deleted, but storage file remains — log as warning
    console.warn('Storage delete failed (DB record already removed):', storageError)
    // Still return success since the DB record was removed
  }
  
  return { success: true }
}

export default { uploadAthleteVideo, getAthleteVideos, deleteAthleteVideo }
