import React from 'react';
import { motion } from 'framer-motion';
import { useWingsStore } from '../store/useWingsStore';

const Toggle = ({ enabled, onToggle }: { enabled: boolean, onToggle: () => void }) => (
  <button 
    onClick={onToggle}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      enabled ? 'bg-indigo-600' : 'bg-zinc-700'
    }`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
      enabled ? 'translate-x-6' : 'translate-x-1'
    }`} />
  </button>
);

export const Settings: React.FC = () => {
  const { settings, updateSettings, toggleHardMode } = useWingsStore();
  
  const handleMotionToggle = () => {
    updateSettings({ motion: settings.motion === 'full' ? 'reduced' : 'full' });
  };

  return (
    <div className="w-full max-w-md space-y-12">
      <h1 className="text-3xl font-bold text-center text-zinc-300">System Settings</h1>

      {/* Motion Settings */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-zinc-200">Full Motion</h2>
            <p className="text-zinc-500 text-sm">Enable/disable UI animations.</p>
          </div>
          <Toggle enabled={settings.motion === 'full'} onToggle={handleMotionToggle} />
        </div>
      </div>
      
      <div className="w-full h-[1px] bg-zinc-800" />

      {/* Hard Mode Settings */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className={`font-semibold transition-colors ${settings.hardMode ? 'text-red-400' : 'text-zinc-200'}`}>
              Hard Mode
            </h2>
            <p className="text-zinc-500 text-sm">High stakes. High reward.</p>
          </div>
          <Toggle enabled={settings.hardMode} onToggle={toggleHardMode} />
        </div>
        <div className="p-4 bg-zinc-900 border border-red-900/50 rounded-lg text-red-400/80 text-xs leading-relaxed">
          <strong className="uppercase tracking-wider">Warning:</strong> Enabling this mode is a serious commitment.
          One missed day will result in a <strong className="text-red-300">catastrophic system reset</strong>.
          All progress, levels, streaks, and growth memory will be permanently erased. This action cannot be undone.
        </div>
      </div>
    </div>
  );
};
