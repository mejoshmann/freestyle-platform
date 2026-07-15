import { supabase } from './supabase'

// ── Types ────────────────────────────────────────────────────────────────────

export interface UploadSignature {
  signature: string
  timestamp: number
  apiKey: string
  cloudName: string
  folder: string
  eager?: string
}

export interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
}

// ── 1. getUploadSignature ────────────────────────────────────────────────────

export async function getUploadSignature(
  athleteId: string,
  resourceType: 'image' | 'video',
): Promise<UploadSignature> {
  const { data, error } = await supabase.functions.invoke('cloudinary-sign', {
    body: { athleteId, resourceType },
  })

  if (error) {
    throw new Error(`Failed to get upload signature: ${error.message}`)
  }

  return data as UploadSignature
}

// ── 2. uploadToCloudinary ────────────────────────────────────────────────────

export async function uploadToCloudinary(
  file: File,
  athleteId: string,
  resourceType: 'image' | 'video',
): Promise<CloudinaryUploadResult> {
  const sig = await getUploadSignature(athleteId, resourceType)

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', sig.apiKey)
  formData.append('timestamp', String(sig.timestamp))
  formData.append('signature', sig.signature)
  formData.append('folder', sig.folder)

  if (sig.eager) {
    formData.append('eager', sig.eager)
  }

  const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => 'unknown error')
    throw new Error(
      `Cloudinary upload failed (${response.status}): ${text}`,
    )
  }

  const result = await response.json()

  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
  }
}

// ── 3. getOptimizedUrl ───────────────────────────────────────────────────────

export function getOptimizedUrl(publicUrl: string): string {
  if (!publicUrl.includes('res.cloudinary.com')) {
    return publicUrl
  }

  // Insert f_auto,q_auto right after /upload/
  return publicUrl.replace('/upload/', '/upload/f_auto,q_auto/')
}

// ── 4. extractPublicId ───────────────────────────────────────────────────────

export function extractPublicId(cloudinaryUrl: string): string {
  // Match everything after /upload/v{digits}/ and strip the file extension
  const match = cloudinaryUrl.match(/\/upload\/v\d+\/(.+?)(?:\.[^/.]+)?$/)
  if (!match) {
    throw new Error(`Unable to extract public_id from URL: ${cloudinaryUrl}`)
  }
  return match[1]
}

// ── 5. deleteFromCloudinary ──────────────────────────────────────────────────

export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video',
): Promise<{ success: boolean }> {
  const { data, error } = await supabase.functions.invoke('cloudinary-delete', {
    body: { publicId, resourceType },
  })

  if (error) {
    throw new Error(`Failed to delete from Cloudinary: ${error.message}`)
  }

  return { success: true }
}
