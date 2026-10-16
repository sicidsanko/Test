import React from 'react';
import { Wifi, BatteryMedium, Signal, Smartphone, Monitor } from 'lucide-react';

interface AndroidPhoneFrameProps {
  children: React.ReactNode;
  isSimulatorMode: boolean;
  onToggleSimulator: () => void;
  isDark: boolean;
}

export const AndroidPhoneFrame: React.FC<AndroidPhoneFrameProps> = ({
  children,
  isSimulatorMode,
  onToggleSimulator,
  isDark,
}) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!isSimulatorMode) {
    return (
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
        {children}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 bg-stone-200 dark:bg-stone-950 overflow-y-auto">
      {/* Phone simulator container */}
      <div className="relative w-full max-w-[430px] h-[860px] max-h-[95vh] bg-stone-900 rounded-[48px] p-3 shadow-2xl border-4 border-stone-700/60 flex flex-col overflow-hidden">
        {/* Top Punch Hole & Speaker */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center justify-center z-50 pointer-events-none">
          <div className="w-4 h-4 rounded-full bg-black border border-stone-800 shadow-inner"></div>
        </div>

        {/* Screen Bezel inner */}
        <div className="relative flex-1 w-full bg-white dark:bg-stone-900 rounded-[38px] overflow-hidden flex flex-col shadow-inner">
          {/* Android Status Bar */}
          <div className="h-9 px-6 pt-1 flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-stone-300 select-none z-40 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm shrink-0">
            <span>{currentTime}</span>
            <div className="flex items-center space-x-2 text-[11px]">
              <Signal size={13} />
              <span className="text-[10px] font-bold">5G</span>
              <Wifi size={13} />
              <BatteryMedium size={15} />
            </div>
          </div>

          {/* App Body */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {children}
          </div>

          {/* Android Gesture Pill */}
          <div className="h-5 flex items-center justify-center bg-white dark:bg-stone-900 shrink-0">
            <div className="w-32 h-1 bg-stone-400 dark:bg-stone-600 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
