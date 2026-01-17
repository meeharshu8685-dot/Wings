import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWingsStore } from '../store/useWingsStore';
import { getTodayISO, addDays, getDaysRemaining } from '../utils/dateUtils';

export const Planning: React.FC = () => {
    const { planning, updatePlanning, settings } = useWingsStore();
    const [newDirection, setNewDirection] = useState("");
    const [newConstraint, setNewConstraint] = useState("");

    const handleAddDirection = () => {
        if (!newDirection || planning.directions.length >= 3) return;
        const directions = [
            ...planning.directions,
            { text: newDirection, lockedUntil: addDays(getTodayISO(), 30) }
        ];
        updatePlanning({ directions });
        setNewDirection("");
    };

    const handleAddConstraint = () => {
        if (!newConstraint) return;
        updatePlanning({ constraints: [...planning.constraints, newConstraint] });
        setNewConstraint("");
    };

    const removeConstraint = (index: number) => {
        const constraints = planning.constraints.filter((_, i) => i !== index);
        updatePlanning({ constraints });
    };

    const updateWeight = (category: string, value: number) => {
        updatePlanning({
            priorityWeights: { ...planning.priorityWeights, [category]: value }
        });
    };

    return (
        <div className="w-full max-w-3xl space-y-16 py-12 px-4">
            <div className="text-center space-y-4">
                <motion.h1
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-3xl font-extralight tracking-[0.4em] text-slate-400 uppercase"
                >
                    Strategic Layer
                </motion.h1>
                <p className="text-[10px] text-slate-400 tracking-[0.3em] uppercase font-light italic">Observation & Direction</p>
            </div>

            {/* 1. Directions */}
            <section className="space-y-8">
                <div className="flex justify-between items-end border-b border-slate-100 pb-3">
                    <label className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold">01. Intent Vectors</label>
                    <span className="text-[9px] text-slate-300 uppercase tracking-widest font-mono">Max: 3 Locked Forces</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {planning.directions.map((dir, idx) => {
                        const daysLeft = getDaysRemaining(dir.lockedUntil);
                        return (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -4 }}
                                className="glass p-6 rounded-[2rem] relative group border-indigo-50"
                            >
                                <p className="text-sm text-slate-600 font-light leading-relaxed">{dir.text}</p>
                                <div className="absolute top-2 right-4 text-[8px] font-mono text-indigo-300 uppercase font-bold">
                                    {daysLeft}d LOCK
                                </div>
                            </motion.div>
                        );
                    })}
                    {planning.directions.length < 3 && (
                        <div className="glass p-6 rounded-[2rem] border-dashed border-slate-200 hover:border-indigo-200 transition-all group">
                            <input
                                value={newDirection}
                                onChange={(e) => setNewDirection(e.target.value)}
                                placeholder="New Vector..."
                                className="w-full bg-transparent text-sm font-light text-slate-400 placeholder-slate-200 focus:outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddDirection()}
                            />
                            <div className="mt-4 opacity-0 group-focus-within:opacity-100 transition-opacity">
                                <p className="text-[8px] text-slate-300 uppercase tracking-widest">Enter &rarr; 30d Commitment</p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* 2. Time Budget */}
            <section className="glass p-10 rounded-[3rem] space-y-8 shadow-xl shadow-indigo-100/20">
                <div className="flex justify-between items-baseline">
                    <label className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold">02. Reality Ceiling</label>
                    <span className="text-2xl font-light text-indigo-600 font-mono tracking-tighter">{planning.timeBudget} <span className="text-xs uppercase tracking-widest text-slate-300">MIN/DAY</span></span>
                </div>
                <input
                    type="range" min="5" max="180" step="5"
                    value={planning.timeBudget}
                    onChange={(e) => updatePlanning({ timeBudget: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-100 appearance-none cursor-pointer accent-indigo-500 rounded-full"
                />
                <p className="text-[9px] text-slate-400 uppercase text-center tracking-[0.2em] font-light">The biological hard limit for daily system demands.</p>
            </section>

            {/* 3. Priority Weights */}
            <section className="space-y-8">
                <label className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold block border-b border-slate-100 pb-3">03. Dynamic Weighting</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                    {Object.entries(planning.priorityWeights).map(([cat, weight]) => (
                        <div key={cat} className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
                                <span className="text-slate-500">{cat}</span>
                                <span className="text-indigo-400 font-mono">{weight}%</span>
                            </div>
                            <input
                                type="range" min="0" max="100" step="10"
                                value={weight}
                                onChange={(e) => updateWeight(cat, parseInt(e.target.value))}
                                className="w-full h-1 bg-slate-100 appearance-none cursor-pointer accent-slate-300 rounded-full hover:accent-indigo-300 transition-colors"
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. Constraints */}
            <section className="space-y-8">
                <label className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold block border-b border-slate-100 pb-3">04. Behavioral Guardrails</label>
                <div className="space-y-3">
                    <AnimatePresence>
                        {planning.constraints.map((c, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex justify-between items-center p-5 glass rounded-2xl group"
                            >
                                <span className="text-[11px] text-slate-600 uppercase tracking-widest font-medium font-mono">
                                    <span className="text-indigo-300 mr-3">#</span>{c}
                                </span>
                                <button onClick={() => removeConstraint(idx)} className="opacity-0 group-hover:opacity-100 text-[9px] text-rose-300 hover:text-rose-500 transition-all font-bold uppercase tracking-widest">Remove</button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div className="pt-4">
                        <input
                            value={newConstraint}
                            onChange={(e) => setNewConstraint(e.target.value)}
                            placeholder="+ Add Behavioral Rule..."
                            className="w-full glass bg-white/30 p-5 rounded-2xl text-[11px] text-slate-600 placeholder-slate-200 tracking-widest focus:ring-1 ring-indigo-100 transition-all"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddConstraint()}
                        />
                    </div>
                </div>
            </section>

            <div className="pt-12 flex flex-col items-center space-y-6 opacity-40">
                <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-transparent rounded-full" />
                <div className="text-[10px] text-slate-400 uppercase tracking-[0.5em] text-center max-w-sm leading-relaxed font-light">
                    Strategy is the art of choosing what not to do.
                </div>
            </div>
        </div>
    );
};
