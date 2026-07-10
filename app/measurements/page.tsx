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
  
  // Modal Edit States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formCurrents, setFormCurrents] = useState<Record<string, string>>({});
  const [formGoals, setFormGoals] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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

  const getStats = (key: keyof Omit<MeasurementRecord, "id" | "date">, config: MeasurementConfig) => {
    const values = records
      .map(r => r[key] as number | null)
      .filter((v): v is number => v !== null && v > 0);

    const current = values.length > 0 ? values[0] : null;
    const highest = values.length > 0 ? Math.max(...values) : null;
    const lowest = values.length > 0 ? Math.min(...values) : null;
    const best = config.isLossGoal ? lowest : highest;
    const goal = goals[key] || null;

    return { current, highest, lowest, best, goal };
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

      // 2. Fetch existing measurements record for today
      const { data: existing } = await supabase
        .from("measurements")
        .select("*")
        .eq("profile_id", asvandId)
        .eq("date", todayStr)
        .maybeSingle();

      const updateFields: any = {
        profile_id: asvandId,
        date: todayStr
      };

      MEASUREMENT_CONFIGS.forEach(cfg => {
        const currentVal = parseFloat(formCurrents[cfg.key]);
        // If there's an input value, use it. Otherwise, carry over from existing today's record, or keep null.
        updateFields[cfg.key] = !isNaN(currentVal) && currentVal > 0 
          ? currentVal 
          : (existing ? existing[cfg.key] : null);
      });

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

      setIsEditOpen(false);
      loadData(asvandId);
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
            const { current, best, goal } = getStats(cfg.key, cfg);
            return (
              <Card key={cfg.key} className="p-4 border border-border bg-surface1">
                <div className="flex items-center gap-2 mb-2 border-b border-border/10 pb-1.5">
                  <span className="text-lg">{cfg.emoji}</span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{cfg.label}</span>
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
              </Card>
            );
          })}
        </div>

        {/* EDIT DIALOG (MODAL) */}
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000]/80 animate-fade-in">
            <div className="w-full max-w-sm bg-surface1 border border-border rounded-2xl overflow-hidden shadow-2xl animate-slide-up max-h-[85vh] flex flex-col">
              
              <div className="p-4 border-b border-border flex justify-between items-center">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Edit Specs & Goals</span>
                <button onClick={() => setIsEditOpen(false)} className="text-secondary hover:text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSaveAll} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
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
                  {submitting ? "Saving..." : "Save Specs & Goals"}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
      <NavBar />
    </div>
  );
}
