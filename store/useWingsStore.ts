import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WingsState, WingsLevel, TaskCategory, DailyLog, CapacityState, GrowthState, PlanningState, PlanningDirection, DailyRule, EnergySignals, BoredomTraining, WeeklyCheck, LifeReviewState, LifeReviewEntry, MoodLevel } from '../types';
import { getTodayISO, getYesterdayISO, addDays, getStartOfWeek } from '../utils/dateUtils';

const LEVEL_THRESHOLDS = { 0: 3, 1: 7, 2: 14, 3: Infinity };

// ===== DAILY NON-NEGOTIABLES (DNN) =====
// Rules, not tasks. No category. No task name. Just a rule.
const DAILY_RULES = [
  "One uninterrupted work block.",
  "One physical movement without phone.",
  "One page of real learning.",
  "One hour without any screen.",
  "One meal eaten in silence.",
  "One difficult conversation initiated.",
  "One small mess cleaned completely.",
  "One moment of deliberate stillness."
];

// Boredom Training Rules (assign 1-2 per week)
const BOREDOM_RULES = [
  "Sit without stimulation for 5 minutes.",
  "Sit without stimulation for 10 minutes.",
  "Walk for 10 minutes without audio.",
  "Stare at a wall for 5 minutes."
];

const INITIAL_GROWTH_STATE: GrowthState = {
  highestLevelAchieved: 0,
  highestCapacityAchieved: 'FRAGILE',
  peakWeeklyAverageEffort: 0,
  categoryUsage: {},
};

const INITIAL_PLANNING_STATE: PlanningState = {
  directions: [],
  timeBudget: 30,
  priorityWeights: { BODY: 20, ORDER: 20, SKILL: 20, FOCUS: 20, FLIGHT: 20 },
  constraints: []
};

const INITIAL_ENERGY_STATE: EnergySignals = {
  lastSessionLength: 0,
  lastSessionDate: null,
  recentMisses: 0
};

const INITIAL_BOREDOM_STATE: BoredomTraining = {
  lastSession: null,
  sessionsThisWeek: 0,
  weekStart: getStartOfWeek()
};

const INITIAL_LIFE_REVIEW_STATE: LifeReviewState = {
  moodLog: [],
  reviews: [],
  lastWeeklyReview: null,
  lastMonthlyReview: null
};

const _calculate7DayAverageEffort = (dailyLog: DailyLog): number => {
  let totalTime = 0;
  let completedDays = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const isoDate = d.toISOString().split('T')[0];
    const day = dailyLog[isoDate];
    if (day?.completed) {
      totalTime += day.timeSpent;
      completedDays++;
    }
  }
  return completedDays > 0 ? Math.round(totalTime / completedDays) : 0;
}

const _calculateCapacity = (dailyLog: DailyLog): { capacity: CapacityState, history: boolean[] } => {
  const history: boolean[] = [];
  let showUps = 0;
  let totalTime = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const isoDate = d.toISOString().split('T')[0];
    const day = dailyLog[isoDate];
    const completed = day?.completed || false;
    history.unshift(completed);
    if (completed) {
      showUps++;
      totalTime += day.timeSpent;
    }
  }

  const avgTime = showUps > 0 ? totalTime / showUps : 0;
  if (showUps < 3) return { capacity: 'FRAGILE', history };
  if (showUps <= 5 && avgTime < 20) return { capacity: 'STABLE', history };
  if (showUps <= 6 && avgTime >= 20) return { capacity: 'CAPABLE', history };
  if (showUps === 7 && avgTime >= 30) return { capacity: 'HIGH', history };
  return { capacity: 'STABLE', history };
};

interface WingsActions {
  setLongTermGoal: (goal: string) => void;
  lockGoal: () => void;
  createTask: (task: string, category: TaskCategory) => void;
  generateDailyRule: () => void;
  completeRule: () => void;
  updateSettings: (settings: Partial<WingsState['settings']>) => void;
  recalculateCapacityAndSanity: () => void;
  toggleHardMode: () => void;
  acknowledgeFailure: () => void;
  updatePlanning: (planning: Partial<PlanningState>) => void;
  answerWeeklyCheck: (answer: boolean) => void;
  // Life Review Actions
  logMood: (mood: MoodLevel, note?: string) => void;
  submitLifeReview: (type: 'WEEKLY' | 'MONTHLY', responses: { question: string; answer: string }[]) => void;
}

// ===== ENERGY-FIRST CALCULATION =====
const _calculateEnergyLevel = (energy: EnergySignals, dailyLog: DailyLog): number => {
  // Base energy: 100
  let energyLevel = 100;

  // Reduce for recent misses (each miss = -15%)
  energyLevel -= energy.recentMisses * 15;

  // Reduce if last session was short (<10 min = -10%)
  if (energy.lastSessionLength > 0 && energy.lastSessionLength < 10) {
    energyLevel -= 10;
  }

  // Time of day factor (not implemented yet, placeholder)
  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) energyLevel -= 20; // Late night penalty

  return Math.max(20, Math.min(100, energyLevel)); // Clamp between 20-100
};

// ===== ADAPTIVE MINIMUM EFFORT =====
const _getAdaptiveMinimumEffort = (energyLevel: number, capacity: CapacityState): number => {
  // Base effort by capacity
  const baseEffort: Record<CapacityState, number> = {
    'FRAGILE': 5,
    'STABLE': 10,
    'CAPABLE': 15,
    'HIGH': 20
  };

  // Adjust based on energy
  const effort = baseEffort[capacity];
  const modifier = energyLevel / 100; // 0.2 to 1.0

  return Math.max(5, Math.round(effort * modifier));
};

const INITIAL_STATE: WingsState = {
  version: "5.0",
  level: 0,
  capacity: 'FRAGILE',
  identity: { longTermGoal: "", wingStatement: "I will convert pressure into momentum.", lockedUntil: null },
  daily: {},
  dailyRule: null,
  momentum: { currentStreak: 0, longestStreak: 0, lastMissedDate: null, lastHardModeFailure: null, totalDaysFlown: 0, showUpHistory: Array(7).fill(false) },
  selfTrust: { promisesMade: 0, promisesKept: 0 },
  weeklyReports: [],
  weeklyChecks: [],
  settings: {
    motion: "full",
    hardMode: false,
    stateOverride: 'AUTO',
    antiDopamine: false,
    focusLock: false,
    explorationMode: false,
    maintenanceMode: false,
    growthMode: true,
    planningMode: false,
    hardStopActive: false
  },
  growth: INITIAL_GROWTH_STATE,
  planning: INITIAL_PLANNING_STATE,
  energy: INITIAL_ENERGY_STATE,
  boredomTraining: INITIAL_BOREDOM_STATE,
  lifeReview: INITIAL_LIFE_REVIEW_STATE
};

export const useWingsStore = create<WingsState & WingsActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,
      setLongTermGoal: (goal) => set((state) => ({ identity: { ...state.identity, longTermGoal: goal } })),
      // ===== DAILY NON-NEGOTIABLE (DNN) =====
      generateDailyRule: () => set((state) => {
        const today = getTodayISO();

        // Already have a rule for today
        if (state.dailyRule?.dateSet === today) return state;

        // Hard Stop: Don't generate new rule if already completed today
        if (state.settings.hardStopActive && state.dailyRule?.completed) return state;

        // Reset boredom week if new week
        const currentWeekStart = getStartOfWeek();
        let boredomState = { ...state.boredomTraining };
        if (boredomState.weekStart !== currentWeekStart) {
          boredomState = { lastSession: boredomState.lastSession, sessionsThisWeek: 0, weekStart: currentWeekStart };
        }

        // Boredom Training: 20% chance if under 2 sessions this week
        const shouldBeBoredom = boredomState.sessionsThisWeek < 2 && Math.random() < 0.2;

        let rule: DailyRule;
        if (shouldBeBoredom) {
          const boredomRule = BOREDOM_RULES[Math.floor(Math.random() * BOREDOM_RULES.length)];
          rule = { rule: boredomRule, completed: false, dateSet: today, type: 'BOREDOM' };
        } else {
          // Use planning directions if available
          if (state.planning.directions.length > 0) {
            const dir = state.planning.directions[Math.floor(Math.random() * state.planning.directions.length)];
            rule = { rule: dir.text, completed: false, dateSet: today, type: 'STANDARD' };
          } else {
            // Default: Pick from DAILY_RULES
            const dailyRule = DAILY_RULES[state.momentum.totalDaysFlown % DAILY_RULES.length];
            rule = { rule: dailyRule, completed: false, dateSet: today, type: 'STANDARD' };
          }
        }

        // Update energy signals: count recent misses
        let recentMisses = 0;
        for (let i = 1; i <= 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const isoDate = d.toISOString().split('T')[0];
          const dayTask = state.daily[isoDate];
          if (!dayTask || !dayTask.completed) recentMisses++;
        }

        return {
          dailyRule: rule,
          energy: { ...state.energy, recentMisses },
          boredomTraining: boredomState,
          selfTrust: { ...state.selfTrust, promisesMade: state.selfTrust.promisesMade + 1 },
          settings: { ...state.settings, hardStopActive: false } // Reset hard stop for new day
        };
      }),

      // ===== COMPLETE RULE (DNN) =====
      completeRule: () => {
        const state = get();
        const today = getTodayISO();

        if (!state.dailyRule || state.dailyRule.completed) return;

        const completedRule = { ...state.dailyRule, completed: true };

        // Update daily log for historical tracking
        const updatedDaily = {
          ...state.daily,
          [today]: {
            task: completedRule.rule,
            completed: true,
            timeSpent: 10, // Rule-based doesn't track time, default to 10
            category: 'GROUND' as TaskCategory,
            systemGenerated: true
          }
        };

        // MISS WITHOUT RESET: Streak softening (decay by 1 max, not full reset)
        const newStreak = state.momentum.currentStreak + 1;
        const currentLevel = state.level;
        let nextLevel = currentLevel;
        const needed = LEVEL_THRESHOLDS[currentLevel as 0 | 1 | 2];
        if (newStreak >= needed && currentLevel < 3) nextLevel = (currentLevel + 1) as WingsLevel;

        const { capacity, history } = _calculateCapacity(updatedDaily);
        const newGrowth: GrowthState = { ...state.growth };
        if (nextLevel > newGrowth.highestLevelAchieved) newGrowth.highestLevelAchieved = nextLevel;

        // Update boredom training if this was a boredom session
        let boredomState = { ...state.boredomTraining };
        if (completedRule.type === 'BOREDOM') {
          boredomState.lastSession = today;
          boredomState.sessionsThisWeek += 1;
        }

        // Update energy signals
        const energyState = {
          ...state.energy,
          lastSessionLength: 10,
          lastSessionDate: today
        };

        set({
          dailyRule: completedRule,
          daily: updatedDaily,
          level: nextLevel,
          capacity: capacity,
          growth: newGrowth,
          selfTrust: { ...state.selfTrust, promisesKept: state.selfTrust.promisesKept + 1 },
          momentum: {
            ...state.momentum,
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, state.momentum.longestStreak),
            totalDaysFlown: state.momentum.totalDaysFlown + 1,
            showUpHistory: history
          },
          boredomTraining: boredomState,
          energy: energyState,
          settings: { ...state.settings, hardStopActive: true } // HARD STOP: Lock after completion
        });
      },

      // Keep createTask for backward compatibility (deprecated)
      createTask: (task, category) => set((state) => {
        const today = getTodayISO();
        if (state.daily[today]) return state;
        return {
          daily: { ...state.daily, [today]: { task, completed: false, timeSpent: 0, category, systemGenerated: false } },
          selfTrust: { ...state.selfTrust, promisesMade: state.selfTrust.promisesMade + 1 }
        };
      }),

      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),

      recalculateCapacityAndSanity: () => {
        const state = get();
        const yesterday = getYesterdayISO();
        const yesterdayTask = state.daily[yesterday];
        const missedYesterday = !yesterdayTask || !yesterdayTask.completed;
        const alreadyMarkedMiss = state.momentum.lastMissedDate === yesterday;

        // Skip reset logic if in Maintenance Mode
        const skipReset = state.settings.maintenanceMode;

        if (missedYesterday && !alreadyMarkedMiss && state.selfTrust.promisesMade > 0 && !skipReset) {
          if (state.settings.hardMode) {
            // HARD MODE FAILURE
            set({
              level: 0,
              capacity: 'FRAGILE',
              momentum: { ...state.momentum, currentStreak: 0, lastHardModeFailure: yesterday },
              settings: { ...state.settings, hardMode: false }
            });
            return;
          }
          // MISS WITHOUT RESET: Streak softens (decays by 1), doesn't reset to 0
          const softenedStreak = Math.max(0, state.momentum.currentStreak - 1);
          set({
            level: Math.max(0, state.level - 1) as WingsLevel,
            momentum: { ...state.momentum, currentStreak: softenedStreak, lastMissedDate: yesterday }
          });
        }

        const { capacity, history } = _calculateCapacity(state.daily);

        let finalCapacity = capacity;
        if (state.settings.stateOverride === 'FORCE_RECOVERY') finalCapacity = 'FRAGILE';
        if (state.settings.stateOverride === 'FORCE_PUSH') finalCapacity = 'HIGH';
        if (state.settings.maintenanceMode) finalCapacity = 'STABLE';

        set((s) => ({
          capacity: finalCapacity,
          momentum: { ...s.momentum, showUpHistory: history }
        }));
      },

      toggleHardMode: () => set((state) => ({ settings: { ...state.settings, hardMode: !state.settings.hardMode } })),
      acknowledgeFailure: () => set((state) => ({ momentum: { ...state.momentum, lastHardModeFailure: null } })),
      updatePlanning: (newPlanning) => set((state) => ({ planning: { ...state.planning, ...newPlanning } })),

      // ===== WEEKLY REALITY CHECK =====
      answerWeeklyCheck: (answer: boolean) => set((state) => {
        const today = getTodayISO();
        const weekStart = getStartOfWeek();

        // Check if already answered this week
        const alreadyAnswered = state.weeklyChecks.some(c => c.weekOf === weekStart && c.answeredOn !== null);
        if (alreadyAnswered) return state;

        const newCheck: WeeklyCheck = {
          weekOf: weekStart,
          answeredOn: today,
          showedUpMoreThanDisappeared: answer
        };

        return {
          weeklyChecks: [...state.weeklyChecks, newCheck]
        };
      }),

      // ===== LIFE REVIEW =====
      logMood: (mood: MoodLevel, note?: string) => set((state) => {
        const today = getTodayISO();

        // Check if already logged today
        const existingIndex = state.lifeReview.moodLog.findIndex(m => m.date === today);
        const newEntry = { date: today, mood, note };

        if (existingIndex >= 0) {
          // Update existing entry
          const updatedLog = [...state.lifeReview.moodLog];
          updatedLog[existingIndex] = newEntry;
          return { lifeReview: { ...state.lifeReview, moodLog: updatedLog } };
        }

        return {
          lifeReview: {
            ...state.lifeReview,
            moodLog: [...state.lifeReview.moodLog, newEntry]
          }
        };
      }),

      submitLifeReview: (type: 'WEEKLY' | 'MONTHLY', responses: { question: string; answer: string }[]) => {
        const state = get();
        const today = getTodayISO();

        // Calculate period dates
        let periodStart: string;
        let periodEnd = today;

        if (type === 'WEEKLY') {
          periodStart = getStartOfWeek();
        } else {
          // Monthly: first day of current month
          const d = new Date();
          d.setDate(1);
          periodStart = d.toISOString().split('T')[0];
        }

        // Calculate insights from data
        const recentMoods = state.lifeReview.moodLog.filter(
          m => m.date >= periodStart && m.date <= periodEnd
        );
        const averageMood = recentMoods.length > 0
          ? recentMoods.reduce((sum, m) => sum + m.mood, 0) / recentMoods.length
          : 3;

        // Consistency: days with completed rules in period / total days in period
        const periodDays = Math.ceil((new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        let completedDays = 0;
        for (let i = 0; i < periodDays; i++) {
          const d = new Date(periodStart);
          d.setDate(d.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          if (state.daily[dateStr]?.completed) completedDays++;
        }
        const consistencyScore = Math.round((completedDays / periodDays) * 100);

        // Discipline score: softer metric based on showing up ratio and streak
        const showUpRatio = state.momentum.showUpHistory.filter(Boolean).length / 7;
        const streakBonus = Math.min(state.momentum.currentStreak * 2, 20);
        const disciplineScore = Math.min(100, Math.round(showUpRatio * 80 + streakBonus));

        const newReview: LifeReviewEntry = {
          id: `${type}-${today}-${Date.now()}`,
          type,
          date: today,
          periodStart,
          periodEnd,
          responses,
          insights: {
            consistencyScore,
            averageMood: Math.round(averageMood * 10) / 10,
            disciplineScore
          }
        };

        set({
          lifeReview: {
            ...state.lifeReview,
            reviews: [...state.lifeReview.reviews, newReview],
            lastWeeklyReview: type === 'WEEKLY' ? today : state.lifeReview.lastWeeklyReview,
            lastMonthlyReview: type === 'MONTHLY' ? today : state.lifeReview.lastMonthlyReview
          }
        });
      },

      lockGoal: () => set((state) => ({ identity: { ...state.identity, lockedUntil: addDays(getTodayISO(), 90) } }))
    }),
    {
      name: 'wings_state_v5',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
