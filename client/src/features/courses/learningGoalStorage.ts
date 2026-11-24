import { isSupabaseConfigured, supabase } from '../../shared/lib/supabase';

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

export async function syncStudyPreferencesFromServer(userId?: string): Promise<{
  goal: LearningGoalId;
  xpTarget: DailyXpTarget;
}> {
  const localGoal = getSavedLearningGoal();
  const localXp = getSavedDailyXpTarget();

  if (!isSupabaseConfigured || !supabase || !userId || userId === 'guest') {
    return { goal: localGoal, xpTarget: localXp };
  }

  try {
    const { data, error } = await supabase
      .from('user_study_preferences')
      .select('learning_goal, daily_xp_target')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return { goal: localGoal, xpTarget: localXp };
    }

    const remoteGoal = VALID_GOALS.has(data.learning_goal as LearningGoalId)
      ? (data.learning_goal as LearningGoalId)
      : localGoal;
    const remoteXp =
      data.daily_xp_target === 30 ||
      data.daily_xp_target === 60 ||
      data.daily_xp_target === 100
        ? (data.daily_xp_target as DailyXpTarget)
        : localXp;

    saveLearningGoal(remoteGoal);
    saveDailyXpTarget(remoteXp);
    return { goal: remoteGoal, xpTarget: remoteXp };
  } catch {
    return { goal: localGoal, xpTarget: localXp };
  }
}

export async function saveStudyPreferencesAsync(
  userId: string | undefined,
  prefs: { goal: LearningGoalId; xpTarget: DailyXpTarget }
): Promise<void> {
  saveLearningGoal(prefs.goal);
  saveDailyXpTarget(prefs.xpTarget);

  if (!isSupabaseConfigured || !supabase || !userId || userId === 'guest') {
    return;
  }

  try {
    await supabase.from('user_study_preferences').upsert(
      {
        user_id: userId,
        learning_goal: prefs.goal,
        daily_xp_target: prefs.xpTarget,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  } catch {
    // keep optimistic local state
  }
}
