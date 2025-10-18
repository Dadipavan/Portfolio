// Data management utilities for database storage with localStorage fallback
import { 
  PERSONAL_INFO, 
  TECHNICAL_SKILLS, 
  PROJECTS, 
  EXPERIENCE, 
  EDUCATION, 
  CERTIFICATIONS, 
  ACHIEVEMENTS,
  QUICK_FACTS,
  CURRENT_FOCUS
} from './data';

export interface Resume {
  id: string;
  name: string;
  description: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  fileData?: string; // Base64 data (fallback for local storage)
  fileType: string;
  // Cloud storage fields
  cloudFileName?: string; // Unique filename in cloud storage
  cloudUrl?: string; // Public URL for cloud file
  storageType: 'local' | 'cloud'; // Storage location indicator
}

export interface PortfolioData {
  personalInfo: typeof PERSONAL_INFO;
  technicalSkills: typeof TECHNICAL_SKILLS;
  projects: typeof PROJECTS;
  experience: typeof EXPERIENCE;
  education: typeof EDUCATION;
  certifications: typeof CERTIFICATIONS;
  achievements: typeof ACHIEVEMENTS;
  quickFacts: typeof QUICK_FACTS;
  currentFocus: typeof CURRENT_FOCUS;
  resumes: Resume[];
  lastUpdated: string;
}

const STORAGE_KEY = 'portfolio_data';

// Check if localStorage is available
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// Get default data
export function getDefaultData(): PortfolioData {
  return {
    personalInfo: PERSONAL_INFO,
    technicalSkills: TECHNICAL_SKILLS,
    projects: PROJECTS,
    experience: EXPERIENCE,
    education: EDUCATION,
    certifications: CERTIFICATIONS,
    achievements: ACHIEVEMENTS,
    quickFacts: QUICK_FACTS,
    currentFocus: CURRENT_FOCUS,
    resumes: [],
    lastUpdated: new Date().toISOString(),
  };
}

// Load portfolio data from database API
async function loadFromDatabase(): Promise<PortfolioData | null> {
  try {
    console.log('🔄 Loading portfolio data from database...');
    
    const response = await fetch('/api/portfolio/data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('❌ Database load failed:', response.status, response.statusText);
      return null;
    }
    
    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('✅ Data loaded from database successfully');
      return result.data;
    }
    
    console.warn('⚠️ No data returned from database');
    return null;
  } catch (error) {
    console.error('❌ Database load failed:', error);
    return null;
  }
}

// Save portfolio data to database API
async function saveToDatabase(data: PortfolioData): Promise<boolean> {
  try {
    console.log('🔄 Saving portfolio data to database...');
    
    const response = await fetch('/api/portfolio/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });
    
    if (!response.ok) {
      console.error('❌ Database save failed:', response.status, response.statusText);
      return false;
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Data saved to database successfully');
      return true;
    }
    
    console.error('❌ Database save returned error:', result.error);
    return false;
  } catch (error) {
    console.error('❌ Database save failed:', error);
    return false;
  }
}

// Save specific section to database API
async function saveSectionToDatabase(section: string, data: any): Promise<boolean> {
  try {
    console.log(`🔄 Saving section ${section} to database...`);
    
    const response = await fetch(`/api/portfolio/sections?section=${section}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      console.error('❌ Database section save failed:', response.status, response.statusText);
      return false;
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Section ${section} saved to database successfully`);
      return true;
    }
    
    console.error(`❌ Database section save returned error:`, result.error);
    return false;
  } catch (error) {
    console.error(`❌ Database section save failed:`, error);
    return false;
  }
}

// Initialize with default data if not exists (now checks database)
export function initializeData(): void {
  // In database mode, initialization happens on the server side
  // This function is kept for backward compatibility
  console.log('📋 Data initialization handled by database');
}

// Get all portfolio data with database fallback to localStorage and default data
export async function getPortfolioData(): Promise<PortfolioData> {
  try {
    // First try to load from database
    const databaseData = await loadFromDatabase();
    if (databaseData) {
      // Also update localStorage as backup if available
      if (isLocalStorageAvailable()) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(databaseData));
      }
      return databaseData;
    }
  } catch (error) {
    console.warn('Database load failed, trying localStorage fallback:', error);
  }
  
  // Fallback to localStorage if database fails
  if (isLocalStorageAvailable()) {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        console.log('✅ Loaded portfolio data from localStorage fallback');
        return parsed;
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }
  
  // Final fallback to default data
  console.warn('Using default data as final fallback');
  return getDefaultData();
}

// Synchronous version that returns default data (for SSR/initial renders)
export function getPortfolioDataSync(): PortfolioData {
  if (!isLocalStorageAvailable()) {
    return getDefaultData();
  }
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return getDefaultData();
    }
    
    const parsed = JSON.parse(data);
    return parsed;
  } catch (error) {
    console.error('Error loading portfolio data sync:', error);
    return getDefaultData();
  }
}

// Helper function to notify UI about data updates
function notifyDataUpdate(section?: string): void {
  if (typeof window !== 'undefined') {
    console.log(`📢 Notifying UI of data update${section ? ` for ${section}` : ''}`);
    window.dispatchEvent(new CustomEvent('portfolioDataUpdated', { 
      detail: { section, timestamp: new Date().toISOString() }
    }));
  }
}

// Update specific section with database persistence and localStorage backup
export async function updatePortfolioSection<K extends keyof Omit<PortfolioData, 'lastUpdated'>>(
  section: K,
  data: PortfolioData[K]
): Promise<boolean> {
  try {
    // Save to database first
    const dbSuccess = await saveSectionToDatabase(section, data);
    
    if (dbSuccess) {
      // Also update localStorage as backup if available
      if (isLocalStorageAvailable()) {
        try {
          const currentData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
          const updatedData = {
            ...currentData,
            [section]: data,
            lastUpdated: new Date().toISOString(),
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
        } catch (error) {
          console.warn('localStorage backup update failed:', error);
        }
      }
      
      // Notify UI components about the update
      notifyDataUpdate(section);
      
      console.log(`✅ Section ${section} updated successfully`);
      return true;
    } else {
      console.error(`❌ Failed to update section ${section}`);
      return false;
    }
  } catch (error) {
    console.error(`Error updating ${section} section:`, error);
    return false;
  }
}

// Enhanced get portfolio data with database sync
export async function getPortfolioDataWithCloudSync(): Promise<PortfolioData> {
  // This function is now the same as getPortfolioData since we use database by default
  return await getPortfolioData();
}

// Backup data to JSON file
export function exportData(): void {
  getPortfolioData().then(data => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }).catch(error => {
    console.error('Export failed:', error);
  });
}

// Import data from JSON file
export function importData(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Save to database
        const success = await saveToDatabase(data);
        
        if (success && isLocalStorageAvailable()) {
          // Also update localStorage as backup
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
        
        resolve(success);
      } catch (error) {
        console.error('Import failed:', error);
        resolve(false);
      }
    };
    reader.readAsText(file);
  });
}

// Clear all data and reset to defaults
export async function resetToDefaults(): Promise<boolean> {
  try {
    const defaultData = getDefaultData();
    const success = await saveToDatabase(defaultData);
    
    if (success && isLocalStorageAvailable()) {
      localStorage.removeItem(STORAGE_KEY);
    }
    
    return success;
  } catch (error) {
    console.error('Reset to defaults failed:', error);
    return false;
  }
}