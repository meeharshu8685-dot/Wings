import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWingsStore } from '../store/useWingsStore';
import { getTodayISO, getStartOfWeek } from '../utils/dateUtils';
import { MoodLevel } from '../types';

// Weekly Review Questions
const WEEKLY_QUESTIONS = [
    "What was your biggest win this week?",
    "What challenged you the most?",
    "What will you do differently next week?",
    "Rate your energy management (1-10)?"
];

// Monthly Review Questions  
const MONTHLY_QUESTIONS = [
    "What are you most proud of this month?",
    "Which habits are becoming automatic?",
    "What needs to change next month?",
    "How aligned are your actions with your goals?"
];

const MoodEmoji: Record<MoodLevel, { emoji: string; label: string; color: string }> = {
    1: { emoji: '😔', label: 'Struggling', color: 'text-rose-500' },
    2: { emoji: '😐', label: 'Low', color: 'text-orange-400' },
    3: { emoji: '🙂', label: 'Okay', color: 'text-yellow-500' },
    4: { emoji: '😊', label: 'Good', color: 'text-lime-500' },
    5: { emoji: '🌟', label: 'Thriving', color: 'text-emerald-500' }
};

export const LifeReview: React.FC = () => {
    const { lifeReview, momentum, daily, logMood, submitLifeReview } = useWingsStore();
    const today = getTodayISO();

    const [activeTab, setActiveTab] = useState<'mood' | 'balance' | 'weekly' | 'monthly' | 'insights'>('mood');
    const [reviewResponses, setReviewResponses] = useState<Record<number, string>>({});
    const [showReviewForm, setShowReviewForm] = useState(false);

    // Life Balance areas with feeling-based values (stored in state, user can adjust)
    const [lifeBalance, setLifeBalance] = useState<Record<string, number>>({
        study: 50,
        sleep: 50,
        health: 50,
        social: 50,
        skills: 50,
        peace: 50
    });

    const LIFE_AREAS = [
        { key: 'study', label: 'Study', emoji: '📚', color: 'bg-indigo-500' },
        { key: 'sleep', label: 'Sleep', emoji: '😴', color: 'bg-violet-500' },
        { key: 'health', label: 'Health', emoji: '💪', color: 'bg-emerald-500' },
        { key: 'social', label: 'Social', emoji: '👥', color: 'bg-amber-500' },
        { key: 'skills', label: 'Skills', emoji: '🎯', color: 'bg-rose-500' },
        { key: 'peace', label: 'Mental Peace', emoji: '🧘', color: 'bg-cyan-500' }
    ];

    // Check if review is due
    const weekStart = getStartOfWeek();
    const monthStart = new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const needsWeeklyReview = !lifeReview.lastWeeklyReview || lifeReview.lastWeeklyReview < weekStart;
    const needsMonthlyReview = !lifeReview.lastMonthlyReview || lifeReview.lastMonthlyReview < monthStart;

    // Today's mood
    const todayMood = lifeReview.moodLog.find(m => m.date === today);

    // Calculate insights
    const insights = useMemo(() => {
        const last7Days = lifeReview.moodLog.slice(-7);
        const avgMood = last7Days.length > 0
            ? last7Days.reduce((sum, m) => sum + m.mood, 0) / last7Days.length
            : 3;

        // Consistency from show-up history
        const showUpCount = momentum.showUpHistory.filter(Boolean).length;
        const consistency = Math.round((showUpCount / 7) * 100);

        // Discipline (softer)
        const streakBonus = Math.min(momentum.currentStreak * 3, 30);
        const discipline = Math.min(100, consistency * 0.7 + streakBonus);

        // Mood trend
        const firstHalf = last7Days.slice(0, Math.floor(last7Days.length / 2));
        const secondHalf = last7Days.slice(Math.floor(last7Days.length / 2));
        const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((s, m) => s + m.mood, 0) / firstHalf.length : 3;
        const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((s, m) => s + m.mood, 0) / secondHalf.length : 3;
        const trend = secondAvg > firstAvg ? 'up' : secondAvg < firstAvg ? 'down' : 'stable';

        return { avgMood, consistency, discipline, trend };
    }, [lifeReview.moodLog, momentum.showUpHistory, momentum.currentStreak]);

    const handleMoodSelect = (mood: MoodLevel) => {
        logMood(mood);
    };

    const handleSubmitReview = (type: 'WEEKLY' | 'MONTHLY') => {
        const questions = type === 'WEEKLY' ? WEEKLY_QUESTIONS : MONTHLY_QUESTIONS;
        const responses = questions.map((q, i) => ({
            question: q,
            answer: reviewResponses[i] || ''
        }));
        submitLifeReview(type, responses);
        setReviewResponses({});
        setShowReviewForm(false);
    };

    return (
        <div className="w-full max-w-lg space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-extralight tracking-[0.3em] text-slate-400 uppercase">Life Review</h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Reflect. Adjust. Grow.</p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center flex-wrap gap-2">
                {(['mood', 'balance', 'insights', 'weekly', 'monthly'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all ${activeTab === tab
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white/50 text-slate-400 hover:bg-white/80'
                            }`}
                    >
                        {tab === 'balance' ? 'Radar' : tab}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* MOOD TAB */}
                {activeTab === 'mood' && (
                    <motion.div
                        key="mood"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="glass p-8 rounded-[2rem] space-y-8"
                    >
                        <div className="text-center space-y-2">
                            <p className="text-slate-500 text-sm">How are you feeling today?</p>
                            {todayMood && (
                                <p className="text-[10px] text-indigo-500 uppercase tracking-widest">
                                    Already logged: {MoodEmoji[todayMood.mood].label}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-center space-x-4">
                            {([1, 2, 3, 4, 5] as MoodLevel[]).map(mood => (
                                <motion.button
                                    key={mood}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleMoodSelect(mood)}
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${todayMood?.mood === mood
                                        ? 'bg-indigo-100 ring-2 ring-indigo-500'
                                        : 'bg-white/50 hover:bg-white'
                                        }`}
                                >
                                    {MoodEmoji[mood].emoji}
                                </motion.button>
                            ))}
                        </div>

                        {/* 7-Day Mood History */}
                        <div className="pt-6 border-t border-slate-100 space-y-3">
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest text-center">Last 7 Days</p>
                            <div className="flex justify-center space-x-2">
                                {Array.from({ length: 7 }).map((_, i) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() - (6 - i));
                                    const dateStr = d.toISOString().split('T')[0];
                                    const entry = lifeReview.moodLog.find(m => m.date === dateStr);
                                    return (
                                        <div key={i} className="flex flex-col items-center space-y-1">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${entry ? 'bg-white' : 'bg-slate-50'
                                                }`}>
                                                {entry ? MoodEmoji[entry.mood].emoji : '·'}
                                            </div>
                                            <span className="text-[8px] text-slate-300">{d.toLocaleDateString('en', { weekday: 'short' }).charAt(0)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* BALANCE / RADAR TAB */}
                {activeTab === 'balance' && (
                    <motion.div
                        key="balance"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="glass p-8 rounded-[2rem] space-y-8"
                    >
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-light text-slate-700">Life Balance Radar</h2>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Which part of your life is collapsing?</p>
                        </div>

                        {/* Visual Radar Wheel */}
                        <div className="relative w-64 h-64 mx-auto">
                            {/* Center circle */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center text-2xl shadow-inner">
                                    🌟
                                </div>
                            </div>

                            {/* Radar segments */}
                            {LIFE_AREAS.map((area, i) => {
                                const angle = (i * 60 - 90) * (Math.PI / 180);
                                const value = lifeBalance[area.key];
                                const maxRadius = 100;
                                const barLength = (value / 100) * maxRadius;
                                const x = Math.cos(angle) * 40;
                                const y = Math.sin(angle) * 40;
                                const endX = Math.cos(angle) * (40 + barLength);
                                const endY = Math.sin(angle) * (40 + barLength);

                                return (
                                    <div key={area.key} className="absolute" style={{ left: '50%', top: '50%' }}>
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="absolute"
                                            style={{
                                                left: endX,
                                                top: endY,
                                                transform: 'translate(-50%, -50%)'
                                            }}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-lg ${value > 60 ? 'bg-white' : value > 30 ? 'bg-amber-50' : 'bg-rose-50'}`}>
                                                {area.emoji}
                                            </div>
                                        </motion.div>

                                        {/* Bar connecting center to node */}
                                        <svg className="absolute" style={{ left: 0, top: 0, overflow: 'visible' }}>
                                            <motion.line
                                                x1={x}
                                                y1={y}
                                                x2={endX}
                                                y2={endY}
                                                stroke={value > 60 ? '#10b981' : value > 30 ? '#f59e0b' : '#ef4444'}
                                                strokeWidth={3}
                                                strokeLinecap="round"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                            />
                                        </svg>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Feeling-based sliders (no numbers shown) */}
                        <div className="space-y-4 pt-6 border-t border-slate-100">
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest text-center">Adjust how each area feels</p>
                            {LIFE_AREAS.map(area => (
                                <div key={area.key} className="flex items-center space-x-3">
                                    <span className="text-lg w-8">{area.emoji}</span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider w-20">{area.label}</span>
                                    <div className="flex-1 relative">
                                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                className={`h-full ${area.color} rounded-full`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${lifeBalance[area.key]}%` }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={lifeBalance[area.key]}
                                            onChange={e => setLifeBalance({ ...lifeBalance, [area.key]: parseInt(e.target.value) })}
                                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${lifeBalance[area.key] > 60 ? 'bg-emerald-500' : lifeBalance[area.key] > 30 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                </div>
                            ))}
                        </div>

                        <p className="text-[9px] text-slate-300 text-center uppercase tracking-widest">
                            Red = needs attention • Amber = okay • Green = thriving
                        </p>
                    </motion.div>
                )}

                {/* INSIGHTS TAB */}
                {activeTab === 'insights' && (
                    <motion.div
                        key="insights"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Consistency Score */}
                        <div className="glass p-6 rounded-[2rem] space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Study Consistency</span>
                                <span className="text-2xl font-light text-slate-700">{insights.consistency}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${insights.consistency}%` }}
                                    className="h-full bg-indigo-500 rounded-full"
                                />
                            </div>
                            <p className="text-[9px] text-slate-400">Days with completed rules this week</p>
                        </div>

                        {/* Mood Trend */}
                        <div className="glass p-6 rounded-[2rem] space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Mood Trend</span>
                                <span className={`text-xl ${insights.trend === 'up' ? 'text-emerald-500' :
                                    insights.trend === 'down' ? 'text-rose-400' : 'text-slate-400'
                                    }`}>
                                    {insights.trend === 'up' ? '↗ Improving' : insights.trend === 'down' ? '↘ Dipping' : '→ Stable'}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-3xl">{MoodEmoji[Math.round(insights.avgMood) as MoodLevel]?.emoji || '🙂'}</span>
                                <span className="text-sm text-slate-500">Average mood: {insights.avgMood.toFixed(1)}/5</span>
                            </div>
                        </div>

                        {/* Discipline Score */}
                        <div className="glass p-6 rounded-[2rem] space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Discipline Score</span>
                                <span className="text-2xl font-light text-slate-700">{Math.round(insights.discipline)}</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${insights.discipline}%` }}
                                    className="h-full bg-emerald-500 rounded-full"
                                />
                            </div>
                            <p className="text-[9px] text-slate-400">Soft metric: showing up + streak bonus</p>
                        </div>
                    </motion.div>
                )}

                {/* WEEKLY TAB */}
                {activeTab === 'weekly' && (
                    <motion.div
                        key="weekly"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="glass p-8 rounded-[2rem] space-y-6"
                    >
                        {needsWeeklyReview && !showReviewForm ? (
                            <div className="text-center space-y-6">
                                <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center">
                                    <span className="text-2xl">📝</span>
                                </div>
                                <p className="text-slate-600">Time for your weekly reflection.</p>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowReviewForm(true)}
                                    className="px-8 py-3 bg-indigo-600 text-white text-[10px] uppercase tracking-widest font-bold rounded-xl"
                                >
                                    Start Review
                                </motion.button>
                            </div>
                        ) : showReviewForm ? (
                            <div className="space-y-6">
                                {WEEKLY_QUESTIONS.map((q, i) => (
                                    <div key={i} className="space-y-2">
                                        <label className="text-sm text-slate-600">{q}</label>
                                        <textarea
                                            value={reviewResponses[i] || ''}
                                            onChange={e => setReviewResponses({ ...reviewResponses, [i]: e.target.value })}
                                            className="w-full p-3 bg-white/50 border border-slate-100 rounded-xl text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-200"
                                            rows={2}
                                        />
                                    </div>
                                ))}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSubmitReview('WEEKLY')}
                                    className="w-full py-4 bg-indigo-600 text-white text-[10px] uppercase tracking-widest font-bold rounded-xl"
                                >
                                    Submit Weekly Review
                                </motion.button>
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <span className="text-3xl">✅</span>
                                <p className="text-slate-500">Weekly review completed.</p>
                                <p className="text-[10px] text-slate-400">Last reviewed: {lifeReview.lastWeeklyReview}</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* MONTHLY TAB */}
                {activeTab === 'monthly' && (
                    <motion.div
                        key="monthly"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="glass p-8 rounded-[2rem] space-y-6"
                    >
                        {needsMonthlyReview && !showReviewForm ? (
                            <div className="text-center space-y-6">
                                <div className="w-16 h-16 mx-auto rounded-full bg-indigo-50 flex items-center justify-center">
                                    <span className="text-2xl">📊</span>
                                </div>
                                <p className="text-slate-600">Take a moment for your monthly review.</p>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowReviewForm(true)}
                                    className="px-8 py-3 bg-indigo-600 text-white text-[10px] uppercase tracking-widest font-bold rounded-xl"
                                >
                                    Start Review
                                </motion.button>
                            </div>
                        ) : showReviewForm ? (
                            <div className="space-y-6">
                                {MONTHLY_QUESTIONS.map((q, i) => (
                                    <div key={i} className="space-y-2">
                                        <label className="text-sm text-slate-600">{q}</label>
                                        <textarea
                                            value={reviewResponses[i] || ''}
                                            onChange={e => setReviewResponses({ ...reviewResponses, [i]: e.target.value })}
                                            className="w-full p-3 bg-white/50 border border-slate-100 rounded-xl text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-200"
                                            rows={2}
                                        />
                                    </div>
                                ))}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSubmitReview('MONTHLY')}
                                    className="w-full py-4 bg-indigo-600 text-white text-[10px] uppercase tracking-widest font-bold rounded-xl"
                                >
                                    Submit Monthly Review
                                </motion.button>
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <span className="text-3xl">✅</span>
                                <p className="text-slate-500">Monthly review completed.</p>
                                <p className="text-[10px] text-slate-400">Last reviewed: {lifeReview.lastMonthlyReview}</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
