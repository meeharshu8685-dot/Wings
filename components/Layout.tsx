import React, { ReactNode } from 'react';
import { ViewState } from '../types';
import { useWingsStore } from '../store/useWingsStore';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: ReactNode;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
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
    className={`p-4 rounded-2xl transition-all duration-700 ease-out relative group ${active
      ? 'text-indigo-600 bg-white/80 shadow-[0_4px_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/10'
      : 'text-slate-400 hover:text-slate-600 hover:bg-white/40'
      }`}
  >
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {icon}
    </motion.div>
    <span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-500 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none translate-y-2 group-hover:translate-y-0">
      {label}
    </span>
    {active && (
      <motion.div
        layoutId="activeTab"
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500"
      />
    )}
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, canGoBack, onGoBack }) => {
  const { level, momentum, settings } = useWingsStore();

  const showAdvancedNav = level >= 2;
  const showFlightNav = level >= 3;
  const isFailureState = !!momentum.lastHardModeFailure;
  const isFocusLocked = settings.focusLock;

  // Hide nav during failure state or Focus Lock
  if (isFailureState || isFocusLocked) {
    return (
      <main className="min-h-screen text-slate-800 flex flex-col items-center justify-center p-6 bg-white/20 backdrop-blur-3xl">
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-screen text-slate-800 flex flex-col items-center justify-between overflow-hidden selection:bg-indigo-500/10">

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

      <nav className="mb-10 px-4 py-2 glass rounded-3xl flex items-center space-x-1">

        {/* Back Button - shows when not on Flight Deck or when there's history */}
        {(currentView !== 'FLIGHT' || canGoBack) && onGoBack && (
          <button
            onClick={onGoBack}
            className="p-3 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/40 transition-all mr-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}

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
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
          />
        )}

        <NavButton active={currentView === 'SETTINGS'} onClick={() => onChangeView('SETTINGS')} label="System"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>}
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
