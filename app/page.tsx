"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardInner, CardLabel } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { NavBar } from "@/components/ui/NavBar";
import { GuildMark } from "@/components/ui/GuildMark";
import { ChevronRight, Target, Trophy, Book, Lock, Check, Zap, Activity } from "lucide-react";
import {
  GUILD_CATALOG,
  CatalogItem,
  getXpForDifficulty,
  getCalisthenicsLevelInfo,
  skillsLocked as isSkillsLockedFunc,
  eliteLocked as isEliteLockedFunc,
  CalisthenicsProgress,
  isExerciseMastered as isExerciseMasteredCentral,
  calculateTotalXp
} from "@/lib/calisthenicsConfig";
import { ASVAND_PROFILE_ID } from "@/lib/appConfig";
import { getLocalDateString } from "@/lib/dateUtils";

interface PrLogItem {
  id: string;
  exercise: string;
  value: number;
  unit: string;
  date: string;
  notes?: string;
}

const DB_QUOTA_MB = 500;

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<CalisthenicsProgress[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [prLogs, setPrLogs] = useState<PrLogItem[]>([]);
  const [activeTargets, setActiveTargets] = useState<{ exercise: string; targetValue: number; currentValue: number; unit: string; completed: boolean }[]>([]);
  const [weightTarget, setWeightTarget] = useState<{ current: number; target: number; unit: string } | null>(null);

  // Database Storage States
  const [dbSizeMb, setDbSizeMb] = useState<number | null>(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState(false);

  const loadData = async (profileId: string) => {
    try {
      const [progressRes, prRes, targetsRes, weightRes, dbSizeRes] = await Promise.all([
        supabase
          .from("calisthenics_progress")
          .select("*")
          .eq("profile_id", profileId),
        supabase
          .from("pr_logs")
          .select("*")
          .eq("profile_id", profileId)
          .order("date", { ascending: false }),
        supabase
          .from("pr_milestones")
          .select("*")
          .eq("profile_id", profileId),
        supabase
          .from("measurements")
          .select("*")
          .eq("profile_id", profileId)
          .order("date", { ascending: false })
          .limit(1),
        supabase.rpc("get_db_size")
      ]);

      if (progressRes.data) {
        setSkills(progressRes.data.map(s => ({
          exercise_name: s.exercise_name,
          path: s.path,
          mastery_percent: s.mastery_percent || 0,
          learned: s.learned || false,
          reps: s.reps || 0,
          x3_completed: s.x3_completed || false,
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

      // Compute weight targets
      let latestWeight: number | null = null;
      if (weightRes.data && weightRes.data.length > 0) {
        latestWeight = Number(weightRes.data[0].weight_kg);
      }

      const storedGoals = localStorage.getItem("calisthenics_measurement_goals");
      if (storedGoals) {
        try {
          const parsed = JSON.parse(storedGoals);
          if (parsed.weight_kg && latestWeight) {
            setWeightTarget({
              current: latestWeight,
              target: parsed.weight_kg,
              unit: "kg"
            });
          }
        } catch (e) {}
      }

      if (targetsRes.data) {
        const mapped = targetsRes.data.map((tg: any) => {
          const matchedPrs = prRes.data ? prRes.data.filter((r: any) => r.exercise === tg.exercise) : [];
          const bestPr = matchedPrs.reduce((max: number, r: any) => r.value > max ? r.value : max, 0);
          return {
            exercise: tg.exercise,
            targetValue: tg.value,
            currentValue: bestPr,
            unit: tg.unit || "reps",
            completed: tg.completed || (bestPr >= tg.value)
          };
        });
        setActiveTargets(mapped);
      }

      // Parse Database Size Result
      if (dbSizeRes.error) {
        console.error("Error loading database size:", dbSizeRes.error);
        setDbError(true);
      } else if (dbSizeRes.data !== undefined) {
        const bytes = Number(dbSizeRes.data);
        const mb = bytes / (1024 * 1024);
        setDbSizeMb(mb);
        setDbError(false);
      }
    } catch (err) {
      console.error("Error loading Dashboard data:", err);
      setDbError(true);
    } finally {
      setLoading(false);
      setDbLoading(false);
    }
  };

  useEffect(() => {
    loadData(ASVAND_PROFILE_ID);
  }, []);

  // Compute total Calisthenics XP accumulated
  const totalCalisthenicsXp = useMemo(() => {
    return calculateTotalXp(skills);
  }, [skills]);

  const levelInfo = getCalisthenicsLevelInfo(totalCalisthenicsXp);

  // Path average calculations
  const getPathAvg = (pathName: string) => {
    const bookCatalog = GUILD_CATALOG.filter(x => x.path === pathName);
    const totalCount = bookCatalog.length;
    if (totalCount === 0) return 0;
    
    let totalMasterySum = 0;
    bookCatalog.forEach(item => {
      const match = skills.find(s => s.exercise_name === item.name);
      totalMasterySum += match ? match.mastery_percent : 0;
    });
    
    return Math.round(totalMasterySum / totalCount);
  };

  const legsAvg = getPathAvg("legs");
  const pushAvg = getPathAvg("push");
  const pullAvg = getPathAvg("pull");
  const coreAvg = getPathAvg("core");
  const baseFourAvg = Math.round((legsAvg + pushAvg + pullAvg + coreAvg) / 4);

  const skillsLocked = isSkillsLockedFunc(baseFourAvg);
  const skillsAvg = skillsLocked ? 0 : getPathAvg("skills");

  const eliteLocked = isEliteLockedFunc(baseFourAvg, skillsAvg);
  const eliteAvg = eliteLocked ? 0 : getPathAvg("elite");

  // Local wrapper around the centralized mastery checker
  const isExerciseMastered = (exName: string) => isExerciseMasteredCentral(exName, skills);

  // Total exercises in the database
  const totalExercises = useMemo(() => {
    return GUILD_CATALOG.length;
  }, []);

  const masteredCount = useMemo(() => {
    return skills.filter(s => isExerciseMastered(s.exercise_name)).length;
  }, [skills]);

  const overallAverage = totalExercises > 0 ? Math.min(100, Math.max(0, Math.round((masteredCount / totalExercises) * 100))) : 0;
  const athleteScore = Math.round(overallAverage * 10);

  const pathStats = useMemo(() => {
    const getCounts = (book: string) => {
      const bookCatalog = GUILD_CATALOG.filter(x => x.path === book);
      const mastered = bookCatalog.filter(ex => isExerciseMastered(ex.name)).length;
      const total = bookCatalog.length;
      return { mastered, total };
    };

    return {
      legs: getCounts("legs"),
      push: getCounts("push"),
      pull: getCounts("pull"),
      core: getCounts("core"),
      skills: getCounts("skills"),
      elite: getCounts("elite"),
    };
  }, [skills]);

  const learnedCount = skills.filter(s => s.learned).length;

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
    paths.sort((a, b) => {
      if (a.avg !== b.avg) return a.avg - b.avg;
      const order = ["legs", "push", "pull", "core"];
      return order.indexOf(a.path) - order.indexOf(b.path);
    });
    return paths[0];
  }, [legsAvg, pushAvg, pullAvg, coreAvg]);

  // Ongoing Target memo: find unlocked, unmastered exercise with the highest mastery percentage (closest to being mastered!)
  const ongoingTarget = useMemo(() => {
    const isUnlocked = (item: CatalogItem) => {
      if (item.name.includes("MASTER")) return false;
      
      // Locked books check
      if (item.path === "skills" && skillsLocked) return false;
      if (item.path === "elite" && eliteLocked) return false;

      const prereqs = item.prerequisites;
      if (!prereqs || (Array.isArray(prereqs) && prereqs.length === 0)) return true;
      if (Array.isArray(prereqs)) {
        return prereqs.every(isExerciseMastered);
      }
      if (prereqs.type === "and") {
        return prereqs.exercises.every(isExerciseMastered);
      }
      if (prereqs.type === "or") {
        return prereqs.exercises.some(isExerciseMastered);
      }
      return false;
    };

    const candidates = GUILD_CATALOG.filter(item => {
      const isM = isExerciseMastered(item.name);
      return !isM && isUnlocked(item);
    });

    if (candidates.length === 0) return null;

    const mapped = candidates.map(item => {
      const progress = skills.find(s => s.exercise_name === item.name);
      const mastery = progress ? progress.mastery_percent : 0;
      const targetReps = item.target_reps;
      const reps = Math.round((mastery / 100) * targetReps);
      const isHold = item.mastery_req.toLowerCase().includes("sec") || item.mastery_req.toLowerCase().includes("hold") || item.name.toLowerCase().includes("hold");
      return {
        item,
        mastery,
        reps,
        targetReps,
        isHold
      };
    });

    // Sort by mastery percentage descending (highest first)
    // If masteries are tied, sort deterministically by their order in GUILD_CATALOG (earliest first)
    mapped.sort((a, b) => {
      if (b.mastery !== a.mastery) {
        return b.mastery - a.mastery;
      }
      const idxA = GUILD_CATALOG.findIndex(x => x.name === a.item.name);
      const idxB = GUILD_CATALOG.findIndex(x => x.name === b.item.name);
      return idxA - idxB;
    });
    return mapped[0];
  }, [skills, skillsLocked, eliteLocked]);

  const ongoingTargetUnlocks = useMemo(() => {
    if (!ongoingTarget) return "Next Tier";
    const exerciseName = ongoingTarget.item.name;
    const unlocks = GUILD_CATALOG.filter(item => {
      const prereqs = item.prerequisites;
      if (!prereqs) return false;
      const list = Array.isArray(prereqs) ? prereqs : prereqs.exercises;
      return list.includes(exerciseName);
    }).map(x => x.name);
    return unlocks.length > 0 ? unlocks.join(", ") : "Next Tier";
  }, [ongoingTarget]);

  // Dynamic Recommendations based on unlocked, unmastered exercises
  const recommendedToday = useMemo(() => {
    const list: CatalogItem[] = [];
    const isExerciseUnlockedLocal = (exName: string) => {
      const item = GUILD_CATALOG.find(x => x.name === exName);
      if (!item) return false;
      
      // Locked books check
      if (item.path === "skills" && skillsLocked) return false;
      if (item.path === "elite" && eliteLocked) return false;

      const prereqs = item.prerequisites;
      if (!prereqs || (Array.isArray(prereqs) && prereqs.length === 0)) return true;
      if (Array.isArray(prereqs)) {
        return prereqs.every(isExerciseMastered);
      }
      if (prereqs.type === "and") {
        return prereqs.exercises.every(isExerciseMastered);
      }
      if (prereqs.type === "or") {
        return prereqs.exercises.some(isExerciseMastered);
      }
      return false;
    };

    for (const item of GUILD_CATALOG) {
      if (item.name.includes("MASTER")) continue;
      
      // Guard against locked books
      if (item.path === "skills" && skillsLocked) continue;
      if (item.path === "elite" && eliteLocked) continue;

      const isM = isExerciseMastered(item.name);
      if (!isM && isExerciseUnlockedLocal(item.name)) {
        list.push(item);
        if (list.length >= 3) break;
      }
    }

    return list;
  }, [skills, skillsLocked, eliteLocked]);

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
      if (Array.isArray(prereqs)) {
        return prereqs.every(isExerciseMastered);
      }
      if (prereqs.type === "and") {
        return prereqs.exercises.every(isExerciseMastered);
      }
      if (prereqs.type === "or") {
        return prereqs.exercises.some(isExerciseMastered);
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
            if (!isExerciseMastered(name)) {
              remainingPrereqs.push(name);
            }
          });
        }
        return {
          target: ex.name,
          remaining: remainingPrereqs.length > 0 ? "Master " + remainingPrereqs.join(", Master ") : "None"
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
    const masteredCount = bookSkills.filter(s => isExerciseMastered(s.exercise_name)).length;
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
    const mastered = skills.filter(s => isExerciseMastered(s.exercise_name));
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
    }
    if (totalCalisthenicsXp >= 500) {
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
        <div className="pt-2 flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface1 border border-border shadow-sm">
              <GuildMark size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary tracking-tight leading-none">Calisthenics Guild</h1>
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider mt-1.5">Athlete Operating System</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (ongoingTarget) {
                router.push(`/calisthenics?book=${ongoingTarget.item.path}&focus=${encodeURIComponent(ongoingTarget.item.name)}`);
              } else {
                router.push("/calisthenics");
              }
            }}
            className="btn btn-primary text-xs font-bold py-2 px-4 shadow-[0_0_15px_rgba(74,158,255,0.2)] rounded-xl"
          >
            <Zap size={14} className="fill-bg mr-1" />
            <span>Train</span>
          </button>
        </div>

        {/* Identity & Level */}
        <Card className="relative overflow-hidden bg-surface1">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] text-accent font-bold uppercase tracking-wider mb-1">Level {levelInfo.level}</p>
              <h2 className="text-xl font-bold text-primary tracking-tight">{levelInfo.title}</h2>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-muted uppercase font-bold tracking-wider mb-1">Total XP</span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-mono font-bold text-primary tabular-nums">{totalCalisthenicsXp.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">XP</span>
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-[9px] text-muted font-bold tracking-wider uppercase">XP Progress</span>
              <div className="flex items-baseline gap-1 text-[10px]">
                <span className="tabular-nums font-mono font-bold text-primary">{levelInfo.currentXp} / {levelInfo.nextLevelXp}</span>
                <span className="font-bold text-muted uppercase tracking-wider">XP</span>
              </div>
            </div>
            <ProgressBar value={levelInfo.progress} color="var(--accent)" height={4} />
          </div>
        </Card>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-4 gap-2.5">
          <button
            onClick={() => router.push("/calisthenics")}
            className="flex flex-col items-center justify-center py-3 bg-surface1 hover:bg-surface2 rounded-xl border border-border text-center transition-colors cursor-pointer"
          >
            <Book size={18} className="text-muted mb-1.5" />
            <span className="text-[9px] text-secondary font-bold uppercase tracking-wide">Skill Tree</span>
          </button>
          <button
            onClick={() => router.push("/weight")}
            className="flex flex-col items-center justify-center py-3 bg-surface1 hover:bg-surface2 rounded-xl border border-border text-center transition-colors cursor-pointer"
          >
            <Activity size={18} className="text-muted mb-1.5" />
            <span className="text-[9px] text-secondary font-bold uppercase tracking-wide">Log Weight</span>
          </button>
          <button
            onClick={() => router.push("/pr")}
            className="flex flex-col items-center justify-center py-3 bg-surface1 hover:bg-surface2 rounded-xl border border-border text-center transition-colors cursor-pointer"
          >
            <Trophy size={18} className="text-muted mb-1.5" />
            <span className="text-[9px] text-secondary font-bold uppercase tracking-wide">Log PR</span>
          </button>
          <button
            onClick={() => router.push("/measurements")}
            className="flex flex-col items-center justify-center py-3 bg-surface1 hover:bg-surface2 rounded-xl border border-border text-center transition-colors cursor-pointer"
          >
            <Target size={18} className="text-muted mb-1.5" />
            <span className="text-[9px] text-secondary font-bold uppercase tracking-wide">Measures</span>
          </button>
        </div>

        {/* Database Storage Usage Card */}
        <Card className="flex flex-col gap-3 relative overflow-hidden bg-surface1">
          <CardLabel>Database Storage</CardLabel>
          {dbLoading ? (
            <div className="flex flex-col gap-2 py-1 animate-pulse">
              <div className="flex justify-between items-baseline text-[10px]">
                <span className="text-muted font-bold tracking-wider uppercase">Retrieving usage...</span>
                <span className="font-mono text-muted tabular-nums">-- MB / -- MB</span>
              </div>
              <ProgressBar value={0} color="var(--accent)" height={4} />
            </div>
          ) : dbError || dbSizeMb === null ? (
            <div className="py-1 text-[10px] text-muted italic flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <span className="text-warning">!</span>
              <span>Metrics temporarily unavailable</span>
            </div>
          ) : (
            (() => {
              const usagePercent = Math.min(100, Math.max(0, (dbSizeMb / DB_QUOTA_MB) * 100));
              const progressColor = usagePercent > 80 ? "var(--warning)" : "var(--accent)";
              return (
                <div className="flex flex-col gap-2 py-0.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-bold text-primary tracking-wider uppercase">
                      {usagePercent.toFixed(2)}% Used
                    </span>
                    <div className="flex items-baseline gap-1 text-[10px]">
                      <span className="font-mono font-bold text-primary tabular-nums">{dbSizeMb.toFixed(2)}</span>
                      <span className="font-bold text-muted uppercase tracking-wider">MB</span>
                      <span className="text-muted mx-0.5">/</span>
                      <span className="font-mono font-bold text-primary tabular-nums">{DB_QUOTA_MB}</span>
                      <span className="font-bold text-muted uppercase tracking-wider">MB</span>
                    </div>
                  </div>
                  <ProgressBar value={usagePercent} color={progressColor} height={4} />
                </div>
              );
            })()
          )}
        </Card>

        {/* 1. Mastery Paths */}
        <Card className="flex flex-col gap-3">
          <CardLabel>Mastery Paths</CardLabel>
          
          {/* Legs */}
          <div className="flex flex-col gap-1.5 bg-surface1 px-4 py-3 border border-border rounded-xl hover:border-accent/40 transition-colors cursor-pointer" onClick={() => router.push("/calisthenics?book=legs")}>
            <div className="flex justify-between items-center">
              <span className="text-primary text-xs font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Leg Mastery
              </span>
              <span className="font-bold text-accent text-xs tabular-nums">{legsAvg}%</span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-muted">
              <span>{pathStats.legs.mastered} / {pathStats.legs.total} Mastered</span>
              <span className="flex items-center gap-0.5">Tap to Open <ChevronRight size={10} /></span>
            </div>
          </div>

          {/* Push */}
          <div className="flex flex-col gap-1.5 bg-surface1 px-4 py-3 border border-border rounded-xl hover:border-accent/40 transition-colors cursor-pointer" onClick={() => router.push("/calisthenics?book=push")}>
            <div className="flex justify-between items-center">
              <span className="text-primary text-xs font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Push Mastery
              </span>
              <span className="font-bold text-accent text-xs tabular-nums">{pushAvg}%</span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-muted">
              <span>{pathStats.push.mastered} / {pathStats.push.total} Mastered</span>
              <span className="flex items-center gap-0.5">Tap to Open <ChevronRight size={10} /></span>
            </div>
          </div>

          {/* Pull */}
          <div className="flex flex-col gap-1.5 bg-surface1 px-4 py-3 border border-border rounded-xl hover:border-accent/40 transition-colors cursor-pointer" onClick={() => router.push("/calisthenics?book=pull")}>
            <div className="flex justify-between items-center">
              <span className="text-primary text-xs font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Pull Mastery
              </span>
              <span className="font-bold text-accent text-xs tabular-nums">{pullAvg}%</span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-muted">
              <span>{pathStats.pull.mastered} / {pathStats.pull.total} Mastered</span>
              <span className="flex items-center gap-0.5">Tap to Open <ChevronRight size={10} /></span>
            </div>
          </div>

          {/* Core */}
          <div className="flex flex-col gap-1.5 bg-surface1 px-4 py-3 border border-border rounded-xl hover:border-accent/40 transition-colors cursor-pointer" onClick={() => router.push("/calisthenics?book=core")}>
            <div className="flex justify-between items-center">
              <span className="text-primary text-xs font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Core Mastery
              </span>
              <span className="font-bold text-accent text-xs tabular-nums">{coreAvg}%</span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-muted">
              <span>{pathStats.core.mastered} / {pathStats.core.total} Mastered</span>
              <span className="flex items-center gap-0.5">Tap to Open <ChevronRight size={10} /></span>
            </div>
          </div>

          {/* Skills */}
          <div className={skillsLocked ? "flex flex-col gap-1.5 bg-surface2/50 px-4 py-3 border border-border rounded-xl opacity-75" : "flex flex-col gap-1.5 bg-surface1 px-4 py-3 border border-border rounded-xl hover:border-accent/40 transition-colors cursor-pointer"} onClick={skillsLocked ? undefined : () => router.push("/calisthenics?book=skills")}>
            <div className="flex justify-between items-center">
              <span className={skillsLocked ? "text-muted text-xs font-bold flex items-center gap-2" : "text-primary text-xs font-bold flex items-center gap-2"}>
                {skillsLocked ? <Lock size={12} /> : <span className="w-1.5 h-1.5 rounded-full bg-accent" />} Skills & Balance
              </span>
              <span className={skillsLocked ? "text-muted italic text-xs font-medium" : "font-bold text-accent text-xs tabular-nums"}>
                {skillsLocked ? "Locked" : `${skillsAvg}%`}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-muted">
              {skillsLocked ? (
                <span>Complete Base Books (Avg &ge; 60%)</span>
              ) : (
                <>
                  <span>{pathStats.skills.mastered} / {pathStats.skills.total} Mastered</span>
                  <span className="flex items-center gap-0.5">Tap to Open <ChevronRight size={10} /></span>
                </>
              )}
            </div>
          </div>

          {/* Elite */}
          <div className={eliteLocked ? "flex flex-col gap-1.5 bg-surface2/50 px-4 py-3 border border-border rounded-xl opacity-75" : "flex flex-col gap-1.5 bg-surface1 px-4 py-3 border border-border rounded-xl hover:border-accent/40 transition-colors cursor-pointer"} onClick={eliteLocked ? undefined : () => router.push("/calisthenics?book=elite")}>
            <div className="flex justify-between items-center">
              <span className={eliteLocked ? "text-muted text-xs font-bold flex items-center gap-2" : "text-primary text-xs font-bold flex items-center gap-2"}>
                {eliteLocked ? <Lock size={12} /> : <span className="w-1.5 h-1.5 rounded-full bg-accent" />} Elite Skills
              </span>
              <span className={eliteLocked ? "text-muted italic text-xs font-medium" : "font-bold text-accent text-xs tabular-nums"}>
                {eliteLocked ? "Locked" : `${eliteAvg}%`}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-muted">
              {eliteLocked ? (
                <span>Complete all Master Books</span>
              ) : (
                <>
                  <span>{pathStats.elite.mastered} / {pathStats.elite.total} Mastered</span>
                  <span className="flex items-center gap-0.5">Tap to Open <ChevronRight size={10} /></span>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* 2. Ongoing Target Card */}
        {ongoingTarget ? (
          <Card 
            className="border-accent/40 bg-accent/5 hover:border-accent hover:bg-accent/10 transition-colors cursor-pointer"
            onClick={() => router.push(`/calisthenics?book=${ongoingTarget.item.path}&focus=${encodeURIComponent(ongoingTarget.item.name)}`)}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent tracking-wider uppercase flex items-center gap-2">
                <Target size={14} /> Ongoing Target
              </span>
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_rgba(74,158,255,0.8)]" />
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <div>
                <span className="text-[10px] text-muted uppercase block font-bold tracking-wider mb-1">Exercise</span>
                <span className="text-primary font-bold text-lg block tracking-tight">{ongoingTarget.item.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-1 bg-surface2/50 border border-border/50 p-3 rounded-xl">
                <div>
                  <span className="text-[9px] text-muted uppercase block font-bold tracking-wider mb-1">Current Progress</span>
                  <div className="flex items-baseline gap-1 text-[10px]">
                    <span className="text-primary font-mono font-bold text-sm tabular-nums">
                      {ongoingTarget.isHold 
                        ? `${ongoingTarget.reps} / ${ongoingTarget.targetReps}` 
                        : `3 × ${ongoingTarget.reps} / ${ongoingTarget.targetReps}`}
                    </span>
                    <span className="font-bold text-muted uppercase tracking-wider">{ongoingTarget.isHold ? 'sec' : ''}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] text-muted uppercase block font-bold tracking-wider mb-1">Remaining</span>
                  <div className="flex items-baseline gap-1 text-[10px]">
                    <span className="text-primary font-mono font-bold text-sm tabular-nums">
                      {ongoingTarget.targetReps - ongoingTarget.reps}
                    </span>
                    <span className="font-bold text-muted uppercase tracking-wider">
                      {ongoingTarget.isHold ? 'sec' : ongoingTarget.targetReps - ongoingTarget.reps === 1 ? 'rep' : 'reps'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="border-t border-border/50 pt-3 flex flex-col gap-1.5">
                <span className="text-[9px] text-muted uppercase font-bold tracking-wider">Reward</span>
                <p className="text-xs text-success font-semibold flex items-center gap-1.5">
                  <Check size={12} /> {ongoingTargetUnlocks}
                </p>
              </div>
              <div className="flex gap-4 items-center mt-1">
                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[9px] text-muted uppercase font-bold tracking-wider">Mastery Progress</span>
                    <span className="font-mono font-bold text-accent text-xs tabular-nums">{ongoingTarget.mastery}%</span>
                  </div>
                  <ProgressBar value={ongoingTarget.mastery} color="var(--accent)" height={4} />
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="border-success/40 bg-success/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-success tracking-wider uppercase flex items-center gap-2">
                <Target size={14} /> Ongoing Target
              </span>
              <span className="text-[10px] text-success font-bold uppercase tracking-wider">Completed</span>
            </div>
            <p className="text-xs text-muted mt-3 font-medium">All exercises in your tree have been fully mastered. Great job.</p>
          </Card>
        )}

        {/* 3. Active Targets Card */}
        {((activeTargets && activeTargets.length > 0) || weightTarget) && (
          <Card className="bg-surface1">
            <CardLabel>Active Targets</CardLabel>
            <div className="flex flex-col gap-4 mt-4">
              {weightTarget && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-primary flex items-center gap-2">
                      <Activity size={14} className="text-muted" /> Weight Target
                    </span>
                    <div className="flex items-baseline gap-1 text-[10px]">
                      <span className="text-muted font-mono tabular-nums">{weightTarget.current} / {weightTarget.target}</span>
                      <span className="font-bold text-muted uppercase tracking-wider">{weightTarget.unit}</span>
                    </div>
                  </div>
                  <div className="w-full bg-surface3 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-accent h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, (weightTarget.current / weightTarget.target) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
              {activeTargets.map((tg) => {
                const percent = Math.min(100, Math.max(0, Math.round((tg.currentValue / tg.targetValue) * 100)));
                return (
                  <div key={tg.exercise} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-primary">{tg.exercise}</span>
                      <div className="flex items-baseline gap-1 text-[10px]">
                        <span className="text-muted font-mono tabular-nums">{tg.currentValue} / {tg.targetValue}</span>
                        <span className="font-bold text-muted uppercase tracking-wider">{tg.unit}</span>
                      </div>
                    </div>
                    <div className="w-full bg-surface3 h-1 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${tg.completed ? 'bg-success shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'bg-accent shadow-[0_0_8px_rgba(74,158,255,0.4)]'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* 5. Latest Milestone Card */}
        <Card className="border-surface3 bg-surface2">
          <CardLabel>Latest Milestone</CardLabel>
          <div className="mt-3 flex flex-col gap-4">
            {newestMastered ? (
              <div className="p-4 rounded-xl bg-surface1 border border-border">
                <span className="text-[9px] text-muted uppercase font-bold tracking-wider block mb-1">Newest Mastered</span>
                <h4 className="text-base font-bold text-primary tracking-tight">{newestMastered.name}</h4>
                <span className="text-[9px] text-muted uppercase font-bold tracking-wider block mt-4 mb-1">Next Exercise Unlocked</span>
                <span className="text-sm font-medium text-primary block">{newestMastered.unlocksText}</span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface1 border border-border">
                <span className="text-xs font-medium text-muted block">No skills mastered yet. Train to unlock your first milestone.</span>
              </div>
            )}
            <div className="flex flex-col gap-2 text-xs">
              <span className="text-[9px] text-muted uppercase font-bold mb-1 block tracking-wider">Recent Achievements</span>
              {recentAchievements.map((ach, i) => (
                <span key={i} className="text-primary font-medium flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
                  <Trophy size={14} className="text-accent" /> {ach}
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* 6. Lifetime Stats */}
        <Card>
          <CardLabel>Lifetime Stats</CardLabel>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[
              { label: "Learned", value: learnedCount },
              { label: "Mastered", value: masteredCount },
              { label: "Books Done", value: booksCompleted, suffix: "/ 6" },
              { label: "PR Records", value: totalSessions },
              { label: "Total XP", value: totalCalisthenicsXp.toLocaleString() },
              { label: "Athlete Score", value: athleteScore, color: "text-accent" },
              { label: "Rank", value: athleteGrade }
            ].map((stat, i) => (
              <div key={i} className="bg-surface2/50 p-3 rounded-xl border border-border/50 flex flex-col gap-1.5">
                <span className="text-muted text-[9px] uppercase font-bold tracking-wider">{stat.label}</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-base font-bold tabular-nums font-mono ${stat.color || 'text-primary'}`}>{stat.value}</span>
                  {stat.suffix && <span className="text-muted font-mono font-bold text-[10px]">{stat.suffix}</span>}
                </div>
              </div>
            ))}
            <div className="bg-surface2/50 p-3 rounded-xl border border-border/50 col-span-2 flex flex-col gap-1.5">
              <span className="text-muted text-[9px] uppercase font-bold tracking-wider">Titles</span>
              <div className="flex flex-col gap-2 mt-1">
                {masterTitles.length > 0 ? (
                  masterTitles.map((title, i) => (
                    <span key={i} className="text-xs font-bold text-primary flex items-center gap-2">
                      <Trophy size={14} className="text-muted" /> {title.replace('🏆 ', '')}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted font-medium italic">None yet</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* 7. Weakest Path & Recommendation */}
        <Card className="border-danger/30 bg-danger/5">
          <CardLabel className="text-danger">Weakest Path & Recommended Next Training</CardLabel>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-primary font-bold text-base tracking-tight">{weakestPathInfo.name}</span>
              <div className="flex items-baseline gap-0.5 bg-danger/10 px-2.5 py-1 rounded-lg">
                <span className="text-sm font-mono font-bold text-danger tabular-nums">{weakestPathInfo.avg}</span>
                <span className="text-[10px] font-bold text-danger/80">%</span>
              </div>
            </div>
            <div className="border-t border-danger/20 pt-4 mt-1 flex flex-col gap-3">
              <span className="text-[9px] text-danger/70 uppercase font-bold tracking-wider">Recommended Next Training</span>
              {recommendedToday.map((rec, i) => (
                <div key={rec.name || i} className="flex justify-between items-center text-xs py-1">
                  <span className="text-primary font-medium flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-danger/50" /> {rec.name}
                  </span>
                  <span className="text-muted font-mono text-[10px] font-medium">{rec.mastery_req}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 8. Overall Completion Progress */}
        <Card className="bg-surface1">
          <CardLabel>Overall Completion Progress</CardLabel>
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Total Guild Mastery</span>
              <div className="flex items-baseline gap-1 text-[10px]">
                <span className="font-mono font-bold text-accent tabular-nums text-sm">{overallAverage}</span>
                <span className="font-bold text-accent/80 uppercase tracking-wider">%</span>
              </div>
            </div>
            <ProgressBar value={overallAverage} color="var(--accent)" height={6} />
            <div className="flex justify-between items-center text-[10px] text-muted mt-2 font-medium">
              <span>{totalExercises - masteredCount} exercises remaining</span>
              <span className="flex items-center gap-1"><Check size={12} className="text-success" /> {masteredCount} mastered</span>
            </div>
          </div>
        </Card>

        {/* 10. Cross-Book Master Tech Chain */}
        <Card className="bg-surface1">
          <CardLabel>Cross-Book Master Tech Chain</CardLabel>
          <div className="flex flex-col gap-2 mt-3">
            
            {/* Legs */}
            <div className="flex justify-between items-center text-xs bg-surface2/50 px-4 py-3 border border-border/50 rounded-xl hover:border-accent/40 transition-colors cursor-pointer" onClick={() => router.push("/calisthenics?book=legs")}>
              <span className="text-primary font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" /> Leg Master
              </span>
              {renderTechStatus("legs", legsAvg, false)}
            </div>

            {/* Push */}
            <div className="flex justify-between items-center text-xs bg-surface2/50 px-4 py-3 border border-border/50 rounded-xl hover:border-accent/40 transition-colors cursor-pointer" onClick={() => router.push("/calisthenics?book=push")}>
              <span className="text-primary font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" /> Push Master
              </span>
              {renderTechStatus("push", pushAvg, false)}
            </div>

            {/* Pull */}
            <div className="flex justify-between items-center text-xs bg-surface2/50 px-4 py-3 border border-border/50 rounded-xl hover:border-accent/40 transition-colors cursor-pointer" onClick={() => router.push("/calisthenics?book=pull")}>
              <span className="text-primary font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" /> Pull Master
              </span>
              {renderTechStatus("pull", pullAvg, false)}
            </div>

            {/* Core */}
            <div className="flex justify-between items-center text-xs bg-surface2/50 px-4 py-3 border border-border/50 rounded-xl hover:border-accent/40 transition-colors cursor-pointer" onClick={() => router.push("/calisthenics?book=core")}>
              <span className="text-primary font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" /> Core Master
              </span>
              {renderTechStatus("core", coreAvg, false)}
            </div>

            {/* Skills */}
            <div className={`flex justify-between items-center text-xs bg-surface2/50 px-4 py-3 border border-border/50 rounded-xl transition-colors ${skillsLocked ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent/40 cursor-pointer'}`} onClick={() => !skillsLocked && router.push("/calisthenics?book=skills")}>
              <span className="text-primary font-medium flex items-center gap-2">
                {skillsLocked ? <Lock size={12} className="text-muted" /> : <div className="w-1.5 h-1.5 rounded-full bg-accent" />} Skills Master
              </span>
              {renderTechStatus("skills", skillsAvg, skillsLocked)}
            </div>

            {/* Elite */}
            <div className={`flex justify-between items-center text-xs bg-surface2/50 px-4 py-3 border border-border/50 rounded-xl transition-colors ${eliteLocked ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent/40 cursor-pointer'}`} onClick={() => !eliteLocked && router.push("/calisthenics?book=elite")}>
              <span className="text-primary font-medium flex items-center gap-2">
                {eliteLocked ? <Lock size={12} className="text-muted" /> : <div className="w-1.5 h-1.5 rounded-full bg-accent" />} Elite Master
              </span>
              {renderTechStatus("elite", eliteAvg, eliteLocked)}
            </div>

          </div>
        </Card>

      </div>
      <NavBar />
    </div>
  );
}
