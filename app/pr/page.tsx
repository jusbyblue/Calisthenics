"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { NavBar } from "@/components/ui/NavBar";
import { Card, CardInner, CardLabel } from "@/components/ui/Card";
import { PR_CALISTHENICS_MAP, GUILD_CATALOG, getExerciseUnit } from "@/lib/calisthenicsConfig";
import { ChevronLeft, ChevronRight, PersonStanding, ArrowUpCircle, ArrowDownCircle, Footprints, Shield, HeartPulse, Target, X } from "lucide-react";
import { ASVAND_PROFILE_ID } from "@/lib/appConfig";
import { getLocalDateString } from "@/lib/dateUtils";

interface PRRecord {
  id: string;
  exercise: string;
  value: number;
  unit: string;
  date: string;
  notes: string | null;
}

interface MilestoneRecord {
  id: string;
  exercise: string;
  value: number;
  completed: boolean;
}

const CATEGORIES: Record<
  string,
  {
    icon: React.ElementType;
    subcategories?: Record<string, string[]>;
    exercises?: string[];
    defaultUnit: string;
  }
> = {
  "Bodyweight": {
    icon: PersonStanding,
    defaultUnit: "reps",
    exercises: [
      "Push-up", "Diamond Push-up", "Wide Push-up", "Archer Push-up", "Pseudo Planche Push-up",
      "Dips", "Pull-up", "Chin-up", "Neutral Grip Pull-up", "Wide Pull-up", "Commando Pull-up",
      "Australian Row", "Inverted Row", "Air Squat", "Jump Squat", "Bulgarian Split Squat",
      "Walking Lunge", "Cossack Squat", "Pistol Squat", "Plank", "Side Plank", "Hollow Hold",
      "Arch Hold", "L-Sit", "V-Sit", "Burpees", "Mountain Climbers", "Box Jump", "Broad Jump",
      "Wall Sit", "Dead Hang", "Wall Handstand Hold", "Crow Hold"
    ]
  },
  "Push": {
    icon: ArrowUpCircle,
    defaultUnit: "kg",
    subcategories: {
      "Chest": [
        "Barbell Bench Press", "Incline Barbell Bench Press", "Decline Barbell Bench Press",
        "Dumbbell Bench Press", "Incline Dumbbell Press", "Decline Dumbbell Press",
        "Machine Chest Press", "Machine Incline Press", "Machine Chest Fly", "Dip Machine",
        "Smith Machine Bench Press", "Cable Fly", "Low Cable Fly", "High Cable Fly",
        "Pec Deck Fly", "Push-up (Weighted)", "Dip (Weighted)"
      ],
      "Shoulders": [
        "Barbell Overhead Press", "Seated Barbell Press", "Dumbbell Shoulder Press", "Arnold Press",
        "Machine Shoulder Press", "Lateral Raise", "Cable Lateral Raise", "Machine Lateral Raise",
        "Front Raise", "Cable Front Raise", "Rear Delt Fly", "Reverse Pec Deck", "Face Pull", "Upright Row"
      ],
      "Triceps": [
        "Close Grip Bench Press", "Skull Crushers", "EZ Bar Skull Crushers", "Overhead Tricep Extension",
        "Cable Pushdown", "Rope Pushdown", "Single Arm Pushdown", "Machine Tricep Extension",
        "Bench Dips", "Weighted Dips"
      ]
    }
  },
  "Pull": {
    icon: ArrowDownCircle,
    defaultUnit: "kg",
    subcategories: {
      "Vertical Pull": [
        "Pull-up (Weighted)", "Chin-up (Weighted)", "Neutral Pull-up",
        "Lat Pulldown (Wide)", "Lat Pulldown (Close)", "Reverse Grip Pulldown", "Single Arm Lat Pulldown",
        "Cable Pullover", "Pull-over Machine"
      ],
      "Horizontal Pull": [
        "Barbell Row", "Pendlay Row", "T-Bar Row", "Seated Cable Row", "Chest Supported Row",
        "Machine Row", "Single Arm Dumbbell Row", "Meadows Row", "Inverted Row"
      ],
      "Deadlift Family": [
        "Conventional Deadlift", "Sumo Deadlift", "Romanian Deadlift (RDL)", "Stiff Leg Deadlift", "Rack Pull"
      ],
      "Biceps": [
        "Barbell Curl", "EZ Bar Curl", "Dumbbell Curl", "Hammer Curl", "Incline Dumbbell Curl",
        "Concentration Curl", "Preacher Curl", "Cable Curl", "Machine Curl", "Spider Curl"
      ],
      "Forearms": [
        "Reverse Curl", "Wrist Curl", "Reverse Wrist Curl", "Farmer Carry", "Plate Pinch Hold", "Finger Curl"
      ]
    }
  },
  "Legs": {
    icon: Footprints,
    defaultUnit: "kg",
    subcategories: {
      "Quads": [
        "Back Squat", "Front Squat", "Smith Squat", "Hack Squat", "Leg Press", "Bulgarian Split Squat",
        "Walking Lunge", "Reverse Lunge", "Step Up", "Goblet Squat", "Sissy Squat", "Split Squat"
      ],
      "Hamstrings": [
        "Romanian Deadlift", "Stiff Leg Deadlift", "Seated Leg Curl", "Lying Leg Curl", "Nordic Curl",
        "Glute Ham Raise", "Good Morning"
      ],
      "Glutes": [
        "Hip Thrust", "Barbell Hip Thrust", "Glute Bridge", "Cable Kickback", "Single Leg Hip Thrust", "Sumo Squat"
      ],
      "Calves": [
        "Standing Calf Raise", "Seated Calf Raise", "Leg Press Calf Raise", "Single Leg Calf Raise", "Donkey Calf Raise"
      ]
    }
  },
  "Core": {
    icon: Shield,
    defaultUnit: "sec",
    exercises: [
      "Plank", "Side Plank", "Reverse Plank", "Hollow Hold", "Arch Hold", "Dead Bug", "Bird Dog",
      "Russian Twist", "Leg Raise", "Hanging Knee Raise", "Hanging Leg Raise", "Toes to Bar",
      "Dragon Flag", "L-Sit", "V-Sit", "Ab Wheel Rollout", "Standing Ab Wheel", "Plank Walkout",
      "Pallof Press", "Cable Crunch", "Decline Sit-up"
    ]
  },
  "Cardio": {
    icon: HeartPulse,
    defaultUnit: "min",
    exercises: [
      "Running (1km)", "Running (5km)", "Running (10km)", "Sprint (100m)", "Sprint (200m)",
      "Cycling", "Rowing", "Assault Bike", "Stair Climber", "Swimming", "Jump Rope (Max)", "Burpees (1 min)", "Burpees (Max)"
    ]
  },
  "Skills": {
    icon: Target,
    defaultUnit: "sec",
    exercises: [
      "Handstand Hold", "One Arm Handstand", "Handstand Push-up", "Planche Lean", "Tuck Planche", "Advanced Tuck Planche",
      "Straddle Planche", "Full Planche", "Front Lever", "Back Lever", "Human Flag", "L-Sit", "V-Sit", "Muscle-up",
      "Bar Muscle-up", "Ring Muscle-up", "Iron Cross", "Victorian", "Manna", "One Arm Pull-up", "One Arm Push-up"
    ]
  }
};

export default function PRPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [asvandId, setAsvandId] = useState<string | null>(null);

  // Database Data States
  const [prRecords, setPrRecords] = useState<PRRecord[]>([]);
  const [milestones, setMilestones] = useState<MilestoneRecord[]>([]);
  const [weightLogs, setWeightLogs] = useState<{ date: string; weight_kg: number }[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Bodyweight");

  // Edit Panel States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTab, setEditTab] = useState<"pr" | "milestone">("pr");
  
  // Form States
  const [formCategory, setFormCategory] = useState("Bodyweight");
  const [formExercise, setFormExercise] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formUnit, setFormUnit] = useState("reps");
  const [formNotes, setFormNotes] = useState("");
  const [formCompleted, setFormCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // List of exercises based on selected formCategory
  const availableExercises = useMemo(() => {
    const cat = CATEGORIES[formCategory];
    if (!cat) return [];
    if (cat.exercises) return cat.exercises;
    if (cat.subcategories) {
      return Object.values(cat.subcategories).flat();
    }
    return [];
  }, [formCategory]);

  // Set default exercise and unit when category changes
  useEffect(() => {
    if (availableExercises.length > 0) {
      setFormExercise(availableExercises[0]);
    }
    const cat = CATEGORIES[formCategory];
    if (cat) {
      setFormUnit(cat.defaultUnit);
    }
  }, [formCategory, availableExercises]);

  // Automatically select the correct unit for mapped exercises to prevent drift
  useEffect(() => {
    if (!formExercise) return;
    const mappedCalName = PR_CALISTHENICS_MAP[formExercise];
    if (mappedCalName) {
      const catalogItem = GUILD_CATALOG.find(x => x.name === mappedCalName);
      if (catalogItem) {
        setFormUnit(getExerciseUnit(catalogItem.mastery_req));
      }
    }
  }, [formExercise]);

  const loadData = async (profileId: string) => {
    try {
      // 1. Load PR Logs, Milestones and Weight Logs in parallel
      const [prRes, mRes, weightRes] = await Promise.all([
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
          .select("date, weight_kg")
          .eq("profile_id", profileId)
          .not("weight_kg", "is", null)
          .order("date", { ascending: false })
      ]);

      if (prRes.data) {
        setPrRecords(prRes.data);
      }

      if (weightRes.data) {
        setWeightLogs(weightRes.data.map((w: any) => ({
          date: w.date,
          weight_kg: Number(w.weight_kg)
        })));
      }

      if (mRes.data) {
        setMilestones(mRes.data);
      } else {
        loadMilestonesFromLocalStorage();
      }
    } catch (err) {
      console.error("Error loading specs database:", err);
      loadMilestonesFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadMilestonesFromLocalStorage = () => {
    const saved = localStorage.getItem("calisthenics_milestones");
    if (saved) {
      try {
        setMilestones(JSON.parse(saved));
      } catch (e) {
        setMilestones([]);
      }
    } else {
      setMilestones([]);
    }
  };

  const saveMilestonesData = async (profileId: string, updated: MilestoneRecord[], targetItem: Omit<MilestoneRecord, "id">) => {
    setMilestones(updated);
    localStorage.setItem("calisthenics_milestones", JSON.stringify(updated));
    
    // Attempt saving to supabase table
    try {
      const { error } = await supabase
        .from("pr_milestones")
        .upsert({
          profile_id: profileId,
          exercise: targetItem.exercise,
          value: targetItem.value,
          completed: targetItem.completed
        }, { onConflict: "profile_id,exercise" });
    } catch (err) {
      console.warn("Could not sync milestone to database, saved locally.", err);
    }
  };

  useEffect(() => {
    setAsvandId(ASVAND_PROFILE_ID);
    loadData(ASVAND_PROFILE_ID);
  }, []);

  const getBwForDate = (dateStr: string) => {
    const match = weightLogs.find(w => w.date === dateStr);
    if (match) return `${match.weight_kg}kg`;
    const beforeLogs = weightLogs.filter(w => w.date <= dateStr);
    if (beforeLogs.length > 0) return `${beforeLogs[0].weight_kg}kg`;
    return "N/A";
  };

  const renderTargetProgress = (msRecord: any, bestLog: any, unitVal: string) => {
    if (!msRecord) return null;
    const targetVal = msRecord.value;
    const isCompleted = msRecord.completed || (bestLog && bestLog.value >= targetVal);
    const currentVal = bestLog ? bestLog.value : 0;
    const percent = targetVal > 0 ? Math.min(100, Math.max(0, Math.round((currentVal / targetVal) * 100))) : 0;

    return (
      <div className="flex flex-col gap-1.5 mt-2 max-w-[240px]">
        <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
          <span className={isCompleted ? "text-success" : "text-accent"}>
            Target: {targetVal} {unitVal} {isCompleted ? "✓" : ""}
          </span>
          <span className="text-muted font-mono">{currentVal} / {targetVal} ({percent}%)</span>
        </div>
        <div className="w-full bg-surface2 h-1.5 rounded-full overflow-hidden mt-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-accent shadow-[0_0_8px_rgba(74,158,255,0.4)]'}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  };

  // Compute Current PR for selected exercise
  const currentPrValue = useMemo(() => {
    if (!formExercise) return "None logged";
    const matched = prRecords.filter(r => r.exercise === formExercise);
    if (matched.length === 0) return "None logged";
    const best = matched.reduce((max, r) => (r.value > max ? r.value : max), 0);
    return `${best} ${matched[0].unit}`;
  }, [formExercise, prRecords]);

  // Compute Current Target for selected exercise
  const currentTargetValue = useMemo(() => {
    if (!formExercise) return "None";
    const match = milestones.find(m => m.exercise === formExercise);
    const cat = CATEGORIES[formCategory];
    const unit = prRecords.find(r => r.exercise === formExercise)?.unit || cat?.defaultUnit || "reps";
    return match ? `${match.value} ${unit}` : "None";
  }, [formExercise, milestones, formCategory, prRecords]);

  const handleSavePr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asvandId || !formExercise || !formValue || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const numericVal = parseFloat(formValue);
      // Basic safety validations
      if (isNaN(numericVal) || numericVal <= 0) {
        alert("Please enter a valid positive number for the PR value.");
        setIsSubmitting(false);
        return;
      }

      const todayStr = getLocalDateString();
      const { error } = await supabase
        .from("pr_logs")
        .insert({
          profile_id: asvandId,
          exercise: formExercise,
          value: numericVal,
          unit: formUnit,
          date: todayStr,
          notes: formNotes || null
        });

      if (error) throw error;

      // PR Database -> Calisthenics Tree Sync:
      // Synchronize the best performance value (reps/sec/m) only if explicitly mapped, without granting mastery.
      const mappedCalName = PR_CALISTHENICS_MAP[formExercise];
      if (mappedCalName) {
        const catalogItem = GUILD_CATALOG.find(x => x.name === mappedCalName);
        if (catalogItem) {
          const pathName = catalogItem.path;
          const targetReps = catalogItem.target_reps;

          // Fetch existing progress
          const { data: currentProgress, error: fetchErr } = await supabase
            .from("calisthenics_progress")
            .select("*")
            .eq("profile_id", asvandId)
            .eq("exercise_name", mappedCalName)
            .maybeSingle();

          if (fetchErr) throw fetchErr;

          const currentReps = currentProgress ? currentProgress.reps : 0;
          const integerPrVal = Math.round(numericVal);

          if (integerPrVal > currentReps || !currentProgress) {
            // Keep x3_completed unchanged (never set to true from PR page; default to false if new record)
            const x3Completed = currentProgress ? !!currentProgress.x3_completed : false;
            const calculatedMastery = Math.min(100, Math.round((integerPrVal / targetReps) * 100));

            if (currentProgress) {
              const { error: updateErr } = await supabase
                .from("calisthenics_progress")
                .update({
                  reps: integerPrVal,
                  mastery_percent: calculatedMastery,
                  learned: true,
                  correct_form: integerPrVal >= targetReps,
                  best_performance_date: todayStr
                })
                .eq("profile_id", asvandId)
                .eq("exercise_name", mappedCalName);
              
              if (updateErr) throw updateErr;
            } else {
              // Insert a valid, complete record without orphan fields
              const { error: insertErr } = await supabase
                .from("calisthenics_progress")
                .insert({
                  profile_id: asvandId,
                  exercise_name: mappedCalName,
                  path: pathName,
                  learned: true,
                  correct_form: integerPrVal >= targetReps,
                  reps: integerPrVal,
                  target_reps: targetReps,
                  sessions_hit: 0,
                  x3_completed: x3Completed,
                  mastery_percent: calculatedMastery,
                  best_performance_date: todayStr
                });
              
              if (insertErr) throw insertErr;
            }
          }
        }
      }

      setFormValue("");
      setFormNotes("");
      setIsEditOpen(false);
      loadData(asvandId);
    } catch (err: any) {
      alert(err.message || "Failed to log PR");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asvandId || !formExercise || !formValue || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const parsedVal = parseFloat(formValue);
      // Basic safety validations for targets
      if (isNaN(parsedVal) || parsedVal <= 0) {
        alert("Please enter a valid positive number for the target goal.");
        setIsSubmitting(false);
        return;
      }

      const existingIdx = milestones.findIndex(m => m.exercise === formExercise);
      let updatedList = [...milestones];
      
      const targetItem = {
        exercise: formExercise,
        value: parsedVal,
        completed: formCompleted
      };

      if (existingIdx > -1) {
        updatedList[existingIdx] = {
          ...updatedList[existingIdx],
          value: parsedVal,
          completed: formCompleted
        };
      } else {
        updatedList.push({
          id: Math.random().toString(),
          exercise: formExercise,
          value: parsedVal,
          completed: formCompleted
        });
      }

      await saveMilestonesData(asvandId, updatedList, targetItem);
      setFormValue("");
      setIsEditOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to save milestone");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-background">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-muted text-sm mt-4 font-semibold animate-pulse font-mono">Loading PR Engine...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-content pb-24">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-6 pt-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface1 border border-border text-primary active:scale-95 transition-all hover:bg-surface2 cursor-pointer shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-2xl font-black text-primary tracking-tight">PR Database</h1>
          </div>
          
          <button
            onClick={() => {
              setIsEditOpen(true);
              setFormValue("");
              setFormNotes("");
            }}
            className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider text-background bg-accent rounded-xl hover:bg-accent/90 active:scale-95 transition-all shadow-[0_0_15px_rgba(74,158,255,0.2)]"
          >
            Add Log
          </button>
        </div>

        {/* Database List grouped by Category */}
        <div className="flex flex-col gap-3">
          {Object.entries(CATEGORIES).map(([catName, catData]) => {
            const isExpanded = expandedCategory === catName;
            
            // Collect all exercises in this category
            const catExercises = catData.exercises || Object.values(catData.subcategories || {}).flat();
            
            // Count logged PRs inside this category
            const loggedPrCount = catExercises.filter(ex => prRecords.some(r => r.exercise === ex)).length;

            return (
              <Card key={catName} className="p-0 overflow-hidden border border-border bg-surface1 shadow-sm">
                <div
                  onClick={() => setExpandedCategory(isExpanded ? null : catName)}
                  className="flex justify-between items-center p-5 bg-surface1 hover:bg-surface2 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 border-2 border-accent/20 flex items-center justify-center text-accent shadow-[0_0_10px_rgba(74,158,255,0.1)]">
                      <catData.icon size={22} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black text-lg text-primary tracking-tight">{catName}</span>
                      <span className="text-[9px] font-bold text-muted uppercase tracking-wider">{loggedPrCount} logged</span>
                    </div>
                  </div>
                  <ChevronRight size={20} className={`text-muted transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                </div>

                {isExpanded && (
                  <div className="p-5 pt-2 bg-surface1 border-t border-border/50 flex flex-col gap-4">
                    {/* Render subcategories if they exist */}
                    {catData.subcategories ? (
                      Object.entries(catData.subcategories).map(([subName, list]) => (
                        <div key={subName} className="flex flex-col gap-2 mt-2">
                          <p className="text-[9px] font-bold text-accent uppercase tracking-widest border-b border-border/20 pb-2">{subName}</p>
                          {list.map(ex => {
                            const exLogs = prRecords.filter(r => r.exercise === ex);
                            const bestLog = exLogs.length > 0 ? exLogs.reduce((best, current) => current.value > best.value ? current : best, exLogs[0]) : null;
                            const unitVal = bestLog ? bestLog.unit : catData.defaultUnit;
                            const msRecord = milestones.find(m => m.exercise === ex);

                            return (
                              <div key={ex} className="flex justify-between items-start py-3 border-b border-border/20 text-sm">
                                <div className="flex-1 pr-3">
                                  <span className="text-primary font-bold block">{ex}</span>
                                  {bestLog && (
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[9px] text-muted font-bold tracking-wider uppercase">
                                      <span className="font-mono">{bestLog.date}</span>
                                      <span className="text-border/50">•</span>
                                      <span className="font-mono">BW: {getBwForDate(bestLog.date)}</span>
                                      {bestLog.notes && (
                                        <>
                                          <span className="text-border/50">•</span>
                                          <span className="italic text-secondary tracking-normal normal-case">"{bestLog.notes}"</span>
                                        </>
                                      )}
                                    </div>
                                  )}
                                  {renderTargetProgress(msRecord, bestLog, unitVal)}
                                </div>
                                <span className={bestLog ? "font-black text-accent whitespace-nowrap text-base" : "text-muted font-bold text-[10px] uppercase tracking-wider whitespace-nowrap mt-1"}>
                                  {bestLog ? `${bestLog.value} ${bestLog.unit}` : "No PR Yet"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col gap-2 mt-2">
                        {catExercises.map(ex => {
                          const exLogs = prRecords.filter(r => r.exercise === ex);
                          const bestLog = exLogs.length > 0 ? exLogs.reduce((best, current) => current.value > best.value ? current : best, exLogs[0]) : null;
                          const unitVal = bestLog ? bestLog.unit : catData.defaultUnit;
                          const msRecord = milestones.find(m => m.exercise === ex);

                          return (
                            <div key={ex} className="flex justify-between items-start py-3 border-b border-border/20 text-sm">
                              <div className="flex-1 pr-3">
                                <span className="text-primary font-bold block">{ex}</span>
                                {bestLog && (
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[9px] text-muted font-bold tracking-wider uppercase">
                                      <span className="font-mono">{bestLog.date}</span>
                                      <span className="text-border/50">•</span>
                                      <span className="font-mono">BW: {getBwForDate(bestLog.date)}</span>
                                      {bestLog.notes && (
                                        <>
                                          <span className="text-border/50">•</span>
                                          <span className="italic text-secondary tracking-normal normal-case">"{bestLog.notes}"</span>
                                        </>
                                      )}
                                    </div>
                                )}
                                {renderTargetProgress(msRecord, bestLog, unitVal)}
                              </div>
                              <span className={bestLog ? "font-black text-accent whitespace-nowrap text-base" : "text-muted font-bold text-[10px] uppercase tracking-wider whitespace-nowrap mt-1"}>
                                {bestLog ? `${bestLog.value} ${bestLog.unit}` : "No PR Yet"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>


        {/* EDIT DIALOG (MODAL) */}
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-surface1 border border-border rounded-2xl overflow-hidden shadow-2xl animate-slide-up">
              
              {/* Modal Tabs */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setEditTab("pr")}
                  className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    editTab === "pr" ? "bg-accent/10 text-accent border-b-2 border-accent" : "text-muted hover:text-primary"
                  }`}
                >
                  New PR
                </button>
                <button
                  onClick={() => setEditTab("milestone")}
                  className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    editTab === "milestone" ? "bg-accent/10 text-accent border-b-2 border-accent" : "text-muted hover:text-primary"
                  }`}
                >
                  New Target
                </button>
              </div>

              {/* Form content */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-5">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                    {editTab === "pr" ? "Add Personal Record" : "Add Target Goal"}
                  </span>
                  <button onClick={() => setIsEditOpen(false)} className="text-muted hover:text-primary transition-colors cursor-pointer">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={editTab === "pr" ? handleSavePr : handleSaveMilestone} className="flex flex-col gap-5">
                  {/* Category Dropdown */}
                  <div>
                    <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-2">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-surface2 py-3 px-4 border border-border/50 rounded-xl text-sm font-bold text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    >
                      {Object.keys(CATEGORIES).map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Exercise Dropdown */}
                  <div>
                    <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-2">Workout</label>
                    <select
                      value={formExercise}
                      onChange={(e) => setFormExercise(e.target.value)}
                      className="w-full bg-surface2 py-3 px-4 border border-border/50 rounded-xl text-sm font-bold text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    >
                      {availableExercises.map(ex => (
                        <option key={ex} value={ex}>
                          {ex}
                        </option>
                      ))}
                    </select>
                  </div>

                  {editTab === "pr" ? (
                    <>
                      {/* PR Form Side-by-Side: Current PR on Left, Enter New PR on Right */}
                      <div className="grid grid-cols-2 gap-4 items-center bg-surface2/30 border border-border/40 p-4 rounded-xl">
                        <div>
                          <span className="text-muted text-[9px] font-bold uppercase tracking-wider block">Current PR</span>
                          <span className="text-primary text-sm font-bold mt-1 block">{currentPrValue}</span>
                        </div>
                        <div>
                          <label className="text-[9px] text-muted font-bold uppercase tracking-wider block mb-1">Enter New PR</label>
                          <input
                            type="number"
                            step="0.1"
                            required
                            placeholder="e.g. 15"
                            value={formValue}
                            onChange={(e) => setFormValue(e.target.value)}
                            className="w-full bg-surface2 py-2 px-3 border border-border/50 rounded-xl text-sm font-bold text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all tabular-nums placeholder:text-muted/50"
                          />
                        </div>
                      </div>

                      {/* Unit & Notes */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-2">Unit</label>
                          <select
                            value={formUnit}
                            onChange={(e) => setFormUnit(e.target.value)}
                            className="w-full bg-surface2 py-2.5 px-3 border border-border/50 rounded-xl text-sm font-bold text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                          >
                            <option value="reps">reps</option>
                            <option value="kg">kg</option>
                            <option value="sec">sec</option>
                            <option value="min">min</option>
                            <option value="km">km</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-2">Notes</label>
                          <input
                            type="text"
                            placeholder="Optional"
                            value={formNotes}
                            onChange={(e) => setFormNotes(e.target.value)}
                            className="w-full bg-surface2 py-2.5 px-3 border border-border/50 rounded-xl text-sm font-bold text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-muted/50"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Milestone Form Side-by-Side: Current Target on Left, Enter New Target on Right */}
                      <div className="grid grid-cols-2 gap-4 items-center bg-surface2/30 border border-border/40 p-4 rounded-xl">
                        <div>
                          <span className="text-muted text-[9px] font-bold uppercase tracking-wider block">Current Target</span>
                          <span className="text-primary text-sm font-bold mt-1 block">{currentTargetValue}</span>
                        </div>
                        <div>
                          <label className="text-[9px] text-muted font-bold uppercase tracking-wider block mb-1">New Target</label>
                          <input
                            type="number"
                            step="0.1"
                            required
                            placeholder="e.g. 20"
                            value={formValue}
                            onChange={(e) => setFormValue(e.target.value)}
                            className="w-full bg-surface2 py-2 px-3 border border-border/50 rounded-xl text-sm font-bold text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all tabular-nums placeholder:text-muted/50"
                          />
                        </div>
                      </div>

                      {/* Unit & Notes */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-2">Unit</label>
                          <select
                            value={formUnit}
                            onChange={(e) => setFormUnit(e.target.value)}
                            className="w-full bg-surface2 py-2.5 px-3 border border-border/50 rounded-xl text-sm font-bold text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                          >
                            <option value="reps">reps</option>
                            <option value="kg">kg</option>
                            <option value="sec">sec</option>
                            <option value="min">min</option>
                            <option value="km">km</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-2">Notes</label>
                          <input
                            type="text"
                            placeholder="Optional"
                            value={formNotes}
                            onChange={(e) => setFormNotes(e.target.value)}
                            className="w-full bg-surface2 py-2.5 px-3 border border-border/50 rounded-xl text-sm font-bold text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-muted/50"
                          />
                        </div>
                      </div>

                      {/* Milestone Completed Box Underneath */}
                      <div className="flex items-center gap-3 bg-surface2/30 p-4 border border-border/40 rounded-xl mt-1">
                        <input
                           type="checkbox"
                           id="milestoneCompleted"
                           checked={formCompleted}
                           onChange={(e) => setFormCompleted(e.target.checked)}
                           className="w-5 h-5 rounded border-border bg-surface2 text-accent focus:ring-accent focus:ring-offset-0 focus:ring-2 cursor-pointer"
                        />
                        <label htmlFor="milestoneCompleted" className="text-sm font-bold text-primary cursor-pointer select-none">
                          Mark as completed
                        </label>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`text-[10px] uppercase tracking-wider font-bold py-3.5 px-6 rounded-xl w-full mt-3 transition-all ${
                      isSubmitting 
                        ? "bg-surface2 text-muted cursor-not-allowed" 
                        : "bg-accent text-background hover:bg-accent/90 active:scale-95 shadow-[0_0_15px_rgba(74,158,255,0.2)]"
                    }`}
                  >
                    {isSubmitting ? "Saving..." : (editTab === "pr" ? "Save PR" : "Save Target")}
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* Recent Logs & History (with Edit/Delete support) */}
        <Card className="mt-6 border border-border bg-surface1 px-0 pt-5 pb-2 shadow-sm">
          <div className="px-5 mb-5">
            <span className="text-[10px] text-muted font-bold tracking-wider uppercase block">Recent Logs History</span>
          </div>
          {prRecords.length === 0 ? (
            <p className="text-xs text-muted font-bold uppercase tracking-wider py-8 text-center">No PR logs recorded yet</p>
          ) : (
            <div className="flex flex-col mt-2">
              {prRecords.slice(0, 15).map((r, i) => (
                <div key={r.id} className={`flex justify-between items-center py-4 px-5 border-t border-border/20 text-sm hover:bg-surface2/30 transition-colors`}>
                  <div className="flex-1 pr-3">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-primary font-bold">{r.exercise}</span>
                      <span className="text-[9px] text-muted font-mono font-bold tracking-wider uppercase">{r.date}</span>
                    </div>
                    {r.notes && <p className="text-[11px] text-muted italic">"{r.notes}"</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-accent text-base">{r.value} {r.unit}</span>
                    
                    {/* Delete Action */}
                    <button
                      onClick={async () => {
                        if (confirm(`Delete PR log for ${r.exercise} (${r.value} ${r.unit})?`)) {
                          try {
                            const { error } = await supabase
                              .from("pr_logs")
                              .delete()
                              .eq("id", r.id);
                            if (error) throw error;
                            loadData(asvandId!);
                          } catch (err: any) {
                            alert(err.message || "Failed to delete PR");
                          }
                        }
                      }}
                      className="text-[#FF4A4A] hover:text-[#FF2A2A] active:scale-95 transition-all cursor-pointer p-1.5 hover:bg-[#FF4A4A]/10 rounded-lg"
                      title="Delete Log"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
      <NavBar />
    </div>
  );
}
