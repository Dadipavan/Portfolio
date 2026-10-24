'use client';

import { usePortfolio } from './PortfolioProvider';

interface RoleSwitchProps {
  label?: string;
  className?: string;
  // centre the label and the buttons (for the centred look)
  center?: boolean;
}

// "View as": choosing a role changes the projects, skills, headline and resume shown
export default function RoleSwitch({ label, className = '', center = false }: RoleSwitchProps) {
  const { role, setRole, settings, model, t } = usePortfolio();
  if (!settings.features.roleSwitch || model.roles.isEmpty) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${center ? 'justify-center' : ''} ${className}`}
    >
      <span className="mono-label mr-1">{label ?? t('hero.viewAs')}</span>
      <div
        role="group"
        aria-label={label ?? t('hero.viewAs')}
        className={`flex flex-wrap gap-2 ${center ? 'justify-center' : ''}`}
      >
        {model.roles.switchOptions.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={role === id}
            onClick={() => setRole(id)}
            className="pill"
          >
            {id === 'all' ? t('role.all') : model.roles.title(id)}
          </button>
        ))}
      </div>
    </div>
  );
}
