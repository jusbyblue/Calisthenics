"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardInner, CardLabel } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { NavBar } from "@/components/ui/NavBar";
import { GUILD_CATALOG, CatalogItem } from "./calisthenics/page";

interface CalisthenicsProgress {
  exercise_name: string;
  path: string;
  mastery_percent: number;
  learned: boolean;
  target_reps?: number;
}

interface PrLogItem {
  id: string;
  exercise: string;
  value: number;
  unit: string;
  date: string;
  notes?: string;
}

const EXERCISE_ORDER: Record<string, string[]> = {
  legs: [
    "Air Squat", "Box Squat", "Tempo Squat (3 sec down)", "Pause Squat (2 sec bottom)",
    "Narrow Squat", "Standard Squat", "Wide Squat", "Sumo Squat", "Squat Pulse",
    "Jump Squat", "180° Jump Squat", "Split Squat", "Reverse Lunge", "Walking Lunge",
    "Bulgarian Split Squat", "Cossack Squat", "Shrimp Squat Assisted", "Shrimp Squat",
    "Assisted Pistol", "Box Pistol", "Negative Pistol", "Pistol Squat", "Paused Pistol",
    "Weighted Pistol", "Jumping Pistol", "Dragon Pistol", "Glute Bridge", "Single Leg Glute Bridge",
    "Nordic Curl Assisted", "Nordic Curl Negative", "Nordic Curl", "Single Leg Nordic Curl",
    "LEG MASTER"
  ],
  push: [
    "Wall Push-up", "High Incline Push-up", "Incline Push-up", "Knee Push-up",
    "Negative Push-up", "Standard Push-up", "Wide Push-up", "Decline Push-up",
    "Ring Push-up", "Deep Ring Push-up", "Diamond Push-up", "Archer Push-up",
    "Pseudo Planche Push-up", "One-Arm Incline Push-up", "One-Arm Push-up",
    "Dips (Bench)", "Standard Dips", "Ring Dips", "Weighted Dips", "Pike Push-up",
    "Elevated Pike Push-up", "Wall Handstand Kick-up", "Wall Handstand Hold",
    "Freestanding Handstand Hold", "Handstand Wall Walk", "Handstand Shoulder Tap",
    "Handstand Push-up", "90 Degree Push-up", "L-Sit to Handstand Press",
    "Clap Push-up", "Superman Push-up", "Explosive Dips", "Planche Lean",
    "Tuck Planche", "Advanced Tuck Planche", "Straddle Planche Lean",
    "Straddle Planche Hold", "Full Planche", "One-Arm Handstand", "PUSH MASTER"
  ],
  pull: [
    "Dead Hang", "Scapular Pull-up", "Australian Row", "Inverted Row",
    "Jackknife Pull-up", "Negative Chin-up", "Chin-up", "Neutral Grip Pull-up",
    "Standard Pull-up", "L-Sit Pull-up", "Weighted Pull-up", "Wide Grip Pull-up",
    "Commando Pull-up", "Towel Pull-up", "Archer Pull-up", "High Pull-up (Chest-to-bar)",
    "Kipping Muscle-up", "Clean Muscle-up", "L-Sit Muscle-up", "Weighted Muscle-up",
    "Ring Muscle-up", "Explosive Pull-up", "One-Arm Dead Hang", "One-Arm Inverted Row",
    "One-Arm Pull-up Assist", "One-Arm Negative", "One-Arm Pull-up", "Back Lever Hold",
    "Skin the Cat", "Tuck Front Lever", "Advanced Tuck Front Lever", "Straddle Front Lever",
    "Full Front Lever", "Pull-up to Front Lever", "Front Lever Pull-up",
    "Tuck Human Flag", "Human Flag Hold", "Dragon Flag", "Grip Master", "PULL MASTER"
  ],
  core: [
    "Plank", "Side Plank", "Lying Leg Raise", "Hollow Body Hold", "Arch Hold",
    "Knee Raise (Hanging)", "Leg Raise (Hanging)", "Windshield Wiper Assist",
    "Windshield Wiper", "Toes to Bar", "L-Sit (Parallel Bars)", "L-Sit (Floor)",
    "V-Sit", "Manna Assist", "Manna Hold", "Dragon Flag Assist", "Dragon Flag",
    "Human Flag Tuck Core", "Human Flag Straddle Core", "Human Flag Hold Core",
    "Ab Wheel Rollout (Knees)", "Ab Wheel Rollout (Feet)", "Standing Cable Crunch",
    "Russian Twist (Weighted)", "Hanging Rotational Raise", "Core Twister",
    "Reverse Hyperextension", "Superman Hold", "Bird Dog", "Pallof Press",
    "Plank Walkout", "Core Master (Plank Max)", "CORE MASTER"
  ],
  skills: [
    "Crow Pose Hold", "Elbow Lever", "Headstand Hold", "Tripod Transition",
    "Kip-Up", "L-Sit Hold", "V-Sit Hold", "Handstand Kick-up Assist",
    "Wall Walk Handstand", "Freestanding Handstand Attempt", "Handstand Press tuck",
    "Back Lever Tuck", "Front Lever Tuck", "Clapping Pull-up", "SKILLS MASTER"
  ],
  elite: [
    "One-Arm Pull-up", "One-Arm Handstand Hold", "Full Planche Hold",
    "Iron Cross (Rings)", "Victorian Cross", "Manna Full Hold", "ELITE MASTER"
  ]
};

// Automatic XP generator based on difficulty
function getXpForDifficulty(difficulty: number): number {
  const xpMapping: Record<number, number> = {
    1: 50, 2: 100, 3: 160, 4: 230, 5: 310,
    6: 400, 7: 500, 8: 620, 9: 760, 10: 950
  };
  return xpMapping[difficulty] ?? 50;
}

// Leveling formula matching the skill tree
function getCalisthenicsLevelInfo(xp: number) {
  let level = 1;
  const getCumulativeXpForLevel = (l: number) => {
    if (l <= 1) return 0;
    return 200 * (l - 1) + 20 * (l - 1) * (l - 2);
  };

  while (xp >= getCumulativeXpForLevel(level + 1)) {
    level++;
  }

  const xpForCurrent = getCumulativeXpForLevel(level);
  const xpForNext = getCumulativeXpForLevel(level + 1);
  const currentLevelProgressXp = xp - xpForCurrent;
  const levelXpDifference = xpForNext - xpForCurrent;
  const progress = levelXpDifference > 0 
    ? Math.min(100, Math.max(0, (currentLevelProgressXp / levelXpDifference) * 100))
    : 100;

  let title = "Recruit";
  if (level >= 35) title = "Grandmaster Legend";
  else if (level >= 28) title = "Beast Mode Overlord";
  else if (level >= 22) title = "Bar Specialist Elite";
  else if (level >= 16) title = "Gymnast Pro";
  else if (level >= 10) title = "Warrior";
  else if (level >= 5) title = "Dedicated Novice";

  return {
    level,
    currentXp: xp - xpForCurrent,
    nextLevelXp: levelXpDifference,
    totalXp: xp,
    progress,
    title,
  };
}

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<CalisthenicsProgress[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [prLogs, setPrLogs] = useState<PrLogItem[]>([]);

  const loadData = async (profileId: string) => {
    try {
      const [progressRes, prRes] = await Promise.all([
        supabase
          .from("calisthenics_progress")
          .select("*")
          .eq("profile_id", profileId),
        supabase
          .from("pr_logs")
          .select("*")
          .eq("profile_id", profileId)
          .order("date", { ascending: false })
      ]);

      if (progressRes.data) {
        setSkills(progressRes.data.map(s => ({
          exercise_name: s.exercise_name,
          path: s.path,
          mastery_percent: s.mastery_percent || 0,
          learned: s.learned || false,
          target_reps: s.target_reps || 10
        })));
      }

      if (prRes.data) {
        setTotalSessions(prRes.data.length);
        setPrLogs(prRes.data.map(log => ({
          id: log.id,
          exercise: log.exercise,
          value: log.value,
          unit: log.unit || "reps",
          date: log.date,
          notes: log.notes
        })));
      }
    } catch (err) {
      console.error("Error loading Dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "asvand")
          .single();

        if (profileData) {
          loadData(profileData.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Compute total Calisthenics XP accumulated
  const totalCalisthenicsXp = useMemo(() => {
    let sum = 0;
    skills.forEach(s => {
      let difficulty = 3;
      if (s.exercise_name.includes("Air Squat") || s.exercise_name.includes("Wall Push-up")) difficulty = 1;
      else if (s.exercise_name.includes("Pistol Squat") || s.exercise_name.includes("Handstand Push-up")) difficulty = 8;
      else if (s.exercise_name.includes("Full Planche") || s.exercise_name.includes("LEG MASTER")) difficulty = 10;
      
      const xpVal = getXpForDifficulty(difficulty);
      sum += Math.round((s.mastery_percent / 100) * xpVal);
    });
    return sum;
  }, [skills]);

  const levelInfo = getCalisthenicsLevelInfo(totalCalisthenicsXp);

  // Path average calculations
  const getPathAvg = (pathName: string) => {
    const pathSkills = skills.filter(s => s.path === pathName);
    return pathSkills.length > 0
      ? Math.round(pathSkills.reduce((sum, item) => sum + item.mastery_percent, 0) / pathSkills.length)
      : 0;
  };

  const legsAvg = getPathAvg("legs");
  const pushAvg = getPathAvg("push");
  const pullAvg = getPathAvg("pull");
  const coreAvg = getPathAvg("core");
  const baseFourAvg = Math.round((legsAvg + pushAvg + pullAvg + coreAvg) / 4);

  const skillsLocked = baseFourAvg < 60;
  const skillsAvg = skillsLocked ? 0 : getPathAvg("skills");

  const eliteLocked = baseFourAvg < 100 || skillsAvg < 100;
  const eliteAvg = eliteLocked ? 0 : getPathAvg("elite");

  const overallAverage = Math.round((legsAvg + pushAvg + pullAvg + coreAvg + skillsAvg + eliteAvg) / 6);
  const athleteScore = Math.round(overallAverage * 10);

  // Total exercises in the database
  const totalExercises = useMemo(() => {
    return Object.values(EXERCISE_ORDER).reduce((sum, list) => sum + list.length, 0);
  }, []);

  const learnedCount = skills.filter(s => s.learned).length;
  const masteredCount = skills.filter(s => s.mastery_percent >= 100).length;

  const booksCompleted = useMemo(() => {
    let completed = 0;
    if (legsAvg >= 100) completed++;
    if (pushAvg >= 100) completed++;
    if (pullAvg >= 100) completed++;
    if (coreAvg >= 100) completed++;
    if (!skillsLocked && skillsAvg >= 100) completed++;
    if (!eliteLocked && eliteAvg >= 100) completed++;
    return completed;
  }, [legsAvg, pushAvg, pullAvg, coreAvg, skillsAvg, eliteAvg, skillsLocked, eliteLocked]);

  // Weakest Path Calculation
  const weakestPathInfo = useMemo(() => {
    const paths = [
      { name: "Leg Mastery", path: "legs", avg: legsAvg, recommend: "Train Legs & Single Leg Balance" },
      { name: "Push Mastery", path: "push", avg: pushAvg, recommend: "Train Chest Press & Shoulder Dips" },
      { name: "Pull Mastery", path: "pull", avg: pullAvg, recommend: "Train Pull-ups & Horizontal Rows" },
      { name: "Core Mastery", path: "core", avg: coreAvg, recommend: "Train Hanging Leg Raises & L-Sit" }
    ];
    paths.sort((a, b) => a.avg - b.avg);
    return paths[0];
  }, [legsAvg, pushAvg, pullAvg, coreAvg]);

  // Current Focus Calculation (First unlocked, unmastered skill in the weakest book path)
  const currentFocus = useMemo(() => {
    const weakestBook = weakestPathInfo.path;
    const orderList = GUILD_CATALOG.filter(x => x.path === weakestBook);

    const isExerciseUnlockedLocal = (exName: string) => {
      if (exName.includes("MASTER")) return false; // Skip checking master nodes as target
      const item = GUILD_CATALOG.find(x => x.name === exName);
      if (!item) return false;
      const prereqs = item.prerequisites;
      if (!prereqs || (Array.isArray(prereqs) && prereqs.length === 0)) return true;
      const isExerciseMasteredLocal = (name: string) => {
        const s = skills.find(sk => sk.exercise_name === name);
        return s ? s.mastery_percent >= 100 : false;
      };
      if (Array.isArray(prereqs)) {
        return prereqs.every(isExerciseMasteredLocal);
      }
      if (prereqs.type === "and") {
        return prereqs.exercises.every(isExerciseMasteredLocal);
      }
      if (prereqs.type === "or") {
        return prereqs.exercises.some(isExerciseMasteredLocal);
      }
      return false;
    };

    for (let i = 0; i < orderList.length; i++) {
      const ex = orderList[i];
      const match = skills.find(s => s.exercise_name === ex.name);
      const mastery = match ? match.mastery_percent : 0;

      if (mastery < 100 && isExerciseUnlockedLocal(ex.name)) {
        return {
          bookName: weakestPathInfo.name,
          exercise: ex.name,
          mastery,
          masteryReqText: ex.mastery_req
        };
      }
    }

    return {
      bookName: weakestPathInfo.name,
      exercise: "Path Mastered!",
      mastery: 100,
      masteryReqText: "N/A"
    };
  }, [weakestPathInfo, skills]);

  // Dynamic Recommendations based on unlocked, unmastered exercises
  const recommendedToday = useMemo(() => {
    const list: CatalogItem[] = [];
    const isExerciseUnlockedLocal = (exName: string) => {
      const item = GUILD_CATALOG.find(x => x.name === exName);
      if (!item) return false;
      const prereqs = item.prerequisites;
      if (!prereqs || (Array.isArray(prereqs) && prereqs.length === 0)) return true;
      const isExerciseMasteredLocal = (name: string) => {
        const s = skills.find(sk => sk.exercise_name === name);
        return s ? s.mastery_percent >= 100 : false;
      };
      if (Array.isArray(prereqs)) {
        return prereqs.every(isExerciseMasteredLocal);
      }
      if (prereqs.type === "and") {
        return prereqs.exercises.every(isExerciseMasteredLocal);
      }
      if (prereqs.type === "or") {
        return prereqs.exercises.some(isExerciseMasteredLocal);
      }
      return false;
    };

    for (const item of GUILD_CATALOG) {
      if (item.name.includes("MASTER")) continue;
      const progress = skills.find(s => s.exercise_name === item.name);
      const mastery = progress ? progress.mastery_percent : 0;
      if (mastery < 100 && isExerciseUnlockedLocal(item.name)) {
        list.push(item);
        if (list.length >= 3) break;
      }
    }

    if (list.length < 3) {
      const defaults = GUILD_CATALOG.filter(x => !x.name.includes("MASTER") && !list.some(y => y.name === x.name));
      for (const d of defaults) {
        list.push(d);
        if (list.length >= 3) break;
      }
    }
    return list;
  }, [skills]);

  // Master Titles
  const masterTitles = useMemo(() => {
    const list: string[] = [];
    if (legsAvg >= 100) list.push("Leg Master");
    if (pushAvg >= 100) list.push("Push Master");
    if (pullAvg >= 100) list.push("Pull Master");
    if (coreAvg >= 100) list.push("Core Master");
    if (!skillsLocked && skillsAvg >= 100) list.push("Skills Master");
    if (!eliteLocked && eliteAvg >= 100) list.push("Elite Master");
    return list;
  }, [legsAvg, pushAvg, pullAvg, coreAvg, skillsAvg, eliteAvg, skillsLocked, eliteLocked]);

  // Athlete Grade
  const athleteGrade = useMemo(() => {
    if (athleteScore < 100) return "Novice";
    if (athleteScore < 300) return "Challenger";
    if (athleteScore < 600) return "Specialist";
    if (athleteScore < 900) return "Elite";
    return "Master";
  }, [athleteScore]);

  // Daily Streak Calculator
  const dailyStreak = useMemo(() => {
    if (prLogs.length === 0) return 0;
    const uniqueDates = Array.from(new Set(prLogs.map(log => log.date))).sort().reverse();
    if (uniqueDates.length === 0) return 0;

    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
      return 0;
    }

    let streak = 1;
    let currentDate = new Date(uniqueDates[0]);

    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i]);
      const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
        currentDate = prevDate;
      } else if (diffDays > 1) {
        break;
      }
    }
    return streak;
  }, [prLogs]);

  // Next Milestone Card (first locked exercise in weakest path)
  const nextMilestoneInfo = useMemo(() => {
    const weakestBook = weakestPathInfo.path;
    const orderList = GUILD_CATALOG.filter(x => x.path === weakestBook);

    const isExerciseUnlockedLocal = (exName: string) => {
      const item = GUILD_CATALOG.find(x => x.name === exName);
      if (!item) return false;
      const prereqs = item.prerequisites;
      if (!prereqs || (Array.isArray(prereqs) && prereqs.length === 0)) return true;
      const isExerciseMasteredLocal = (name: string) => {
        const s = skills.find(sk => sk.exercise_name === name);
        return s ? s.mastery_percent >= 100 : false;
      };
      if (Array.isArray(prereqs)) {
        return prereqs.every(isExerciseMasteredLocal);
      }
      if (prereqs.type === "and") {
        return prereqs.exercises.every(isExerciseMasteredLocal);
      }
      if (prereqs.type === "or") {
        return prereqs.exercises.some(isExerciseMasteredLocal);
      }
      return false;
    };

    for (const ex of orderList) {
      if (!ex.name.includes("MASTER") && !isExerciseUnlockedLocal(ex.name)) {
        const prereqs = ex.prerequisites;
        const remainingPrereqs: string[] = [];
        if (prereqs) {
          const list = Array.isArray(prereqs) ? prereqs : prereqs.exercises;
          list.forEach(name => {
            const progress = skills.find(s => s.exercise_name === name);
            if (!progress || progress.mastery_percent < 100) {
              remainingPrereqs.push(name);
            }
          });
        }
        return {
          target: ex.name,
          remaining: remainingPrereqs.length > 0 ? remainingPrereqs.join(", ") : "None"
        };
      }
    }

    return {
      target: weakestPathInfo.name + " Mastered",
      remaining: "All exercises unlocked!"
    };
  }, [weakestPathInfo, skills]);

  // Current Book Progress
  const currentBookProgress = useMemo(() => {
    const book = weakestPathInfo.path;
    const bookCatalog = GUILD_CATALOG.filter(x => x.path === book);
    const bookSkills = skills.filter(s => s.path === book);
    const masteredCount = bookSkills.filter(s => s.mastery_percent >= 100).length;
    const totalCount = bookCatalog.length;
    const percent = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;
    return {
      masteredCount,
      totalCount,
      percent
    };
  }, [weakestPathInfo, skills]);

  // Newest Mastered or Latest Unlock
  const newestMastered = useMemo(() => {
    const mastered = skills.filter(s => s.mastery_percent >= 100);
    if (mastered.length === 0) return null;
    for (const log of prLogs) {
      const match = mastered.find(m => m.exercise_name === log.exercise);
      if (match) {
        const unlocks = GUILD_CATALOG.filter(item => {
          const prereqs = item.prerequisites;
          if (!prereqs) return false;
          const list = Array.isArray(prereqs) ? prereqs : prereqs.exercises;
          return list.includes(match.exercise_name);
        }).map(x => x.name);

        return {
          name: match.exercise_name,
          unlocksText: unlocks.length > 0 ? unlocks.join(", ") : "None"
        };
      }
    }
    return { name: mastered[0].exercise_name, unlocksText: "None" };
  }, [skills, prLogs]);

  // Dynamic Achievements list
  const recentAchievements = useMemo(() => {
    const list: string[] = [];
    const hasPullup = skills.some(s => s.exercise_name === "Standard Pull-up" && s.learned);
    if (hasPullup) list.push("🏆 First Pull-Up");
    if (totalCalisthenicsXp >= 1000) {
      list.push("🏆 1000 XP Reached");
    } else if (totalCalisthenicsXp >= 500) {
      list.push("🏆 500 XP Reached");
    }
    if (legsAvg >= 25) list.push("🏆 Leg Master Apprentice");
    if (pushAvg >= 25) list.push("🏆 Push Master Apprentice");
    if (pullAvg >= 25) list.push("🏆 Pull Master Apprentice");
    if (coreAvg >= 25) list.push("🏆 Core Master Apprentice");

    if (list.length === 0) {
      list.push("🏆 Guild Journey Initiated");
      list.push("🏆 Recruit Rank Attained");
    }
    return list.slice(0, 3);
  }, [skills, totalCalisthenicsXp, legsAvg, pushAvg, pullAvg, coreAvg]);

  // Heatmap values generator
  const getHeatmapVal = (book: string, col: string): string => {
    const pathSkills = skills.filter(s => s.path === book);
    if (pathSkills.length === 0) return "0%";

    let filtered = pathSkills;
    if (col === "Foundation") {
      filtered = pathSkills.filter(s => s.exercise_name.toLowerCase().includes("foundation") || s.exercise_name.toLowerCase().includes("easy") || s.exercise_name.toLowerCase().includes("wall") || s.exercise_name.toLowerCase().includes("box") || s.exercise_name.toLowerCase().includes("air") || s.exercise_name.toLowerCase().includes("dead hang") || s.exercise_name.toLowerCase().includes("plank"));
    } else if (col === "Strength") {
      filtered = pathSkills.filter(s => s.exercise_name.toLowerCase().includes("strength") || s.exercise_name.toLowerCase().includes("standard") || s.exercise_name.toLowerCase().includes("tempo") || s.exercise_name.toLowerCase().includes("hold") || s.exercise_name.toLowerCase().includes("narrow") || s.exercise_name.toLowerCase().includes("raise"));
    } else if (col === "Power") {
      filtered = pathSkills.filter(s => s.exercise_name.toLowerCase().includes("pistol") || s.exercise_name.toLowerCase().includes("planche") || s.exercise_name.toLowerCase().includes("lever") || s.exercise_name.toLowerCase().includes("handstand") || s.exercise_name.toLowerCase().includes("l-sit"));
    } else if (col === "Explosive") {
      filtered = pathSkills.filter(s => s.exercise_name.toLowerCase().includes("explosive") || s.exercise_name.toLowerCase().includes("jump") || s.exercise_name.toLowerCase().includes("muscle") || s.exercise_name.toLowerCase().includes("clap") || s.exercise_name.toLowerCase().includes("shrimp") || s.exercise_name.toLowerCase().includes("wiper"));
    } else if (col === "Master") {
      filtered = pathSkills.filter(s => s.exercise_name.toLowerCase().includes("master") || s.exercise_name.toLowerCase().includes("grandmaster") || s.exercise_name.toLowerCase().includes("elite") || s.exercise_name.toLowerCase().includes("one arm") || s.exercise_name.toLowerCase().includes("nordic") || s.exercise_name.toLowerCase().includes("flag"));
    }

    if (filtered.length === 0) {
      return `${Math.round(pathSkills.reduce((sum, s) => sum + s.mastery_percent, 0) / pathSkills.length)}%`;
    }

    const avgVal = Math.round(filtered.reduce((sum, s) => sum + s.mastery_percent, 0) / filtered.length);
    return `${avgVal}%`;
  };

  const getHeatmapColorClass = (valStr: string) => {
    const val = parseInt(valStr) || 0;
    if (val === 0) return "text-secondary/40 font-normal";
    if (val <= 20) return "text-[#FF4A4A] font-medium";
    if (val <= 40) return "text-[#FFA84A] font-medium";
    if (val <= 60) return "text-[#FFEB4A] font-semibold";
    if (val <= 80) return "text-[#8AFF4A] font-bold";
    return "text-accent font-extrabold";
  };

  // Helper for tech chain status render
  const renderTechStatus = (bookName: string, avgVal: number, isLocked: boolean) => {
    if (isLocked) return <span className="text-secondary/60">🔒</span>;
    if (avgVal >= 100) return <span className="text-success font-black text-sm">✓</span>;
    return <span className="text-accent font-extrabold text-[11px] font-mono">🔄 {avgVal}%</span>;
  };

  return (
    <div className="page bg-bg">
      <div className="page-content pb-24">
        
        {/* Header - Who Am I? */}
        <div className="pt-2 flex justify-between items-center">
          <div>
            <p className="label">Dashboard</p>
            <h1 className="text-2xl font-bold text-primary">Calisthenics Guild</h1>
          </div>
          <button
            onClick={() => router.push("/calisthenics")}
            className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_10px_rgba(74,158,255,0.3)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            Train Now ⚡
          </button>
        </div>

        {/* Identity & Level */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-[#10101C] to-[#0A0A10]">
          <div className="absolute top-0 right-0 w-28 h-28 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">Level {levelInfo.level}</p>
              <h2 className="text-2xl font-black text-white mt-0.5">{levelInfo.title}</h2>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-secondary uppercase font-bold tracking-wider">Total XP</span>
              <p className="text-sm font-mono font-black text-accent mt-0.5">{totalCalisthenicsXp.toLocaleString()} XP</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-secondary mb-1">
              <span>XP PROGRESS</span>
              <span>{levelInfo.currentXp} / {levelInfo.nextLevelXp} XP</span>
            </div>
            <ProgressBar value={levelInfo.progress} color="var(--accent)" height={6} />
          </div>
        </Card>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => router.push("/calisthenics")}
            className="flex flex-col items-center justify-center p-2.5 bg-[#10101C]/80 hover:bg-[#151528] rounded-xl border border-border/20 text-center transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <span className="text-lg">📚</span>
            <span className="text-[8px] text-secondary font-bold uppercase mt-1">Book Trees</span>
          </button>
          <button
            onClick={() => router.push("/weight")}
            className="flex flex-col items-center justify-center p-2.5 bg-[#10101C]/80 hover:bg-[#151528] rounded-xl border border-border/20 text-center transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <span className="text-lg">⚖️</span>
            <span className="text-[8px] text-secondary font-bold uppercase mt-1">Log Weight</span>
          </button>
          <button
            onClick={() => router.push("/pr")}
            className="flex flex-col items-center justify-center p-2.5 bg-[#10101C]/80 hover:bg-[#151528] rounded-xl border border-border/20 text-center transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <span className="text-lg">🏆</span>
            <span className="text-[8px] text-secondary font-bold uppercase mt-1">Log PR</span>
          </button>
          <button
            onClick={() => router.push("/measurements")}
            className="flex flex-col items-center justify-center p-2.5 bg-[#10101C]/80 hover:bg-[#151528] rounded-xl border border-border/20 text-center transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <span className="text-lg">📏</span>
            <span className="text-[8px] text-secondary font-bold uppercase mt-1">Measures</span>
          </button>
        </div>

        {/* Overall Completion Progress */}
        <Card className="bg-[#121221]/90">
          <CardLabel>Overall Completion</CardLabel>
          <div className="flex items-center gap-6 mt-2">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="28" className="stroke-[#19192C]" strokeWidth="5.5" fill="transparent" />
                  <circle cx="32" cy="32" r="28" className="stroke-accent" strokeWidth="5.5" fill="transparent"
                    strokeDasharray={175.9}
                    strokeDashoffset={175.9 - (175.9 * overallAverage) / 100}
                  />
                </svg>
                <span className="absolute text-sm font-black text-white">{overallAverage}%</span>
              </div>
              <span className="text-[8px] text-secondary font-bold uppercase tracking-wider mt-1">{masteredCount} / {totalExercises} Mastered</span>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-surface2/30 p-2 rounded-xl border border-border/10">
                <span className="text-[9px] text-secondary block uppercase">Learned</span>
                <span className="text-sm font-bold text-white mt-0.5 block">{learnedCount} <span className="text-secondary text-[10px] font-normal">/ {totalExercises}</span></span>
              </div>
              <div className="bg-surface2/30 p-2 rounded-xl border border-border/10">
                <span className="text-[9px] text-secondary block uppercase">Mastered</span>
                <span className="text-sm font-bold text-accent mt-0.5 block">{masteredCount} <span className="text-secondary text-[10px] font-normal">/ {totalExercises}</span></span>
              </div>
            </div>
          </div>
        </Card>

        {/* Where Am I? - Mastery Paths */}
        <Card className="flex flex-col gap-3">
          <CardLabel>Mastery Paths</CardLabel>
          
          {/* Legs */}
          <div className="flex justify-between items-center bg-surface2/20 px-3.5 py-2.5 border border-border/15 rounded-xl hover:border-accent/40 transition-all cursor-pointer" onClick={() => router.push("/calisthenics")}>
            <span className="text-white text-xs font-semibold flex items-center gap-2">
              <span>📕</span> Leg Mastery
            </span>
            <span className="font-extrabold text-accent text-xs">{legsAvg}%</span>
          </div>

          {/* Push */}
          <div className="flex justify-between items-center bg-surface2/20 px-3.5 py-2.5 border border-border/15 rounded-xl hover:border-accent/40 transition-all cursor-pointer" onClick={() => router.push("/calisthenics")}>
            <span className="text-white text-xs font-semibold flex items-center gap-2">
              <span>📘</span> Push Mastery
            </span>
            <span className="font-extrabold text-accent text-xs">{pushAvg}%</span>
          </div>

          {/* Pull */}
          <div className="flex justify-between items-center bg-surface2/20 px-3.5 py-2.5 border border-border/15 rounded-xl hover:border-accent/40 transition-all cursor-pointer" onClick={() => router.push("/calisthenics")}>
            <span className="text-white text-xs font-semibold flex items-center gap-2">
              <span>📙</span> Pull Mastery
            </span>
            <span className="font-extrabold text-accent text-xs">{pullAvg}%</span>
          </div>

          {/* Core */}
          <div className="flex justify-between items-center bg-surface2/20 px-3.5 py-2.5 border border-border/15 rounded-xl hover:border-accent/40 transition-all cursor-pointer" onClick={() => router.push("/calisthenics")}>
            <span className="text-white text-xs font-semibold flex items-center gap-2">
              <span>📗</span> Core Mastery
            </span>
            <span className="font-extrabold text-accent text-xs">{coreAvg}%</span>
          </div>

          {/* Skills */}
          <div className="flex justify-between items-center bg-surface2/20 px-3.5 py-2.5 border border-border/15 rounded-xl hover:border-accent/40 transition-all cursor-pointer" onClick={() => router.push("/calisthenics")}>
            <span className="text-white text-xs font-semibold flex items-center gap-2">
              <span>📕</span> Skills & Balance
            </span>
            <span className={skillsLocked ? "text-secondary italic text-xs font-medium" : "font-extrabold text-accent text-xs"}>
              {skillsLocked ? "Locked" : `${skillsAvg}%`}
            </span>
          </div>

          {/* Elite */}
          <div className="flex justify-between items-center bg-surface2/20 px-3.5 py-2.5 border border-border/15 rounded-xl hover:border-accent/40 transition-all cursor-pointer" onClick={() => router.push("/calisthenics")}>
            <span className="text-white text-xs font-semibold flex items-center gap-2">
              <span>📘</span> Elite Skills
            </span>
            <span className={eliteLocked ? "text-secondary italic text-xs font-medium" : "font-extrabold text-accent text-xs"}>
              {eliteLocked ? "Locked" : `${eliteAvg}%`}
            </span>
          </div>
        </Card>

        {/* What Should I Do Next? - Today's Target Card */}
        <Card className="border border-accent/20 bg-accent/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-accent tracking-wider uppercase">Today's Target</span>
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <div>
              <span className="text-[10px] text-secondary uppercase block">Current Book</span>
              <span className="text-white font-bold text-xs block">{currentFocus.bookName}</span>
              <span className="text-[9px] text-secondary/80 block mt-0.5">{currentBookProgress.masteredCount} / {currentBookProgress.totalCount} mastered ({currentBookProgress.percent}%)</span>
            </div>
            <div>
              <span className="text-[10px] text-secondary uppercase block">Exercise Target</span>
              <span className="text-white font-black text-sm block mt-0.5">{currentFocus.exercise}</span>
            </div>
            <div>
              <span className="text-[10px] text-secondary uppercase block">Required Goal</span>
              <span className="text-white font-bold text-xs block mt-0.5">{currentFocus.masteryReqText}</span>
            </div>
            <div className="flex gap-4 items-center mt-1">
              <div className="flex-1">
                <span className="text-[10px] text-secondary uppercase block mb-1">Mastery Progress</span>
                <ProgressBar value={currentFocus.mastery} color="var(--accent)" height={4} />
              </div>
              <span className="text-xs font-bold text-white bg-surface2 px-2.5 py-1 rounded-lg border border-border/20">{currentFocus.mastery}%</span>
            </div>
          </div>
        </Card>

        {/* Daily Streak Card */}
        <Card className="border border-accent/20 bg-accent/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <span className="text-[10px] text-secondary uppercase font-bold tracking-wider">Daily Streak</span>
              <h4 className="text-base font-black text-white mt-0.5">{dailyStreak} Days</h4>
            </div>
          </div>
        </Card>

        {/* Next Milestone Card */}
        <Card className="border border-accent/20 bg-[#121221]/95">
          <CardLabel>Next Milestone</CardLabel>
          <div className="mt-2.5 flex flex-col gap-2">
            <div>
              <span className="text-[9px] text-secondary uppercase font-bold tracking-wider block">Unlock Goal</span>
              <h4 className="text-xs font-black text-white mt-0.5">{nextMilestoneInfo.target}</h4>
            </div>
            <div className="border-t border-border/15 pt-2">
              <span className="text-[9px] text-secondary/80 uppercase font-bold tracking-wider block">Remaining Prerequisites</span>
              <p className="text-xs text-accent font-semibold mt-0.5">{nextMilestoneInfo.remaining}</p>
            </div>
          </div>
        </Card>

        {/* Latest Milestone Card */}
        <Card className="border border-success/20 bg-success/5">
          <CardLabel className="text-success">🏆 Latest Milestone</CardLabel>
          <div className="mt-2.5 flex flex-col gap-2.5">
            {newestMastered ? (
              <div className="p-2.5 rounded-xl bg-success/10 border border-success/15">
                <span className="text-[9px] text-secondary uppercase font-bold tracking-wider block">Newest Mastered</span>
                <h4 className="text-xs font-black text-white mt-0.5">{newestMastered.name}</h4>
                <span className="text-[8px] text-secondary block mt-1">Unlocked: {newestMastered.unlocksText}</span>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-success/10 border border-success/15">
                <span className="text-xs text-secondary/60 italic block">No skills mastered yet. Train to unlock your first milestone!</span>
              </div>
            )}
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-[9px] text-secondary uppercase font-bold mb-0.5 block">Recent Achievements</span>
              {recentAchievements.map((ach, i) => (
                <span key={i} className="text-white font-medium flex items-center gap-1.5">
                  <span className="text-[10px]">⭐</span> {ach}
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* Lifetime Stats */}
        <Card>
          <CardLabel>Lifetime Stats</CardLabel>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="bg-surface2/30 p-3 rounded-xl border border-border/10">
              <span className="text-secondary text-[10px] block uppercase font-medium">Exercises Learned</span>
              <span className="text-lg font-black text-white mt-1 block">{learnedCount}</span>
            </div>
            <div className="bg-surface2/30 p-3 rounded-xl border border-border/10">
              <span className="text-secondary text-[10px] block uppercase font-medium">Exercises Mastered</span>
              <span className="text-lg font-black text-white mt-1 block">{masteredCount}</span>
            </div>
            <div className="bg-surface2/30 p-3 rounded-xl border border-border/10">
              <span className="text-secondary text-[10px] block uppercase font-medium">Books Completed</span>
              <span className="text-lg font-black text-white mt-1 block">{booksCompleted} <span className="text-secondary text-xs">/ 6</span></span>
            </div>
            <div className="bg-surface2/30 p-3 rounded-xl border border-border/10">
              <span className="text-secondary text-[10px] block uppercase font-medium">PR Records</span>
              <span className="text-lg font-black text-white mt-1 block">{totalSessions}</span>
            </div>
            <div className="bg-surface2/30 p-3 rounded-xl border border-border/10">
              <span className="text-secondary text-[10px] block uppercase font-medium">Total XP</span>
              <span className="text-lg font-black text-white mt-1 block font-mono text-ellipsis overflow-hidden">{totalCalisthenicsXp.toLocaleString()}</span>
            </div>
            <div className="bg-surface2/30 p-3 rounded-xl border border-border/10">
              <span className="text-secondary text-[10px] block uppercase font-medium">Athlete Score</span>
              <span className="text-lg font-black text-accent mt-1 block">{athleteScore} <span className="text-secondary text-[10px] font-normal">{athleteGrade}</span></span>
            </div>
            <div className="bg-surface2/30 p-3 rounded-xl border border-border/10 col-span-2">
              <span className="text-secondary text-[10px] block uppercase font-medium">Master Titles Earned ({masterTitles.length})</span>
              <span className="text-xs font-black text-white mt-1 block">
                {masterTitles.length > 0 ? masterTitles.join(" • ") : "None yet"}
              </span>
            </div>
          </div>
        </Card>

        {/* Weakest Path & Recommendation */}
        <Card className="border border-[#FF4A4A]/25 bg-[#FF4A4A]/5">
          <CardLabel className="text-[#FF4A4A]">Weakest Path & Recommended Today</CardLabel>
          <div className="mt-2 flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-white font-bold text-sm">{weakestPathInfo.name}</span>
              <span className="text-xs font-bold text-[#FF4A4A] bg-[#FF4A4A]/10 px-2.5 py-0.5 rounded-lg border border-[#FF4A4A]/20">{weakestPathInfo.avg}%</span>
            </div>
            <div className="border-t border-[#FF4A4A]/15 pt-2 mt-1.5 flex flex-col gap-1">
              <span className="text-[9px] text-secondary uppercase font-bold tracking-wider mb-1">Recommended From Unlocked Progress Tree</span>
              {recommendedToday.map((rec, i) => (
                <div key={rec.name || i} className="flex justify-between items-center text-xs py-0.5">
                  <span className="text-white font-semibold flex items-center gap-1.5">
                    <span className="text-[9px] text-accent">●</span> {rec.name}
                  </span>
                  <span className="text-secondary/70 font-mono text-[10px]">{rec.mastery_req}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Completion Heatmap */}
        <Card className="p-0 overflow-hidden border border-border bg-[#101018]">
          <div className="p-4 border-b border-border/25">
            <span className="label text-[10px] font-bold tracking-wider text-white">Completion Heatmap</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/30 bg-surface2/30">
                  <th className="p-2.5 font-bold text-secondary text-[10px] uppercase">Book</th>
                  <th className="p-2.5 font-bold text-secondary text-[10px] uppercase">Foundation</th>
                  <th className="p-2.5 font-bold text-secondary text-[10px] uppercase">Strength</th>
                  <th className="p-2.5 font-bold text-secondary text-[10px] uppercase">Power</th>
                  <th className="p-2.5 font-bold text-secondary text-[10px] uppercase">Explosive</th>
                  <th className="p-2.5 font-bold text-secondary text-[10px] uppercase">Mastery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {(["legs", "push", "pull", "core", "skills", "elite"] as const).map(book => (
                  <tr key={book} className="hover:bg-surface2/10">
                    <td className="p-2.5 font-bold text-white uppercase text-[10px]">{book}</td>
                    <td className={`p-2.5 ${getHeatmapColorClass(getHeatmapVal(book, "Foundation"))}`}>{getHeatmapVal(book, "Foundation")}</td>
                    <td className={`p-2.5 ${getHeatmapColorClass(getHeatmapVal(book, "Strength"))}`}>{getHeatmapVal(book, "Strength")}</td>
                    <td className={`p-2.5 ${getHeatmapColorClass(getHeatmapVal(book, "Power"))}`}>{getHeatmapVal(book, "Power")}</td>
                    <td className={`p-2.5 ${getHeatmapColorClass(getHeatmapVal(book, "Explosive"))}`}>{getHeatmapVal(book, "Explosive")}</td>
                    <td className={`p-2.5 ${getHeatmapColorClass(getHeatmapVal(book, "Master"))}`}>{getHeatmapVal(book, "Master")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Cross-Book Master Tech Chain */}
        <Card>
          <CardLabel>Cross-Book Master Tech Chain</CardLabel>
          <div className="flex flex-col gap-2.5 mt-2">
            
            {/* Legs */}
            <div className="flex justify-between items-center text-xs bg-surface2/20 px-3.5 py-2.5 border border-border/15 rounded-xl hover:border-accent/40 transition-all cursor-pointer" onClick={() => router.push("/calisthenics")}>
              <span className="text-secondary font-semibold">Leg Master</span>
              {renderTechStatus("legs", legsAvg, false)}
            </div>

            {/* Push */}
            <div className="flex justify-between items-center text-xs bg-surface2/20 px-3.5 py-2.5 border border-border/15 rounded-xl hover:border-accent/40 transition-all cursor-pointer" onClick={() => router.push("/calisthenics")}>
              <span className="text-secondary font-semibold">Push Master</span>
              {renderTechStatus("push", pushAvg, false)}
            </div>

            {/* Pull */}
            <div className="flex justify-between items-center text-xs bg-surface2/20 px-3.5 py-2.5 border border-border/15 rounded-xl hover:border-accent/40 transition-all cursor-pointer" onClick={() => router.push("/calisthenics")}>
              <span className="text-secondary font-semibold">Pull Master</span>
              {renderTechStatus("pull", pullAvg, false)}
            </div>

            {/* Core */}
            <div className="flex justify-between items-center text-xs bg-surface2/20 px-3.5 py-2.5 border border-border/15 rounded-xl hover:border-accent/40 transition-all cursor-pointer" onClick={() => router.push("/calisthenics")}>
              <span className="text-secondary font-semibold">Core Master</span>
              {renderTechStatus("core", coreAvg, false)}
            </div>

            {/* Skills */}
            <div className="flex justify-between items-center text-xs bg-surface2/20 px-3.5 py-2.5 border border-border/15 rounded-xl hover:border-accent/40 transition-all cursor-pointer" onClick={() => router.push("/calisthenics")}>
              <span className="text-secondary font-semibold">Skills Master</span>
              {renderTechStatus("skills", skillsAvg, skillsLocked)}
            </div>

            {/* Elite */}
            <div className="flex justify-between items-center text-xs bg-surface2/20 px-3.5 py-2.5 border border-border/15 rounded-xl hover:border-accent/40 transition-all cursor-pointer" onClick={() => router.push("/calisthenics")}>
              <span className="text-secondary font-semibold">Elite Master</span>
              {renderTechStatus("elite", eliteAvg, eliteLocked)}
            </div>

          </div>
        </Card>

      </div>
      <NavBar />
    </div>
  );
}
