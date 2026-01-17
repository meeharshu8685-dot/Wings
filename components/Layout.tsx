import React, { ReactNode } from 'react';
import { ViewState } from '../types';
import { useWingsStore } from '../store/useWingsStore';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: ReactNode;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const NavButton = ({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
}) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-full transition-all duration-500 ease-out relative group ${active
      ? 'text-white bg-zinc-800 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
      : 'text-zinc-600 hover:text-zinc-400'
      }`}
  >
    {icon}
    <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
      {label}
    </span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView }) => {
  const { level, momentum, settings } = useWingsStore();

  const showAdvancedNav = level >= 2;
  const showFlightNav = level >= 3;
  const isFailureState = !!momentum.lastHardModeFailure;
  const isFocusLocked = settings.focusLock;

  // Hide nav during failure state or Focus Lock
  if (isFailureState || isFocusLocked) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col items-center justify-center p-6">
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col items-center justify-between overflow-hidden selection:bg-indigo-500/30">

      <main className="flex-1 w-full max-w-xl flex flex-col justify-center p-6 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="w-full h-full flex flex-col items-center justify-center"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="mb-8 px-6 py-3 bg-zinc-900/50 backdrop-blur-md rounded-full border border-zinc-800/50 flex space-x-2">

        {showFlightNav && (
          <NavButton active={currentView === 'GOAL'} onClick={() => onChangeView('GOAL')} label="Lock"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
          />
        )}

        <NavButton active={currentView === 'FLIGHT'} onClick={() => onChangeView('FLIGHT')} label="Action"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h10" /><path d="M9 4v16" /><path d="m3 9 3 3-3 3" /><path d="M12 6h8" /><path d="M12 18h8" /></svg>}
        />

        {showAdvancedNav && (
          <NavButton active={currentView === 'MOMENTUM'} onClick={() => onChangeView('MOMENTUM')} label="History"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>}
          />
        )}

        {showFlightNav && (
          <NavButton active={currentView === 'PRESSURE'} onClick={() => onChangeView('PRESSURE')} label="Reality"
            icon={<svg xmlns="http://www.w.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
          />
        )}

        <NavButton active={currentView === 'SETTINGS'} onClick={() => onChangeView('SETTINGS')} label="System"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>}
        />

        <NavButton active={currentView === 'CONTROL_PANEL'} onClick={() => onChangeView('CONTROL_PANEL')} label="Control"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" /><line x1="12" y1="18" x2="12" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /></svg>}
        />

        <NavButton active={currentView === 'PLANNING'} onClick={() => onChangeView('PLANNING')} label="Strategy"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8" /><path d="m4.93 10.93 1.41 1.41" /><path d="M2 18h2" /><path d="M20 18h2" /><path d="m19.07 10.93-1.41 1.41" /><path d="M22 22H2" /><path d="m8 22 4-10 4 10" /></svg>}
        />
      </nav>
    </div>
  );
};
