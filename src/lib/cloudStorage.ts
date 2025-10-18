// Cloud file storage service using Supabase
import { supabase, RESUME_BUCKET, UPLOAD_CONFIG } from './supabase'

export interface CloudFile {
  id: string
  name: string
  originalName: string
  size: number
  type: string
  url: string
  uploadedAt: string
}

export class CloudStorageService {
  
  // Upload file to Supabase storage
  static async uploadFile(file: File, fileName?: string): Promise<CloudFile> {
    try {
      // Validate file
      this.validateFile(file)
      
      // Generate unique filename
      const uniqueFileName = fileName || this.generateFileName(file)
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(RESUME_BUCKET)
        .upload(uniqueFileName, file)

      if (error) {
        throw new Error(`Upload failed: ${error.message}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(RESUME_BUCKET)
        .getPublicUrl(uniqueFileName)

      const cloudFile: CloudFile = {
        id: data.path,
        name: uniqueFileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        uploadedAt: new Date().toISOString()
      }

      return cloudFile
    } catch (error) {
      console.error('File upload error:', error)
      throw error
    }
  }

  // Download file from cloud storage
  static async downloadFile(fileName: string): Promise<Blob> {
    try {
      const { data, error } = await supabase.storage
        .from(RESUME_BUCKET)
        .download(fileName)

      if (error) {
        throw new Error(`Download failed: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('File download error:', error)
      throw error
    }
  }

  // Delete file from cloud storage
  static async deleteFile(fileName: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(RESUME_BUCKET)
        .remove([fileName])

      if (error) {
        throw new Error(`Delete failed: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('File delete error:', error)
      return false
    }
  }

  // List all files in storage
  static async listFiles(): Promise<CloudFile[]> {
    try {
      const { data, error } = await supabase.storage
        .from(RESUME_BUCKET)
        .list()

      if (error) {
        throw new Error(`List files failed: ${error.message}`)
      }

      return data.map(file => ({
        id: file.name,
        name: file.name,
        originalName: file.name,
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || 'application/octet-stream',
        url: this.getPublicUrl(file.name),
        uploadedAt: file.created_at || new Date().toISOString()
      }))
    } catch (error) {
      console.error('List files error:', error)
      return []
    }
  }

  // Get public URL for a file
  static getPublicUrl(fileName: string): string {
    const { data } = supabase.storage
      .from(RESUME_BUCKET)
      .getPublicUrl(fileName)
    
    return data.publicUrl
  }

  // Validate file before upload
  private static validateFile(file: File): void {
    // Check file size
    if (file.size > UPLOAD_CONFIG.maxFileSize) {
      throw new Error(`File size exceeds ${UPLOAD_CONFIG.maxFileSize / 1024 / 1024}MB limit`)
    }

    // Check file type
    if (!UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`)
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!UPLOAD_CONFIG.allowedExtensions.includes(extension)) {
      throw new Error(`File extension ${extension} is not allowed`)
    }
  }

  // Generate unique filename
  private static generateFileName(file: File): string {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '_')
    
    return `${baseName}_${timestamp}_${randomString}.${extension}`
  }

  // Get file info without downloading
  static async getFileInfo(fileName: string): Promise<CloudFile | null> {
    try {
      const { data, error } = await supabase.storage
        .from(RESUME_BUCKET)
        .list('', {
          search: fileName
        })

      if (error || !data.length) {
        return null
      }

      const file = data[0]
      return {
        id: file.name,
        name: file.name,
        originalName: file.name,
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || 'application/octet-stream',
        url: this.getPublicUrl(file.name),
        uploadedAt: file.created_at || new Date().toISOString()
      }
    } catch (error) {
      console.error('Get file info error:', error)
      return null
    }
  }
}