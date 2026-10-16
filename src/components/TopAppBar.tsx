import React from 'react';
import { Smartphone, Monitor, Sun, Moon, FolderOpen, ShieldCheck } from 'lucide-react';
import { ActiveTab } from './NavigationRailOrBar';

interface TopAppBarProps {
  isSimulatorMode: boolean;
  onToggleSimulator: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  onPickLocalFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectTab?: (tab: ActiveTab) => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  isSimulatorMode,
  onToggleSimulator,
  isDark,
  onToggleDark,
  onPickLocalFile,
}) => {
  return (
    <header className="px-4 py-2.5 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0 transition-colors z-20">
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
          MOBI
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <h1 className="font-black text-sm sm:text-base leading-none text-stone-900 dark:text-stone-100 tracking-tight">
              Mobi<span className="text-red-600">PDF</span>
            </h1>
            <span className="hidden xs:inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              <ShieldCheck size={10} />
              <span>Offline ML</span>
            </span>
          </div>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">Editor & Scanner • Android APK</p>
        </div>
      </div>

      <div className="flex items-center space-x-1 sm:space-x-1.5">
        {/* SAF File Upload Input */}
        <label className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer">
          <FolderOpen size={13} />
          <span className="hidden sm:inline">Open PDF</span>
          <input
            type="file"
            accept=".pdf,application/pdf,image/*"
            className="hidden"
            onChange={onPickLocalFile}
          />
        </label>

        {/* Simulator mode toggle */}
        <button
          onClick={onToggleSimulator}
          className="p-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          title={isSimulatorMode ? 'Switch to Full-Screen Desktop View' : 'Switch to Android Phone Simulator Frame'}
          aria-label="Toggle Phone Frame Simulator"
        >
          {isSimulatorMode ? <Monitor size={17} /> : <Smartphone size={17} />}
        </button>

        {/* Theme mode toggle */}
        <button
          onClick={onToggleDark}
          className="p-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Dark Mode"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
};
