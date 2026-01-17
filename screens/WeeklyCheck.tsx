import React from 'react';
import { motion } from 'framer-motion';
import { useWingsStore } from '../store/useWingsStore';

interface WeeklyCheckProps {
    onClose: () => void;
}

export const WeeklyCheck: React.FC<WeeklyCheckProps> = ({ onClose }) => {
    const { answerWeeklyCheck, momentum } = useWingsStore();

    // Calculate show-up ratio
    const showedUp = momentum.showUpHistory.filter(Boolean).length;
    const total = momentum.showUpHistory.length;
    const moreShowedUp = showedUp > (total - showedUp);

    const handleAnswer = (answer: boolean) => {
        answerWeeklyCheck(answer);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass p-12 rounded-[3rem] max-w-md w-full space-y-10 text-center"
            >
                <div className="space-y-4">
                    <h1 className="text-3xl font-extralight tracking-[0.3em] text-slate-400 uppercase">Weekly Check</h1>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em]">One question. No dashboards.</p>
                </div>

                <div className="py-8 space-y-6">
                    <p className="text-xl font-semibold text-slate-800 leading-relaxed">
                        Did you show up more days than you disappeared?
                    </p>

                    <div className="flex justify-center items-center space-x-4">
                        <div className="flex space-x-1">
                            {momentum.showUpHistory.map((day, i) => (
                                <div
                                    key={i}
                                    className={`w-3 h-3 rounded-full ${day ? 'bg-indigo-500' : 'bg-slate-200'}`}
                                />
                            ))}
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                            {showedUp}/{total}
                        </span>
                    </div>
                </div>

                <div className="flex justify-center space-x-6">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAnswer(true)}
                        className="px-12 py-4 bg-indigo-600 text-white text-[11px] uppercase tracking-[0.3em] font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all"
                    >
                        Yes
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAnswer(false)}
                        className="px-12 py-4 bg-white border border-slate-200 text-slate-600 text-[11px] uppercase tracking-[0.3em] font-bold rounded-2xl shadow-sm transition-all hover:bg-slate-50"
                    >
                        No
                    </motion.button>
                </div>

                <p className="text-[9px] text-slate-300 uppercase tracking-widest">
                    Honesty is the only metric that matters.
                </p>
            </motion.div>
        </motion.div>
    );
};
