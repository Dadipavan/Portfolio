'use client';

import {
  Brain,
  ChartColumn,
  Cloud,
  CodeXml,
  Cpu,
  Database,
  FlaskConical,
  Layers,
  Sparkles,
  Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { RoleIconId } from '@/lib/types';
import { usePortfolio } from './PortfolioProvider';

const ICONS: Record<RoleIconId, LucideIcon> = {
  database: Database,
  chart: ChartColumn,
  flask: FlaskConical,
  cpu: Cpu,
  brain: Brain,
  code: CodeXml,
  cloud: Cloud,
  layers: Layers,
  target: Target,
  sparkles: Sparkles,
};

// The icon chosen for a role in Admin > Roles (a neutral one for "no role")
export default function RoleIcon({ id, className }: { id: string; className?: string }) {
  const { model } = usePortfolio();
  const icon = model.roles.get(id)?.icon;
  const Icon = icon ? ICONS[icon] : Layers;
  return <Icon aria-hidden="true" className={className} />;
}
