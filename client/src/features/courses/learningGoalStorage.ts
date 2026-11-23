export type LearningGoalId = 'psikotes' | 'cpns_bumn' | 'japanese' | 'korean' | 'english';
export type DailyXpTarget = 30 | 60 | 100;

const GOAL_STORAGE_KEY = 'lokatalenta_learning_goal_v1';
const XP_TARGET_STORAGE_KEY = 'lokatalenta_daily_xp_target_v1';

const VALID_GOALS = new Set<LearningGoalId>([
  'psikotes',
  'cpns_bumn',
  'japanese',
  'korean',
  'english',
]);

export function getSavedLearningGoal(): LearningGoalId {
  try {
    const val = localStorage.getItem(GOAL_STORAGE_KEY) as LearningGoalId | null;
    return val && VALID_GOALS.has(val) ? val : 'psikotes';
  } catch {
    return 'psikotes';
  }
}

export function saveLearningGoal(goal: LearningGoalId): void {
  try {
    localStorage.setItem(GOAL_STORAGE_KEY, goal);
  } catch {
    // ignore storage errors
  }
}

export function getSavedDailyXpTarget(): DailyXpTarget {
  try {
    const raw = Number(localStorage.getItem(XP_TARGET_STORAGE_KEY));
    return raw === 30 || raw === 60 || raw === 100 ? raw : 60;
  } catch {
    return 60;
  }
}

export function saveDailyXpTarget(target: DailyXpTarget): void {
  try {
    localStorage.setItem(XP_TARGET_STORAGE_KEY, String(target));
  } catch {
    // ignore storage errors
  }
}
