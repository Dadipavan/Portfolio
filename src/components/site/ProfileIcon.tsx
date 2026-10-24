import { Github, Globe, Linkedin } from 'lucide-react';
import type { Profile } from '@/lib/profiles';

// The icon for a profile link: the real logo for GitHub and LinkedIn, a globe for anything else
export default function ProfileIcon({
  kind,
  className,
}: {
  kind: Profile['kind'];
  className?: string;
}) {
  const Icon = kind === 'github' ? Github : kind === 'linkedin' ? Linkedin : Globe;
  return <Icon aria-hidden="true" className={className} />;
}
