import { createClient } from '@supabase/supabase-js'

// Create a client for image storage operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export interface StoredImage {
  id: string
  session_id: string
  original_url: string
  stored_url: string
  filename: string
  prompt: string
  file_size: number
  mime_type: string
  created_at: string
}

export class ImageStorageService {
  /**
   * Download and store a DALL-E image permanently
   */
  async storeDalleImage(
    dalleUrl: string, 
    sessionId: string, 
    prompt: string
  ): Promise<StoredImage | null> {
    try {
      console.log('📥 Downloading DALL-E image:', dalleUrl)
      
      // Download the image
      const response = await fetch(dalleUrl)
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
      }
      
      const imageBuffer = await response.arrayBuffer()
      const imageData = new Uint8Array(imageBuffer)
      
      // Generate filename
      const timestamp = Date.now()
      const filename = `dalle-${sessionId}-${timestamp}.png`
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('session-images')
        .upload(filename, imageData, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) {
        console.error('❌ Failed to upload image to storage:', uploadError)
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('session-images')
        .getPublicUrl(filename)
      
      const storedUrl = urlData.publicUrl
      
      // Save metadata to database
      const { data: imageRecord, error: dbError } = await supabase
        .from('session_images')
        .insert({
          session_id: sessionId,
          original_url: dalleUrl,
          stored_url: storedUrl,
          filename: filename,
          prompt: prompt,
          file_size: imageData.length,
          mime_type: 'image/png'
        })
        .select()
        .single()
      
      if (dbError) {
        console.error('❌ Failed to save image metadata:', dbError)
        // Clean up the uploaded file
        await supabase.storage.from('session-images').remove([filename])
        throw new Error(`Database save failed: ${dbError.message}`)
      }
      
      console.log('✅ Image stored successfully:', storedUrl)
      return imageRecord as StoredImage
      
    } catch (error) {
      console.error('💥 Failed to store DALL-E image:', error)
      return null
    }
  }
  
  /**
   * Get stored images for a session
   */
  async getSessionImages(sessionId: string): Promise<StoredImage[]> {
    try {
      const { data, error } = await supabase
        .from('session_images')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('❌ Failed to fetch session images:', error)
        return []
      }
      
      return data as StoredImage[]
    } catch (error) {
      console.error('💥 Error fetching session images:', error)
      return []
    }
  }
  
  /**
   * Delete a stored image
   */
  async deleteStoredImage(imageId: string): Promise<boolean> {
    try {
      // Get image record first
      const { data: imageRecord, error: fetchError } = await supabase
        .from('session_images')
        .select('filename')
        .eq('id', imageId)
        .single()
      
      if (fetchError || !imageRecord) {
        console.error('❌ Failed to fetch image record:', fetchError)
        return false
      }
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('session-images')
        .remove([imageRecord.filename])
      
      if (storageError) {
        console.error('❌ Failed to delete image from storage:', storageError)
        // Continue with database deletion even if storage deletion fails
      }
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('session_images')
        .delete()
        .eq('id', imageId)
      
      if (dbError) {
        console.error('❌ Failed to delete image from database:', dbError)
        return false
      }
      
      console.log('✅ Image deleted successfully')
      return true
      
    } catch (error) {
      console.error('💥 Error deleting image:', error)
      return false
    }
  }
  
  /**
   * Clean up orphaned images (images without valid sessions)
   */
  async cleanupOrphanedImages(): Promise<number> {
    try {
      // Find orphaned images
      const { data: orphanedImages, error: fetchError } = await supabase
        .from('session_images')
        .select('id, filename')
        .not('session_id', 'in', 
          supabase
            .from('learning_sessions')
            .select('id')
        )
      
      if (fetchError) {
        console.error('❌ Failed to find orphaned images:', fetchError)
        return 0
      }
      
      if (!orphanedImages || orphanedImages.length === 0) {
        return 0
      }
      
      console.log(`🧹 Found ${orphanedImages.length} orphaned images to clean up`)
      
      // Delete from storage
      const filenames = orphanedImages.map(img => img.filename)
      const { error: storageError } = await supabase.storage
        .from('session-images')
        .remove(filenames)
      
      if (storageError) {
        console.error('❌ Failed to delete orphaned images from storage:', storageError)
      }
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('session_images')
        .delete()
        .in('id', orphanedImages.map(img => img.id))
      
      if (dbError) {
        console.error('❌ Failed to delete orphaned images from database:', dbError)
        return 0
      }
      
      console.log(`✅ Cleaned up ${orphanedImages.length} orphaned images`)
      return orphanedImages.length
      
    } catch (error) {
      console.error('💥 Error cleaning up orphaned images:', error)
      return 0
    }
  }
}

// Export singleton instance
export const imageStorage = new ImageStorageService()
