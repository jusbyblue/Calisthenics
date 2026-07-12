"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { NavBar } from "@/components/ui/NavBar";
import { Card, CardInner, CardLabel } from "@/components/ui/Card";
import { ASVAND_PROFILE_ID } from "@/lib/appConfig";
import { getLocalDateString } from "@/lib/dateUtils";
import { Scale, Ruler, User, Circle, Square, Shield, Crosshair, Target, ChevronLeft, X } from "lucide-react";

interface MeasurementRecord {
  id?: string;
  date: string;
  wrist_cm?: number | null;
  waist_cm?: number | null;
  arm_cm?: number | null; // arm_relaxed
  arm_flexed_cm?: number | null;
  forearm_cm?: number | null;
  chest_cm?: number | null;
  shoulders_cm?: number | null;
  thigh_cm?: number | null;
  calf_cm?: number | null;
  hip_cm?: number | null;
  neck_cm?: number | null;
  weight_kg?: number | null;
}

interface MeasurementConfig {
  key: keyof Omit<MeasurementRecord, "id" | "date">;
  label: string;
  unit: string;
  icon: React.ElementType;
  isLossGoal: boolean;
}

const MEASUREMENT_CONFIGS: MeasurementConfig[] = [
  { key: "weight_kg", label: "Weight", unit: "kg", icon: Scale, isLossGoal: false },
  { key: "waist_cm", label: "Waist", unit: "cm", icon: Ruler, isLossGoal: true },
  { key: "chest_cm", label: "Chest", unit: "cm", icon: User, isLossGoal: false },
  { key: "shoulders_cm", label: "Shoulders", unit: "cm", icon: Square, isLossGoal: false },
  { key: "arm_cm", label: "Arm (Relaxed)", unit: "cm", icon: Target, isLossGoal: false },
  { key: "arm_flexed_cm", label: "Arm (Flexed)", unit: "cm", icon: Target, isLossGoal: false },
  { key: "forearm_cm", label: "Forearm", unit: "cm", icon: Target, isLossGoal: false },
  { key: "thigh_cm", label: "Thigh", unit: "cm", icon: Circle, isLossGoal: false },
  { key: "calf_cm", label: "Calf", unit: "cm", icon: Circle, isLossGoal: false },
  { key: "hip_cm", label: "Hip", unit: "cm", icon: Circle, isLossGoal: false },
  { key: "neck_cm", label: "Neck", unit: "cm", icon: Crosshair, isLossGoal: false },
  { key: "wrist_cm", label: "Wrist", unit: "cm", icon: Crosshair, isLossGoal: false },
];

export default function AsvandMeasurementsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [asvandId, setAsvandId] = useState<string | null>(null);

  // States
  const [records, setRecords] = useState<MeasurementRecord[]>([]);
  const [localLogs, setLocalLogs] = useState<MeasurementRecord[]>([]);
  const [goals, setGoals] = useState<Record<string, number>>({});
  
  // Modal Edit States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formCurrents, setFormCurrents] = useState<Record<string, string>>({});
  const [formGoals, setFormGoals] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Toast State
  const [showToast, setShowToast] = useState(false);

  const loadData = async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from("measurements")
        .select("*")
        .eq("profile_id", profileId)
        .order("date", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err: any) {
      console.error("Error loading measurements:", err);
      alert(err.message || "Failed to load measurements from the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load local logs and goals from local storage on mount
    const storedGoals = localStorage.getItem("calisthenics_measurement_goals");
    if (storedGoals) {
      try {
        setGoals(JSON.parse(storedGoals));
      } catch (e) {}
    }

    const storedLogs = localStorage.getItem("calisthenics_local_measurements");
    if (storedLogs) {
      try {
        setLocalLogs(JSON.parse(storedLogs));
      } catch (e) {}
    }

    setAsvandId(ASVAND_PROFILE_ID);
    loadData(ASVAND_PROFILE_ID);
  }, []);

  // Compute unified records (combining database records and local logs by date)
  const unifiedHistory = useMemo(() => {
    const mergedMap: Record<string, MeasurementRecord> = {};
    
    // 1. Populate local logs
    localLogs.forEach(log => {
      mergedMap[log.date] = { ...mergedMap[log.date], ...log };
    });
    
    // 2. Override and merge Supabase records (all 12 fields)
    records.forEach(r => {
      mergedMap[r.date] = {
        ...mergedMap[r.date],
        id: r.id,
        date: r.date,
        weight_kg: r.weight_kg,
        waist_cm: r.waist_cm,
        chest_cm: r.chest_cm,
        shoulders_cm: r.shoulders_cm,
        arm_cm: r.arm_cm,
        arm_flexed_cm: r.arm_flexed_cm,
        forearm_cm: r.forearm_cm,
        thigh_cm: r.thigh_cm,
        calf_cm: r.calf_cm,
        hip_cm: r.hip_cm,
        neck_cm: r.neck_cm,
        wrist_cm: r.wrist_cm
      };
    });
    
    return Object.values(mergedMap).sort((a, b) => b.date.localeCompare(a.date));
  }, [records, localLogs]);

  const getStats = (key: keyof Omit<MeasurementRecord, "id" | "date">, config: MeasurementConfig) => {
    const values = unifiedHistory
      .map(r => r[key] as number | null)
      .filter((v): v is number => v !== null && v > 0);

    const current = values.length > 0 ? values[0] : null;
    const highest = values.length > 0 ? Math.max(...values) : null;
    const lowest = values.length > 0 ? Math.min(...values) : null;
    const goal = goals[key] || null;

    // Weight can be muscle gain or fat loss. We check if the goal is lower than current weight.
    const isLoss = config.isLossGoal || (key === "weight_kg" && goal && current && current > goal);
    const best = isLoss ? lowest : highest;

    return { current, best, goal, isLoss };
  };

  const openEditModal = () => {
    const currentValues: Record<string, string> = {};
    const goalValues: Record<string, string> = {};
    
    MEASUREMENT_CONFIGS.forEach(cfg => {
      const { current, goal } = getStats(cfg.key, cfg);
      currentValues[cfg.key] = current ? String(current) : "";
      goalValues[cfg.key] = goal ? String(goal) : "";
    });
    
    setFormCurrents(currentValues);
    setFormGoals(goalValues);
    setIsEditOpen(true);
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asvandId || submitting) return;
    setSubmitting(true);

    try {
      // 1. Strict numeric validations using Number() pattern
      for (const cfg of MEASUREMENT_CONFIGS) {
        const currentRaw = formCurrents[cfg.key]?.trim() || "";
        if (currentRaw !== "") {
          const val = Number(currentRaw);
          if (isNaN(val) || !Number.isFinite(val) || val <= 0 || val >= 1000) {
            alert(`Please enter a valid positive number under 1000 for today's ${cfg.label}.`);
            setSubmitting(false);
            return;
          }
        }

        const goalRaw = formGoals[cfg.key]?.trim() || "";
        if (goalRaw !== "") {
          const val = Number(goalRaw);
          if (isNaN(val) || !Number.isFinite(val) || val <= 0 || val >= 1000) {
            alert(`Please enter a valid positive number under 1000 for target goal ${cfg.label}.`);
            setSubmitting(false);
            return;
          }
        }
      }

      const todayStr = getLocalDateString();

      // 2. Save goals to local storage
      const newGoals: Record<string, number> = {};
      MEASUREMENT_CONFIGS.forEach(cfg => {
        const raw = formGoals[cfg.key]?.trim() || "";
        if (raw !== "") {
          newGoals[cfg.key] = Number(raw);
        }
      });
      setGoals(newGoals);
      localStorage.setItem("calisthenics_measurement_goals", JSON.stringify(newGoals));

      // 3. Save all measurements locally (unified history backup)
      const todayLocalData: any = { date: todayStr };
      MEASUREMENT_CONFIGS.forEach(cfg => {
        const raw = formCurrents[cfg.key]?.trim() || "";
        if (raw !== "") {
          todayLocalData[cfg.key] = Number(raw);
        } else {
          // Carry over from previous records if exist
          const match = localLogs.find(l => l.date === todayStr);
          if (match && match[cfg.key]) {
            todayLocalData[cfg.key] = match[cfg.key];
          }
        }
      });
      const updatedLocalLogs = [
        todayLocalData,
        ...localLogs.filter(l => l.date !== todayStr)
      ];
      setLocalLogs(updatedLocalLogs);
      localStorage.setItem("calisthenics_local_measurements", JSON.stringify(updatedLocalLogs));

      // 4. Save all 12 Supabase fields
      const { data: existing } = await supabase
        .from("measurements")
        .select("*")
        .eq("profile_id", asvandId)
        .eq("date", todayStr)
        .maybeSingle();

      const getFieldVal = (key: keyof Omit<MeasurementRecord, "id" | "date">) => {
        const raw = formCurrents[key]?.trim() || "";
        if (raw !== "") {
          return Number(raw);
        }
        return existing ? existing[key] : null;
      };

      const dbFields: any = {
        profile_id: asvandId,
        date: todayStr,
        weight_kg: getFieldVal("weight_kg"),
        waist_cm: getFieldVal("waist_cm"),
        chest_cm: getFieldVal("chest_cm"),
        shoulders_cm: getFieldVal("shoulders_cm"),
        arm_cm: getFieldVal("arm_cm"),
        arm_flexed_cm: getFieldVal("arm_flexed_cm"),
        forearm_cm: getFieldVal("forearm_cm"),
        thigh_cm: getFieldVal("thigh_cm"),
        calf_cm: getFieldVal("calf_cm"),
        hip_cm: getFieldVal("hip_cm"),
        neck_cm: getFieldVal("neck_cm"),
        wrist_cm: getFieldVal("wrist_cm")
      };

      if (existing) {
        const { error } = await supabase
          .from("measurements")
          .update(dbFields)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("measurements")
          .insert(dbFields);
        if (error) throw error;
      }

      setIsEditOpen(false);
      loadData(asvandId);

      // Trigger Toast Success Notification
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } catch (err: any) {
      console.error("Error saving measurements:", err);
      alert(err.message || "Failed to save measurements. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-background">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-muted text-sm mt-4 font-semibold animate-pulse">Syncing body specs...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-content pb-28">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pt-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface1 border border-border text-primary active:scale-95 transition-all hover:bg-surface2 cursor-pointer shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-primary tracking-tight">Body Specs</h1>
              <p className="text-[9px] font-bold text-muted uppercase tracking-wider mt-0.5">Track body dimensions</p>
            </div>
          </div>
          
          <button
            onClick={openEditModal}
            className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider text-background bg-accent rounded-xl hover:bg-accent/90 active:scale-95 transition-all shadow-[0_0_15px_rgba(74,158,255,0.2)]"
          >
            Update
          </button>
        </div>

        {/* Spec Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {MEASUREMENT_CONFIGS.map(cfg => {
            const { current, best, goal, isLoss } = getStats(cfg.key, cfg);
            
            // Determine goal status and badges
            let badgeText = "No Goal";
            let badgeStyle = "bg-surface2 text-muted border-border";
            let progressText = "";

            if (goal) {
              const isAchieved = current ? (isLoss ? current <= goal : current >= goal) : false;
              if (isAchieved) {
                badgeText = "Goal Reached";
                badgeStyle = "bg-success/10 text-success border-success/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
              } else {
                badgeText = "In Progress";
                badgeStyle = "bg-warning/10 text-warning border-warning/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]";
              }

              if (current) {
                if (isLoss) {
                  const remaining = current - goal;
                  progressText = remaining <= 0 ? "Goal Met! 🎉" : `Remaining: ${remaining.toFixed(1)} ${cfg.unit}`;
                } else {
                  progressText = `Progress: ${current} / ${goal} ${cfg.unit}`;
                }
              }
            }

            return (
              <Card key={cfg.key} className="p-5 border border-border bg-surface1 flex flex-col justify-between min-h-[150px] hover:bg-surface2/60 transition-colors shadow-sm">
                <div>
                  <div className="flex justify-between items-start mb-4 border-b border-border/50 pb-3">
                    <div className="flex items-center gap-3 text-primary">
                      <div className="w-8 h-8 rounded-lg bg-surface2 border border-border/50 flex items-center justify-center text-primary shadow-sm">
                        <cfg.icon size={16} />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest">{cfg.label}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 text-[10px] font-bold text-muted uppercase tracking-wider">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px]">Current</span>
                      <span className="font-mono text-primary font-black">{current ? `${current} ${cfg.unit}` : "—"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px]">Target</span>
                      <span className="font-mono text-accent font-black">{goal ? `${goal} ${cfg.unit}` : "—"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px]">Best</span>
                      <span className="font-mono text-primary font-black">{best ? `${best} ${cfg.unit}` : "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/30 flex justify-between items-center">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider ${badgeStyle}`}>
                    {badgeText}
                  </span>
                  {progressText && (
                    <span className="text-[9px] font-bold text-muted font-mono tracking-wide text-right">
                      {progressText}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* EDIT DIALOG (MODAL) */}
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-surface1 border border-border rounded-2xl overflow-hidden shadow-2xl animate-slide-up max-h-[85vh] flex flex-col">
              
              <div className="p-6 border-b border-border flex justify-between items-center bg-surface1">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Update Body Specs</span>
                <button onClick={() => setIsEditOpen(false)} className="text-muted hover:text-primary transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveAll} className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 bg-surface1">
                {MEASUREMENT_CONFIGS.map(cfg => (
                  <div key={cfg.key} className="bg-surface2/30 border border-border/40 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-4 text-primary">
                      <div className="w-8 h-8 rounded-lg bg-surface1 border border-border/50 flex items-center justify-center text-primary shadow-sm">
                        <cfg.icon size={16} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{cfg.label} <span className="text-muted font-bold ml-1">({cfg.unit})</span></span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-2">Today's Value</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 70"
                          value={formCurrents[cfg.key] || ""}
                          onChange={(e) => setFormCurrents({ ...formCurrents, [cfg.key]: e.target.value })}
                          className="w-full bg-surface2 py-2.5 px-3 border border-border/50 rounded-xl text-sm font-bold text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent tabular-nums transition-all placeholder:text-muted/50"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-2">Target Goal</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 75"
                          value={formGoals[cfg.key] || ""}
                          onChange={(e) => setFormGoals({ ...formGoals, [cfg.key]: e.target.value })}
                          className="w-full bg-surface2 py-2.5 px-3 border border-border/50 rounded-xl text-sm font-bold text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent tabular-nums transition-all placeholder:text-muted/50"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={submitting}
                  className={`text-[10px] uppercase tracking-wider font-bold py-3.5 px-6 rounded-xl w-full mt-3 mb-2 transition-all ${
                    submitting 
                      ? "bg-surface2 text-muted cursor-not-allowed" 
                      : "bg-accent text-background hover:bg-accent/90 active:scale-95 shadow-[0_0_15px_rgba(74,158,255,0.2)]"
                  }`}
                >
                  {submitting ? "Saving..." : "Save Specs"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TOAST SUCCESS NOTIFICATION */}
        {showToast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-surface1 border border-success/30 px-5 py-3 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.25)] flex items-center gap-2.5 animate-bounce-in">
            <span className="text-success text-xs font-black">Specs updated successfully.</span>
          </div>
        )}

      </div>
      <NavBar />
    </div>
  );
}
