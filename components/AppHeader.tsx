
import React from 'react';
import { useApp } from '../store';

const AppHeader: React.FC = () => {
  const { settings } = useApp();
  const headerImage = settings.profile.headerImage;

  return (
    <header className="w-full aspect-[18/5] bg-[#f5f5f5] flex items-center justify-center overflow-hidden relative">
      <div className="w-full h-full flex items-center justify-center relative">
        {headerImage ? (
          <img 
            src={headerImage} 
            alt="Dashboard Header" 
            className="w-full h-full object-cover block border-none outline-none shadow-none m-0 p-0"
          />
        ) : (
          <span className="absolute text-[#888888] text-[11px] font-black pointer-events-none uppercase tracking-[0.2em] opacity-40">
            INSÉRER IMAGE ICI
          </span>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
