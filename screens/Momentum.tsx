import React from 'react';
import { useWingsStore } from '../store/useWingsStore';

const HistoryBar: React.FC<{ active: boolean }> = ({ active }) => (
  <div className={`h-8 w-2 rounded-full ${active ? 'bg-indigo-400' : 'bg-zinc-800'}`} />
);

export const Momentum: React.FC = () => {
  const { momentum, selfTrust, capacity, level, growth } = useWingsStore();
  
  const trustScore = selfTrust.promisesMade === 0 
    ? 0 
    : Math.round((selfTrust.promisesKept / selfTrust.promisesMade) * 100);

  return (
    <div className="w-full h-full flex flex-col justify-center space-y-10">
      
      {/* Big Numbers */}
      <div className="grid grid-cols-2 gap-8 text-center">
        <div className="space-y-2">
          <p className="text-zinc-600 text-xs uppercase tracking-widest">Current Capacity</p>
          <div className="text-3xl font-light text-white">
            {capacity}
          </div>
          <p className="text-zinc-700 text-xs font-mono">LEVEL {level}</p>
        </div>
        
        <div className="space-y-2">
          <p className="text-zinc-600 text-xs uppercase tracking-widest">Self Trust</p>
          <div className="text-4xl font-light text-white">
            {trustScore}%
          </div>
          <p className="text-zinc-700 text-xs font-mono">INTEGRITY</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 text-center border-t border-b border-zinc-900 py-6">
        <div>
          <p className="text-zinc-600 text-xs uppercase tracking-widest">Current Streak</p>
          <div className="text-3xl font-light text-white">{momentum.currentStreak}</div>
        </div>
        <div>
          <p className="text-zinc-600 text-xs uppercase tracking-widest">Peak Effort</p>
          <div className="text-3xl font-light text-white">{growth.peakWeeklyAverageEffort}<span className="text-lg text-zinc-600"> min</span></div>
        </div>
      </div>


      {/* 7 Day History */}
      <div className="w-full flex flex-col items-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          {momentum.showUpHistory.map((day, i) => (
            <HistoryBar key={i} active={day} />
          ))}
        </div>
        <p className="text-zinc-700 text-[10px] uppercase tracking-widest">Last 7 Days</p>
      </div>

      <div className="text-center">
         <p className="text-zinc-700 text-xs italic">
           {capacity === 'FRAGILE' ? "Recovery is the only objective." : "Your history sets the new standard."}
         </p>
      </div>
    </div>
  );
};
