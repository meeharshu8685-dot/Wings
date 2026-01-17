import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWingsStore } from '../store/useWingsStore';

const RadiantSwitch = ({
    label,
    value,
    options,
    onChange,
    warning = false
}: {
    label: string,
    value: any,
    options?: { label: string, value: any }[],
    onChange: (val: any) => void,
    warning?: boolean
}) => {
    return (
        <div className={`glass p-6 rounded-[2rem] space-y-4 transition-all duration-500 overflow-hidden relative group`}>
            {warning && (
                <div className="absolute inset-0 bg-rose-500/5 pointer-events-none" />
            )}
            <div className="flex justify-between items-center">
                <label className={`text-[10px] uppercase tracking-[0.3em] font-bold ${warning ? 'text-rose-500' : 'text-slate-400'}`}>
                    {label}
                </label>
            </div>

            <div className="flex flex-wrap gap-3 mt-2">
                {options ? (
                    options.map((opt) => (
                        <motion.button
                            key={opt.value}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onChange(opt.value)}
                            className={`px-5 py-2 text-[10px] uppercase tracking-[0.2em] font-bold rounded-xl transition-all duration-300 border ${value === opt.value
                                ? (warning ? 'bg-rose-500 text-white border-rose-500' : 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100')
                                : 'bg-white/50 border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-400'
                                }`}
                        >
                            {opt.label}
                        </motion.button>
                    ))
                ) : (
                    <div className="flex bg-slate-100/50 p-1 rounded-xl">
                        <button
                            onClick={() => onChange(true)}
                            className={`px-6 py-2 text-[10px] uppercase tracking-[0.2em] font-bold rounded-lg transition-all duration-500 ${value === true
                                ? (warning ? 'bg-rose-500 text-white shadow-md shadow-rose-100' : 'bg-white text-indigo-600 shadow-sm')
                                : 'text-slate-400 opacity-60'
                                }`}
                        >
                            ON
                        </button>
                        <button
                            onClick={() => onChange(false)}
                            className={`px-6 py-2 text-[10px] uppercase tracking-[0.2em] font-bold rounded-lg transition-all duration-500 ${value === false
                                ? 'bg-white text-slate-600 shadow-sm'
                                : 'text-slate-400 opacity-60'
                                }`}
                        >
                            OFF
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const ControlPanel: React.FC = () => {
    const { settings, updateSettings, capacity } = useWingsStore();

    const handleUpdate = (key: keyof typeof settings, value: any) => {
        updateSettings({ [key]: value });
    };

    const isPlanningBlocked = settings.stateOverride === 'FORCE_RECOVERY' ||
        settings.stateOverride === 'FORCE_PUSH' ||
        settings.maintenanceMode;

    const isPlanningLimited = capacity === 'CAPABLE' && !isPlanningBlocked;

    return (
        <div className="w-full max-w-2xl space-y-12 py-8 px-4">
            <div className="text-center space-y-4">
                <motion.h1
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-3xl font-extralight tracking-[0.4em] text-slate-400 uppercase"
                >
                    System Core
                </motion.h1>
                <p className="text-[10px] text-slate-400 tracking-[0.3em] uppercase font-light">Direct Agency Controls</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Planning Mode Toggle */}
                <div className="md:col-span-2">
                    <RadiantSwitch
                        label={isPlanningBlocked ? "Strategy Blocked (Restrictive State)" : "Strategic Planning"}
                        value={settings.planningMode}
                        onChange={(val) => !isPlanningBlocked && handleUpdate('planningMode', val)}
                        warning={isPlanningBlocked}
                    />
                    {isPlanningLimited && (
                        <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-3 px-6 text-center">Elevation required for deeper strategy.</p>
                    )}
                </div>

                {/* State Override */}
                <div className="md:col-span-2">
                    <RadiantSwitch
                        label="Override: System Stance"
                        value={settings.stateOverride}
                        options={[
                            { label: 'Auto', value: 'AUTO' },
                            { label: 'Recovery', value: 'FORCE_RECOVERY' },
                            { label: 'Push', value: 'FORCE_PUSH' }
                        ]}
                        onChange={(val) => handleUpdate('stateOverride', val)}
                        warning={settings.stateOverride !== 'AUTO'}
                    />
                </div>

                {/* Toggles */}
                <RadiantSwitch
                    label="Noise Filter (Anti-Dopamine)"
                    value={settings.antiDopamine}
                    onChange={(val) => handleUpdate('antiDopamine', val)}
                />

                <RadiantSwitch
                    label="Sanctuary (Focus Lock)"
                    value={settings.focusLock}
                    onChange={(val) => handleUpdate('focusLock', val)}
                    warning={settings.focusLock}
                />

                <RadiantSwitch
                    label="Exploration (Random Vectors)"
                    value={settings.explorationMode}
                    onChange={(val) => handleUpdate('explorationMode', val)}
                />

                <RadiantSwitch
                    label="Load Protection (Maintenance)"
                    value={settings.maintenanceMode}
                    onChange={(val) => handleUpdate('maintenanceMode', val)}
                    warning={settings.maintenanceMode}
                />

                {/* Growth State */}
                <div className="md:col-span-2 opacity-50">
                    <div className="glass p-8 rounded-[2rem] flex justify-between items-center group overflow-hidden relative">
                        <div className="absolute inset-0 bg-indigo-50/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700" />
                        <div className="relative z-10">
                            <label className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold">
                                Growth Synchronization
                            </label>
                            <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-1">Permanent baseline active</p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-lg shadow-indigo-200 relative z-10" />
                    </div>
                </div>
            </div>

            <div className="pt-8 flex justify-center opacity-30">
                <div className="text-[10px] text-slate-500 uppercase tracking-[0.5em] font-light">
                    System Architecture: Premium Radiant
                </div>
            </div>
        </div>
    );
};
