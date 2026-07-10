"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { NavBar } from "@/components/ui/NavBar";
import { Card } from "@/components/ui/Card";

interface MeasurementRecord {
  id: string;
  date: string;
  wrist_cm: number | null;
  waist_cm: number | null;
  arm_cm: number | null;
  forearm_cm: number | null;
  chest_cm: number | null;
  hip_cm: number | null;
  weight_kg: number | null;
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
  { key: "arm_cm", label: "Arm", unit: "cm", emoji: "💪", isLossGoal: false },
  { key: "forearm_cm", label: "Forearm", unit: "cm", emoji: "✊", isLossGoal: false },
  { key: "wrist_cm", label: "Wrist", unit: "cm", emoji: "⌚", isLossGoal: false },
  { key: "hip_cm", label: "Hip", unit: "cm", emoji: "🍑", isLossGoal: false },
];

export default function AsvandMeasurementsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [asvandId, setAsvandId] = useState<string | null>(null);

  // States
  const [records, setRecords] = useState<MeasurementRecord[]>([]);
  const [goals, setGoals] = useState<Record<string, number>>({});
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Edit/Log Inline States
  const [logValue, setLogValue] = useState("");
  const [goalValue, setGoalValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ key: string; type: "success" | "error"; text: string } | null>(null);

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
    // Load goals from local storage
    const storedGoals = localStorage.getItem("calisthenics_measurement_goals");
    if (storedGoals) {
      try {
        setGoals(JSON.parse(storedGoals));
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

  const handleSaveConfig = async (key: keyof Omit<MeasurementRecord, "id" | "date">) => {
    if (!asvandId) return;
    setSubmitting(true);
    setStatusMsg(null);

    try {
      const todayStr = new Date().toISOString().split("T")[0];

      // Update Local Goal if provided
      if (goalValue.trim() !== "") {
        const goalNum = parseFloat(goalValue);
        if (!isNaN(goalNum) && goalNum > 0) {
          const updatedGoals = { ...goals, [key]: goalNum };
          setGoals(updatedGoals);
          localStorage.setItem("calisthenics_measurement_goals", JSON.stringify(updatedGoals));
        }
      }

      // Log Today's Measurement if provided
      if (logValue.trim() !== "") {
        const logNum = parseFloat(logValue);
        if (!isNaN(logNum) && logNum > 0) {
          // Fetch existing record for today
          const { data: existing } = await supabase
            .from("measurements")
            .select("*")
            .eq("profile_id", asvandId)
            .eq("date", todayStr)
            .maybeSingle();

          const updateFields = {
            profile_id: asvandId,
            date: todayStr,
            [key]: logNum
          };

          if (existing) {
            const { error } = await supabase
              .from("measurements")
              .update(updateFields)
              .eq("id", existing.id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from("measurements")
              .insert(updateFields);
            if (error) throw error;
          }
        }
      }

      setStatusMsg({ key, type: "success", text: "Successfully saved!" });
      setLogValue("");
      setGoalValue("");
      loadData(asvandId);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg({ key, type: "error", text: err.message || "Failed to save data" });
    } finally {
      setSubmitting(false);
    }
  };

  const getStats = (key: keyof Omit<MeasurementRecord, "id" | "date">, config: MeasurementConfig) => {
    const values = records
      .map(r => r[key] as number | null)
      .filter((v): v is number => v !== null && v > 0);

    const current = values.length > 0 ? values[0] : null;
    const highest = values.length > 0 ? Math.max(...values) : null;
    const lowest = values.length > 0 ? Math.min(...values) : null;
    const best = config.isLossGoal ? lowest : highest;
    const goal = goals[key] || null;

    // Dynamic loss goal check for weight (if goal is lower than current)
    const isLoss = config.isLossGoal || (key === "weight_kg" && goal && current && current > goal);

    return { current, highest, lowest, best, goal, isLoss };
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
        <div className="flex items-center gap-3 mb-5 pt-2">
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

        {/* Spec Cards list */}
        <div className="flex flex-col gap-3.5 mb-6">
          {MEASUREMENT_CONFIGS.map(cfg => {
            const { current, highest, lowest, best, goal, isLoss } = getStats(cfg.key, cfg);
            const isExpanded = expandedKey === cfg.key;

            // Compute Difference/Progress String
            let diffStr = "";
            let progressPercent = 0;
            if (goal && current) {
              if (isLoss) {
                const diff = current - goal;
                diffStr = diff <= 0 ? "Goal Met! 🎉" : `${diff.toFixed(1)} ${cfg.unit} remaining`;
                // progress calculation for loss: starting from highest or a reasonable offset
                const baseVal = highest && highest > goal ? highest : current + 5;
                const totalRange = baseVal - goal;
                const currentProgress = baseVal - current;
                progressPercent = totalRange > 0 ? Math.min(100, Math.max(0, (currentProgress / totalRange) * 100)) : 100;
              } else {
                const diff = goal - current;
                diffStr = diff <= 0 ? "Goal Met! 🎉" : `${diff.toFixed(1)} ${cfg.unit} remaining`;
                progressPercent = Math.min(100, Math.max(0, (current / goal) * 100));
              }
            }

            return (
              <Card key={cfg.key} className="p-0 overflow-hidden border border-border">
                <div
                  onClick={() => {
                    setExpandedKey(isExpanded ? null : cfg.key);
                    setLogValue("");
                    setGoalValue("");
                    setStatusMsg(null);
                  }}
                  className="flex justify-between items-center p-4 bg-surface1 hover:bg-surface2/60 cursor-pointer transition-colors"
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">{cfg.emoji}</span>
                      <span className="text-sm font-bold text-white">{cfg.label}</span>
                    </div>

                    {goal ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-secondary font-semibold">
                          {isLoss ? (
                            <>Target: {goal} {cfg.unit} • Progress: {current ? `${current} → ${goal}` : "No Logs"}</>
                          ) : (
                            <>Target: {goal} {cfg.unit} • Progress: {current ? `${current} / ${goal}` : "No Logs"}</>
                          )}
                        </span>
                        {/* Progress Bar */}
                        <div className="w-full bg-[#1F1F1F] h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-accent h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-secondary font-semibold italic">No target set</span>
                    )}
                  </div>

                  <div className="text-right flex flex-col items-end justify-center">
                    <span className="text-base font-extrabold text-white leading-none">
                      {current ? `${current} ${cfg.unit}` : "—"}
                    </span>
                    <span className="text-[9px] text-secondary mt-1 block">
                      Best: {best ? `${best} ${cfg.unit}` : "—"}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 pt-3 bg-surface1 border-t border-border/20 flex flex-col gap-4">
                    {/* Stats details grid */}
                    <div className="grid grid-cols-3 gap-2 text-center bg-surface2/40 border border-border/30 rounded-xl p-3">
                      <div>
                        <span className="text-[9px] text-secondary uppercase block mb-0.5">Highest</span>
                        <span className="text-xs font-bold text-white">{highest ? `${highest} ${cfg.unit}` : "—"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-secondary uppercase block mb-0.5">Lowest</span>
                        <span className="text-xs font-bold text-white">{lowest ? `${lowest} ${cfg.unit}` : "—"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-secondary uppercase block mb-0.5">Difference</span>
                        <span className="text-xs font-bold text-accent">{diffStr || "No goal"}</span>
                      </div>
                    </div>

                    {/* Inline Log / Set Target Forms */}
                    <div className="grid grid-cols-2 gap-3.5 mt-1">
                      <div>
                        <label className="text-[10px] text-secondary uppercase block mb-1">Log Today</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder={current ? `e.g. ${current}` : `e.g. 70`}
                          value={logValue}
                          onChange={(e) => setLogValue(e.target.value)}
                          className="w-full bg-[#111111] py-2 px-2.5 border border-[#2A2A2A] rounded-xl text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-secondary uppercase block mb-1">Set Goal</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder={goal ? `e.g. ${goal}` : `e.g. 75`}
                          value={goalValue}
                          onChange={(e) => setGoalValue(e.target.value)}
                          className="w-full bg-[#111111] py-2 px-2.5 border border-[#2A2A2A] rounded-xl text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {statusMsg && statusMsg.key === cfg.key && (
                      <p className={`text-[10px] font-bold ${statusMsg.type === "success" ? "text-success" : "text-danger"}`}>
                        {statusMsg.text}
                      </p>
                    )}

                    <button
                      onClick={() => handleSaveConfig(cfg.key)}
                      disabled={submitting}
                      className="btn btn-primary text-xs font-bold py-2 w-full"
                    >
                      {submitting ? "Saving..." : "Save Spec"}
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Historical Logs List */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Historical Logs</p>
          {records.length === 0 ? (
            <Card className="text-center py-6 text-xs text-secondary italic border border-border">
              No measurements recorded yet
            </Card>
          ) : (
            records.slice(0, 8).map((r) => (
              <Card key={r.id} className="border border-border/40">
                <div className="flex justify-between items-center mb-2 border-b border-border/10 pb-1.5">
                  <span className="text-white font-bold text-xs">{r.date}</span>
                  {r.weight_kg && <span className="text-xs text-accent font-extrabold">{r.weight_kg} kg</span>}
                </div>
                <div className="grid grid-cols-3 gap-y-1.5 gap-x-2 mt-2">
                  {r.wrist_cm && <div className="text-[10px] text-secondary">Wrist: <span className="text-white font-medium">{r.wrist_cm}cm</span></div>}
                  {r.waist_cm && <div className="text-[10px] text-secondary">Waist: <span className="text-white font-medium">{r.waist_cm}cm</span></div>}
                  {r.arm_cm && <div className="text-[10px] text-secondary">Arm: <span className="text-white font-medium">{r.arm_cm}cm</span></div>}
                  {r.forearm_cm && <div className="text-[10px] text-secondary">Forearm: <span className="text-white font-medium">{r.forearm_cm}cm</span></div>}
                  {r.chest_cm && <div className="text-[10px] text-secondary">Chest: <span className="text-white font-medium">{r.chest_cm}cm</span></div>}
                  {r.hip_cm && <div className="text-[10px] text-secondary">Hip: <span className="text-white font-medium">{r.hip_cm}cm</span></div>}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
      <NavBar />
    </div>
  );
}
