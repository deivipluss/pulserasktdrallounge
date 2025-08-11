'use client';

import { Trophy, Gift, Star, PartyPopper } from 'lucide-react';

interface IconProps {
  name: 'trophy' | 'gift' | 'star' | 'party';
  size?: number;
  className?: string;
}

export function Icon({ name, size = 24, className = '' }: IconProps) {
  const iconProps = {
    size,
    className: `${className}`,
  };

  switch (name) {
    case 'trophy':
      return <Trophy {...iconProps} />;
    case 'gift':
      return <Gift {...iconProps} />;
    case 'star':
      return <Star {...iconProps} />;
    case 'party':
      return <PartyPopper {...iconProps} />;
    default:
      return null;
  }
}

// Componente de ejemplo para mostrar todos los iconos
export function IconShowcase() {
  return (
    <div className="flex flex-wrap gap-4 p-4">
      <div className="flex flex-col items-center gap-2">
        <Icon name="trophy" className="text-fiesta-yellow" />
        <span>Trophy</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon name="gift" className="text-fiesta-pink" />
        <span>Gift</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon name="star" className="text-fiesta-orange" />
        <span>Star</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon name="party" className="text-fiesta-purple" />
        <span>Party</span>
      </div>
    </div>
  );
}
