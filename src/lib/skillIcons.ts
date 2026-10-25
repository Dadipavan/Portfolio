// A clean line icon for a skill category, chosen from the words in its name (the emoji typed in the admin is not used).
import {
  BrainCircuit,
  Cloud,
  Code,
  Database,
  Globe,
  Layers,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const RULES: [RegExp, LucideIcon][] = [
  [/soft|people|leader|team|communicat/i, Users],
  [/machine|learning|\bml\b|\bai\b|neural|science|deep/i, BrainCircuit],
  [/analy|model|statist|visuali|insight|predict/i, TrendingUp],
  [/language|programming|coding|script/i, Code],
  [/web|front|back|framework|ui\b|ux\b/i, Globe],
  [/mobile|android|ios|app\b/i, Smartphone],
  [/cloud|devops|deploy|infra/i, Cloud],
  [/secur|cyber|network/i, ShieldCheck],
  [/database|sql|data\b|storage|warehouse/i, Database],
  [/tool|platform|software|tech/i, Wrench],
];

export function skillIconFor(category: string): LucideIcon {
  return RULES.find(([pattern]) => pattern.test(category))?.[1] ?? Layers;
}
