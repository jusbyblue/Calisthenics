"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { NavBar } from "@/components/ui/NavBar";
import { Card, CardInner, CardLabel } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ChevronLeft, ChevronRight, Lock, Book, Zap, Target, Trophy, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
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
  CalisthenicsProgress,
  getExerciseUnit,
  CALISTHENICS_PR_MAP
} from "@/lib/calisthenicsConfig";
import { ASVAND_PROFILE_ID } from "@/lib/appConfig";
import { getLocalDateString } from "@/lib/dateUtils";

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
    setAsvandId(ASVAND_PROFILE_ID);
    loadData(ASVAND_PROFILE_ID);
  }, []);

  // Handle focus query parameter scroll/highlight
  useEffect(() => {
    if (loading || !asvandId) return;
    const params = new URLSearchParams(window.location.search);
    const bookParam = params.get("book");
    const focusParam = params.get("focus");

    const VALID_BOOKS = ["legs", "push", "pull", "core", "skills", "elite"];
    if (bookParam && VALID_BOOKS.includes(bookParam) && activeBook !== bookParam) {
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
      // Basic safety validations
      if (!Number.isFinite(value) || value <= 0) {
        alert("Performance value must be a valid positive number.");
        setIsLogging(false);
        return;
      }
      if (!Number.isInteger(sets) || sets < 1) {
        alert("Sets must be a positive integer.");
        setIsLogging(false);
        return;
      }
      if (weight !== null && (!Number.isFinite(weight) || weight < 0)) {
        alert("Weight must be a valid non-negative number.");
        setIsLogging(false);
        return;
      }

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
      const todayStr = getLocalDateString();
      
      const isNewX3 = (isX3Click || sets >= 3) && !currentSkill?.x3_completed;
      
      // Update progress if logging higher reps or completing 3 sets for the first time
      if (value >= currentPrVal || isNewX3) {
        const finalReps = Math.max(value, currentPrVal);
        const learned = true;
        const correctForm = finalReps >= unlockReps;
        const calculatedMastery = Math.min(100, Math.round((finalReps / masteryReps) * 100));
        const x3Completed = !!(currentSkill?.x3_completed || isX3Click || sets >= 3);

        if (currentSkill) {
          const { error } = await supabase
            .from("calisthenics_progress")
            .update({
              learned,
              correct_form: correctForm,
              reps: finalReps,
              sessions_hit: finalReps >= masteryReps ? 3 : 1,
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
              reps: finalReps,
              target_reps: masteryReps,
              sessions_hit: finalReps >= masteryReps ? 3 : 1,
              mastery_percent: calculatedMastery,
              x3_completed: x3Completed,
              best_performance_date: todayStr
            });
          if (error) throw error;
        }
      }

      // Sync to general PR Database only if the exercise is explicitly mapped
      const mappedPrExercise = CALISTHENICS_PR_MAP[exerciseName];
      if (mappedPrExercise) {
        const details = [];
        details.push(`${sets} set${sets > 1 ? "s" : ""}`);
        if (weight !== null && !isNaN(weight)) {
          details.push(`@ ${weight} kg`);
        }
        const prefix = details.join(" ");
        const finalNotes = notes 
          ? `[${prefix}] ${notes}` 
          : `Logged performance: ${prefix}.`;

        const { error } = await supabase
          .from("pr_logs")
          .insert({
            profile_id: asvandId,
            exercise: mappedPrExercise,
            value: value,
            unit: getExerciseUnit(catalogItem.mastery_req),
            date: todayStr,
            notes: finalNotes
          });
        if (error) throw error;
      }

      // Reload
      await loadData(asvandId);
    } catch (err: any) {
      console.error("Error logging performance:", err);
      alert(err.message || "Failed to save training log to database.");
    } finally {
      setIsLogging(false);
    }
  };

  const bookOptions = [
    { key: "legs", name: "Leg Mastery", avg: legsAvg, locked: false },
    { key: "push", name: "Push Mastery", avg: pushAvg, locked: false },
    { key: "pull", name: "Pull Mastery", avg: pullAvg, locked: false },
    { key: "core", name: "Core Mastery", avg: coreAvg, locked: false },
    { key: "skills", name: "Skill & Balance", avg: skillsAvg, locked: skillsLocked },
    { key: "elite", name: "Elite Skills", avg: eliteAvg, locked: eliteLocked }
  ] as const;

  return (
    <div className="page pb-24">
      <div className="page-content">
        
        {/* Navigation & Header */}
        <div className="flex items-center gap-3 mb-6 pt-2">
          <button
            onClick={() => {
              if (activeBook) {
                setActiveBook(null);
              } else {
                router.push("/");
              }
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface1 border border-border text-primary active:scale-95 transition-all hover:bg-surface2 cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-primary tracking-tight">
            {activeBook ? bookOptions.find(b => b.key === activeBook)?.name : "Calisthenics Guild"}
          </h1>
        </div>

        {activeBook === null ? (
          // Main Books Selection Screen
          <div className="flex flex-col gap-5">
            
            {/* Dynamic Level & XP Progress Meter */}
            <Card className="relative overflow-hidden bg-surface1">
              <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10 p-2">
                <div className="w-16 h-16 rounded-full border-2 border-accent/80 flex flex-col items-center justify-center bg-accent/5 shadow-[0_0_15px_rgba(74,158,255,0.15)]">
                  <span className="text-[9px] text-accent font-bold uppercase leading-none tracking-wider mb-1">Level</span>
                  <span className="text-2xl font-black text-primary leading-none tabular-nums">{levelInfo.level}</span>
                </div>
                
                <div className="flex-1 w-full text-center sm:text-left mt-1 sm:mt-0">
                  <div className="flex justify-between items-baseline mb-3">
                    <span className="text-sm font-bold text-primary tracking-wide">{levelInfo.title}</span>
                    <span className="text-xs font-mono font-bold text-accent">
                      <span className="tabular-nums">{levelInfo.currentXp.toLocaleString()}</span> <span className="text-muted font-sans font-medium px-1">/</span> <span className="tabular-nums">{levelInfo.nextLevelXp.toLocaleString()}</span> <span className="text-[10px] uppercase font-bold tracking-wider ml-1 text-accent/80">XP</span>
                    </span>
                  </div>
                  <ProgressBar value={levelInfo.progress} color="var(--accent)" height={6} />
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {bookOptions.map((book) => (
                <button
                  key={book.key}
                  disabled={book.locked}
                  onClick={() => setActiveBook(book.key)}
                  className={`p-5 rounded-2xl border text-left flex flex-col gap-4 transition-colors relative overflow-hidden ${
                    book.locked
                      ? "bg-surface2/50 border-border/50 text-muted cursor-not-allowed opacity-50"
                      : "bg-surface1 hover:bg-surface2 hover:border-accent/40 border-border text-primary cursor-pointer shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${book.locked ? 'bg-surface3 text-muted' : 'bg-accent/10 text-accent'}`}>
                       {book.locked ? <Lock size={18} /> : <Book size={18} />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-base tracking-tight flex items-center justify-between">
                        {book.name}
                        {!book.locked && <ChevronRight size={16} className="text-muted" />}
                      </h3>
                      <p className="text-[9px] text-muted mt-1 font-bold uppercase tracking-wider">
                        {book.locked ? "Complete base paths at 60%" : "Tap to train"}
                      </p>
                    </div>
                  </div>
                  {!book.locked && (
                    <div className="mt-1 w-full pt-4 border-t border-border/50">
                      <div className="flex justify-between text-[9px] text-muted mb-2 font-bold uppercase tracking-wider">
                        <span>Completion</span>
                        <span className="font-mono font-bold text-accent tabular-nums text-xs">{book.avg}%</span>
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
                <Card className="bg-surface1 border-border p-5">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <span className="text-[10px] text-muted font-bold tracking-wider uppercase block mb-1">Active Tree</span>
                      <span className="font-black text-xl text-primary tracking-tight">{treeTitle}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-accent font-mono font-bold text-2xl tabular-nums leading-none block">{progressVal}%</span>
                    </div>
                  </div>
                  <ProgressBar value={progressVal} color="var(--accent)" height={8} />
                  <div className="mt-3 flex justify-between items-center text-[10px] text-muted font-bold tracking-wider uppercase">
                    <span>{masteredCount} / {totalCount} Mastered</span>
                    <span className="text-accent">{progressVal === 100 ? "Complete" : "In Progress"}</span>
                  </div>
                </Card>
              );
            })()}

            {/* List of Exercises */}
            <div className="flex flex-col gap-4">
              {GUILD_CATALOG.filter(item => item.path === activeBook).map((ex) => {
                const exName = ex.name;
                const isUnlocked = isExerciseUnlocked(exName, activeBook);
                const skillProgress = skills.find(s => s.exercise_name === exName);
                const currentPrVal = skillProgress ? skillProgress.reps : null;

                const unit = getExerciseUnit(ex.mastery_req);

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
                    className={`p-6 rounded-2xl border transition-colors ${
                      isUnlocked 
                        ? "bg-surface1 border-border text-primary" 
                        : "bg-surface2/30 border-border/30 text-muted opacity-80"
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      {/* Title & Status */}
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-bold text-xl tracking-tight text-primary">{exName}</h3>
                        {(() => {
                          if (!isUnlocked) {
                            return (
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-surface2 rounded-lg border border-border/50">
                                <Lock size={12} className="text-muted" />
                                <span className="text-[9px] text-muted font-bold uppercase tracking-wider">Locked</span>
                              </div>
                            );
                          }
                          const mastered = isExerciseMastered(exName);
                          if (mastered) {
                            return (
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-success/10 rounded-lg border border-success/20">
                                <CheckCircle2 size={12} className="text-success" />
                                <span className="text-[9px] text-success font-bold uppercase tracking-wider">Mastered</span>
                              </div>
                            );
                          }
                          const masteryPercent = skillProgress?.mastery_percent || 0;
                          return (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/10 rounded-lg border border-accent/20">
                              <Zap size={12} className="text-accent" />
                              <span className="text-[10px] text-accent font-bold uppercase tracking-wider tabular-nums">{masteryPercent}%</span>
                            </div>
                          );
                        })()}
                      </div>

                      {isUnlocked && !isExerciseMastered(exName) && (
                        <div className="mb-2">
                          <ProgressBar value={skillProgress?.mastery_percent || 0} color="var(--accent)" height={4} />
                        </div>
                      )}

                      {!isUnlocked ? (
                        /* Locked Exercise Layout: Show Prerequisite Checklist */
                        <div className="mt-1 pt-4 border-t border-border/50">
                          <span className="text-[9px] text-muted block uppercase font-bold tracking-wider mb-3">Requirements</span>
                          {exName === "LEG MASTER" || exName === "PUSH MASTER" || exName === "PULL MASTER" || exName === "CORE MASTER" || exName === "SKILLS MASTER" || exName === "ELITE MASTER" ? (
                            <div className="flex flex-col gap-3">
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
                                  <div key={pathKey} className="flex items-center gap-3 text-xs">
                                    <span className={complete ? "text-success" : "text-muted"}>
                                      {complete ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-border" />}
                                    </span>
                                    <span className={complete ? "text-primary font-bold line-through decoration-success/40" : "text-muted font-medium"}>
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
                                  <div className="flex flex-col gap-3">
                                    <span className="text-[10px] text-muted block font-mono uppercase tracking-wider font-bold">
                                      {remaining} {remaining === 1 ? "requirement" : "requirements"} remaining
                                    </span>
                                    {isOrRelation && (
                                      <span className="text-[9px] text-accent font-bold uppercase tracking-wider block">
                                        Complete any one of the following:
                                      </span>
                                    )}
                                    {list.map(prereqName => {
                                      const mastered = isExerciseMastered(prereqName);
                                      return (
                                        <div key={prereqName} className="flex items-center gap-3 text-xs">
                                          <span className={mastered ? "text-success" : "text-muted"}>
                                            {mastered ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-border" />}
                                          </span>
                                          <span className={mastered ? "text-primary font-bold line-through decoration-success/40" : "text-muted font-medium"}>
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
                          <div className="grid grid-cols-2 gap-4 mt-2 pt-5 border-t border-border/50">
                            {/* Mastery Requirement */}
                            <div>
                              <span className="text-[9px] text-muted block uppercase font-bold tracking-wider mb-2">Requirement</span>
                              <span className="text-sm font-bold text-primary block leading-snug">
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
                                    } paths` 
                                  : ex.mastery_req}
                              </span>
                            </div>

                            {/* Best Performance */}
                            <div>
                              <span className="text-[9px] text-muted block uppercase font-bold tracking-wider mb-2">Best Performance</span>
                              <span className="text-sm font-bold text-accent block leading-snug">
                                {currentPrVal !== null 
                                  ? (skillProgress?.x3_completed ? `3 × ${currentPrVal} ${unit}` : `1 × ${currentPrVal} ${unit}`) 
                                  : "—"}
                              </span>
                              {skillProgress?.best_performance_date && (
                                <span className="text-[10px] text-muted font-bold block mt-1">
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                                  {/* Direct Unlocks */}
                                  {directUnlocks.length > 0 && (
                                    <div>
                                      <span className="text-[9px] text-muted block uppercase font-bold tracking-wider mb-2">Unlocks</span>
                                      <div className="flex flex-col gap-2">
                                        {directUnlocks.map(unlockEx => {
                                          const isUnlockExUnlocked = isExerciseUnlocked(unlockEx.name);
                                          return (
                                            <div key={unlockEx.name} className="flex items-center gap-2.5 text-xs">
                                              <span className={isUnlockExUnlocked ? "text-success" : "text-muted"}>
                                                {isUnlockExUnlocked ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-border" />}
                                              </span>
                                              <button
                                                onClick={() => {
                                                  const targetEl = document.getElementById(`exercise-card-${unlockEx.name.replace(/\s+/g, "-")}`);
                                                  if (targetEl) {
                                                    targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
                                                    targetEl.classList.add("ring-2", "ring-accent", "ring-offset-2", "ring-offset-[#0A0A0F]");
                                                    setTimeout(() => {
                                                      targetEl.classList.remove("ring-2", "ring-accent", "ring-offset-2", "ring-offset-[#0A0A0F]");
                                                    }, 2000);
                                                  }
                                                }}
                                                className={`text-left font-bold hover:underline hover:cursor-pointer flex items-center gap-1.5 transition-colors ${
                                                  isUnlockExUnlocked ? "text-accent" : "text-muted"
                                                }`}
                                              >
                                                <span>{unlockEx.name}</span>
                                                <ArrowRight size={12} className="opacity-80" />
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
                                      <span className="text-[9px] text-muted block uppercase font-bold tracking-wider mb-2">Builds To</span>
                                      <div className="flex flex-col gap-2">
                                        {contributesTo.map(unlockEx => {
                                          const isUnlockExUnlocked = isExerciseUnlocked(unlockEx.name);
                                          return (
                                            <div key={unlockEx.name} className="flex items-center gap-2.5 text-xs">
                                              <span className={isUnlockExUnlocked ? "text-success" : "text-muted"}>
                                                {isUnlockExUnlocked ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-border" />}
                                              </span>
                                              <button
                                                onClick={() => {
                                                  const targetEl = document.getElementById(`exercise-card-${unlockEx.name.replace(/\s+/g, "-")}`);
                                                  if (targetEl) {
                                                    targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
                                                    targetEl.classList.add("ring-2", "ring-accent", "ring-offset-2", "ring-offset-[#0A0A0F]");
                                                    setTimeout(() => {
                                                      targetEl.classList.remove("ring-2", "ring-accent", "ring-offset-2", "ring-offset-[#0A0A0F]");
                                                    }, 2000);
                                                  }
                                                }}
                                                className={`text-left font-bold hover:underline hover:cursor-pointer flex items-center gap-1.5 transition-colors ${
                                                  isUnlockExUnlocked ? "text-accent" : "text-muted"
                                                }`}
                                              >
                                                <span>{unlockEx.name}</span>
                                                <ArrowRight size={12} className="opacity-80" />
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
                            <div className="flex flex-col gap-4 mt-5 pt-5 border-t border-border/50">
                              <div>
                                <span className="text-[9px] text-muted block uppercase font-bold tracking-wider mb-3">Prerequisite Branches</span>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
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
                                      <div key={pathKey} className="flex items-center gap-3 text-sm">
                                        <span className={complete ? "text-success" : "text-muted"}>
                                          {complete ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-border" />}
                                        </span>
                                        <span className={complete ? "text-primary font-bold" : "text-muted font-medium"}>
                                          {pathKey} Tree
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              <div className="mt-3 p-4 rounded-2xl bg-surface2/50 border border-border/50">
                                <span className="text-[9px] text-accent block uppercase font-bold tracking-wider mb-3">Reward</span>
                                <div className="flex flex-col gap-2.5 text-sm text-primary font-bold">
                                  <span className="flex items-center gap-2"><Trophy size={16} className="text-accent" /> {exName === "LEG MASTER" ? "Leg Master" : exName === "PUSH MASTER" ? "Push Master" : exName === "PULL MASTER" ? "Pull Master" : exName === "CORE MASTER" ? "Core Master" : exName === "SKILLS MASTER" ? "Skills Master" : "Elite Master"} Title</span>
                                  <span className="flex items-center gap-2"><Zap size={16} className="text-accent" /> +500 XP</span>
                                  <span className="flex items-center gap-2"><Book size={16} className="text-accent" /> Book Complete</span>
                                  <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-accent" /> Certificate Unlocked</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Log Training Input Container */}
                          <div className="mt-5 bg-surface1 p-5 rounded-2xl border border-border flex flex-col gap-4 shadow-sm">
                            <span className="text-[10px] text-accent block uppercase font-bold tracking-wider">Log Training</span>
                            
                            <div className="grid grid-cols-3 gap-4">
                              {/* Sets Input */}
                              <div>
                                <label className="text-[9px] text-muted block uppercase font-bold tracking-wider mb-1.5">Sets</label>
                                <input
                                  type="number"
                                  placeholder="Sets"
                                  defaultValue="3"
                                  id={`input-sets-${exName}`}
                                  className="w-full bg-surface2 py-2 px-3 border border-border/50 rounded-xl text-sm text-primary text-center font-mono font-bold focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-muted/50"
                                />
                              </div>

                              {/* Primary Input (Reps or Seconds) */}
                              {exerciseType === "duration" ? (
                                <div>
                                  <label className="text-[9px] text-muted block uppercase font-bold tracking-wider mb-1.5">Seconds</label>
                                  <input
                                    type="number"
                                    placeholder="Sec"
                                    defaultValue=""
                                    id={`input-value-${exName}`}
                                    className="w-full bg-surface2 py-2 px-3 border border-border/50 rounded-xl text-sm text-primary text-center font-mono font-bold focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-muted/50"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <label className="text-[9px] text-muted block uppercase font-bold tracking-wider mb-1.5">Reps</label>
                                  <input
                                    type="number"
                                    placeholder="Reps"
                                    defaultValue=""
                                    id={`input-value-${exName}`}
                                    className="w-full bg-surface2 py-2 px-3 border border-border/50 rounded-xl text-sm text-primary text-center font-mono font-bold focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-muted/50"
                                  />
                                </div>
                              )}

                              {/* Secondary Input (Weight) */}
                              {exerciseType === "weighted_reps" && (
                                <div>
                                  <label className="text-[9px] text-muted block uppercase font-bold tracking-wider mb-1.5">Weight (kg)</label>
                                  <input
                                    type="number"
                                    placeholder="Weight"
                                    defaultValue=""
                                    id={`input-weight-${exName}`}
                                    className="w-full bg-surface2 py-2 px-3 border border-border/50 rounded-xl text-sm text-primary text-center font-mono font-bold focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-muted/50"
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
                                className="w-full bg-surface2 py-2.5 px-4 border border-border/50 rounded-xl text-sm text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-muted/50 font-medium"
                              />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 mt-2">
                              <button
                                disabled={isLogging}
                                onClick={async () => {
                                  const inputValEl = document.getElementById(`input-value-${exName}`) as HTMLInputElement;
                                  const inputSetsEl = document.getElementById(`input-sets-${exName}`) as HTMLInputElement;
                                  const inputWeightEl = document.getElementById(`input-weight-${exName}`) as HTMLInputElement;
                                  const inputNotesEl = document.getElementById(`input-notes-${exName}`) as HTMLInputElement;
                                  
                                  if (inputValEl) {
                                    const val = parseInt(inputValEl.value);
                                    if (isNaN(val) || val <= 0) {
                                      alert("Please enter a valid positive number for the performance value.");
                                      return;
                                    }
                                    const sets = parseInt(inputSetsEl?.value) || 1;
                                    if (isNaN(sets) || sets < 1) {
                                      alert("Sets must be a positive integer.");
                                      return;
                                    }
                                    const weightVal = inputWeightEl?.value;
                                    const weight = weightVal ? parseFloat(weightVal) : null;
                                    if (weight !== null && (isNaN(weight) || weight < 0)) {
                                      alert("Weight must be a non-negative number.");
                                      return;
                                    }
                                    const userNotes = inputNotesEl?.value || "";
                                    
                                    await handleSaveInlinePr(exName, val, sets >= 3, sets, weight, userNotes);
                                    
                                    inputValEl.value = "";
                                    if (inputNotesEl) inputNotesEl.value = "";
                                    if (inputWeightEl) inputWeightEl.value = "";
                                  }
                                }}
                                className={`px-6 py-2.5 text-[10px] font-bold tracking-wider uppercase bg-accent text-background rounded-xl transition-all ${
                                  isLogging ? "opacity-50 cursor-not-allowed" : "hover:bg-accent/90 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(74,158,255,0.2)]"
                                }`}
                              >
                                {isLogging ? "Logging..." : "Record"}
                              </button>
                              
                              <button
                                disabled={isLogging}
                                onClick={async () => {
                                  const inputValEl = document.getElementById(`input-value-${exName}`) as HTMLInputElement;
                                  const inputNotesEl = document.getElementById(`input-notes-${exName}`) as HTMLInputElement;
                                  const inputWeightEl = document.getElementById(`input-weight-${exName}`) as HTMLInputElement;
                                  
                                  if (inputValEl) {
                                    const val = parseInt(inputValEl.value);
                                    if (isNaN(val) || val <= 0) {
                                      alert("Please enter a valid positive number for the performance value.");
                                      return;
                                    }
                                    const weightVal = inputWeightEl?.value;
                                    const weight = weightVal ? parseFloat(weightVal) : null;
                                    if (weight !== null && (isNaN(weight) || weight < 0)) {
                                      alert("Weight must be a non-negative number.");
                                      return;
                                    }
                                    const userNotes = inputNotesEl?.value || "";
                                    
                                    await handleSaveInlinePr(exName, val, true, 3, weight, userNotes);
                                    
                                    inputValEl.value = "";
                                    if (inputNotesEl) inputNotesEl.value = "";
                                    if (inputWeightEl) inputWeightEl.value = "";
                                  }
                                }}
                                className={`px-6 py-2.5 text-[10px] font-bold tracking-wider uppercase bg-success text-background rounded-xl transition-all ${
                                  isLogging ? "opacity-50 cursor-not-allowed" : "hover:bg-success/90 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                }`}
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
