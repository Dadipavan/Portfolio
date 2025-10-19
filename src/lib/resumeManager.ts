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
      
      if (resume.storageType === 'cloud') {
        if (resume.cloudFileName) {
          // Download from Supabase storage using cloudFileName
          blob = await CloudStorageService.downloadFile(resume.cloudFileName)
        } else if (resume.cloudUrl) {
          // Fallback: Download from public URL (for imported cloud files)
          const response = await fetch(resume.cloudUrl)
          if (!response.ok) {
            throw new Error(`Failed to download from URL: ${response.statusText}`)
          }
          blob = await response.blob()
        } else {
          throw new Error('No cloud file reference available for download')
        }
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
      
      console.log(`Successfully downloaded: ${fileName}`)
      
    } catch (error) {
      console.error('Download error:', error)
      throw error
    }
  }
  
  // Delete resume
  static async deleteResume(resume: Resume): Promise<boolean> {
    try {
      console.log('🗑️ Deleting resume:', resume.name, '| Storage:', resume.storageType);

      // Always use server API for proper deletion (handles both cloud and database)
      try {
        const res = await fetch(`/api/resumes/delete/${resume.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            console.log('✅ Resume deleted via server API');
            return true;
          } else {
            console.error('Server delete API error:', json.error);
          }
        } else {
          console.error('Server delete API failed with status:', res.status);
        }
      } catch (err) {
        console.error('Server delete API request failed:', err);
      }

      // Fallback: attempt client-side deletion (for local files only)
      console.log('⚠️ Falling back to client-side deletion');
      const data = await getPortfolioData();
      if (data?.resumes && Array.isArray(data.resumes)) {
        const updatedResumes = data.resumes.filter(r => r.id !== resume.id);
        await updatePortfolioSection('resumes', updatedResumes);
        console.log('✅ Resume removed via client fallback');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }
  
  // Get all resumes
  static async getAllResumes(): Promise<Resume[]> {
    try {
      const data = await getPortfolioData()
      console.log('📊 Portfolio data structure:', data)
      
      // Handle different data structures
      if (data?.resumes && Array.isArray(data.resumes)) {
        return data.resumes
      }
      
      // Initialize empty resumes array if not found
      console.log('⚠️ No resumes found in portfolio data, initializing empty array')
      return []
    } catch (error) {
      console.error('Error in getAllResumes:', error)
      return []
    }
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
      if (data?.resumes && Array.isArray(data.resumes)) {
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

  // Create a resume record from existing cloud file metadata
  static async uploadResumeFromCloud(cloudMeta: { name: string; publicUrl?: string; size?: number; mimeType?: string }): Promise<Resume> {
    try {
      const resume: Resume = {
        id: this.generateId(),
        name: cloudMeta.name,
        description: 'Imported from cloud storage',
        fileName: cloudMeta.name,
        fileSize: this.formatFileSize(cloudMeta.size || 0),
        fileType: cloudMeta.mimeType || 'application/octet-stream',
        uploadDate: new Date().toISOString(),
        cloudFileName: cloudMeta.name,
        cloudUrl: cloudMeta.publicUrl,
        storageType: 'cloud'
      }

      await this.saveResumeRecord(resume)
      return resume
    } catch (error) {
      console.error('Import cloud file error:', error)
      throw error
    }
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
    try {
      const data = await getPortfolioData()
      console.log('📊 Data structure for saveResumeRecord:', data)
      console.log('📊 data.resumes type:', typeof data?.resumes, 'isArray:', Array.isArray(data?.resumes))
      
      if (data) {
        // Ensure resumes is always an array - handle all edge cases
        let existingResumes: Resume[] = []
        
        if (data.resumes === null || data.resumes === undefined) {
          console.log('⚠️ data.resumes is null/undefined, initializing empty array')
          existingResumes = []
        } else if (Array.isArray(data.resumes)) {
          console.log('✅ data.resumes is array with', data.resumes.length, 'items')
          existingResumes = data.resumes
        } else {
          console.log('⚠️ data.resumes is not array, type:', typeof data.resumes, 'value:', data.resumes)
          existingResumes = []
        }
        
        const updatedResumes = [...existingResumes, resume]
        await updatePortfolioSection('resumes', updatedResumes)
        console.log('💾 Resume record saved:', resume.name)
      } else {
        console.error('❌ No portfolio data found')
      }
    } catch (error) {
      console.error('❌ Error in saveResumeRecord:', error)
      throw error
    }
  }
}