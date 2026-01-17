import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWingsStore } from '../store/useWingsStore';
import { getTodayISO } from '../utils/dateUtils';
import { TaskCategory, CapacityState, GrowthState } from '../types';

const getMinimumEffort = (growth: GrowthState): number => {
  const { highestCapacityAchieved, peakWeeklyAverageEffort } = growth;
  switch (highestCapacityAchieved) {
    case 'FRAGILE': return 1;
    case 'STABLE': return 10;
    case 'CAPABLE': return Math.max(25, Math.floor(peakWeeklyAverageEffort * 0.8));
    case 'HIGH': return Math.max(45, Math.floor(peakWeeklyAverageEffort * 0.9));
    default: return 1;
  }
};

const getFlightDeckMessages = (capacity: CapacityState, growth: GrowthState, minEffort: number) => {
  const hasProvenStrength = growth.highestCapacityAchieved === 'CAPABLE' || growth.highestCapacityAchieved === 'HIGH';

  if (capacity === 'FRAGILE') {
    return {
      title: "GROUND MODE",
      subtitle: hasProvenStrength 
        ? "You know the recovery protocol. No thinking. Execute."
        : "You are depleted. Do not plan. Do not aspire. Just show up."
    };
  }
  if (capacity === 'STABLE') {
    return {
      title: "STABILITY PROTOCOL",
      subtitle: `Small inputs. ${minEffort} minutes minimum. Repair your foundation.`
    };
  }
  if (capacity === 'CAPABLE') {
    return {
      title: "BUILD MODE",
      subtitle: `Proven capacity demands at least ${minEffort} minutes of focused effort.`
    };
  }
  if (capacity === 'HIGH') {
    return {
      title: "FLIGHT MODE",
      subtitle: `High execution standard. Minimum effective dose: ${minEffort} minutes.`
    };
  }
  return { title: "STANDBY", subtitle: "Define today's action." };
};

export const FlightDeck: React.FC = () => {
  const { daily, capacity, growth, createTask, generateGroundTask, completeTask } = useWingsStore();
  const today = getTodayISO();
  const currentTask = daily[today];
  const [inputTask, setInputTask] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(null);
  
  const [isCompleting, setIsCompleting] = useState(false);
  const [realityTime, setRealityTime] = useState("");
  
  const minEffort = getMinimumEffort(growth);
  const messages = getFlightDeckMessages(capacity, growth, minEffort);

  const handleCompletionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseInt(realityTime);
    if (minutes >= minEffort) {
      completeTask(minutes);
    }
  };

  if (currentTask?.completed) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: "easeOut" }}
          className="text-zinc-500 uppercase tracking-[0.2em] text-sm"
        >
          Flight Complete
        </motion.div>
        <div className="space-y-2">
          <motion.h2 className="text-2xl text-zinc-300 font-light">{currentTask.task}</motion.h2>
          <p className="text-zinc-600 text-sm font-mono">{currentTask.timeSpent} MINUTES REALITY</p>
        </div>
        <div className="text-zinc-600 text-xs font-mono mt-8">COME BACK TOMORROW</div>
      </div>
    );
  }

  if (isCompleting) {
    return (
       <div className="w-full max-w-md">
         <form onSubmit={handleCompletionSubmit} className="flex flex-col items-center space-y-12">
           <label className="text-zinc-500 text-sm uppercase tracking-widest">Time With Reality (Min: {minEffort})</label>
           <div className="relative">
             <input autoFocus type="number" min={minEffort} value={realityTime} onChange={(e) => setRealityTime(e.target.value)} placeholder="0"
               className="w-32 bg-transparent text-center text-4xl font-light text-zinc-100 placeholder-zinc-800 border-b border-zinc-800 focus:border-zinc-600 pb-2 transition-colors" />
             <span className="absolute right-0 bottom-4 text-zinc-600 text-sm font-mono">MIN</span>
           </div>
           <div className="flex space-x-4">
             <button type="button" onClick={() => setIsCompleting(false)} className="px-6 py-3 text-zinc-600 hover:text-zinc-400 text-xs uppercase tracking-widest transition-all">Cancel</button>
             <button type="submit" disabled={parseInt(realityTime) < minEffort} className="px-8 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 text-xs uppercase tracking-widest transition-all disabled:opacity-50">Confirm</button>
           </div>
         </form>
       </div>
    );
  }

  if (currentTask) {
    return (
      <div className="w-full max-w-md flex flex-col items-center space-y-12">
        <div className="space-y-2 text-center">
          <p className="text-zinc-600 text-xs uppercase tracking-widest">{currentTask.systemGenerated ? "System Protocol" : "Current Mission"}</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight px-4">{currentTask.task}</h2>
        </div>
        <button onClick={() => setIsCompleting(true)} className="group relative w-24 h-24 rounded-full flex items-center justify-center border transition-all duration-700 border-zinc-700 hover:border-indigo-500/50 hover:bg-indigo-500/5">
          <div className="absolute inset-2 rounded-full border border-zinc-900 group-hover:border-zinc-800 transition-all duration-700" />
          <svg className="w-8 h-8 text-zinc-600 group-hover:text-zinc-300 transition-colors duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" /></svg>
        </button>
      </div>
    );
  }

  if (capacity === 'FRAGILE') {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-12">
        <div className="space-y-4">
           <h1 className="text-4xl font-bold text-zinc-500">{messages.title}</h1>
           <p className="text-zinc-600 max-w-xs mx-auto text-sm leading-relaxed">{messages.subtitle}</p>
        </div>
        <button onClick={() => generateGroundTask()} className="px-8 py-4 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 text-xs uppercase tracking-widest transition-all">Receive Protocol</button>
      </div>
    );
  }

  if (capacity === 'STABLE') {
    if (!selectedCategory) {
      return (
        <div className="flex flex-col items-center space-y-8 w-full">
           <p className="text-zinc-500 text-xs uppercase tracking-widest">Select Stability Vector</p>
           <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              {['BODY', 'SKILL', 'ORDER', 'FOCUS'].map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat as TaskCategory)} className="p-6 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 transition-all text-xs text-zinc-400 hover:text-white uppercase tracking-wider">{cat}</button>
              ))}
           </div>
           <p className="text-zinc-700 text-xs text-center max-w-xs">{messages.subtitle}</p>
        </div>
      );
    }
    return (
      <div className="w-full max-w-md">
        <form onSubmit={(e) => { e.preventDefault(); if(inputTask) createTask(inputTask, selectedCategory); }} className="flex flex-col items-center space-y-12">
          <button onClick={() => setSelectedCategory(null)} className="text-zinc-600 text-[10px] uppercase tracking-widest hover:text-zinc-400">&larr; Change Vector: {selectedCategory}</button>
          <input autoFocus type="text" value={inputTask} onChange={(e) => setInputTask(e.target.value)} placeholder="Small, specific action..." className="w-full bg-transparent text-center text-xl font-normal text-zinc-200 placeholder-zinc-800 border-b border-zinc-800 focus:border-zinc-600 pb-4 transition-colors"/>
          <AnimatePresence>
            {inputTask.length > 3 && <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} type="submit" className="px-8 py-3 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 text-xs uppercase tracking-widest transition-all">Confirm Action</motion.button>}
          </AnimatePresence>
        </form>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-md">
      <form onSubmit={(e) => { e.preventDefault(); if(inputTask) createTask(inputTask, 'FLIGHT'); }} className="flex flex-col items-center space-y-12">
        <div className="text-center space-y-4">
          <div className="text-[10px] text-zinc-700 font-mono">{messages.title}</div>
          <label className="text-zinc-500 text-sm">{messages.subtitle}</label>
        </div>
        <input autoFocus type="text" value={inputTask} onChange={(e) => setInputTask(e.target.value)} placeholder="Define high-leverage action..." className="w-full bg-transparent text-center text-2xl font-normal text-zinc-100 placeholder-zinc-800 border-b border-zinc-800 focus:border-zinc-600 pb-4 transition-colors"/>
        <AnimatePresence>
          {inputTask.length > 3 && <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} type="submit" className="px-8 py-3 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 text-xs uppercase tracking-widest transition-all">Initiate</motion.button>}
        </AnimatePresence>
      </form>
    </div>
  );
};
