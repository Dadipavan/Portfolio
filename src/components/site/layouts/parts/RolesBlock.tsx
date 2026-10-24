'use client';

import RolePipeline from '../../blocks/RolePipeline';
import { usePortfolio } from '../../PortfolioProvider';

// The role pipeline with its small heading: the pair every look shows under the introduction (nothing when no
// roles are set up in Admin > Roles).
export default function RolesBlock({
  className = '',
  headingClassName = '',
}: {
  className?: string;
  headingClassName?: string;
}) {
  const { model, t } = usePortfolio();
  if (model.roleStats.length === 0) return null;

  return (
    <div className={`roles-block ${className}`}>
      <h2 className={`mono-label mb-3 ${headingClassName}`}>{t('hero.rolesHeading')}</h2>
      <RolePipeline />
    </div>
  );
}
