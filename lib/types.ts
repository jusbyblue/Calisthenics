// ============================================================
// TypeScript types for the Calisthenics App
// ============================================================

export type Role = "asvand";
export type Theme = "dark" | "light";

export interface Profile {
  id: string;
  name: string;
  role: Role;
  theme: Theme;
  xp: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export type CalisthenicsPath = "legs" | "push" | "pull" | "core" | "skills" | "elite";

export interface CalisthenicsProgress {
  id: string;
  profile_id: string;
  exercise_name: string;
  path: CalisthenicsPath;
  mastery_percent: number;
  current_reps: number | null;
  target_reps: number | null;
  sessions_at_target: number;
  unlocked: boolean;
  last_updated: string;
  created_at: string;
}

export type PRUnit = "kg" | "km" | "min" | "reps" | "sec";

export interface PRLog {
  id: string;
  profile_id: string;
  exercise: string;
  value: number;
  unit: PRUnit;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface Measurement {
  id: string;
  profile_id: string;
  date: string;
  wrist_cm: number | null;
  waist_cm: number | null;
  arm_cm: number | null;
  forearm_cm: number | null;
  chest_cm: number | null;
  hip_cm: number | null;
  weight_kg: number | null;
  notes: string | null;
  created_at: string;
}

// Level system
export interface Level {
  level: number;
  title: string;
  xp_required: number;
}

export const LEVELS: Level[] = [
  { level: 1,  title: "Beginner",     xp_required: 0 },
  { level: 2,  title: "Starter",      xp_required: 100 },
  { level: 3,  title: "Consistent",   xp_required: 250 },
  { level: 4,  title: "Committed",    xp_required: 500 },
  { level: 5,  title: "Worker",       xp_required: 900 },
  { level: 6,  title: "Focused",      xp_required: 1500 },
  { level: 7,  title: "Disciplined",  xp_required: 2400 },
  { level: 8,  title: "Expert",       xp_required: 3700 },
  { level: 9,  title: "Elite",        xp_required: 5500 },
  { level: 10, title: "Master",       xp_required: 8000 },
  { level: 11, title: "Champion",     xp_required: 12000 },
  { level: 12, title: "Veteran",      xp_required: 18000 },
  { level: 13, title: "Hero",         xp_required: 27000 },
  { level: 14, title: "Legend",       xp_required: 40000 },
  { level: 15, title: "Grandmaster",  xp_required: 60000 },
  { level: 16, title: "Mythic",       xp_required: 90000 },
  { level: 17, title: "Immortal",     xp_required: 135000 },
  { level: 18, title: "Ascendant",    xp_required: 200000 },
  { level: 19, title: "Eternal",      xp_required: 300000 },
  { level: 20, title: "Guild Legend", xp_required: 450000 },
];

export function getLevelInfo(xp: number): { current: Level; next: Level | null; progress: number } {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.xp_required) current = lvl;
    else break;
  }
  const currentIdx = LEVELS.indexOf(current);
  const next = LEVELS[currentIdx + 1] ?? null;
  const progress = next
    ? Math.min(100, Math.max(0, ((xp - current.xp_required) / (next.xp_required - current.xp_required)) * 100))
    : 100;
  return { current, next, progress };
}

export interface PRMilestone {
  id: string;
  profile_id: string;
  exercise: string;
  value: number;
  completed: boolean;
  created_at: string;
}

