import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { useWingsStore } from '../store/useWingsStore';
import { getTodayISO, getStartOfWeek } from '../utils/dateUtils';
import { MoodLevel } from '../types';

// Import Lottie animations
import pulseGlowAnimation from '../assets/animations/pulse_glow.json';
import successCheckAnimation from '../assets/animations/success_check.json';
import radarSweepAnimation from '../assets/animations/radar_sweep.json';

// Advanced Framer Motion variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1, y: 0, scale: 1,
        transition: { type: "spring", stiffness: 300, damping: 24 }
    }
};

const floatVariants = {
    float: {
        y: [0, -8, 0],
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    }
};

// Questions
const WEEKLY_QUESTIONS = [
    "What was your biggest win this week?",
    "What challenged you the most?",
    "What will you do differently next week?",
    "Rate your energy management (1-10)?"
];

const MONTHLY_QUESTIONS = [
    "What are you most proud of this month?",
    "Which habits are becoming automatic?",
    "What needs to change next month?",
    "How aligned are your actions with your goals?"
];

// Mood levels
const MoodLevels: Record<MoodLevel, { label: string; gradient: string; ring: string }> = {
    1: { label: 'Struggling', gradient: 'from-rose-500 to-rose-600', ring: 'ring-rose-400' },
    2: { label: 'Low', gradient: 'from-orange-400 to-amber-500', ring: 'ring-orange-300' },
    3: { label: 'Neutral', gradient: 'from-slate-400 to-slate-500', ring: 'ring-slate-300' },
    4: { label: 'Good', gradient: 'from-lime-400 to-emerald-500', ring: 'ring-lime-300' },
    5: { label: 'Thriving', gradient: 'from-emerald-400 to-teal-500', ring: 'ring-emerald-300' }
};

// Life area icons
const LifeAreaIcons = {
    study: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
    sleep: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>,
    health: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>,
    social: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
    skills: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
    peace: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
};

export const LifeReview: React.FC = () => {
    const { lifeReview, momentum, logMood, submitLifeReview } = useWingsStore();
    const today = getTodayISO();

    const [activeTab, setActiveTab] = useState<'mood' | 'balance' | 'weekly' | 'monthly' | 'insights'>('mood');
    const [reviewResponses, setReviewResponses] = useState<Record<number, string>>({});
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [lifeBalance, setLifeBalance] = useState<Record<string, number>>({
        study: 50, sleep: 50, health: 50, social: 50, skills: 50, peace: 50
    });

    const LIFE_AREAS = [
        { key: 'study', label: 'Study', gradient: 'from-indigo-500 to-violet-600' },
        { key: 'sleep', label: 'Sleep', gradient: 'from-violet-500 to-purple-600' },
        { key: 'health', label: 'Health', gradient: 'from-emerald-500 to-teal-600' },
        { key: 'social', label: 'Social', gradient: 'from-amber-500 to-orange-600' },
        { key: 'skills', label: 'Skills', gradient: 'from-rose-500 to-pink-600' },
        { key: 'peace', label: 'Peace', gradient: 'from-cyan-500 to-sky-600' }
    ];

    const weekStart = getStartOfWeek();
    const monthStart = new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const needsWeeklyReview = !lifeReview.lastWeeklyReview || lifeReview.lastWeeklyReview < weekStart;
    const needsMonthlyReview = !lifeReview.lastMonthlyReview || lifeReview.lastMonthlyReview < monthStart;
    const todayMood = lifeReview.moodLog.find(m => m.date === today);

    const insights = useMemo(() => {
        const last7Days = lifeReview.moodLog.slice(-7);
        const avgMood = last7Days.length > 0 ? last7Days.reduce((sum, m) => sum + m.mood, 0) / last7Days.length : 3;
        const showUpCount = momentum.showUpHistory.filter(Boolean).length;
        const consistency = Math.round((showUpCount / 7) * 100);
        const streakBonus = Math.min(momentum.currentStreak * 3, 30);
        const discipline = Math.min(100, consistency * 0.7 + streakBonus);
        const firstHalf = last7Days.slice(0, Math.floor(last7Days.length / 2));
        const secondHalf = last7Days.slice(Math.floor(last7Days.length / 2));
        const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((s, m) => s + m.mood, 0) / firstHalf.length : 3;
        const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((s, m) => s + m.mood, 0) / secondHalf.length : 3;
        const trend = secondAvg > firstAvg ? 'up' : secondAvg < firstAvg ? 'down' : 'stable';
        return { avgMood, consistency, discipline, trend };
    }, [lifeReview.moodLog, momentum.showUpHistory, momentum.currentStreak]);

    const handleMoodSelect = (mood: MoodLevel) => logMood(mood);

    const handleSubmitReview = (type: 'WEEKLY' | 'MONTHLY') => {
        const questions = type === 'WEEKLY' ? WEEKLY_QUESTIONS : MONTHLY_QUESTIONS;
        const responses = questions.map((q, i) => ({ question: q, answer: reviewResponses[i] || '' }));
        submitLifeReview(type, responses);
        setReviewResponses({});
        setShowReviewForm(false);
    };

    return (
        <div className="w-full max-w-lg space-y-8">
            {/* Header with Lottie */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-3"
            >
                <div className="relative inline-block">
                    <div className="w-12 h-12 mx-auto">
                        <Lottie animationData={pulseGlowAnimation} loop={true} />
                    </div>
                </div>
                <motion.div
                    variants={floatVariants}
                    animate="float"
                    className="inline-flex items-center space-x-2 px-4 py-1.5 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-full border border-indigo-200/50"
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[10px] text-indigo-600 uppercase tracking-[0.3em] font-medium">Life Review</span>
                </motion.div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Reflect · Calibrate · Evolve</p>
            </motion.div>

            {/* Premium Tabs */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex justify-center"
            >
                <div className="inline-flex p-1 bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-lg">
                    {(['mood', 'balance', 'insights', 'weekly', 'monthly'] as const).map(tab => (
                        <motion.button
                            key={tab}
                            variants={itemVariants}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setActiveTab(tab); setShowReviewForm(false); }}
                            className={`px-5 py-2.5 text-[10px] uppercase tracking-widest font-semibold rounded-xl transition-all duration-300 ${activeTab === tab
                                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab === 'balance' ? 'Radar' : tab}
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {/* MOOD TAB */}
                {activeTab === 'mood' && (
                    <motion.div
                        key="mood"
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="glass p-10 rounded-[2.5rem] space-y-10 border border-white/50"
                    >
                        <div className="text-center space-y-2">
                            <h2 className="text-lg font-light text-slate-700 tracking-wide">How are you feeling?</h2>
                            {todayMood && (
                                <p className="text-[10px] text-indigo-500 uppercase tracking-widest font-medium">
                                    Logged: {MoodLevels[todayMood.mood].label}
                                </p>
                            )}
                        </div>

                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="flex justify-center space-x-4"
                        >
                            {([1, 2, 3, 4, 5] as MoodLevel[]).map((mood, i) => (
                                <motion.button
                                    key={mood}
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.15, y: -4, rotate: [0, -5, 5, 0] }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleMoodSelect(mood)}
                                    className={`relative w-14 h-14 rounded-2xl overflow-hidden transition-all duration-500 ${todayMood?.mood === mood ? `ring-2 ${MoodLevels[mood].ring} ring-offset-2` : ''
                                        }`}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${MoodLevels[mood].gradient}`} />
                                    <div className="absolute inset-0 flex items-center justify-center text-white/90 text-lg font-light">
                                        {mood}
                                    </div>
                                    {todayMood?.mood === mood && (
                                        <motion.div layoutId="selectedMood" className="absolute inset-0 bg-white/20" />
                                    )}
                                </motion.button>
                            ))}
                        </motion.div>

                        <div className="flex justify-center space-x-8 text-[9px] text-slate-400 uppercase tracking-widest">
                            <span>Struggling</span><span>·</span><span>Thriving</span>
                        </div>

                        {/* 7-Day History */}
                        <div className="pt-8 border-t border-slate-100/50 space-y-4">
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest text-center">Last 7 Days</p>
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="flex justify-center space-x-2"
                            >
                                {Array.from({ length: 7 }).map((_, i) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() - (6 - i));
                                    const dateStr = d.toISOString().split('T')[0];
                                    const entry = lifeReview.moodLog.find(m => m.date === dateStr);
                                    return (
                                        <motion.div key={i} variants={itemVariants} className="flex flex-col items-center space-y-2">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-medium ${entry ? `bg-gradient-to-br ${MoodLevels[entry.mood].gradient} text-white shadow-lg` : 'bg-slate-50 text-slate-300 border border-slate-100'
                                                }`}>
                                                {entry ? entry.mood : '—'}
                                            </div>
                                            <span className="text-[8px] text-slate-300 uppercase">
                                                {d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2)}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {/* BALANCE TAB */}
                {activeTab === 'balance' && (
                    <motion.div
                        key="balance"
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="glass p-10 rounded-[2.5rem] space-y-10 border border-white/50"
                    >
                        <div className="text-center space-y-2">
                            <h2 className="text-lg font-light text-slate-700 tracking-wide">Life Balance Radar</h2>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Which area needs attention?</p>
                        </div>

                        {/* Radar with Lottie center */}
                        <div className="relative w-72 h-72 mx-auto">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16">
                                    <Lottie animationData={radarSweepAnimation} loop={true} />
                                </div>
                            </div>

                            <svg className="absolute inset-0 w-full h-full" viewBox="-150 -150 300 300">
                                {[100, 66, 33].map(r => (
                                    <motion.polygon
                                        key={r}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: r === 100 ? 0.5 : 0.3, scale: 1 }}
                                        transition={{ delay: (100 - r) / 100 * 0.3 }}
                                        points={LIFE_AREAS.map((_, i) => {
                                            const angle = (i * 60 - 90) * (Math.PI / 180);
                                            return `${Math.cos(angle) * r},${Math.sin(angle) * r}`;
                                        }).join(' ')}
                                        fill="none"
                                        stroke="#e2e8f0"
                                        strokeWidth="1"
                                    />
                                ))}

                                <motion.polygon
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.8 }}
                                    transition={{ delay: 0.4 }}
                                    points={LIFE_AREAS.map((area, i) => {
                                        const angle = (i * 60 - 90) * (Math.PI / 180);
                                        const r = (lifeBalance[area.key] / 100) * 100;
                                        return `${Math.cos(angle) * r},${Math.sin(angle) * r}`;
                                    }).join(' ')}
                                    fill="url(#radarGradient)"
                                    stroke="url(#radarStroke)"
                                    strokeWidth="2"
                                />

                                <defs>
                                    <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
                                    </linearGradient>
                                    <linearGradient id="radarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#6366f1" />
                                        <stop offset="100%" stopColor="#8b5cf6" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {LIFE_AREAS.map((area, i) => {
                                const angle = (i * 60 - 90) * (Math.PI / 180);
                                const r = (lifeBalance[area.key] / 100) * 100 + 20;
                                const x = Math.cos(angle) * r + 144;
                                const y = Math.sin(angle) * r + 144;
                                const value = lifeBalance[area.key];
                                return (
                                    <motion.div
                                        key={area.key}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: i * 0.1, type: "spring" }}
                                        className="absolute"
                                        style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${value > 60 ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                                                : value > 30 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                                                    : 'bg-gradient-to-br from-rose-500 to-pink-600 text-white'
                                            }`}>
                                            {LifeAreaIcons[area.key as keyof typeof LifeAreaIcons]}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Sliders */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-5 pt-8 border-t border-slate-100/50"
                        >
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest text-center">Adjust Your Balance</p>
                            {LIFE_AREAS.map((area, i) => (
                                <motion.div key={area.key} variants={itemVariants} className="flex items-center space-x-4">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${area.gradient} text-white shadow-sm`}>
                                        {LifeAreaIcons[area.key as keyof typeof LifeAreaIcons]}
                                    </div>
                                    <span className="text-[11px] text-slate-600 uppercase tracking-wider w-16 font-medium">{area.label}</span>
                                    <div className="flex-1 relative h-2">
                                        <div className="absolute inset-0 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                className={`h-full bg-gradient-to-r ${area.gradient} rounded-full`}
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
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 0.3 }}
                                        className={`w-2 h-2 rounded-full ${lifeBalance[area.key] > 60 ? 'bg-emerald-500' : lifeBalance[area.key] > 30 ? 'bg-amber-500' : 'bg-rose-500'
                                            }`}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>
                )}

                {/* INSIGHTS TAB */}
                {activeTab === 'insights' && (
                    <motion.div
                        key="insights"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Consistency */}
                        <motion.div variants={itemVariants} className="glass p-8 rounded-[2rem] space-y-5 border border-white/50">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">Study Consistency</span>
                                    <p className="text-[9px] text-slate-300">Days with completed rules</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-extralight text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
                                        {insights.consistency}
                                    </span>
                                    <span className="text-lg text-slate-300 ml-1">%</span>
                                </div>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${insights.consistency}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                                />
                            </div>
                        </motion.div>

                        {/* Mood */}
                        <motion.div variants={itemVariants} className="glass p-8 rounded-[2rem] space-y-5 border border-white/50">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Mood Trend</span>
                                <span className={`text-xl font-light ${insights.trend === 'up' ? 'text-emerald-500' : insights.trend === 'down' ? 'text-rose-400' : 'text-slate-400'
                                    }`}>
                                    {insights.trend === 'up' ? '↗ Rising' : insights.trend === 'down' ? '↘ Dipping' : '→ Stable'}
                                </span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${MoodLevels[Math.round(insights.avgMood) as MoodLevel]?.gradient || 'from-slate-400 to-slate-500'} flex items-center justify-center text-white text-lg font-light shadow-lg`}>
                                    {Math.round(insights.avgMood)}
                                </div>
                                <span className="text-sm text-slate-500">Average mood this week</span>
                            </div>
                        </motion.div>

                        {/* Discipline */}
                        <motion.div variants={itemVariants} className="glass p-8 rounded-[2rem] space-y-5 border border-white/50">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Discipline Score</span>
                                <span className="text-3xl font-extralight text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                                    {Math.round(insights.discipline)}
                                </span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${insights.discipline}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* WEEKLY TAB */}
                {activeTab === 'weekly' && (
                    <motion.div
                        key="weekly"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass p-10 rounded-[2.5rem] space-y-8 border border-white/50"
                    >
                        {needsWeeklyReview && !showReviewForm ? (
                            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-center space-y-8">
                                <motion.div variants={itemVariants} className="w-20 h-20 mx-auto">
                                    <Lottie animationData={pulseGlowAnimation} loop={true} />
                                </motion.div>
                                <motion.div variants={itemVariants} className="space-y-2">
                                    <h3 className="text-lg font-light text-slate-700">Weekly Reflection</h3>
                                    <p className="text-sm text-slate-400">Take a moment to review your week</p>
                                </motion.div>
                                <motion.button
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowReviewForm(true)}
                                    className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[11px] uppercase tracking-[0.2em] font-semibold rounded-2xl shadow-lg shadow-indigo-200"
                                >
                                    Start Review
                                </motion.button>
                            </motion.div>
                        ) : showReviewForm ? (
                            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                                {WEEKLY_QUESTIONS.map((q, i) => (
                                    <motion.div key={i} variants={itemVariants} className="space-y-2">
                                        <label className="text-sm text-slate-600 font-medium">{q}</label>
                                        <textarea
                                            value={reviewResponses[i] || ''}
                                            onChange={e => setReviewResponses({ ...reviewResponses, [i]: e.target.value })}
                                            className="w-full p-4 bg-white/60 border border-slate-200/50 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                            rows={2}
                                        />
                                    </motion.div>
                                ))}
                                <motion.button
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSubmitReview('WEEKLY')}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[11px] uppercase tracking-widest font-semibold rounded-2xl shadow-lg"
                                >
                                    Submit
                                </motion.button>
                            </motion.div>
                        ) : (
                            <div className="text-center space-y-4 py-8">
                                <div className="w-24 h-24 mx-auto">
                                    <Lottie animationData={successCheckAnimation} loop={false} />
                                </div>
                                <p className="text-slate-500">Weekly review completed</p>
                                <p className="text-[10px] text-slate-300 uppercase tracking-widest">{lifeReview.lastWeeklyReview}</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* MONTHLY TAB */}
                {activeTab === 'monthly' && (
                    <motion.div
                        key="monthly"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass p-10 rounded-[2.5rem] space-y-8 border border-white/50"
                    >
                        {needsMonthlyReview && !showReviewForm ? (
                            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-center space-y-8">
                                <motion.div variants={itemVariants} className="w-20 h-20 mx-auto">
                                    <Lottie animationData={pulseGlowAnimation} loop={true} />
                                </motion.div>
                                <motion.div variants={itemVariants} className="space-y-2">
                                    <h3 className="text-lg font-light text-slate-700">Monthly Reflection</h3>
                                    <p className="text-sm text-slate-400">A deeper look at your progress</p>
                                </motion.div>
                                <motion.button
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowReviewForm(true)}
                                    className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[11px] uppercase tracking-[0.2em] font-semibold rounded-2xl shadow-lg shadow-indigo-200"
                                >
                                    Start Review
                                </motion.button>
                            </motion.div>
                        ) : showReviewForm ? (
                            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                                {MONTHLY_QUESTIONS.map((q, i) => (
                                    <motion.div key={i} variants={itemVariants} className="space-y-2">
                                        <label className="text-sm text-slate-600 font-medium">{q}</label>
                                        <textarea
                                            value={reviewResponses[i] || ''}
                                            onChange={e => setReviewResponses({ ...reviewResponses, [i]: e.target.value })}
                                            className="w-full p-4 bg-white/60 border border-slate-200/50 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                            rows={2}
                                        />
                                    </motion.div>
                                ))}
                                <motion.button
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSubmitReview('MONTHLY')}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[11px] uppercase tracking-widest font-semibold rounded-2xl shadow-lg"
                                >
                                    Submit
                                </motion.button>
                            </motion.div>
                        ) : (
                            <div className="text-center space-y-4 py-8">
                                <div className="w-24 h-24 mx-auto">
                                    <Lottie animationData={successCheckAnimation} loop={false} />
                                </div>
                                <p className="text-slate-500">Monthly review completed</p>
                                <p className="text-[10px] text-slate-300 uppercase tracking-widest">{lifeReview.lastMonthlyReview}</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
