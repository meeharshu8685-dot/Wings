import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWingsStore } from '../store/useWingsStore';
import { getDaysRemaining } from '../utils/dateUtils';

export const GoalLock: React.FC = () => {
  const { identity, setLongTermGoal, lockGoal, capacity, growth } = useWingsStore();
  const [localGoal, setLocalGoal] = useState(identity.longTermGoal);
  
  const daysRemaining = identity.lockedUntil ? getDaysRemaining(identity.lockedUntil) : 0;
  const isLocked = daysRemaining > 0;
  
  // Growth-Aware Anti-Self-Sabotage Logic:
  // Lock goal-setting only if capacity is low AND the user has NOT proven they can handle higher capacity states before.
  const isFragile = capacity === 'FRAGILE' || capacity === 'STABLE';
  const hasNotProvenStrength = growth.highestCapacityAchieved === 'FRAGILE' || growth.highestCapacityAchieved === 'STABLE';
  const shouldLockGoalSetting = isFragile && hasNotProvenStrength && !isLocked;

  const handleLock = () => {
    if (!localGoal.trim()) return;
    setLongTermGoal(localGoal);
    lockGoal();
  };

  if (shouldLockGoalSetting) {
    return (
      <div className="flex flex-col items-center text-center w-full max-w-sm space-y-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-zinc-800 text-zinc-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <h2 className="text-xl font-medium text-zinc-300">Direction is Locked</h2>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Your capacity is currently fragile. The system has locked goal-setting to protect your focus.
          <br/><br/>
          Direction will emerge from consistent daily action.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center w-full max-w-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="mb-12"
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 mb-6 mx-auto transition-colors duration-700 ${
          isLocked ? 'border-red-900/50 text-red-500/50' : 'border-zinc-700 text-zinc-500'
        }`}>
           {isLocked ? (
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
           ) : (
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
           )}
        </div>
      </motion.div>

      {isLocked ? (
        <div className="space-y-8">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight text-zinc-100">
            {identity.longTermGoal}
          </h1>
          <p className="text-zinc-600 font-mono text-sm tracking-widest uppercase">
            Locked for {daysRemaining} days
          </p>
        </div>
      ) : (
        <div className="w-full space-y-8">
          <textarea
            value={localGoal}
            onChange={(e) => setLocalGoal(e.target.value)}
            placeholder="What is the ONE thing?"
            className="w-full bg-transparent text-center text-3xl md:text-4xl font-bold text-zinc-100 placeholder-zinc-800 resize-none border-none focus:ring-0 leading-tight"
            rows={3}
          />
          
          <button
            onClick={handleLock}
            disabled={!localGoal.trim()}
            className="group relative px-8 py-3 bg-zinc-900 text-zinc-400 font-medium tracking-wide text-sm uppercase transition-all hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="relative z-10">Lock Target (90 Days)</span>
            <div className="absolute inset-0 border border-zinc-800 group-hover:border-zinc-600 transition-colors" />
          </button>
        </div>
      )}
    </div>
  );
};
