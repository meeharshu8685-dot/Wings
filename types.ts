export type WingsLevel = 0 | 1 | 2 | 3;

export type CapacityState = 'FRAGILE' | 'STABLE' | 'CAPABLE' | 'HIGH';

export type TaskCategory = 'BODY' | 'ORDER' | 'SKILL' | 'FOCUS' | 'FLIGHT' | 'GROUND';

export interface WingsIdentity {
  longTermGoal: string;
  wingStatement: string;
  lockedUntil: string | null;
}

export interface DailyTask {
  task: string;
  completed: boolean;
  timeSpent: number;
  category: TaskCategory;
  systemGenerated: boolean;
}

export interface DailyLog {
  [date: string]: DailyTask;
}

export interface Momentum {
  currentStreak: number;
  longestStreak: number;
  lastMissedDate: string | null;
  lastHardModeFailure: string | null; // Tracks the date of the last Hard Mode failure
  totalDaysFlown: number;
  showUpHistory: boolean[]; // Last 7 days, true = showed up
}

export interface SelfTrust {
  promisesMade: number;
  promisesKept: number;
}

export interface WeeklyReport {
  week: string;
  flownDays: number;
  missedDays: number;
  verdict: string;
  id: string;
  acknowledged: boolean;
}

export interface Settings {
  motion: "full" | "reduced";
  userAge?: number;
  hardMode: boolean;
  stateOverride: 'AUTO' | 'FORCE_RECOVERY' | 'FORCE_PUSH';
  antiDopamine: boolean;
  focusLock: boolean;
  explorationMode: boolean;
  maintenanceMode: boolean;
  growthMode: boolean;
}

// GROWTH MODE: The memory layer of the system.
export interface GrowthState {
  highestLevelAchieved: WingsLevel;
  highestCapacityAchieved: CapacityState;
  peakWeeklyAverageEffort: number; // in minutes
  categoryUsage: Partial<Record<TaskCategory, number>>;
}

export interface WingsState {
  version: "4.0";
  level: WingsLevel;
  capacity: CapacityState;
  identity: WingsIdentity;
  daily: DailyLog;
  momentum: Momentum;
  selfTrust: SelfTrust;
  weeklyReports: WeeklyReport[];
  settings: Settings;
  growth: GrowthState; // The evolution engine
}

export type ViewState = 'GOAL' | 'FLIGHT' | 'MOMENTUM' | 'PRESSURE' | 'SETTINGS' | 'FAILURE' | 'CONTROL_PANEL';
