import React from 'react';
import { motion } from 'framer-motion';
import { useWingsStore } from '../store/useWingsStore';
import { formatDateReadable } from '../utils/dateUtils';
import { ViewState } from '../types';

interface FailureProps {
  onChangeView: (view: ViewState) => void;
}

export const Failure: React.FC<FailureProps> = ({ onChangeView }) => {
  const { momentum, acknowledgeFailure } = useWingsStore();
  const failureDate = momentum.lastHardModeFailure ? formatDateReadable(momentum.lastHardModeFailure) : 'recently';

  const handleAcknowledge = () => {
    acknowledgeFailure();
    onChangeView('FLIGHT');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-16 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="glass p-12 rounded-[4rem] space-y-8 max-w-lg relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-rose-500/5 pointer-events-none" />

        <div className="space-y-6 relative z-10">
          <div className="w-20 h-20 mx-auto rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shadow-inner">
            <svg className="w-10 h-10 text-rose-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-extralight uppercase tracking-[0.4em] text-slate-400">
              System Reset
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
              Hard Mode failure detected on <span className="text-rose-500 font-bold">{failureDate}</span>.
              Baseline preserved, level reset to 0.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 relative z-10">
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] italic">Self-trust is built in the return.</p>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleAcknowledge}
        className="px-12 py-5 bg-slate-900 text-white font-bold uppercase tracking-[0.3em] text-[11px] rounded-2xl shadow-xl shadow-slate-200 transition-all active:bg-slate-800"
      >
        Return to Flight
      </motion.button>
    </div>
  );
};
