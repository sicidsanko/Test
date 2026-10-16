import React from 'react';
import { Home, Layers, Camera, Folder } from 'lucide-react';

export type ActiveTab = 'home' | 'tools' | 'scan' | 'files';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  filesCount: number;
}

export const NavigationRailOrBar: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  filesCount,
}) => {
  return (
    <nav
      aria-label="App Navigation"
      className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t md:border-t-0 md:border-r border-stone-200 dark:border-stone-800 flex md:flex-col justify-around md:justify-start items-center py-1.5 md:py-6 px-3 md:w-20 md:shrink-0 z-30 transition-colors shadow-lg md:shadow-none"
    >
      {/* Desktop App Logo */}
      <div className="hidden md:flex flex-col items-center mb-6">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-black text-sm shadow-md shadow-red-500/20">
          MOBI
        </div>
        <span className="text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-wider">PDF</span>
      </div>

      {/* Navigation Buttons Container */}
      <div className="flex md:flex-col w-full justify-around md:justify-start md:space-y-3 items-center">
        {/* 1. HOME */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all relative group cursor-pointer ${
            activeTab === 'home'
              ? 'text-red-600 dark:text-red-400 font-bold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
          aria-label="Home"
        >
          <div
            className={`w-11 h-7 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'home'
                ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 scale-105'
                : 'group-hover:bg-stone-100 dark:group-hover:bg-stone-800'
            }`}
          >
            <Home size={20} />
          </div>
          <span className="text-[10px] mt-0.5 text-center font-medium leading-tight">
            Home
          </span>
        </button>

        {/* 2. TOOLS */}
        <button
          onClick={() => onTabChange('tools')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all relative group cursor-pointer ${
            activeTab === 'tools'
              ? 'text-red-600 dark:text-red-400 font-bold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
          aria-label="Tools"
        >
          <div
            className={`w-11 h-7 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'tools'
                ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 scale-105'
                : 'group-hover:bg-stone-100 dark:group-hover:bg-stone-800'
            }`}
          >
            <Layers size={20} />
          </div>
          <span className="text-[10px] mt-0.5 text-center font-medium leading-tight">
            Tools
          </span>
        </button>

        {/* 3. BIG CENTER SCAN BUTTON (MobiPDF signature action) */}
        <button
          onClick={() => onTabChange('scan')}
          className="flex flex-col items-center justify-center group cursor-pointer -mt-5 md:mt-1 focus:outline-hidden"
          aria-label="Scan Document"
        >
          <div className="w-13 h-13 md:w-12 md:h-12 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-500/40 group-hover:scale-108 active:scale-95 transition-all border-4 border-stone-50 dark:border-stone-950">
            <Camera size={24} className="stroke-[2.2]" />
          </div>
          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 mt-0.5 text-center leading-tight">
            Scan
          </span>
        </button>

        {/* 4. FILES */}
        <button
          onClick={() => onTabChange('files')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all relative group cursor-pointer ${
            activeTab === 'files'
              ? 'text-red-600 dark:text-red-400 font-bold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
          aria-label="Files"
        >
          <div
            className={`w-11 h-7 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'files'
                ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 scale-105'
                : 'group-hover:bg-stone-100 dark:group-hover:bg-stone-800'
            }`}
          >
            <Folder size={20} />
          </div>
          <span className="text-[10px] mt-0.5 text-center font-medium leading-tight">
            Files
          </span>
          {filesCount > 0 && (
            <span className="absolute top-1 right-2 md:right-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full min-w-4 text-center">
              {filesCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
