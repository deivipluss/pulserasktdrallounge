import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  badge?: string;
  requiresAuth?: boolean;
}

export function Card({
  href,
  icon: Icon,
  title,
  description,
  className = '',
  badge,
  requiresAuth
}: CardProps) {
  return (
    <Link
      href={href}
      className={`
        relative flex flex-col gap-2 p-4 rounded-2xl transition-all 
        bg-white/5 backdrop-blur-sm border border-white/10
        hover:bg-white/10 hover:scale-[1.01] hover:shadow-party-md 
        active:scale-[0.98] active:shadow-party-sm
        ${className}
      `}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-party flex items-center justify-center text-white">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold">{title}</h3>
          {description && <p className="text-sm text-gray-300">{description}</p>}
        </div>
      </div>
      
      {badge && (
        <span className="absolute top-2 right-2 px-2 py-1 text-xs rounded-full bg-fiesta-purple text-white">
          {badge}
        </span>
      )}
      
      {requiresAuth && (
        <span className="absolute bottom-2 right-2 text-xs text-gray-400 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Requiere acceso
        </span>
      )}
    </Link>
  );
}
