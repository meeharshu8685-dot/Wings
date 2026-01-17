import React from 'react';
import { useWingsStore } from '../store/useWingsStore';
import { motion } from 'framer-motion';

export const WeeklyReportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { momentum, identity, capacity, growth } = useWingsStore();
  
  const flown = momentum.showUpHistory.filter(Boolean).length;
  const missed = 7 - flown;
  
  const getVerdict = () => {
    const { highestCapacityAchieved } = growth;

    if (capacity === 'FRAGILE') {
      if (flown > 0) return `You showed up ${flown} time(s). That is a foundation. Continue.`
      return "This was a difficult week. The only goal is to show up tomorrow."
    }
    if (capacity === 'STABLE') {
      if (highestCapacityAchieved === 'HIGH') return "This is regression. Stability is not the standard for you any longer. Re-engage."
      if (missed === 0) return "Perfect execution builds stability. You are on the right path."
      return `Consistency is forming, but ${missed} gap(s) slowed progress. Seal the leaks.`
    }
    if (capacity === 'CAPABLE') {
      if (highestCapacityAchieved === 'HIGH' && missed > 0) return "You are operating below your proven potential. Close the gap."
      if (missed > 1) return "You are capable of more. Inconsistency is a choice. Do not choose it."
      return "Solid week. Now transition from capable to dangerous."
    }
    if (capacity === 'HIGH') {
      if (missed > 0) return "You are operating at a high level. A single miss is a signal. Do not ignore it."
      return "Total execution. This is the standard. Maintain it."
    }
    return "The week is complete."
  };

  const verdict = getVerdict();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 flex flex-col items-center text-center space-y-8 shadow-2xl"
      >
        <h2 className="text-zinc-500 text-xs uppercase tracking-widest border-b border-zinc-800 pb-2 w-full">
          Reality Report
        </h2>

        <div className="space-y-2">
           <h3 className="text-lg text-white font-medium">{identity.longTermGoal || "No Direction Set"}</h3>
        </div>

        <div className="grid grid-cols-2 gap-8 w-full">
          <div className="bg-zinc-950 p-4 rounded border border-zinc-800/50">
             <div className="text-2xl text-white">{flown}</div>
             <div className="text-xs text-zinc-600 uppercase mt-1">Flown</div>
          </div>
          <div className="bg-zinc-950 p-4 rounded border border-zinc-800/50">
             <div className="text-2xl text-red-400">{missed}</div>
             <div className="text-xs text-zinc-600 uppercase mt-1">Missed</div>
          </div>
        </div>

        <div className="py-4">
          <p className="text-xl font-serif italic text-zinc-300">"{verdict}"</p>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors"
        >
          Accept Reality & Dismiss
        </button>
      </motion.div>
    </div>
  );
};
