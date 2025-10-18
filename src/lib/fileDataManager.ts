// File-based data management for production deployment
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

// Environment-aware data management
const isProduction = process.env.NODE_ENV === 'production';
const isClient = typeof window !== 'undefined';

// Default data structure
const getDefaultData = (): PortfolioData => ({
  personalInfo: PERSONAL_INFO,
  technicalSkills: TECHNICAL_SKILLS,
  projects: PROJECTS,
  experience: EXPERIENCE,
  education: EDUCATION,
  certifications: CERTIFICATIONS,
  achievements: ACHIEVEMENTS,
  resumes: [],
  lastUpdated: new Date().toISOString(),
});

// Production: Use API endpoints, Development: Use localStorage
export async function getPortfolioData(): Promise<PortfolioData | null> {
  try {
    if (isProduction) {
      // In production, fetch from API
      const response = await fetch('/api/portfolio-data');
      if (response.ok) {
        return await response.json();
      }
      return getDefaultData();
    } else {
      // Development: use localStorage
      if (!isClient) return getDefaultData();
      const data = localStorage.getItem('portfolio_data');
      return data ? JSON.parse(data) : getDefaultData();
    }
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    return getDefaultData();
  }
}

export async function updatePortfolioData(data: PortfolioData): Promise<boolean> {
  try {
    data.lastUpdated = new Date().toISOString();
    
    if (isProduction) {
      // In production, save via API
      const response = await fetch('/api/portfolio-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } else {
      // Development: use localStorage
      if (!isClient) return false;
      localStorage.setItem('portfolio_data', JSON.stringify(data));
      return true;
    }
  } catch (error) {
    console.error('Error updating portfolio data:', error);
    return false;
  }
}

export async function updatePortfolioSection(
  section: keyof Omit<PortfolioData, 'lastUpdated'>,
  sectionData: any
): Promise<boolean> {
  try {
    const currentData = await getPortfolioData();
    if (!currentData) return false;

    const updatedData = {
      ...currentData,
      [section]: sectionData,
      lastUpdated: new Date().toISOString(),
    };

    return await updatePortfolioData(updatedData);
  } catch (error) {
    console.error('Error updating portfolio section:', error);
    return false;
  }
}

// Initialize data (for development)
export function initializeData(): void {
  if (isProduction || !isClient) return;
  
  const existing = localStorage.getItem('portfolio_data');
  if (!existing) {
    localStorage.setItem('portfolio_data', JSON.stringify(getDefaultData()));
  }
}