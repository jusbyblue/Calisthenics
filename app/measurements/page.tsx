"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { NavBar } from "@/components/ui/NavBar";
import { Card } from "@/components/ui/Card";

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
  emoji: string;
  isLossGoal: boolean;
}

const MEASUREMENT_CONFIGS: MeasurementConfig[] = [
  { key: "weight_kg", label: "Weight", unit: "kg", emoji: "⚖️", isLossGoal: false },
  { key: "waist_cm", label: "Waist", unit: "cm", emoji: "📏", isLossGoal: true },
  { key: "chest_cm", label: "Chest", unit: "cm", emoji: "👤", isLossGoal: false },
  { key: "shoulders_cm", label: "Shoulders", unit: "cm", emoji: "📐", isLossGoal: false },
  { key: "arm_cm", label: "Arm (Relaxed)", unit: "cm", emoji: "💪", isLossGoal: false },
  { key: "arm_flexed_cm", label: "Arm (Flexed)", unit: "cm", emoji: "💪", isLossGoal: false },
  { key: "forearm_cm", label: "Forearm", unit: "cm", emoji: "✊", isLossGoal: false },
  { key: "thigh_cm", label: "Thigh", unit: "cm", emoji: "🦵", isLossGoal: false },
  { key: "calf_cm", label: "Calf", unit: "cm", emoji: "🦵", isLossGoal: false },
  { key: "hip_cm", label: "Hip", unit: "cm", emoji: "🍑", isLossGoal: false },
  { key: "neck_cm", label: "Neck", unit: "cm", emoji: "🫁", isLossGoal: false },
  { key: "wrist_cm", label: "Wrist", unit: "cm", emoji: "⌚", isLossGoal: false },
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
    } catch (err) {
      console.error("Error loading measurements:", err);
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

    async function init() {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "asvand")
        .single();
      
      if (profile) {
        setAsvandId(profile.id);
        loadData(profile.id);
      } else {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Compute unified records (combining database records and local logs by date)
  const unifiedHistory = useMemo(() => {
    const mergedMap: Record<string, MeasurementRecord> = {};
    
    // 1. Populate local logs
    localLogs.forEach(log => {
      mergedMap[log.date] = { ...mergedMap[log.date], ...log };
    });
    
    // 2. Override and merge Supabase records (wrist, waist, arm_relaxed, forearm, chest, hip, weight)
    records.forEach(r => {
      mergedMap[r.date] = {
        ...mergedMap[r.date],
        id: r.id,
        date: r.date,
        weight_kg: r.weight_kg,
        waist_cm: r.waist_cm,
        arm_cm: r.arm_cm,
        forearm_cm: r.forearm_cm,
        chest_cm: r.chest_cm,
        hip_cm: r.hip_cm,
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
    if (!asvandId) return;
    setSubmitting(true);

    try {
      const todayStr = new Date().toISOString().split("T")[0];

      // 1. Save goals to local storage
      const newGoals: Record<string, number> = {};
      MEASUREMENT_CONFIGS.forEach(cfg => {
        const val = parseFloat(formGoals[cfg.key]);
        if (!isNaN(val) && val > 0) {
          newGoals[cfg.key] = val;
        }
      });
      setGoals(newGoals);
      localStorage.setItem("calisthenics_measurement_goals", JSON.stringify(newGoals));

      // 2. Save all measurements locally (unified history backup)
      const todayLocalData: any = { date: todayStr };
      MEASUREMENT_CONFIGS.forEach(cfg => {
        const val = parseFloat(formCurrents[cfg.key]);
        if (!isNaN(val) && val > 0) {
          todayLocalData[cfg.key] = val;
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

      // 3. Save Supabase-supported fields (wrist, waist, arm_relaxed, forearm, chest, hip, weight)
      const { data: existing } = await supabase
        .from("measurements")
        .select("*")
        .eq("profile_id", asvandId)
        .eq("date", todayStr)
        .maybeSingle();

      const dbFields: any = {
        profile_id: asvandId,
        date: todayStr,
        weight_kg: !isNaN(parseFloat(formCurrents.weight_kg)) ? parseFloat(formCurrents.weight_kg) : (existing ? existing.weight_kg : null),
        waist_cm: !isNaN(parseFloat(formCurrents.waist_cm)) ? parseFloat(formCurrents.waist_cm) : (existing ? existing.waist_cm : null),
        chest_cm: !isNaN(parseFloat(formCurrents.chest_cm)) ? parseFloat(formCurrents.chest_cm) : (existing ? existing.chest_cm : null),
        arm_cm: !isNaN(parseFloat(formCurrents.arm_cm)) ? parseFloat(formCurrents.arm_cm) : (existing ? existing.arm_cm : null),
        forearm_cm: !isNaN(parseFloat(formCurrents.forearm_cm)) ? parseFloat(formCurrents.forearm_cm) : (existing ? existing.forearm_cm : null),
        hip_cm: !isNaN(parseFloat(formCurrents.hip_cm)) ? parseFloat(formCurrents.hip_cm) : (existing ? existing.hip_cm : null),
        wrist_cm: !isNaN(parseFloat(formCurrents.wrist_cm)) ? parseFloat(formCurrents.wrist_cm) : (existing ? existing.wrist_cm : null),
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
    } catch (err) {
      console.error("Error saving measurements:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-[#0A0A0A]">
        <div className="w-8 h-8 border-4 border-[#4A9EFF] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#888888] text-sm mt-4 font-semibold animate-pulse">Syncing body specs...</p>
      </div>
    );
  }

  return (
    <div className="page" style={{ background: "var(--bg)" }}>
      <div className="page-content pb-28">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-5 pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#1A1A1A] border border-[#2A2A2A] text-white active:scale-95 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white leading-none">Body Specs</h1>
              <p className="text-[10px] text-secondary mt-1">Track body dimensions and physical goals</p>
            </div>
          </div>
          
          <button
            onClick={openEditModal}
            className="px-4 py-2 text-xs font-bold text-[#000] bg-accent rounded-xl hover:filter hover:brightness-110 active:scale-95 transition-all shadow-[0_0_10px_rgba(74,158,255,0.2)]"
          >
            Edit
          </button>
        </div>

        {/* Spec Cards Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          {MEASUREMENT_CONFIGS.map(cfg => {
            const { current, best, goal, isLoss } = getStats(cfg.key, cfg);
            
            // Determine goal status and badges
            let badgeText = "⚪ No Goal";
            let badgeStyle = "bg-neutral-800 text-neutral-400";
            let progressText = "";

            if (goal) {
              const isAchieved = current ? (isLoss ? current <= goal : current >= goal) : false;
              if (isAchieved) {
                badgeText = "🟢 Goal Reached";
                badgeStyle = "bg-success/15 text-success";
              } else {
                badgeText = "🟡 In Progress";
                badgeStyle = "bg-warning/15 text-warning";
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
              <Card key={cfg.key} className="p-4 border border-border bg-surface1 flex flex-col justify-between min-h-[145px]">
                <div>
                  <div className="flex justify-between items-start mb-2 border-b border-border/10 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{cfg.emoji}</span>
                      <span className="text-[11px] font-black text-white uppercase tracking-wider">{cfg.label}</span>
                    </div>
                    <span className={`text-[7.5px] font-bold px-1.5 py-0.5 rounded-full ${badgeStyle}`}>
                      {badgeText}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-[11px] text-secondary">
                    <div className="flex justify-between">
                      <span>Current:</span>
                      <span className="font-semibold text-white">{current ? `${current} ${cfg.unit}` : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Goal:</span>
                      <span className="font-semibold text-accent">{goal ? `${goal} ${cfg.unit}` : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Best:</span>
                      <span className="font-semibold text-white">{best ? `${best} ${cfg.unit}` : "—"}</span>
                    </div>
                  </div>
                </div>

                {progressText && (
                  <div className="mt-2.5 pt-2 border-t border-border/10 text-[9px] font-extrabold text-[#777799] tracking-wide text-right">
                    {progressText}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* EDIT DIALOG (MODAL) */}
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000]/80 animate-fade-in">
            <div className="w-full max-w-sm bg-surface1 border border-border rounded-2xl overflow-hidden shadow-2xl animate-slide-up max-h-[85vh] flex flex-col">
              
              <div className="p-4 border-b border-border flex justify-between items-center bg-surface1">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Edit Specs & Goals</span>
                <button onClick={() => setIsEditOpen(false)} className="text-secondary hover:text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSaveAll} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-surface1">
                {MEASUREMENT_CONFIGS.map(cfg => (
                  <div key={cfg.key} className="bg-surface2/40 border border-border/30 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{cfg.emoji}</span>
                      <span className="text-xs font-bold text-white">{cfg.label} ({cfg.unit})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-secondary uppercase block mb-1">Today's Value</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 70"
                          value={formCurrents[cfg.key] || ""}
                          onChange={(e) => setFormCurrents({ ...formCurrents, [cfg.key]: e.target.value })}
                          className="w-full bg-[#111111] py-1.5 px-2 border border-[#2A2A2A] rounded-lg text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-secondary uppercase block mb-1">Target Goal</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 75"
                          value={formGoals[cfg.key] || ""}
                          onChange={(e) => setFormGoals({ ...formGoals, [cfg.key]: e.target.value })}
                          className="w-full bg-[#111111] py-1.5 px-2 border border-[#2A2A2A] rounded-lg text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary text-xs font-bold py-2.5 w-full mt-2"
                >
                  {submitting ? "Saving..." : "Save Specs"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TOAST SUCCESS NOTIFICATION */}
        {showToast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#121221] border border-success/30 px-5 py-3 rounded-2xl shadow-[0_0_15px_rgba(46,213,115,0.25)] flex items-center gap-2.5 animate-bounce-in">
            <span className="text-success text-xs font-black">✅ Body specs updated successfully.</span>
          </div>
        )}

      </div>
      <NavBar />
    </div>
  );
}
