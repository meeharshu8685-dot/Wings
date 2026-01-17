import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWingsStore } from '../store/useWingsStore';
import { getTodayISO } from '../utils/dateUtils';
import { TaskCategory, CapacityState, GrowthState, DailyRule } from '../types';

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
  const {
    daily, dailyRule, capacity, growth, settings, planning, energy,
    generateDailyRule, completeRule, updateSettings
  } = useWingsStore();
  const today = getTodayISO();

  const [focusTimer, setFocusTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (settings.focusLock && dailyRule && !dailyRule.completed) {
      interval = setInterval(() => {
        setFocusTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [settings.focusLock, dailyRule?.completed]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const minEffort = getMinimumEffort(growth, settings, planning);
  const messages = getFlightDeckMessages(capacity, growth, minEffort, settings);

  // ===== HARD STOP: Session Complete Lock =====
  if (settings.hardStopActive && dailyRule?.completed) {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-16 py-12">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass p-16 rounded-[4rem] space-y-10"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-extralight tracking-[0.4em] text-slate-400 uppercase">Session Complete</h1>
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] max-w-xs mx-auto leading-relaxed">
              Today's rule fulfilled. System locked until tomorrow.
            </p>
          </div>
          <div className="pt-8 border-t border-slate-100">
            <p className="text-[11px] font-mono text-slate-600 uppercase tracking-widest">{dailyRule.rule}</p>
            <p className="text-[10px] text-emerald-500 mt-2 font-bold tracking-widest">PROOF RECORDED</p>
          </div>
        </motion.div>
        <p className="text-[9px] text-slate-300 uppercase tracking-[0.3em]">Hard Stop: No extra work. Rest is part of the protocol.</p>
      </div>
    );
  }

  // ===== RULE COMPLETED (but Hard Stop not active - shouldn't happen normally) =====
  if (dailyRule?.completed) {
    return (
      <div className="text-center space-y-12 py-12">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass p-12 rounded-[3rem] space-y-8"
        >
          <div className="space-y-4">
            <h2 className="text-3xl font-extralight tracking-[0.3em] text-slate-400 uppercase">Rule Followed</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.5em] leading-relaxed max-w-xs mx-auto">
              Behavior &rarr; Identity<br />
              Proof: I showed up today.
            </p>
          </div>
          <div className="pt-8 border-t border-slate-200/50">
            <p className="text-slate-600 text-[11px] font-mono uppercase tracking-widest">{dailyRule.rule}</p>
            {dailyRule.type === 'BOREDOM' && (
              <p className="text-amber-500 text-[9px] mt-2 font-bold tracking-widest">BOREDOM TRAINING</p>
            )}
          </div>
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

  // ===== FOCUS LOCK / SANCTUARY MODE (with dailyRule) =====
  if (settings.focusLock && dailyRule && !dailyRule.completed) {
    return (
      <div className="flex flex-col items-center justify-center space-y-16 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-12 rounded-[4rem] text-center space-y-10 relative overflow-hidden"
        >
          <motion.div
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full"
          />

          <div className="space-y-4 relative z-10">
            <p className="text-indigo-500 text-[10px] uppercase tracking-[0.5em] font-bold">Sanctuary Mode</p>
            <h2 className="text-3xl font-semibold text-slate-800 max-w-xs mx-auto leading-tight">{dailyRule.rule}</h2>
            {dailyRule.type === 'BOREDOM' && (
              <p className="text-amber-500 text-[9px] tracking-widest font-bold">BOREDOM TRAINING</p>
            )}
          </div>

          <div className="text-4xl font-extralight tracking-tighter text-slate-700 font-mono relative z-10">
            {formatTime(focusTimer)}
          </div>

          <div className="space-y-6 relative z-10">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => completeRule()}
              className="px-12 py-4 bg-indigo-600 text-white text-[11px] uppercase tracking-[0.3em] font-bold rounded-full shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
            >
              I Followed This Rule
            </motion.button>
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

  // ===== ACTIVE RULE (not in focus lock) =====
  if (dailyRule && !dailyRule.completed) {
    return (
      <div className="w-full max-w-lg flex flex-col items-center space-y-16">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass w-full p-12 rounded-[3.5rem] text-center space-y-10"
        >
          <div className="space-y-6">
            <p className="text-slate-400 text-[10px] uppercase tracking-[0.4em] font-semibold">
              {dailyRule.type === 'BOREDOM' ? 'Boredom Training' : "Today's Non-Negotiable"}
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-800 leading-tight px-4">{dailyRule.rule}</h2>

            {planning.constraints.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 pt-4">
                {planning.constraints.map((c, i) => (
                  <span key={i} className="px-3 py-1 bg-rose-50 text-rose-500 text-[9px] uppercase tracking-widest font-bold rounded-full border border-rose-100">Rule: {c}</span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => completeRule()}
              className="px-12 py-5 bg-indigo-600 text-white text-[11px] uppercase tracking-[0.3em] font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
            >
              I Followed This Rule
            </motion.button>
            <p className="text-[9px] text-slate-300 uppercase tracking-widest">No time tracking. Just truth.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ===== NO RULE YET: Generate Daily Rule =====
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-12">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-6">
        <h1 className="text-4xl font-semibold text-slate-800 tracking-tight">{messages.title}</h1>
        <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed tracking-wide font-light">{messages.subtitle}</p>

        {/* Energy Level Indicator */}
        {energy && (
          <div className="flex justify-center items-center space-x-3 pt-4">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest">Energy Level</span>
            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(20, 100 - energy.recentMisses * 15))}%` }}
              />
            </div>
          </div>
        )}
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => generateDailyRule()}
        className="px-12 py-5 bg-white shadow-xl shadow-slate-200/50 border border-slate-100 rounded-2xl text-indigo-600 text-[11px] uppercase tracking-[0.3em] font-bold transition-all hover:shadow-indigo-100"
      >
        Receive Today's Rule
      </motion.button>
    </div>
  );
};
