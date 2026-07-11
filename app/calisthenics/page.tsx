"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { NavBar } from "@/components/ui/NavBar";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  GUILD_CATALOG,
  LEG_PATHS,
  PUSH_PATHS,
  PULL_PATHS,
  CORE_PATHS,
  SKILLS_PATHS,
  ELITE_PATHS,
  getXpForDifficulty,
  getCalisthenicsLevelInfo,
  skillsLocked as isSkillsLockedFunc,
  eliteLocked as isEliteLockedFunc,
  CatalogItem,
  PrereqRule,
  isExerciseMastered as isExerciseMasteredCentral,
  calculateTotalXp,
  CalisthenicsProgress
} from "@/lib/calisthenicsConfig";

export default function AsvandCalisthenicsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [asvandId, setAsvandId] = useState<string | null>(null);

  // States
  const [skills, setSkills] = useState<CalisthenicsProgress[]>([]);
  const [activeBook, setActiveBook] = useState<"legs" | "push" | "pull" | "core" | "skills" | "elite" | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  const loadData = async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from("calisthenics_progress")
        .select("*")
        .eq("profile_id", profileId);

      if (error) throw error;

      if (data) {
        setSkills(data.map(s => ({
          id: s.id,
          exercise_name: s.exercise_name,
          path: s.path,
          mastery_percent: s.mastery_percent || 0,
          learned: s.learned || false,
          correct_form: s.correct_form || false,
          reps: s.reps || 0,
          target_reps: s.target_reps || 20,
          sessions_hit: s.sessions_hit || 0,
          x3_completed: s.x3_completed || false,
          best_performance_date: s.best_performance_date || null
        })));
      }
    } catch (err) {
      console.error("Error loading calisthenics data:", err);
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
          setAsvandId(profileData.id);
          await loadData(profileData.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Handle focus query parameter scroll/highlight
  useEffect(() => {
    if (loading || !asvandId) return;
    const params = new URLSearchParams(window.location.search);
    const bookParam = params.get("book");
    const focusParam = params.get("focus");

    if (bookParam && activeBook !== bookParam) {
      if (bookParam === "skills" && skillsLocked) {
        // Keep activeBook null if locked
      } else if (bookParam === "elite" && eliteLocked) {
        // Keep activeBook null if locked
      } else {
        setActiveBook(bookParam as any);
      }
    }

    if (focusParam && activeBook === bookParam) {
      const timer = setTimeout(() => {
        const targetEl = document.getElementById(`exercise-card-${focusParam.replace(/\s+/g, "-")}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
          targetEl.classList.add("ring-2", "ring-accent", "ring-offset-2", "ring-offset-[#0d0d12]");
          setTimeout(() => {
            targetEl.classList.remove("ring-2", "ring-accent", "ring-offset-2", "ring-offset-[#0d0d12]");
          }, 3000);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, asvandId, activeBook]);

  // Compute total Calisthenics XP accumulated
  const totalCalisthenicsXp = useMemo(() => {
    return calculateTotalXp(skills);
  }, [skills]);

  const levelInfo = getCalisthenicsLevelInfo(totalCalisthenicsXp);

  // Path average calculations
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
  const skillsAvg = getPathAvg("skills");

  const eliteLocked = isEliteLockedFunc(baseFourAvg, skillsAvg);
  const eliteAvg = getPathAvg("elite");

  // Local wrapper around the centralized mastery checker
  const isExerciseMastered = (exName: string) => isExerciseMasteredCentral(exName, skills);

  // Helper to check if a prerequisite rule is met
  const isRuleMet = (rule: string[] | PrereqRule | undefined): boolean => {
    if (!rule) return true;
    if (Array.isArray(rule)) {
      return rule.every(exName => isExerciseMastered(exName));
    }
    if (rule.type === "and") {
      return rule.exercises.every(exName => isExerciseMastered(exName));
    }
    if (rule.type === "or") {
      return rule.exercises.some(exName => isExerciseMastered(exName));
    }
    return false;
  };

  // Helper to get prerequisites for an exercise, falling back to linear order if not explicitly defined
  const getPrerequisites = (item: CatalogItem): string[] | PrereqRule => {
    if (item.prerequisites !== undefined) {
      return item.prerequisites;
    }
    const pathList = GUILD_CATALOG.filter(x => x.path === item.path);
    const idx = pathList.findIndex(x => x.name === item.name);
    if (idx <= 0) return [];
    return [pathList[idx - 1].name];
  };

  const isExerciseUnlocked = (exName: string, path?: string) => {
    if (exName === "LEG MASTER") {
      return Object.keys(LEG_PATHS).every(pathKey => isPathComplete(pathKey, "legs"));
    }
    if (exName === "PUSH MASTER") {
      return Object.keys(PUSH_PATHS).every(pathKey => isPathComplete(pathKey, "push"));
    }
    if (exName === "PULL MASTER") {
      return Object.keys(PULL_PATHS).every(pathKey => isPathComplete(pathKey, "pull"));
    }
    if (exName === "CORE MASTER") {
      return Object.keys(CORE_PATHS).every(pathKey => isPathComplete(pathKey, "core"));
    }
    if (exName === "SKILLS MASTER") {
      return Object.keys(SKILLS_PATHS).every(pathKey => isPathComplete(pathKey, "skills"));
    }
    if (exName === "ELITE MASTER") {
      return Object.keys(ELITE_PATHS).every(pathKey => isPathComplete(pathKey, "elite"));
    }
    const item = GUILD_CATALOG.find(x => x.name === exName);
    if (!item) return false;
    
    const prereqs = getPrerequisites(item);
    return isRuleMet(prereqs);
  };

  // Helper to get all exercises unlocked by a given exercise
  const getUnlocksForExercise = (exName: string) => {
    return GUILD_CATALOG.filter(item => {
      const prereqs = getPrerequisites(item);
      if (Array.isArray(prereqs)) {
        return prereqs.includes(exName);
      }
      return prereqs.exercises.includes(exName);
    });
  };

  // Helper to check if a specific progression branch is fully completed
  const isPathComplete = (pathName: string, book: "legs" | "push" | "pull" | "core" | "skills" | "elite") => {
    if (book === "legs") {
      const p = pathName as keyof typeof LEG_PATHS;
      return LEG_PATHS[p]?.every(isExerciseMastered) || false;
    } else if (book === "push") {
      const p = pathName as keyof typeof PUSH_PATHS;
      return PUSH_PATHS[p]?.every(isExerciseMastered) || false;
    } else if (book === "pull") {
      const p = pathName as keyof typeof PULL_PATHS;
      return PULL_PATHS[p]?.every(isExerciseMastered) || false;
    } else if (book === "core") {
      const p = pathName as keyof typeof CORE_PATHS;
      return CORE_PATHS[p]?.every(isExerciseMastered) || false;
    } else if (book === "skills") {
      const p = pathName as keyof typeof SKILLS_PATHS;
      return SKILLS_PATHS[p]?.every(isExerciseMastered) || false;
    } else {
      const p = pathName as keyof typeof ELITE_PATHS;
      return ELITE_PATHS[p]?.every(isExerciseMastered) || false;
    }
  };

  // Save inline PR / Log Performance
  const handleSaveInlinePr = async (
    exerciseName: string, 
    value: number, 
    isX3Click: boolean = false,
    sets: number = 3,
    weight: number | null = null,
    notes: string = ""
  ) => {
    if (!asvandId || isLogging) return;

    setIsLogging(true);
    try {
      const currentSkill = skills.find(s => s.exercise_name === exerciseName);
      const catalogItem = GUILD_CATALOG.find(item => item.name === exerciseName);
      if (!catalogItem) return;

      const pathName = catalogItem.path;
      const masteryReps = catalogItem.target_reps;
      
      let unlockReps = 8;
      if (catalogItem.unlock_req) {
        if (catalogItem.unlock_req.includes("×")) {
          unlockReps = parseInt(catalogItem.unlock_req.split("×")[1].trim()) || 8;
        } else if (catalogItem.unlock_req.toLowerCase().includes("hold")) {
          const match = catalogItem.unlock_req.match(/\d+/);
          if (match) {
            unlockReps = parseInt(match[0]) || 8;
          }
        }
      } else {
        // Fallback for new Leg exercises: use a sensible portion of target reps (e.g. 40%)
        unlockReps = Math.ceil(masteryReps * 0.4) || 1;
      }

      const currentPrVal = currentSkill ? currentSkill.reps : 0;
      const todayStr = new Date().toISOString().split("T")[0];
      
      // Update best performance only if value >= currentPrVal
      if (value >= currentPrVal) {
        const learned = value > 0;
        const correctForm = value >= unlockReps;
        const calculatedMastery = Math.min(100, Math.round((value / masteryReps) * 100));
        const x3Completed = isX3Click || sets >= 3;

        if (currentSkill) {
          const { error } = await supabase
            .from("calisthenics_progress")
            .update({
              learned,
              correct_form: correctForm,
              reps: value,
              sessions_hit: value >= masteryReps ? 3 : 1,
              mastery_percent: calculatedMastery,
              x3_completed: x3Completed,
              best_performance_date: todayStr
            })
            .eq("profile_id", asvandId)
            .eq("exercise_name", exerciseName);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("calisthenics_progress")
            .insert({
              profile_id: asvandId,
              exercise_name: exerciseName,
              path: pathName,
              learned,
              correct_form: correctForm,
              reps: value,
              target_reps: masteryReps,
              sessions_hit: value >= masteryReps ? 3 : 1,
              mastery_percent: calculatedMastery,
              x3_completed: x3Completed,
              best_performance_date: todayStr
            });
          if (error) throw error;
        }
      }

      // ALWAYS log to training history (pr_logs)
      const details = [];
      details.push(`${sets} set${sets > 1 ? "s" : ""}`);
      if (weight !== null && !isNaN(weight)) {
        details.push(`@ ${weight} kg`);
      }
      const prefix = details.join(" ");
      const finalNotes = notes 
        ? `[${prefix}] ${notes}` 
        : `Logged performance: ${prefix}.`;

      await supabase
        .from("pr_logs")
        .insert({
          profile_id: asvandId,
          exercise: exerciseName,
          value: value,
          unit: catalogItem.mastery_req.toLowerCase().includes("s") || catalogItem.mastery_req.toLowerCase().includes("sec") ? "sec" : "reps",
          date: todayStr,
          notes: finalNotes
        });

      // Reload
      await loadData(asvandId);
    } catch (err) {
      console.error("Error logging performance:", err);
    } finally {
      setIsLogging(false);
    }
  };

  const bookOptions = [
    { key: "legs", name: "Leg Mastery", emoji: "📕", avg: legsAvg, locked: false },
    { key: "push", name: "Push Mastery", emoji: "📘", avg: pushAvg, locked: false },
    { key: "pull", name: "Pull Mastery", emoji: "📙", avg: pullAvg, locked: false },
    { key: "core", name: "Core Mastery", emoji: "📗", avg: coreAvg, locked: false },
    { key: "skills", name: "Skill & Balance", emoji: "📕", avg: skillsAvg, locked: skillsLocked },
    { key: "elite", name: "Elite Skills", emoji: "📘", avg: eliteAvg, locked: eliteLocked }
  ] as const;

  return (
    <div className="page pb-24" style={{ background: "radial-gradient(circle at top, #111322 0%, #0A0A0F 100%)" }}>
      <div className="page-content">
        
        {/* Navigation & Header */}
        <div className="flex items-center gap-3 mb-4 pt-2">
          <button
            onClick={() => {
              if (activeBook) {
                setActiveBook(null);
              } else {
                router.push("/");
              }
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#14141E] border border-border/30 text-white active:scale-95 transition-all hover:bg-[#1E1E2C] hover:border-border"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 className="text-xl font-black text-white tracking-wide uppercase">
            {activeBook ? bookOptions.find(b => b.key === activeBook)?.name : "Calisthenics Guild"}
          </h1>
        </div>

        {activeBook === null ? (
          // Main Books Selection Screen
          <div className="flex flex-col gap-4">
            
            {/* Dynamic Level & XP Progress Meter */}
            <Card className="relative overflow-hidden border-arctic/20 bg-[#101018]/90 backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-arctic/10 rounded-full blur-3xl" />
              <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 p-2">
                <div className="w-16 h-16 rounded-full border-4 border-dashed border-arctic/40 flex flex-col items-center justify-center bg-arctic/10 shadow-[0_0_15px_rgba(74,158,255,0.2)]">
                  <span className="text-[10px] text-secondary font-bold uppercase leading-none">Level</span>
                  <span className="text-2xl font-black text-white leading-none mt-1">{levelInfo.level}</span>
                </div>
                
                <div className="flex-1 w-full text-center sm:text-left">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-bold text-white tracking-wide uppercase">{levelInfo.title}</span>
                    <span className="text-xs font-mono font-bold text-arctic">
                      {levelInfo.currentXp.toLocaleString()} <span className="text-secondary">/</span> {levelInfo.nextLevelXp.toLocaleString()} XP
                    </span>
                  </div>
                  <div className="xp-bar h-2.5 bg-[#1B1B29] rounded-full overflow-hidden">
                    <div
                      className="xp-bar-fill h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${levelInfo.progress}%`,
                        background: `linear-gradient(90deg, rgba(74,158,255,0.6), rgba(74,158,255,1))`,
                        boxShadow: `0 0 10px rgba(74,158,255,0.5)`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookOptions.map((book) => (
                <button
                  key={book.key}
                  disabled={book.locked}
                  onClick={() => setActiveBook(book.key)}
                  className={`p-5 rounded-2xl border text-left flex flex-col gap-3 transition-all relative overflow-hidden ${
                    book.locked
                      ? "bg-surface1/20 border-border/10 text-secondary/35 cursor-not-allowed"
                      : "bg-[#10101C]/90 hover:bg-[#151526]/90 border-border/30 text-white hover:border-arctic/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer shadow-lg"
                  }`}
                >
                  {book.locked && (
                    <div className="absolute top-4 right-4 bg-surface2/80 p-1.5 rounded-lg border border-border/30 text-xs">
                      🔒 Locked
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{book.emoji}</span>
                    <div>
                      <h3 className="font-extrabold text-sm tracking-wide">{book.name}</h3>
                      <p className="text-[10px] text-secondary mt-0.5 font-bold uppercase">
                        {book.locked ? "Complete base path at 60%" : "Tap to open"}
                      </p>
                    </div>
                  </div>
                  {!book.locked && (
                    <div className="mt-2 w-full">
                      <div className="flex justify-between text-[10px] text-secondary mb-1">
                        <span>COMPLETION</span>
                        <span className="font-mono font-bold text-accent">{book.avg}%</span>
                      </div>
                      <ProgressBar value={book.avg} color="var(--accent)" height={4} />
                    </div>
                  )}
                </button>
              ))}
            </div>

          </div>
        ) : (
          // Book Detail View (List of Exercises in linear order)
          <div className="flex flex-col gap-4">
            
            {/* Book Progress Header */}
            {(() => {
              const bookObj = bookOptions.find(b => b.key === activeBook);
              const progressVal = bookObj ? bookObj.avg : 0;
              const pathExercises = GUILD_CATALOG.filter(item => item.path === activeBook);
              const totalCount = pathExercises.length;
              const masteredCount = pathExercises.filter(ex => isExerciseMastered(ex.name)).length;

              const titleMapping = {
                legs: "Leg Mastery Tree",
                push: "Push Mastery Tree",
                pull: "Pull Mastery Tree",
                core: "Core Mastery Tree",
                skills: "Skills Mastery Tree",
                elite: "Elite Mastery Tree"
              };
              const treeTitle = titleMapping[activeBook as keyof typeof titleMapping] || "Mastery Tree";

              return (
                <Card className="bg-surface1/40 border-border/20 py-4.5 px-5">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-extrabold text-white uppercase tracking-wider">{treeTitle}</span>
                    <span className="text-accent font-mono font-bold">{progressVal}% COMPLETE</span>
                  </div>
                  <div className="mb-2">
                    <ProgressBar value={progressVal} color="var(--accent)" height={6} />
                  </div>
                  <div className="text-[10px] text-secondary font-semibold font-mono">
                    {masteredCount} / {totalCount} Exercises Mastered
                  </div>
                </Card>
              );
            })()}

            {/* List of Exercises */}
            <div className="flex flex-col gap-3.5">
              {GUILD_CATALOG.filter(item => item.path === activeBook).map((ex) => {
                const exName = ex.name;
                const isUnlocked = isExerciseUnlocked(exName, activeBook);
                const skillProgress = skills.find(s => s.exercise_name === exName);
                const currentPrVal = skillProgress ? skillProgress.reps : null;

                const isDuration = ex.mastery_req.toLowerCase().includes("s") || ex.mastery_req.toLowerCase().includes("sec");
                const unit = isDuration ? "sec" : "reps";

                // Exercise type for logging interface
                const getExerciseType = (item: CatalogItem) => {
                  const req = item.mastery_req.toLowerCase();
                  if (req.includes("sec") || req.includes("hold") || req.endsWith("s")) {
                    return "duration";
                  }
                  if (req.includes("kg") || req.includes("weighted")) {
                    return "weighted_reps";
                  }
                  return "reps";
                };
                const exerciseType = getExerciseType(ex);

                return (
                  <div
                    key={exName}
                    id={`exercise-card-${exName.replace(/\s+/g, "-")}`}
                    className={`p-5 rounded-2xl border transition-all ${
                      isUnlocked 
                        ? "bg-surface1 border-border/40 text-white" 
                        : "bg-[#101018]/30 border-border/10 text-secondary/30 opacity-60"
                    }`}
                  >
                    <div className="flex flex-col gap-3">
                      {/* Title & Status */}
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-base tracking-wide">{exName}</h3>
                        {(() => {
                          if (!isUnlocked) {
                            return <span className="text-xs text-danger font-bold uppercase tracking-wider">🔒 Locked</span>;
                          }
                          const mastered = isExerciseMastered(exName);
                          if (mastered) {
                            return <span className="text-xs text-success font-bold uppercase tracking-wider">✅ Mastered</span>;
                          }
                          const masteryPercent = skillProgress?.mastery_percent || 0;
                          return (
                            <span className="text-xs text-accent font-bold uppercase tracking-wider">
                              ⚡ {masteryPercent}%
                            </span>
                          );
                        })()}
                      </div>

                      <div className="divider opacity-30 my-0.5" />

                      {isUnlocked && !isExerciseMastered(exName) && (
                        <div className="mb-1">
                          <ProgressBar value={skillProgress?.mastery_percent || 0} color="var(--accent)" height={4} />
                        </div>
                      )}

                      {!isUnlocked ? (
                        /* Locked Exercise Layout: Show Prerequisite Checklist */
                        <div className="mt-1">
                          <span className="text-[9px] text-secondary block uppercase font-bold tracking-wider mb-0.5">Requirements</span>
                          {exName === "LEG MASTER" || exName === "PUSH MASTER" || exName === "PULL MASTER" || exName === "CORE MASTER" || exName === "SKILLS MASTER" || exName === "ELITE MASTER" ? (
                            <div className="flex flex-col gap-1.5 mt-2">
                              {Object.keys(
                                exName === "LEG MASTER" 
                                  ? LEG_PATHS 
                                  : exName === "PUSH MASTER" 
                                    ? PUSH_PATHS 
                                    : exName === "PULL MASTER"
                                      ? PULL_PATHS
                                      : exName === "CORE MASTER"
                                        ? CORE_PATHS
                                        : exName === "SKILLS MASTER"
                                          ? SKILLS_PATHS
                                          : ELITE_PATHS
                              ).map(pathKey => {
                                const complete = isPathComplete(
                                  pathKey, 
                                  exName === "LEG MASTER" 
                                    ? "legs" 
                                    : exName === "PUSH MASTER" 
                                      ? "push" 
                                      : exName === "PULL MASTER"
                                        ? "pull"
                                        : exName === "CORE MASTER"
                                          ? "core"
                                          : exName === "SKILLS MASTER"
                                            ? "skills"
                                            : "elite"
                                );
                                return (
                                  <div key={pathKey} className="flex items-center gap-2 text-xs">
                                    <span>{complete ? "✅" : "⬜"}</span>
                                    <span className={complete ? "text-white font-medium line-through decoration-success/40" : "text-secondary/50"}>
                                      {pathKey} Tree
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            (() => {
                              const prereqRules = getPrerequisites(ex);
                              const list = Array.isArray(prereqRules) ? prereqRules : prereqRules.exercises;
                              const totalReqs = list.length;
                              const completedCount = list.filter(prereqName => isExerciseMastered(prereqName)).length;
                              const remaining = totalReqs - completedCount;
                              const isOrRelation = !Array.isArray(prereqRules) && prereqRules.type === "or";
                              
                              return (
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] text-secondary/70 block mb-1 font-mono">
                                    {remaining} {remaining === 1 ? "requirement" : "requirements"} remaining
                                  </span>
                                  {isOrRelation && (
                                    <span className="text-[10px] text-secondary/70 italic block mb-1">
                                      Complete any one of the following:
                                    </span>
                                  )}
                                  {list.map(prereqName => {
                                    const mastered = isExerciseMastered(prereqName);
                                    return (
                                      <div key={prereqName} className="flex items-center gap-2 text-xs">
                                        <span>{mastered ? "✅" : "⬜"}</span>
                                        <span className={mastered ? "text-white font-medium line-through decoration-success/40" : "text-secondary/50"}>
                                          {prereqName}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()
                          )}
                        </div>
                      ) : (
                        /* Unlocked Exercise Layout */
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            {/* Mastery Requirement */}
                            <div>
                              <span className="text-[9px] text-secondary block uppercase font-bold tracking-wider">Mastery Requirement</span>
                              <span className="text-xs font-bold text-white">
                                {exName === "LEG MASTER" || exName === "PUSH MASTER" || exName === "PULL MASTER" || exName === "CORE MASTER" || exName === "SKILLS MASTER" || exName === "ELITE MASTER"
                                  ? `Complete all ${
                                      exName === "LEG MASTER" 
                                        ? "Leg" 
                                        : exName === "PUSH MASTER" 
                                          ? "Push" 
                                          : exName === "PULL MASTER" 
                                            ? "Pull" 
                                            : exName === "CORE MASTER"
                                              ? "Core"
                                              : exName === "SKILLS MASTER"
                                                ? "Skills"
                                                : "Elite"
                                    } Mastery paths` 
                                  : ex.mastery_req}
                              </span>
                            </div>

                            {/* Best Performance */}
                            <div>
                              <span className="text-[9px] text-secondary block uppercase font-bold tracking-wider">Best Performance</span>
                              <span className="text-xs font-bold text-accent block">
                                {currentPrVal !== null 
                                  ? (skillProgress?.x3_completed ? `3 × ${currentPrVal} ${unit}` : `1 × ${currentPrVal} ${unit}`) 
                                  : "—"}
                              </span>
                              {skillProgress?.best_performance_date && (
                                <span className="text-[9px] text-secondary/50 block font-mono mt-0.5">
                                  {(() => {
                                    try {
                                      return new Date(skillProgress.best_performance_date).toLocaleDateString("en-US", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric"
                                      });
                                    } catch (e) {
                                      return "";
                                    }
                                  })()}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Successors Display */}
                          {exName !== "LEG MASTER" ? (
                            (() => {
                              const unlocksList = getUnlocksForExercise(exName);
                              const directUnlocks = unlocksList.filter(item => {
                                const prereqs = getPrerequisites(item);
                                return Array.isArray(prereqs) ? prereqs.length === 1 : prereqs.exercises.length === 1;
                              });
                              const contributesTo = unlocksList.filter(item => {
                                const prereqs = getPrerequisites(item);
                                return Array.isArray(prereqs) ? prereqs.length > 1 : prereqs.exercises.length > 1;
                              });

                              if (directUnlocks.length === 0 && contributesTo.length === 0) return null;

                              return (
                                <div className="grid grid-cols-2 gap-4">
                                  {/* Direct Unlocks */}
                                  {directUnlocks.length > 0 && (
                                    <div>
                                      <span className="text-[9px] text-secondary block uppercase font-bold tracking-wider">Unlocks</span>
                                      <div className="mt-1 flex flex-col gap-1">
                                        {directUnlocks.map(unlockEx => {
                                          const isUnlockExUnlocked = isExerciseUnlocked(unlockEx.name);
                                          return (
                                            <div key={unlockEx.name} className="flex items-center gap-1.5 text-xs">
                                              <span className={isUnlockExUnlocked ? "text-success font-bold" : "text-secondary/30"}>
                                                {isUnlockExUnlocked ? "✓" : "•"}
                                              </span>
                                              <button
                                                onClick={() => {
                                                  const targetEl = document.getElementById(`exercise-card-${unlockEx.name.replace(/\s+/g, "-")}`);
                                                  if (targetEl) {
                                                    targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
                                                    targetEl.classList.add("ring-2", "ring-accent", "ring-offset-2", "ring-offset-[#0d0d12]");
                                                    setTimeout(() => {
                                                      targetEl.classList.remove("ring-2", "ring-accent", "ring-offset-2", "ring-offset-[#0d0d12]");
                                                    }, 2000);
                                                  }
                                                }}
                                                className={`text-left font-medium hover:underline hover:cursor-pointer flex items-center gap-0.5 ${
                                                  isUnlockExUnlocked ? "text-accent" : "text-secondary/40"
                                                }`}
                                              >
                                                <span>{unlockEx.name}</span>
                                                <span className="text-[9px] opacity-80 font-bold">→</span>
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Contributes To */}
                                  {contributesTo.length > 0 && (
                                    <div>
                                      <span className="text-[9px] text-secondary block uppercase font-bold tracking-wider">Contributes To</span>
                                      <div className="mt-1 flex flex-col gap-1">
                                        {contributesTo.map(unlockEx => {
                                          const isUnlockExUnlocked = isExerciseUnlocked(unlockEx.name);
                                          return (
                                            <div key={unlockEx.name} className="flex items-center gap-1.5 text-xs">
                                              <span className={isUnlockExUnlocked ? "text-success font-bold" : "text-secondary/30"}>
                                                {isUnlockExUnlocked ? "✓" : "•"}
                                              </span>
                                              <button
                                                onClick={() => {
                                                  const targetEl = document.getElementById(`exercise-card-${unlockEx.name.replace(/\s+/g, "-")}`);
                                                  if (targetEl) {
                                                    targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
                                                    targetEl.classList.add("ring-2", "ring-accent", "ring-offset-2", "ring-offset-[#0d0d12]");
                                                    setTimeout(() => {
                                                      targetEl.classList.remove("ring-2", "ring-accent", "ring-offset-2", "ring-offset-[#0d0d12]");
                                                    }, 2000);
                                                  }
                                                }}
                                                className={`text-left font-medium hover:underline hover:cursor-pointer flex items-center gap-0.5 ${
                                                  isUnlockExUnlocked ? "text-accent" : "text-secondary/40"
                                                }`}
                                              >
                                                <span>{unlockEx.name}</span>
                                                <span className="text-[9px] opacity-80 font-bold">→</span>
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()
                          ) : (
                            /* MASTER Special Display */
                            <div className="flex flex-col gap-2.5">
                              <div>
                                <span className="text-[9px] text-secondary block uppercase font-bold tracking-wider">Prerequisite Branches</span>
                                <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
                                  {Object.keys(
                                    exName === "LEG MASTER" 
                                      ? LEG_PATHS 
                                      : exName === "PUSH MASTER" 
                                        ? PUSH_PATHS 
                                        : exName === "PULL MASTER"
                                          ? PULL_PATHS
                                          : exName === "CORE MASTER"
                                            ? CORE_PATHS
                                            : exName === "SKILLS MASTER"
                                              ? SKILLS_PATHS
                                              : ELITE_PATHS
                                  ).map(pathKey => {
                                    const complete = isPathComplete(
                                      pathKey, 
                                      exName === "LEG MASTER" 
                                        ? "legs" 
                                        : exName === "PUSH MASTER" 
                                          ? "push" 
                                          : exName === "PULL MASTER"
                                            ? "pull"
                                            : exName === "CORE MASTER"
                                              ? "core"
                                              : exName === "SKILLS MASTER"
                                                ? "skills"
                                                : "elite"
                                    );
                                    return (
                                      <div key={pathKey} className="flex items-center gap-1 text-xs">
                                        <span className={complete ? "text-success font-bold" : "text-secondary/30"}>
                                          {complete ? "✓" : "•"}
                                        </span>
                                        <span className={complete ? "text-white font-medium" : "text-secondary/40"}>
                                          {pathKey} Tree
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              <div className="mt-1.5 p-3 rounded-xl bg-accent/5 border border-accent/20">
                                <span className="text-[9px] text-accent block uppercase font-bold tracking-wider">Reward</span>
                                <div className="mt-1 flex flex-col gap-1 text-xs text-white/95 font-medium">
                                  <span>🏆 {exName === "LEG MASTER" ? "Leg Master" : exName === "PUSH MASTER" ? "Push Master" : exName === "PULL MASTER" ? "Pull Master" : exName === "CORE MASTER" ? "Core Master" : exName === "SKILLS MASTER" ? "Skills Master" : "Elite Master"} Title</span>
                                  <span>⚡ +500 XP</span>
                                  <span>📚 Book Complete</span>
                                  <span>📜 Certificate Unlocked</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Log Training Input Container */}
                          <div className="mt-3 bg-[#13131c] p-3.5 rounded-xl border border-border/20 flex flex-col gap-2.5">
                            <span className="text-[9px] text-accent block uppercase font-bold tracking-wider">Log Training</span>
                            
                            <div className="grid grid-cols-3 gap-2">
                              {/* Sets Input */}
                              <div>
                                <label className="text-[8px] text-secondary block uppercase font-semibold mb-0.5">Sets</label>
                                <input
                                  type="number"
                                  placeholder="Sets"
                                  defaultValue="3"
                                  id={`input-sets-${exName}`}
                                  className="w-full bg-[#181825] py-1 px-1.5 border border-border/30 rounded-lg text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-accent"
                                />
                              </div>

                              {/* Primary Input (Reps or Seconds) */}
                              {exerciseType === "duration" ? (
                                <div>
                                  <label className="text-[8px] text-secondary block uppercase font-semibold mb-0.5">Seconds</label>
                                  <input
                                    type="number"
                                    placeholder="Sec"
                                    defaultValue=""
                                    id={`input-value-${exName}`}
                                    className="w-full bg-[#181825] py-1 px-1.5 border border-border/30 rounded-lg text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-accent"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <label className="text-[8px] text-secondary block uppercase font-semibold mb-0.5">Reps</label>
                                  <input
                                    type="number"
                                    placeholder="Reps"
                                    defaultValue=""
                                    id={`input-value-${exName}`}
                                    className="w-full bg-[#181825] py-1 px-1.5 border border-border/30 rounded-lg text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-accent"
                                  />
                                </div>
                              )}

                              {/* Secondary Input (Weight) */}
                              {exerciseType === "weighted_reps" && (
                                <div>
                                  <label className="text-[8px] text-secondary block uppercase font-semibold mb-0.5">Weight (kg)</label>
                                  <input
                                    type="number"
                                    placeholder="Weight"
                                    defaultValue=""
                                    id={`input-weight-${exName}`}
                                    className="w-full bg-[#181825] py-1 px-1.5 border border-border/30 rounded-lg text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-accent"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Notes Input */}
                            <div>
                              <input
                                type="text"
                                placeholder="Add training notes (optional)"
                                defaultValue=""
                                id={`input-notes-${exName}`}
                                className="w-full bg-[#181825] py-1.5 px-2.5 border border-border/30 rounded-lg text-xs text-white focus:outline-none focus:border-accent"
                              />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-1.5 mt-0.5">
                              <button
                                onClick={async () => {
                                  const inputValEl = document.getElementById(`input-value-${exName}`) as HTMLInputElement;
                                  const inputSetsEl = document.getElementById(`input-sets-${exName}`) as HTMLInputElement;
                                  const inputWeightEl = document.getElementById(`input-weight-${exName}`) as HTMLInputElement;
                                  const inputNotesEl = document.getElementById(`input-notes-${exName}`) as HTMLInputElement;
                                  
                                  if (inputValEl) {
                                    const val = parseInt(inputValEl.value);
                                    if (!isNaN(val) && val >= 0) {
                                      const sets = parseInt(inputSetsEl?.value) || 1;
                                      const weight = inputWeightEl ? parseFloat(inputWeightEl.value) : null;
                                      const userNotes = inputNotesEl?.value || "";
                                      
                                      await handleSaveInlinePr(exName, val, sets >= 3, sets, weight, userNotes);
                                      
                                      inputValEl.value = "";
                                      if (inputNotesEl) inputNotesEl.value = "";
                                      if (inputWeightEl) inputWeightEl.value = "";
                                    }
                                  }
                                }}
                                className="px-4 py-1.5 text-xs font-bold text-[#000] bg-accent rounded-lg hover:filter hover:brightness-110 active:scale-95 transition-all"
                              >
                                Record
                              </button>
                              
                              <button
                                onClick={async () => {
                                  const inputValEl = document.getElementById(`input-value-${exName}`) as HTMLInputElement;
                                  const inputNotesEl = document.getElementById(`input-notes-${exName}`) as HTMLInputElement;
                                  const inputWeightEl = document.getElementById(`input-weight-${exName}`) as HTMLInputElement;
                                  
                                  if (inputValEl) {
                                    const val = parseInt(inputValEl.value);
                                    if (!isNaN(val) && val >= 0) {
                                      const weight = inputWeightEl ? parseFloat(inputWeightEl.value) : null;
                                      const userNotes = inputNotesEl?.value || "";
                                      
                                      await handleSaveInlinePr(exName, val, true, 3, weight, userNotes);
                                      
                                      inputValEl.value = "";
                                      if (inputNotesEl) inputNotesEl.value = "";
                                      if (inputWeightEl) inputWeightEl.value = "";
                                    }
                                  }
                                }}
                                className="px-4 py-1.5 text-xs font-bold text-[#000] bg-success rounded-lg hover:filter hover:brightness-110 active:scale-95 transition-all"
                                title="Log 3 sets at this value"
                              >
                                x3
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>
      <NavBar />
    </div>
  );
}
