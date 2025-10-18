// Production-ready data management utilities
import { 
  PERSONAL_INFO, 
  TECHNICAL_SKILLS, 
  PROJECTS, 
  EXPERIENCE, 
  EDUCATION, 
  CERTIFICATIONS, 
  ACHIEVEMENTS 
} from './data';

export interface Resume {
  id: string;
  name: string;
  description: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  fileData?: string;
  fileType: string;
}

export interface PortfolioData {
  personalInfo: typeof PERSONAL_INFO;
  technicalSkills: typeof TECHNICAL_SKILLS;
  projects: typeof PROJECTS;
  experience: typeof EXPERIENCE;
  education: typeof EDUCATION;
  certifications: typeof CERTIFICATIONS;
  achievements: typeof ACHIEVEMENTS;
  resumes: Resume[];
  lastUpdated: string;
}

const STORAGE_KEY = 'portfolio_data';
const isProduction = process.env.NODE_ENV === 'production';
const isClient = typeof window !== 'undefined';

// Default data factory
function getDefaultData(): PortfolioData {
  return {
    personalInfo: PERSONAL_INFO,
    technicalSkills: TECHNICAL_SKILLS,
    projects: PROJECTS,
    experience: EXPERIENCE,
    education: EDUCATION,
    certifications: CERTIFICATIONS,
    achievements: ACHIEVEMENTS,
    resumes: [],
    lastUpdated: new Date().toISOString(),
  };
}

// Initialize with default data if not exists
export function initializeData(): void {
  if (isProduction || !isClient) return;
  
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getDefaultData()));
  }
}

// Get all portfolio data (production-aware)
export async function getPortfolioData(): Promise<PortfolioData | null> {
  try {
    if (isProduction) {
      // Production: fetch from API
      const response = await fetch('/api/portfolio-data');
      if (response.ok) {
        return await response.json();
      }
      return null;
    } else {
      // Development: use localStorage
      if (!isClient) return null;
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    return null;
  }
}

// Synchronous version for backward compatibility (development only)
export function getPortfolioDataSync(): PortfolioData | null {
  if (isProduction || !isClient) return null;
  
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Update specific section (production-aware)
export async function updatePortfolioSection<K extends keyof Omit<PortfolioData, 'lastUpdated'>>(
  section: K,
  data: PortfolioData[K]
): Promise<boolean> {
  try {
    const currentData = await getPortfolioData();
    if (!currentData) return false;
    
    const updatedData = {
      ...currentData,
      [section]: data,
      lastUpdated: new Date().toISOString(),
    };
    
    if (isProduction) {
      // Production: save via API
      const response = await fetch('/api/portfolio-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      return response.ok;
    } else {
      // Development: use localStorage
      if (!isClient) return false;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      return true;
    }
  } catch (error) {
    console.error('Error updating portfolio section:', error);
    return false;
  }
}

// Synchronous version for backward compatibility (development only)
export function updatePortfolioSectionSync<K extends keyof Omit<PortfolioData, 'lastUpdated'>>(
  section: K,
  data: PortfolioData[K]
): void {
  if (isProduction || !isClient) return;
  
  const currentData = getPortfolioDataSync();
  if (!currentData) return;
  
  const updatedData = {
    ...currentData,
    [section]: data,
    lastUpdated: new Date().toISOString(),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
}

// Backup data to JSON file
export async function exportData(): Promise<void> {
  const data = await getPortfolioData();
  if (!data) return;
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `portfolio_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import data from JSON file
export async function importData(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (isProduction) {
          // Production: save via API
          const response = await fetch('/api/portfolio-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          resolve(response.ok);
        } else {
          // Development: use localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          resolve(true);
        }
      } catch {
        resolve(false);
      }
    };
    reader.readAsText(file);
  });
}

// Clear all data and reset to defaults
export async function resetToDefaults(): Promise<boolean> {
  try {
    if (isProduction) {
      // Production: reset via API
      const response = await fetch('/api/portfolio-data', {
        method: 'DELETE',
      });
      return response.ok;
    } else {
      // Development: clear localStorage
      if (!isClient) return false;
      localStorage.removeItem(STORAGE_KEY);
      initializeData();
      return true;
    }
  } catch (error) {
    console.error('Error resetting data:', error);
    return false;
  }
}

// Synchronous version for backward compatibility (development only)
export function resetToDefaultsSync(): void {
  if (isProduction || !isClient) return;
  localStorage.removeItem(STORAGE_KEY);
  initializeData();
}

// Migration helper: Update existing code to use async functions
export function migrateToAsyncAPI() {
  if (isProduction) {
    console.warn('Portfolio is running in production mode. All data operations are now async.');
    console.warn('Please update your code to use await with getPortfolioData() and updatePortfolioSection()');
  }
}