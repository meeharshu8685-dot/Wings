import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWingsStore } from '../store/useWingsStore';

const HeavyToggle = ({
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
    const [isPending, setIsPending] = useState(false);

    const handleClick = (nextVal: any) => {
        if (nextVal === value) return;
        setIsPending(true);
        // Heavy animation delay
        setTimeout(() => {
            onChange(nextVal);
            setIsPending(false);
        }, 600);
    };

    return (
        <div className={`space-y-4 p-6 border ${warning ? 'border-red-900/30' : 'border-zinc-800/50'} bg-zinc-900/20 transition-all`}>
            <div className="flex justify-between items-baseline">
                <label className={`text-[10px] uppercase tracking-[0.2em] ${warning ? 'text-red-500' : 'text-zinc-500'}`}>
                    {label}
                </label>
                {isPending && (
                    <motion.span
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-[10px] font-mono text-zinc-600 animate-pulse"
                    >
                        SYNCHRONIZING...
                    </motion.span>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {options ? (
                    options.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => handleClick(opt.value)}
                            disabled={isPending}
                            className={`px-4 py-2 text-[11px] uppercase tracking-widest border transition-all duration-500 ${value === opt.value
                                ? (warning ? 'bg-red-950 border-red-500 text-red-200' : 'bg-white border-white text-black')
                                : 'border-zinc-800 text-zinc-600 hover:border-zinc-500 hover:text-zinc-300'
                                } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                        >
                            {opt.label}
                        </button>
                    ))
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleClick(true)}
                            disabled={isPending || value === true}
                            className={`px-6 py-2 text-[11px] uppercase tracking-widest border transition-all duration-500 ${value === true
                                ? (warning ? 'bg-red-950 border-red-500 text-red-200' : 'bg-white border-white text-black')
                                : 'border-zinc-800 text-zinc-600 hover:border-zinc-500 hover:text-zinc-300'
                                } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                        >
                            ON
                        </button>
                        <button
                            onClick={() => handleClick(false)}
                            disabled={isPending || value === false}
                            className={`px-6 py-2 text-[11px] uppercase tracking-widest border transition-all duration-500 ${value === false
                                ? 'bg-zinc-800 border-zinc-800 text-zinc-400'
                                : 'border-zinc-800 text-zinc-600 hover:border-zinc-500 hover:text-zinc-300'
                                } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
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
    const isPlanningLight = settings.explorationMode && !isPlanningBlocked;

    return (
        <div className="w-full max-w-lg space-y-12 py-8">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-light tracking-[0.3em] text-white uppercase">Control Panel</h1>
                <p className="text-[10px] text-zinc-600 tracking-widest uppercase">Manual System Override Hub</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Planning Mode Toggle */}
                <div className="md:col-span-2">
                    <HeavyToggle
                        label={isPlanningBlocked ? "Planning Blocked (Restrictive State)" : "Planning Mode"}
                        value={settings.planningMode}
                        onChange={(val) => !isPlanningBlocked && handleUpdate('planningMode', val)}
                        warning={isPlanningBlocked}
                    />
                    {isPlanningLimited && (
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-2 px-6">Limited strategic access in Build Mode.</p>
                    )}
                </div>

                {/* Toggle 1: State Override */}
                <div className="md:col-span-2">
                    <HeavyToggle
                        label="I am not okay today"
                        value={settings.stateOverride}
                        options={[
                            { label: 'Auto', value: 'AUTO' },
                            { label: 'Force Recovery', value: 'FORCE_RECOVERY' },
                            { label: 'Force Push', value: 'FORCE_PUSH' }
                        ]}
                        onChange={(val) => handleUpdate('stateOverride', val)}
                        warning={settings.stateOverride !== 'AUTO'}
                    />
                </div>

                {/* Toggle 2: Anti-Dopamine */}
                <HeavyToggle
                    label="Anti-dopamine"
                    value={settings.antiDopamine}
                    onChange={(val) => handleUpdate('antiDopamine', val)}
                />

                {/* Toggle 3: Focus Lock */}
                <HeavyToggle
                    label="Lock me in"
                    value={settings.focusLock}
                    onChange={(val) => handleUpdate('focusLock', val)}
                    warning={settings.focusLock}
                />

                {/* Toggle 4: Exploration Mode */}
                <HeavyToggle
                    label="I don't know what to work on"
                    value={settings.explorationMode}
                    onChange={(val) => handleUpdate('explorationMode', val)}
                />

                {/* Toggle 5: Maintenance Mode */}
                <HeavyToggle
                    label="Life is heavy right now"
                    value={settings.maintenanceMode}
                    onChange={(val) => handleUpdate('maintenanceMode', val)}
                />

                {/* Toggle 6: Growth Mode */}
                <div className="md:col-span-2 opacity-50 pointer-events-none">
                    <div className="p-6 border border-zinc-800 bg-zinc-900/10">
                        <div className="flex justify-between items-baseline mb-4">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                                Grow with me
                            </label>
                            <span className="text-[10px] font-mono text-zinc-700">ACTIVE</span>
                        </div>
                        <div className="text-[11px] text-zinc-600 uppercase tracking-widest">
                            Permanent synchronization enabled.
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-8 border-t border-zinc-900 flex justify-center">
                <div className="text-[9px] text-zinc-700 uppercase tracking-[0.4em]">
                    Agency without chaos.
                </div>
            </div>
        </div>
    );
};
