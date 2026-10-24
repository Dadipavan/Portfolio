// The profile links shown across the site: GitHub and LinkedIn from Personal info, then any other
// profiles the admin has added (Kaggle, Medium, LeetCode, Hugging Face, ...).
import type { PersonalInfo } from './types';

export interface Profile {
  id: string;
  label: string;
  url: string;
  kind: 'github' | 'linkedin' | 'other';
}

export function getProfiles(info: Pick<PersonalInfo, 'github' | 'linkedin' | 'links'>): Profile[] {
  const profiles: Profile[] = [];
  if (info.github)
    profiles.push({ id: 'github', label: 'GitHub', url: info.github, kind: 'github' });
  if (info.linkedin)
    profiles.push({ id: 'linkedin', label: 'LinkedIn', url: info.linkedin, kind: 'linkedin' });
  (info.links ?? []).forEach((link, index) => {
    if (link.url && link.label)
      profiles.push({ id: `link-${index}`, label: link.label, url: link.url, kind: 'other' });
  });
  return profiles;
}
