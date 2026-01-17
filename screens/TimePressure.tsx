import React, { useState } from 'react';
import { useWingsStore } from '../store/useWingsStore';
import { motion } from 'framer-motion';

export const TimePressure: React.FC = () => {
  const { settings, updateSettings } = useWingsStore();
  const [age, setAge] = useState(settings.userAge || 30);
  
  // Assumptions: Life expectancy 80. Deep work decline starts around 65? 
  // Let's keep it simple: 80 years total.
  const TOTAL_YEARS = 80;
  const WEEKS_IN_YEAR = 52;
  const totalWeeks = TOTAL_YEARS * WEEKS_IN_YEAR;
  const weeksLived = age * WEEKS_IN_YEAR;
  const weeksLeft = totalWeeks - weeksLived;
  const percentGone = (weeksLived / totalWeeks) * 100;

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setAge(val);
    updateSettings({ userAge: val });
  };

  return (
    <div className="w-full flex flex-col items-center space-y-10">
      
      <div className="w-full space-y-2">
        <div className="flex justify-between items-baseline">
          <label className="text-zinc-500 text-xs uppercase tracking-widest">Age Input</label>
          <input 
             type="number" 
             value={age} 
             onChange={handleAgeChange}
             className="bg-transparent text-right text-zinc-300 font-mono text-sm w-12 border-b border-zinc-800 focus:border-zinc-600"
          />
        </div>
      </div>

      <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden relative">
        <motion.div 
          className="absolute top-0 left-0 h-full bg-zinc-700"
          initial={{ width: 0 }}
          animate={{ width: `${percentGone}%` }}
          transition={{ duration: 2, ease: "circOut" }}
        />
      </div>

      <div className="grid grid-cols-2 gap-12 text-center w-full">
        <div>
           <h3 className="text-5xl font-bold text-zinc-200">{weeksLeft.toLocaleString()}</h3>
           <p className="text-zinc-600 text-xs mt-2 uppercase tracking-widest">Weeks Remaining</p>
        </div>
        <div>
           <h3 className="text-5xl font-bold text-zinc-200">{(TOTAL_YEARS - age)}</h3>
           <p className="text-zinc-600 text-xs mt-2 uppercase tracking-widest">Winters Left</p>
        </div>
      </div>

      <div className="max-w-xs text-center space-y-4">
        <p className="text-zinc-500 text-sm leading-relaxed">
          The sand does not stop flowing. <br/>
          Every hesitation is a withdrawal from a non-renewable account.
        </p>
      </div>

      <div className="pt-8">
        <div className="px-4 py-2 border border-red-900/30 text-red-900/50 text-xs uppercase tracking-[0.2em] rounded">
          No Fear. Only Clarity.
        </div>
      </div>
    </div>
  );
};
