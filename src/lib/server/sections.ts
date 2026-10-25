// Shared constants/validation for portfolio_data sections (server only)

export const PORTFOLIO_TABLE = 'portfolio_data';

export const PORTFOLIO_SECTIONS = [
  'personalInfo',
  'technicalSkills',
  'projects',
  'experience',
  'education',
  'certifications',
  'achievements',
  'moments',
  'quickFacts',
  'currentFocus',
  'recommendations',
  'siteSettings',
  'resumes',
] as const;

export type PortfolioSection = (typeof PORTFOLIO_SECTIONS)[number];

export function isPortfolioSection(value: unknown): value is PortfolioSection {
  return typeof value === 'string' && (PORTFOLIO_SECTIONS as readonly string[]).includes(value);
}

// Section payloads are JSON objects or arrays and stay well under 1 MB.
const MAX_PAYLOAD_BYTES = 1_000_000;

export function isValidSectionPayload(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false;
  try {
    return JSON.stringify(value).length <= MAX_PAYLOAD_BYTES;
  } catch {
    return false;
  }
}
