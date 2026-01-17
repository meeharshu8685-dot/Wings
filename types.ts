export type WingsLevel = 0 | 1 | 2 | 3;

export type CapacityState = 'FRAGILE' | 'STABLE' | 'CAPABLE' | 'HIGH';

export type TaskCategory = 'BODY' | 'ORDER' | 'SKILL' | 'FOCUS' | 'FLIGHT' | 'GROUND';

export interface PlanningDirection {
  text: string;
  lockedUntil: string;
}

// ===== MENTOR IDEAS: NEW TYPES =====

// Daily Non-Negotiable (DNN) - Rules, not tasks
export interface DailyRule {
  rule: string;
  completed: boolean;
  dateSet: string;
  type: 'STANDARD' | 'BOREDOM'; // Boredom Training is a special rule type
}

// Energy-First Task Selection
export interface EnergySignals {
  lastSessionLength: number; // minutes from last completed session
  lastSessionDate: string | null;
  recentMisses: number; // count of misses in last 7 days
}

// Boredom Training
export interface BoredomTraining {
  lastSession: string | null; // ISO date of last session
  sessionsThisWeek: number;
  weekStart: string; // ISO date of current week's Monday
}

// Weekly Reality Check
export interface WeeklyCheck {
  weekOf: string; // ISO date of Monday of the week
  answeredOn: string | null; // ISO date when answered
  showedUpMoreThanDisappeared: boolean | null;
}

export interface PlanningState {
  directions: PlanningDirection[];
  timeBudget: number; // minutes
  priorityWeights: Record<string, number>;
  constraints: string[];
}

// ===== LIFE REVIEW =====

export type MoodLevel = 1 | 2 | 3 | 4 | 5; // 1=struggling, 5=thriving

export interface DailyMoodEntry {
  date: string; // ISO date
  mood: MoodLevel;
  note?: string;
}

export interface LifeReviewEntry {
  id: string;
  type: 'WEEKLY' | 'MONTHLY';
  date: string; // ISO date when review was taken
  periodStart: string; // Start of the review period
  periodEnd: string; // End of the review period
  responses: {
    question: string;
    answer: string;
  }[];
  insights: {
    consistencyScore: number; // 0-100
    averageMood: number; // 1-5
    disciplineScore: number; // 0-100
  };
}

export interface LifeReviewState {
  moodLog: DailyMoodEntry[];
  reviews: LifeReviewEntry[];
  lastWeeklyReview: string | null; // ISO date
  lastMonthlyReview: string | null; // ISO date
}

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
  planningMode: boolean;
  hardStopActive: boolean; // Hard Stop After Completion
}

// GROWTH MODE: The memory layer of the system.
export interface GrowthState {
  highestLevelAchieved: WingsLevel;
  highestCapacityAchieved: CapacityState;
  peakWeeklyAverageEffort: number; // in minutes
  categoryUsage: Partial<Record<TaskCategory, number>>;
}

export interface WingsState {
  version: "5.0"; // Version bump for new features
  level: WingsLevel;
  capacity: CapacityState;
  identity: WingsIdentity;
  daily: DailyLog;
  dailyRule: DailyRule | null; // Current day's non-negotiable rule
  momentum: Momentum;
  selfTrust: SelfTrust;
  weeklyReports: WeeklyReport[];
  weeklyChecks: WeeklyCheck[]; // Weekly Reality Check history
  settings: Settings;
  growth: GrowthState;
  planning: PlanningState;
  energy: EnergySignals; // Energy-First Selection
  boredomTraining: BoredomTraining; // Boredom Training state
  lifeReview: LifeReviewState; // Life Review state
}

export type ViewState = 'GOAL' | 'FLIGHT' | 'MOMENTUM' | 'PRESSURE' | 'SETTINGS' | 'FAILURE' | 'CONTROL_PANEL' | 'PLANNING' | 'LIFE_REVIEW';
