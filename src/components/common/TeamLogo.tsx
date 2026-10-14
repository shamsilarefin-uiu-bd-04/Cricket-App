import React, { useState } from 'react';
import { Team } from '../../types/cricket';

interface TeamLogoProps {
  team?: Team | { name?: string; logoEmoji?: string; logoUrl?: string; primaryColor?: string };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  rounded?: 'full' | 'xl' | '2xl';
}

const sizeClasses: Record<string, { container: string; text: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-xs' },
  sm: { container: 'w-8 h-8', text: 'text-sm' },
  md: { container: 'w-10 h-10', text: 'text-base' },
  lg: { container: 'w-12 h-12', text: 'text-xl' },
  xl: { container: 'w-14 h-14', text: 'text-2xl' },
  '2xl': { container: 'w-20 h-20', text: 'text-4xl' }
};

export const TeamLogo: React.FC<TeamLogoProps> = ({
  team,
  size = 'md',
  className = '',
  rounded = '2xl'
}) => {
  const [hasError, setHasError] = useState(false);
  const sizeConfig = sizeClasses[size] || sizeClasses.md;

  const roundedClass =
    rounded === 'full' ? 'rounded-full' : rounded === 'xl' ? 'rounded-xl' : 'rounded-2xl';

  const bgColor = team?.primaryColor ? `${team.primaryColor}25` : '#1e293b';
  const borderColor = team?.primaryColor ? `${team.primaryColor}50` : '#334155';

  if (team?.logoUrl && !hasError) {
    return (
      <div
        className={`${sizeConfig.container} ${roundedClass} border overflow-hidden flex items-center justify-center bg-slate-950 shrink-0 shadow-md ${className}`}
        style={{ borderColor }}
      >
        <img
          src={team.logoUrl}
          alt={team.name || 'Team Logo'}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeConfig.container} ${roundedClass} border flex items-center justify-center shrink-0 shadow-md select-none ${sizeConfig.text} ${className}`}
      style={{
        backgroundColor: bgColor,
        borderColor
      }}
    >
      <span>{team?.logoEmoji || '🏏'}</span>
    </div>
  );
};
