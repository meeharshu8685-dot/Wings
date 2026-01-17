import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWingsStore } from '../store/useWingsStore';
import { getTodayISO } from '../utils/dateUtils';
import { TaskCategory, CapacityState, GrowthState } from '../types';

const getMinimumEffort = (growth: GrowthState, settings: any, planning: any): number => {
  if (settings.maintenanceMode) return 1;
  if (settings.stateOverride === 'FORCE_RECOVERY') return 1;

  let floor = 1;
  if (settings.stateOverride === 'FORCE_PUSH') {
    floor = Math.max(60, Math.floor(growth.peakWeeklyAverageEffort * 1.1));
  } else {
    const { highestCapacityAchieved, peakWeeklyAverageEffort } = growth;
    switch (highestCapacityAchieved) {
      case 'FRAGILE': floor = 1; break;
      case 'STABLE': floor = 10; break;
      case 'CAPABLE': floor = Math.max(25, Math.floor(peakWeeklyAverageEffort * 0.8)); break;
      case 'HIGH': floor = Math.max(45, Math.floor(peakWeeklyAverageEffort * 0.9)); break;
      default: floor = 1;
    }
  }

  // Respect planning time budget ceiling
  return Math.min(floor, planning.timeBudget || Infinity);
};

const getFlightDeckMessages = (capacity: CapacityState, growth: GrowthState, minEffort: number, settings: any) => {
  if (settings.stateOverride === 'FORCE_RECOVERY') {
    return { title: "RECOVERY MODE", subtitle: "Expectations minimized. Stabilize biological baseline." };
  }
  if (settings.stateOverride === 'FORCE_PUSH') {
    return { title: "PUSH MODE", subtitle: `Comfort ignored. Floor: ${minEffort}m. Environment > Willpower.` };
  }
  if (settings.explorationMode) {
    return { title: "EXPLORATION", subtitle: "Vector sampling mode. No commitment required." };
  }
  if (settings.maintenanceMode) {
    return { title: "MAINTENANCE", subtitle: "Load protection active. Streak preservation is priority." };
  }

  const hasProvenStrength = growth.highestCapacityAchieved === 'CAPABLE' || growth.highestCapacityAchieved === 'HIGH';

  if (capacity === 'FRAGILE') {
    return {
      title: "GROUND MODE",
      subtitle: hasProvenStrength
        ? "Recovery protocol. Execute the known sequence. No thinking."
        : "Low capacity detected. Show up. That is the only protocol."
    };
  }
  if (capacity === 'STABLE') {
    return {
      title: "STABILITY PROTOCOL",
      subtitle: `Small specific inputs. ${minEffort}m floor. Repairing foundation.`
    };
  }
  if (capacity === 'CAPABLE') {
    return {
      title: "BUILD MODE",
      subtitle: `Adaptive load: ${minEffort}m. Maintain trajectory.`
    };
  }
  if (capacity === 'HIGH') {
    return {
      title: "FLIGHT MODE",
      subtitle: `Peak demand active. Floor: ${minEffort}m. Progress requires load.`
    };
  }
  return { title: "STANDBY", subtitle: "Define action for log." };
};

export const FlightDeck: React.FC = () => {
  const { daily, capacity, growth, settings, planning, createTask, generateGroundTask, completeTask, updateSettings } = useWingsStore();
  const today = getTodayISO();
  const currentTask = daily[today];
  const [inputTask, setInputTask] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(null);

  const [isCompleting, setIsCompleting] = useState(false);
  const [realityTime, setRealityTime] = useState("");
  const [focusTimer, setFocusTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (settings.focusLock && !currentTask?.completed) {
      interval = setInterval(() => {
        setFocusTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [settings.focusLock, currentTask?.completed]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const minEffort = getMinimumEffort(growth, settings, planning);
  const messages = getFlightDeckMessages(capacity, growth, minEffort, settings);

  const handleCompletionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseInt(realityTime);
    if (minutes >= minEffort) {
      completeTask(minutes);
    }
  };

  if (currentTask?.completed) {
    return (
      <div className="text-center space-y-8 py-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-extralight tracking-[0.3em] text-zinc-600 uppercase">Mission Logged</h2>
          <p className="text-[10px] text-zinc-700 uppercase tracking-[0.5em] leading-relaxed max-w-xs mx-auto">
            Behavior &rarr; Identity<br />
            Proof: I showed up today.
          </p>
        </div>
        <div className="pt-8 border-t border-zinc-900/50">
          <p className="text-zinc-800 text-[10px] font-mono uppercase tracking-widest">{currentTask.task}</p>
          <p className="text-zinc-800 text-[10px] font-mono mt-2">{currentTask.timeSpent}M INVESTED</p>
        </div>
      </div>
    );
  }

  if (isCompleting) {
    return (
      <div className="w-full max-w-md">
        <form onSubmit={handleCompletionSubmit} className="flex flex-col items-center space-y-12">
          <label className="text-zinc-500 text-[10px] uppercase tracking-[0.3em]">Log Minutes with Reality (Min: {minEffort})</label>
          <div className="relative">
            <input autoFocus type="number" min={minEffort} value={realityTime} onChange={(e) => setRealityTime(e.target.value)} placeholder="0"
              className="w-32 bg-transparent text-center text-4xl font-mono text-zinc-100 placeholder-zinc-800 border-b border-zinc-800 focus:border-zinc-600 pb-2 transition-colors" />
            <span className="absolute right-0 bottom-4 text-zinc-600 text-xs font-mono tracking-widest">MIN</span>
          </div>
          <div className="flex space-x-4">
            <button type="button" onClick={() => setIsCompleting(false)} className="px-6 py-3 text-zinc-700 hover:text-zinc-500 text-[10px] uppercase tracking-widest transition-all">Cancel</button>
            <button type="submit" disabled={parseInt(realityTime) < minEffort} className="px-8 py-3 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 text-[10px] uppercase tracking-[0.2em] transition-all disabled:opacity-50 font-mono">Confirm Proof of Action</button>
          </div>
        </form>
      </div>
    );
  }

  if (settings.planningMode) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 py-12 text-center opacity-60">
        <div className="w-12 h-12 border border-zinc-700 animate-spin rounded-full border-t-zinc-400 mb-4" />
        <h2 className="text-xl font-light tracking-[0.2em] text-zinc-300 uppercase">System Recalibration</h2>
        <p className="text-[10px] text-zinc-600 uppercase max-w-xs leading-relaxed tracking-widest">
          Strategic layer feeding execution logic.
        </p>
      </div>
    );
  }

  if (settings.focusLock && currentTask && !currentTask.completed) {
    return (
      <div className="flex flex-col items-center justify-center space-y-16 py-12">
        <div className="text-center space-y-4">
          <p className="text-red-500 text-[10px] uppercase tracking-[0.4em] animate-pulse">Focus Locked</p>
          <h2 className="text-3xl font-bold text-white max-w-sm">{currentTask.task}</h2>
        </div>

        <div className="text-6xl font-extralight tracking-tighter text-zinc-100 font-mono">
          {formatTime(focusTimer)}
        </div>

        <div className="space-y-4 flex flex-col items-center">
          <button onClick={() => setIsCompleting(true)} className="px-12 py-4 bg-white text-black text-xs uppercase tracking-[0.2em] font-bold hover:bg-zinc-200 transition-colors">Complete Mission</button>
          <button
            onDoubleClick={() => updateSettings({ focusLock: false })}
            className="text-zinc-800 text-[9px] uppercase tracking-widest hover:text-red-900/40 transition-colors cursor-help"
          >
            (Double click to break seal)
          </button>
        </div>
      </div>
    );
  }

  if (currentTask) {
    return (
      <div className="w-full max-w-md flex flex-col items-center space-y-12">
        <div className="space-y-4 text-center">
          <p className="text-zinc-600 text-[10px] uppercase tracking-[0.3em]">{currentTask.systemGenerated ? "System Protocol" : "Current Mission"}</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight px-4">{currentTask.task}</h2>

          {planning.constraints.length > 0 && (
            <div className="pt-4 space-y-1">
              {planning.constraints.map((c, i) => (
                <p key={i} className="text-[9px] text-red-900/60 uppercase tracking-widest font-mono">Rule: {c}</p>
              ))}
            </div>
          )}
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
        <form onSubmit={(e) => { e.preventDefault(); if (inputTask) createTask(inputTask, selectedCategory); }} className="flex flex-col items-center space-y-12">
          <button onClick={() => setSelectedCategory(null)} className="text-zinc-600 text-[10px] uppercase tracking-widest hover:text-zinc-400">&larr; Change Vector: {selectedCategory}</button>
          <input autoFocus type="text" value={inputTask} onChange={(e) => setInputTask(e.target.value)} placeholder="Small, specific action..." className="w-full bg-transparent text-center text-xl font-normal text-zinc-200 placeholder-zinc-800 border-b border-zinc-800 focus:border-zinc-600 pb-4 transition-colors" />
          <AnimatePresence>
            {inputTask.length > 3 && <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} type="submit" className="px-8 py-3 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 text-xs uppercase tracking-widest transition-all">Confirm Action</motion.button>}
          </AnimatePresence>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={(e) => { e.preventDefault(); if (inputTask) createTask(inputTask, 'FLIGHT'); }} className="flex flex-col items-center space-y-12">
        <div className="text-center space-y-4">
          <div className="text-[10px] text-zinc-700 font-mono">{messages.title}</div>
          <label className="text-zinc-500 text-sm">{messages.subtitle}</label>
        </div>
        <input autoFocus type="text" value={inputTask} onChange={(e) => setInputTask(e.target.value)} placeholder="Define high-leverage action..." className="w-full bg-transparent text-center text-2xl font-normal text-zinc-100 placeholder-zinc-800 border-b border-zinc-800 focus:border-zinc-600 pb-4 transition-colors" />
        <AnimatePresence>
          {inputTask.length > 3 && <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} type="submit" className="px-8 py-3 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 text-xs uppercase tracking-widest transition-all">Initiate</motion.button>}
        </AnimatePresence>
      </form>
    </div>
  );
};
