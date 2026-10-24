// Resume management for the admin panel. All writes go through authenticated server routes.
import { Resume, getPortfolioData, getPortfolioDataForEditing, notifyOpenPages, updatePortfolioSection } from './dataManager';

export class ResumeManager {
  // Upload a file through the server, which stores it in Supabase Storage and saves the record
  static async uploadResume(file: File, name: string, description: string): Promise<Resume> {
    const form = new FormData();
    form.append('file', file);
    form.append('name', name);
    form.append('description', description);

    const response = await fetch('/api/resumes/upload', { method: 'POST', body: form });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Upload failed');
    }
    notifyOpenPages();
    return result.resume as Resume;
  }

  // Download a resume from its public storage URL
  static async downloadResume(resume: Resume): Promise<void> {
    if (!resume.cloudUrl) {
      throw new Error('No file available for download');
    }

    try {
      const response = await fetch(resume.cloudUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = resume.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // If the browser blocks the download request, open the file directly instead
      window.open(resume.cloudUrl, '_blank', 'noopener,noreferrer');
    }
  }

  // Delete the stored file and the resume record
  static async deleteResume(resume: Resume): Promise<boolean> {
    try {
      const response = await fetch(`/api/resumes/delete/${encodeURIComponent(resume.id)}`, {
        method: 'DELETE',
      });
      const result = await response.json().catch(() => ({}));
      const ok = response.ok && Boolean(result.success);
      if (ok) notifyOpenPages();
      return ok;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  static async getAllResumes(): Promise<Resume[]> {
    try {
      const data = await getPortfolioData();
      return Array.isArray(data?.resumes) ? data.resumes : [];
    } catch (error) {
      console.error('Error loading resumes:', error);
      return [];
    }
  }

  // The saved resumes, read strictly: if they cannot be loaded this throws instead of returning an empty
  // list, so a failed load can never be saved over the real records
  static async getStoredResumes(): Promise<Resume[]> {
    const data = await getPortfolioDataForEditing();
    return Array.isArray(data.resumes) ? data.resumes : [];
  }

  // Update resume metadata (name, description, role, ...)
  static async updateResume(id: string, updates: Partial<Resume>): Promise<boolean> {
    try {
      const resumes = await this.getStoredResumes();
      if (!resumes.some((r) => r.id === id)) return false;

      return await updatePortfolioSection(
        'resumes',
        resumes.map((r) => (r.id === id ? { ...r, ...updates } : r))
      );
    } catch (error) {
      console.error('Updating the resume failed:', error);
      return false;
    }
  }

  // Show a resume to visitors or hide it. Several can be public at once (for example one per role).
  static async setResumePublic(id: string, isPublic: boolean): Promise<boolean> {
    return this.updateResume(id, { isPublic });
  }

  // Create a resume record from a file that already exists in the storage bucket
  static async uploadResumeFromCloud(cloudMeta: {
    name: string;
    publicUrl?: string;
    size?: number;
    mimeType?: string;
  }): Promise<Resume> {
    const resume: Resume = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 11),
      name: cloudMeta.name,
      description: 'Imported from cloud storage',
      fileName: cloudMeta.name,
      fileSize: this.formatFileSize(cloudMeta.size || 0),
      fileType: cloudMeta.mimeType || 'application/octet-stream',
      uploadDate: new Date().toISOString(),
      cloudFileName: cloudMeta.name,
      cloudUrl: cloudMeta.publicUrl,
      storageType: 'cloud',
      isPublic: false,
    };

    const resumes = await this.getStoredResumes();
    if (!(await updatePortfolioSection('resumes', [...resumes, resume]))) {
      throw new Error('Failed to save resume record');
    }
    return resume;
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
