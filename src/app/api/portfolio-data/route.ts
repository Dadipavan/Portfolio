// API route for portfolio data management
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'portfolio.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(DATA_FILE_PATH);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Default data structure
const getDefaultData = () => ({
  personalInfo: {
    name: 'Sai Pavan Dadipavan',
    title: 'Full Stack Developer',
    email: 'saipavandadipavan@gmail.com',
    phone: '+91-9381626123',
    location: 'Hyderabad, India',
    github: 'https://github.com/dadipavan',
    linkedin: 'https://linkedin.com/in/sai-pavan-dadipavan',
    portfolio: 'https://sai-pavan-portfolio.vercel.app'
  },
  technicalSkills: [],
  projects: [],
  experience: [],
  education: [],
  certifications: [],
  achievements: [],
  resumes: [],
  lastUpdated: new Date().toISOString(),
});

// GET: Read portfolio data
export async function GET() {
  try {
    await ensureDataDirectory();
    
    try {
      const fileContent = await fs.readFile(DATA_FILE_PATH, 'utf-8');
      const data = JSON.parse(fileContent);
      return NextResponse.json(data);
    } catch (error) {
      // If file doesn't exist, return default data
      const defaultData = getDefaultData();
      await fs.writeFile(DATA_FILE_PATH, JSON.stringify(defaultData, null, 2));
      return NextResponse.json(defaultData);
    }
  } catch (error) {
    console.error('Error reading portfolio data:', error);
    return NextResponse.json(getDefaultData());
  }
}

// POST: Update portfolio data
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    await ensureDataDirectory();
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving portfolio data:', error);
    return NextResponse.json({ success: false, error: 'Failed to save data' }, { status: 500 });
  }
}

// DELETE: Reset to default data
export async function DELETE() {
  try {
    await ensureDataDirectory();
    const defaultData = getDefaultData();
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(defaultData, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting portfolio data:', error);
    return NextResponse.json({ success: false, error: 'Failed to reset data' }, { status: 500 });
  }
}