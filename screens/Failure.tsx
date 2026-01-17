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
    <div className="flex flex-col items-center justify-center h-full text-center space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-6"
      >
        <div className="w-24 h-24 mx-auto rounded-full border-4 border-red-900/50 flex items-center justify-center">
           <svg className="w-12 h-12 text-red-900" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-zinc-400">
          System Reset
        </h1>
        <p className="text-zinc-500 max-w-sm">
          You failed Hard Mode on <span className="text-zinc-400 font-semibold">{failureDate}</span>.
          All progress and growth memory have been erased.
          The standard was not met.
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        onClick={handleAcknowledge}
        className="px-12 py-4 bg-zinc-200 text-zinc-900 font-bold uppercase tracking-widest text-sm hover:bg-white transition-colors"
      >
        Acknowledge & Begin Again
      </motion.button>
    </div>
  );
};
