// Data management utilities for local storage
import { 
  PERSONAL_INFO, 
  TECHNICAL_SKILLS, 
  PROJECTS, 
  EXPERIENCE, 
  EDUCATION, 
  CERTIFICATIONS, 
  ACHIEVEMENTS 
} from './data';

export interface PortfolioData {
  personalInfo: typeof PERSONAL_INFO;
  technicalSkills: typeof TECHNICAL_SKILLS;
  projects: typeof PROJECTS;
  experience: typeof EXPERIENCE;
  education: typeof EDUCATION;
  certifications: typeof CERTIFICATIONS;
  achievements: typeof ACHIEVEMENTS;
  lastUpdated: string;
}

const STORAGE_KEY = 'portfolio_data';

// Initialize with default data if not exists
export function initializeData(): void {
  if (typeof window === 'undefined') return;
  
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    const defaultData: PortfolioData = {
      personalInfo: PERSONAL_INFO,
      technicalSkills: TECHNICAL_SKILLS,
      projects: PROJECTS,
      experience: EXPERIENCE,
      education: EDUCATION,
      certifications: CERTIFICATIONS,
      achievements: ACHIEVEMENTS,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  }
}

// Get all portfolio data
export function getPortfolioData(): PortfolioData | null {
  if (typeof window === 'undefined') return null;
  
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Update specific section
export function updatePortfolioSection<K extends keyof Omit<PortfolioData, 'lastUpdated'>>(
  section: K,
  data: PortfolioData[K]
): void {
  if (typeof window === 'undefined') return;
  
  const currentData = getPortfolioData();
  if (!currentData) return;
  
  const updatedData = {
    ...currentData,
    [section]: data,
    lastUpdated: new Date().toISOString(),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
}

// Backup data to JSON file
export function exportData(): void {
  const data = getPortfolioData();
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
export function importData(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        resolve(true);
      } catch {
        resolve(false);
      }
    };
    reader.readAsText(file);
  });
}

// Clear all data and reset to defaults
export function resetToDefaults(): void {
  localStorage.removeItem(STORAGE_KEY);
  initializeData();
}