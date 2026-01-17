import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WingsState, WingsLevel, TaskCategory, DailyLog, CapacityState, GrowthState, PlanningState, PlanningDirection } from '../types';
import { getTodayISO, getYesterdayISO, addDays } from '../utils/dateUtils';

const LEVEL_THRESHOLDS = { 0: 3, 1: 7, 2: 14, 3: Infinity };

const GROUND_PROTOCOLS = [
  "10 minutes of physical movement. No phone.",
  "10 minutes sitting in silence. No inputs.",
  "Clean one specific surface area.",
  "Read 2 pages of something dense."
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
  generateGroundTask: () => void;
  completeTask: (minutes: number) => void;
  updateSettings: (settings: Partial<WingsState['settings']>) => void;
  recalculateCapacityAndSanity: () => void;
  toggleHardMode: () => void;
  acknowledgeFailure: () => void;
  updatePlanning: (planning: Partial<PlanningState>) => void;
}

const INITIAL_STATE: WingsState = {
  version: "4.0",
  level: 0,
  capacity: 'FRAGILE',
  identity: { longTermGoal: "", wingStatement: "I will convert pressure into momentum.", lockedUntil: null },
  daily: {},
  momentum: { currentStreak: 0, longestStreak: 0, lastMissedDate: null, lastHardModeFailure: null, totalDaysFlown: 0, showUpHistory: Array(7).fill(false) },
  selfTrust: { promisesMade: 0, promisesKept: 0 },
  weeklyReports: [],
  settings: {
    motion: "full",
    hardMode: false,
    stateOverride: 'AUTO',
    antiDopamine: false,
    focusLock: false,
    explorationMode: false,
    maintenanceMode: false,
    growthMode: true,
    planningMode: false
  },
  growth: INITIAL_GROWTH_STATE,
  planning: INITIAL_PLANNING_STATE
};

export const useWingsStore = create<WingsState & WingsActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,
      setLongTermGoal: (goal) => set((state) => ({ identity: { ...state.identity, longTermGoal: goal } })),
      lockGoal: () => set((state) => ({ identity: { ...state.identity, lockedUntil: addDays(getTodayISO(), 90) } })),
      generateGroundTask: () => set((state) => {
        const today = getTodayISO();
        if (state.daily[today]) return state;

        // Planning Mode Logic: Pick from weighted categories
        const priorityWeights = state.planning.priorityWeights;
        const categories = Object.keys(priorityWeights) as TaskCategory[];
        const weights = Object.values(priorityWeights) as number[];
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        let selectedCategory: TaskCategory = 'GROUND';

        for (const cat of categories) {
          const weight = (priorityWeights[cat] || 0) as number;
          if (random < weight) {
            selectedCategory = cat;
            break;
          }
          random -= weight;
        }

        let task = GROUND_PROTOCOLS[state.momentum.totalDaysFlown % GROUND_PROTOCOLS.length];

        // Use Directions if available in Planning Mode
        if (state.planning.directions.length > 0) {
          const dir = state.planning.directions[Math.floor(Math.random() * state.planning.directions.length)];
          task = `${dir.text}: Focus on ${selectedCategory.toLowerCase()} vector.`;
        }

        // Exploration Mode Override
        if (state.settings.explorationMode) {
          const explorationTasks = ["Try a new movement pattern", "Read a random article", "Organize one digital folder", "Write 100 words of nonsense"];
          task = explorationTasks[Math.floor(Math.random() * explorationTasks.length)];
        }

        return {
          daily: { ...state.daily, [today]: { task, completed: false, timeSpent: 0, category: selectedCategory, systemGenerated: true } },
          selfTrust: { ...state.selfTrust, promisesMade: state.selfTrust.promisesMade + 1 }
        };
      }),
      createTask: (task, category) => set((state) => {
        const today = getTodayISO();
        if (state.daily[today]) return state;

        // Anti-Dopamine: block certain categories if needed
        if (state.settings.antiDopamine && (category === 'FLIGHT' || category === 'SKILL')) {
          // Force restorative categories
          // Not explicitly blocking yet but could be added if categories were defined as "stimulating"
        }

        // Maintenance Mode: preserve streak, low minimum (handled in effort logic)

        return {
          daily: { ...state.daily, [today]: { task, completed: false, timeSpent: 0, category, systemGenerated: false } },
          selfTrust: { ...state.selfTrust, promisesMade: state.selfTrust.promisesMade + 1 }
        };
      }),
      completeTask: (minutes: number) => {
        const state = get();
        const today = getTodayISO();
        const currentTask = state.daily[today];
        if (!currentTask || currentTask.completed) return;
        const updatedDaily = { ...state.daily, [today]: { ...currentTask, completed: true, timeSpent: minutes } };
        const newStreak = state.momentum.currentStreak + 1;
        const currentLevel = state.level;
        let nextLevel = currentLevel;
        const needed = LEVEL_THRESHOLDS[currentLevel as 0 | 1 | 2];
        if (newStreak >= needed && currentLevel < 3) nextLevel = (currentLevel + 1) as WingsLevel;
        const { capacity, history } = _calculateCapacity(updatedDaily);
        const newGrowth: GrowthState = { ...state.growth };
        if (nextLevel > newGrowth.highestLevelAchieved) newGrowth.highestLevelAchieved = nextLevel;
        const capacityMap: Record<CapacityState, number> = { 'FRAGILE': 0, 'STABLE': 1, 'CAPABLE': 2, 'HIGH': 3 };
        if (capacityMap[capacity] > capacityMap[newGrowth.highestCapacityAchieved]) newGrowth.highestCapacityAchieved = capacity;
        const current7DayEffort = _calculate7DayAverageEffort(updatedDaily);
        if (current7DayEffort > newGrowth.peakWeeklyAverageEffort) newGrowth.peakWeeklyAverageEffort = current7DayEffort;
        newGrowth.categoryUsage[currentTask.category] = (newGrowth.categoryUsage[currentTask.category] || 0) + 1;
        set({
          level: nextLevel,
          capacity: capacity,
          daily: updatedDaily,
          growth: newGrowth,
          selfTrust: { ...state.selfTrust, promisesKept: state.selfTrust.promisesKept + 1 },
          momentum: { ...state.momentum, currentStreak: newStreak, longestStreak: Math.max(newStreak, state.momentum.longestStreak), totalDaysFlown: state.momentum.totalDaysFlown + 1, showUpHistory: history }
        });
      },
      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      recalculateCapacityAndSanity: () => {
        const state = get();
        const yesterday = getYesterdayISO();
        const yesterdayTask = state.daily[yesterday];
        const missedYesterday = !yesterdayTask || !yesterdayTask.completed;
        const alreadyMarkedMiss = state.momentum.lastMissedDate === yesterday;

        // Skip reset logic if in Maintenance Mode or certain overrides
        const skipReset = state.settings.maintenanceMode;

        if (missedYesterday && !alreadyMarkedMiss && state.selfTrust.promisesMade > 0 && !skipReset) {
          if (state.settings.hardMode) {
            // HARD MODE FAILURE: Catastrophic Reset
            set({
              level: 0,
              capacity: 'FRAGILE',
              growth: INITIAL_GROWTH_STATE,
              momentum: { ...state.momentum, currentStreak: 0, lastHardModeFailure: yesterday },
              settings: { ...state.settings, hardMode: false }
            });
            return; // Stop further processing
          }
          // Normal miss
          set({
            level: Math.max(0, state.level - 1) as WingsLevel,
            momentum: { ...state.momentum, currentStreak: 0, lastMissedDate: yesterday }
          });
        }

        const { capacity, history } = _calculateCapacity(state.daily);

        // Handle State Overrides
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
      updatePlanning: (newPlanning) => set((state) => ({ planning: { ...state.planning, ...newPlanning } }))
    }),
    {
      name: 'wings_state_v4',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
