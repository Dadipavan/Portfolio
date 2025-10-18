// Enhanced resume manager with cloud storage support
import { CloudStorageService, CloudFile } from './cloudStorage'
import { Resume, getPortfolioData, updatePortfolioSection } from './dataManager'

export class ResumeManager {
  
  // Upload resume to cloud storage
  static async uploadResumeToCloud(
    file: File, 
    name: string, 
    description: string
  ): Promise<Resume> {
    try {
      // Upload file to Supabase
      const cloudFile: CloudFile = await CloudStorageService.uploadFile(file)
      
      // Create resume record
      const resume: Resume = {
        id: this.generateId(),
        name,
        description,
        fileName: file.name,
        fileSize: this.formatFileSize(file.size),
        fileType: file.type,
        uploadDate: new Date().toISOString(),
        cloudFileName: cloudFile.name,
        cloudUrl: cloudFile.url,
        storageType: 'cloud'
      }
      
      // Save to portfolio data
      await this.saveResumeRecord(resume)
      
      return resume
    } catch (error) {
      console.error('Cloud upload error:', error)
      throw error
    }
  }
  
  // Upload resume locally (fallback)
  static async uploadResumeLocally(
    file: File, 
    name: string, 
    description: string
  ): Promise<Resume> {
    try {
      // Convert file to base64
      const fileData = await this.convertFileToBase64(file)
      
      // Create resume record
      const resume: Resume = {
        id: this.generateId(),
        name,
        description,
        fileName: file.name,
        fileSize: this.formatFileSize(file.size),
        fileType: file.type,
        uploadDate: new Date().toISOString(),
        fileData,
        storageType: 'local'
      }
      
      // Save to portfolio data
      await this.saveResumeRecord(resume)
      
      return resume
    } catch (error) {
      console.error('Local upload error:', error)
      throw error
    }
  }
  
  // Smart upload - tries cloud first, falls back to local
  static async uploadResume(
    file: File, 
    name: string, 
    description: string,
    preferCloud: boolean = true
  ): Promise<Resume> {
    if (preferCloud) {
      try {
        return await this.uploadResumeToCloud(file, name, description)
      } catch (error) {
        console.warn('Cloud upload failed, falling back to local storage:', error)
        return await this.uploadResumeLocally(file, name, description)
      }
    } else {
      return await this.uploadResumeLocally(file, name, description)
    }
  }
  
  // Download resume
  static async downloadResume(resume: Resume): Promise<void> {
    try {
      let blob: Blob
      let fileName = resume.fileName
      
      if (resume.storageType === 'cloud' && resume.cloudFileName) {
        // Download from cloud
        blob = await CloudStorageService.downloadFile(resume.cloudFileName)
      } else if (resume.fileData) {
        // Download from local base64 data
        blob = this.base64ToBlob(resume.fileData, resume.fileType)
      } else {
        throw new Error('No file data available for download')
      }
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Download error:', error)
      throw error
    }
  }
  
  // Delete resume
  static async deleteResume(resume: Resume): Promise<boolean> {
    try {
      // Delete from cloud storage if applicable
      if (resume.storageType === 'cloud' && resume.cloudFileName) {
        await CloudStorageService.deleteFile(resume.cloudFileName)
      }
      
      // Remove from portfolio data
      const data = await getPortfolioData()
      if (data?.resumes) {
        const updatedResumes = data.resumes.filter(r => r.id !== resume.id)
        await updatePortfolioSection('resumes', updatedResumes)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Delete error:', error)
      return false
    }
  }
  
  // Get all resumes
  static async getAllResumes(): Promise<Resume[]> {
    const data = await getPortfolioData()
    return data?.resumes || []
  }
  
  // Get resume by ID
  static async getResumeById(id: string): Promise<Resume | null> {
    const resumes = await this.getAllResumes()
    return resumes.find(r => r.id === id) || null
  }
  
  // Update resume metadata
  static async updateResume(id: string, updates: Partial<Resume>): Promise<boolean> {
    try {
      const data = await getPortfolioData()
      if (data?.resumes) {
        const resumeIndex = data.resumes.findIndex(r => r.id === id)
        if (resumeIndex !== -1) {
          data.resumes[resumeIndex] = { ...data.resumes[resumeIndex], ...updates }
          await updatePortfolioSection('resumes', data.resumes)
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Update error:', error)
      return false
    }
  }
  
  // Migrate local resumes to cloud
  static async migrateToCloud(): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0
    
    try {
      const resumes = await this.getAllResumes()
      const localResumes = resumes.filter(r => r.storageType === 'local' && r.fileData)
      
      for (const resume of localResumes) {
        try {
          // Convert base64 to file
          const blob = this.base64ToBlob(resume.fileData!, resume.fileType)
          const file = new File([blob], resume.fileName, { type: resume.fileType })
          
          // Upload to cloud
          const cloudFile = await CloudStorageService.uploadFile(file)
          
          // Update resume record
          await this.updateResume(resume.id, {
            cloudFileName: cloudFile.name,
            cloudUrl: cloudFile.url,
            storageType: 'cloud',
            fileData: undefined // Remove base64 data to save space
          })
          
          success++
        } catch (error) {
          console.error(`Failed to migrate resume ${resume.id}:`, error)
          failed++
        }
      }
      
    } catch (error) {
      console.error('Migration error:', error)
    }
    
    return { success, failed }
  }
  
  // Utility methods
  private static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }
  
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  private static async convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  
  private static base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64.split(',')[1])
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }
  
  private static async saveResumeRecord(resume: Resume): Promise<void> {
    const data = await getPortfolioData()
    if (data) {
      const updatedResumes = [...(data.resumes || []), resume]
      await updatePortfolioSection('resumes', updatedResumes)
    }
  }
}