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
  const totalSecondsNeeded = minEffort * 60;
  const progress = Math.min(focusTimer / totalSecondsNeeded, 1);

  const handleCompletionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseInt(realityTime);
    if (minutes >= minEffort) {
      completeTask(minutes);
    }
  };

  if (currentTask?.completed) {
    return (
      <div className="text-center space-y-12 py-12">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass p-12 rounded-[3rem] space-y-8"
        >
          <div className="space-y-4">
            <h2 className="text-3xl font-extralight tracking-[0.3em] text-slate-400 uppercase">Mission Logged</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.5em] leading-relaxed max-w-xs mx-auto">
              Behavior &rarr; Identity<br />
              Proof: I showed up today.
            </p>
          </div>
          <div className="pt-8 border-t border-slate-200/50">
            <p className="text-slate-600 text-[11px] font-mono uppercase tracking-widest">{currentTask.task}</p>
            <p className="text-indigo-500 text-[10px] font-mono mt-2 font-bold tracking-widest">{currentTask.timeSpent}M INVESTED</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isCompleting) {
    return (
      <div className="w-full max-w-md">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass p-12 rounded-[3rem] space-y-12">
          <form onSubmit={handleCompletionSubmit} className="flex flex-col items-center space-y-12">
            <label className="text-slate-400 text-[10px] uppercase tracking-[0.3em] font-semibold">Log Minutes (Floor: {minEffort})</label>
            <div className="relative">
              <input autoFocus type="number" min={minEffort} value={realityTime} onChange={(e) => setRealityTime(e.target.value)} placeholder="0"
                className="w-32 bg-transparent text-center text-5xl font-mono text-slate-700 placeholder-slate-200 border-b-2 border-slate-100 focus:border-indigo-200 pb-4 transition-colors" />
              <span className="absolute -right-8 bottom-6 text-slate-300 text-xs font-mono tracking-widest">MIN</span>
            </div>
            <div className="flex space-x-6">
              <button type="button" onClick={() => setIsCompleting(false)} className="px-6 py-3 text-slate-400 hover:text-slate-600 text-[10px] uppercase tracking-widest transition-all font-bold">Cancel</button>
              <button type="submit" disabled={parseInt(realityTime) < minEffort} className="px-10 py-4 bg-indigo-600 text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all disabled:opacity-30 transform hover:scale-105">Confirm Proof</button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  if (settings.planningMode) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 py-12 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-2 border-indigo-100 border-t-indigo-500 rounded-full"
        />
        <h2 className="text-xl font-light tracking-[0.2em] text-slate-400 uppercase">System Recalibration</h2>
        <p className="text-[10px] text-slate-400 uppercase max-w-xs leading-relaxed tracking-widest">
          Strategic layer feeding execution logic.
        </p>
      </div>
    );
  }

  if (settings.focusLock && currentTask && !currentTask.completed) {
    return (
      <div className="flex flex-col items-center justify-center space-y-16 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-12 rounded-[4rem] text-center space-y-10 relative overflow-hidden"
        >
          {/* Radiant Aura */}
          <motion.div
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full"
          />

          <div className="space-y-4 relative z-10">
            <p className="text-indigo-500 text-[10px] uppercase tracking-[0.5em] font-bold">Sanctuary Mode</p>
            <h2 className="text-3xl font-semibold text-slate-800 max-w-xs mx-auto leading-tight">{currentTask.task}</h2>
          </div>

          <div className="relative h-32 w-32 mx-auto flex items-center justify-center z-10">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="64" cy="64" r="60" className="stroke-slate-100 fill-none" strokeWidth="2" />
              <motion.circle
                cx="64" cy="64" r="60"
                className="stroke-indigo-500 fill-none"
                strokeWidth="2"
                strokeDasharray="377"
                animate={{ strokeDashoffset: 377 * (1 - progress) }}
                transition={{ type: "spring", bounce: 0 }}
              />
            </svg>
            <div className="text-4xl font-extralight tracking-tighter text-slate-700 font-mono">
              {formatTime(focusTimer)}
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <button onClick={() => setIsCompleting(true)} className="px-12 py-4 bg-indigo-600 text-white text-[11px] uppercase tracking-[0.3em] font-bold rounded-full shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform hover:scale-105 active:scale-95">Log Progress</button>
            <button
              onDoubleClick={() => updateSettings({ focusLock: false })}
              className="block mx-auto text-slate-300 text-[9px] uppercase tracking-widest hover:text-indigo-400 transition-colors cursor-help"
            >
              (Double click to end sanctuary)
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (currentTask) {
    return (
      <div className="w-full max-w-lg flex flex-col items-center space-y-16">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass w-full p-12 rounded-[3.5rem] text-center space-y-10"
        >
          <div className="space-y-6">
            <p className="text-slate-400 text-[10px] uppercase tracking-[0.4em] font-semibold">{currentTask.systemGenerated ? "System Protocol" : "Mission Active"}</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-800 leading-tight px-4">{currentTask.task}</h2>

            {planning.constraints.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 pt-4">
                {planning.constraints.map((c, i) => (
                  <span key={i} className="px-3 py-1 bg-rose-50 text-rose-500 text-[9px] uppercase tracking-widest font-bold rounded-full border border-rose-100">Rule: {c}</span>
                ))}
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCompleting(true)}
            className="group relative w-28 h-28 mx-auto rounded-full flex items-center justify-center glass border-indigo-100 hover:border-indigo-300 transition-all duration-700"
          >
            <div className="absolute inset-2 rounded-full border border-indigo-50 transition-all duration-700 group-hover:bg-indigo-50/50" />
            <svg className="w-10 h-10 text-indigo-400 group-hover:text-indigo-600 transition-colors duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" />
            </svg>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (capacity === 'FRAGILE') {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-12">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-6">
          <h1 className="text-4xl font-semibold text-slate-800 tracking-tight">{messages.title}</h1>
          <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed tracking-wide font-light">{messages.subtitle}</p>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => generateGroundTask()}
          className="px-12 py-5 bg-white shadow-xl shadow-slate-200/50 border border-slate-100 rounded-2xl text-indigo-600 text-[11px] uppercase tracking-[0.3em] font-bold transition-all"
        >
          Receive Protocol
        </motion.button>
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
