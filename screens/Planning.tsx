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
        <div className="w-full max-w-2xl space-y-16 py-12">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-extralight tracking-[0.4em] text-white uppercase">Strategic Planning</h1>
                <p className="text-[10px] text-zinc-600 tracking-widest uppercase italic">Feed the system. Do not control it.</p>
            </div>

            {/* 1. Directions */}
            <section className="space-y-6">
                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 block border-b border-zinc-900 pb-2">1. Pull Forces (Directions)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {planning.directions.map((dir, idx) => {
                        const daysLeft = getDaysRemaining(dir.lockedUntil);
                        return (
                            <div key={idx} className="p-6 border border-zinc-800 bg-zinc-900/20 relative group">
                                <p className="text-sm text-zinc-300 font-light leading-relaxed">{dir.text}</p>
                                <div className="absolute bottom-2 right-2 text-[8px] font-mono text-zinc-700 uppercase">
                                    Locked: {daysLeft}d
                                </div>
                            </div>
                        );
                    })}
                    {planning.directions.length < 3 && (
                        <div className="p-6 border border-zinc-800 border-dashed hover:border-zinc-600 transition-colors">
                            <input
                                value={newDirection}
                                onChange={(e) => setNewDirection(e.target.value)}
                                placeholder="Declare direction..."
                                className="w-full bg-transparent text-sm font-light text-zinc-400 placeholder-zinc-800 focus:outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddDirection()}
                            />
                            <p className="text-[8px] text-zinc-700 uppercase mt-4">Press Enter to lock for 30 days</p>
                        </div>
                    )}
                </div>
            </section>

            {/* 2. Time Budget */}
            <section className="space-y-6">
                <div className="flex justify-between items-baseline border-b border-zinc-900 pb-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">2. Reality Ceiling (Time Budget)</label>
                    <span className="text-xl font-light text-white font-mono">{planning.timeBudget} MIN/DAY</span>
                </div>
                <input
                    type="range" min="5" max="180" step="5"
                    value={planning.timeBudget}
                    onChange={(e) => updatePlanning({ timeBudget: parseInt(e.target.value) })}
                    className="w-full h-1 bg-zinc-900 appearance-none cursor-pointer accent-white"
                />
                <p className="text-[10px] text-zinc-700 uppercase text-center tracking-widest">WINGS will never exceed this. It will often ask for less.</p>
            </section>

            {/* 3. Priority Weights */}
            <section className="space-y-6">
                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 block border-b border-zinc-900 pb-2">3. Importance Ratios (Weights)</label>
                <div className="space-y-4">
                    {Object.entries(planning.priorityWeights).map(([cat, weight]) => (
                        <div key={cat} className="flex items-center space-x-6">
                            <span className="w-16 text-[10px] uppercase tracking-widest text-zinc-600">{cat}</span>
                            <input
                                type="range" min="0" max="100" step="10"
                                value={weight}
                                onChange={(e) => updateWeight(cat, parseInt(e.target.value))}
                                className="flex-1 h-1 bg-zinc-900 appearance-none cursor-pointer accent-zinc-500"
                            />
                            <span className="w-8 text-[10px] font-mono text-zinc-400">{weight}%</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. Constraints */}
            <section className="space-y-6">
                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 block border-b border-zinc-900 pb-2">4. Anti-Self-Sabotage (Rules)</label>
                <div className="space-y-2">
                    {planning.constraints.map((c, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-zinc-900/40 border border-zinc-800/50 group">
                            <span className="text-[11px] text-zinc-400 uppercase tracking-widest">{c}</span>
                            <button onClick={() => removeConstraint(idx)} className="opacity-0 group-hover:opacity-100 text-[10px] text-red-900 hover:text-red-500 transition-all font-mono">REMOVE</button>
                        </div>
                    ))}
                    <div className="flex space-x-2 pt-2">
                        <input
                            value={newConstraint}
                            onChange={(e) => setNewConstraint(e.target.value)}
                            placeholder="e.g. No phone before daily task"
                            className="flex-1 bg-transparent border-b border-zinc-800 text-[11px] text-zinc-300 placeholder-zinc-800 py-2 focus:outline-none focus:border-zinc-600"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddConstraint()}
                        />
                    </div>
                </div>
            </section>

            <div className="pt-12 flex justify-center border-t border-zinc-900">
                <div className="text-[9px] text-zinc-800 uppercase tracking-[0.5em] text-center max-w-xs leading-relaxed">
                    Planning is complete when you stop seeking control and start accepting constraints.
                </div>
            </div>
        </div>
    );
};
