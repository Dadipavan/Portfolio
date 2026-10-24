// "Save my contact": a vCard 3.0 file built from the personal details.
import { getProfiles } from './profiles';
import type { PersonalInfo } from './types';

const escapeValue = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

// Lines longer than 75 characters are folded, as the format requires
function fold(line: string): string {
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75));
    rest = ` ${rest.slice(75)}`;
  }
  parts.push(rest);
  return parts.join('\r\n');
}

export function buildVCard(info: PersonalInfo, siteUrl = ''): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    // the whole name goes in the given-name slot: we cannot know where a family name starts
    `N:;${escapeValue(info.name)};;;`,
    `FN:${escapeValue(info.name)}`,
    info.title ? `TITLE:${escapeValue(info.title)}` : '',
    info.email ? `EMAIL;TYPE=INTERNET:${escapeValue(info.email)}` : '',
    info.phone ? `TEL;TYPE=CELL:${escapeValue(info.phone)}` : '',
    siteUrl ? `URL:${siteUrl}` : '',
    ...getProfiles(info).map(
      (profile) =>
        `URL;TYPE=${profile.label.replace(/[^A-Za-z0-9-]/g, '') || 'Profile'}:${profile.url}`
    ),
    info.location ? `ADR;TYPE=HOME:;;${escapeValue(info.location)};;;;` : '',
    'END:VCARD',
  ].filter(Boolean);

  return lines.map(fold).join('\r\n') + '\r\n';
}
