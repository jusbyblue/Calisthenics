"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { NavBar } from "@/components/ui/NavBar";
import { Card, CardInner, CardLabel } from "@/components/ui/Card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { ChevronLeft, Scale } from "lucide-react";
import { ASVAND_PROFILE_ID } from "@/lib/appConfig";
import { getLocalDateString } from "@/lib/dateUtils";

interface WeightLog {
  id: string;
  date: string;
  weight_kg: number;
}

export default function AsvandWeightPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // States
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [filter, setFilter] = useState<"3m" | "1y" | "all">("3m");
  const [weightInput, setWeightInput] = useState("");
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const loadWeightData = async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from("measurements")
        .select("id, date, weight_kg")
        .eq("profile_id", profileId)
        .not("weight_kg", "is", null)
        .order("date", { ascending: true });

      if (error) throw error;

      const formatted: WeightLog[] = (data || []).map(d => ({
        id: d.id,
        date: d.date,
        weight_kg: Number(d.weight_kg) || 0,
      }));

      setWeightLogs(formatted);
    } catch (err: any) {
      console.error("Error loading weight logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeightData(ASVAND_PROFILE_ID);
  }, []);

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus(null);
    if (submitting || !weightInput) return;

    const raw = weightInput.trim();
    if (raw === "") return;

    const val = Number(raw);
    if (isNaN(val) || !Number.isFinite(val) || val <= 0 || val >= 1000) {
      setSubmitStatus({ type: "error", msg: "Please enter a valid positive weight under 1000 kg." });
      return;
    }

    setSubmitting(true);
    try {
      const todayStr = getLocalDateString();
      const { data: existing, error: selectErr } = await supabase
        .from("measurements")
        .select("*")
        .eq("profile_id", ASVAND_PROFILE_ID)
        .eq("date", todayStr)
        .maybeSingle();

      if (selectErr) throw selectErr;

      if (existing) {
        const { error: updateErr } = await supabase
          .from("measurements")
          .update({ weight_kg: val })
          .eq("id", existing.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from("measurements")
          .insert({
            profile_id: ASVAND_PROFILE_ID,
            date: todayStr,
            weight_kg: val
          });
        if (insertErr) throw insertErr;
      }

      setSubmitStatus({ type: "success", msg: "Weight logged successfully!" });
      setWeightInput("");
      loadWeightData(ASVAND_PROFILE_ID);
    } catch (err: any) {
      setSubmitStatus({ type: "error", msg: err.message || "Failed to log weight" });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter logs for graph
  const getFilteredChartData = () => {
    if (weightLogs.length === 0) return [];
    const now = new Date();
    let cutoff = new Date();

    if (filter === "3m") {
      cutoff.setMonth(now.getMonth() - 3);
    } else if (filter === "1y") {
      cutoff.setFullYear(now.getFullYear() - 1);
    } else {
      return weightLogs;
    }

    return weightLogs.filter(log => new Date(log.date) >= cutoff);
  };

  const chartData = getFilteredChartData();
  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight_kg : null;

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-[#0A0A0A]">
        <div className="w-8 h-8 border-4 border-[#4A9EFF] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#888888] text-sm mt-4 font-semibold animate-pulse">Syncing weight history...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-content pb-24">
        {/* Back navigation & Title */}
        <div className="flex items-center gap-4 mb-6 pt-2">
          <button
            onClick={() => router.push("/")}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface1 border border-border text-primary active:scale-95 transition-all hover:bg-surface2 cursor-pointer shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-black text-primary tracking-tight">Weight Tracker</h1>
        </div>

        <div className="flex flex-col gap-5">
          {/* Current Weight Card */}
          <Card className="bg-surface1 overflow-hidden relative">
            <CardInner className="flex items-center gap-5 p-5 z-10 relative">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border-2 border-accent/20 flex items-center justify-center text-accent shadow-[0_0_15px_rgba(74,158,255,0.15)]">
                <Scale size={24} />
              </div>
              <div>
                <span className="text-[10px] text-muted font-bold tracking-wider uppercase block mb-1">Current Weight</span>
                <div className="text-4xl font-black text-primary tabular-nums tracking-tight leading-none">
                  {latestWeight ? `${latestWeight} ` : "—"}
                  {latestWeight && <span className="text-base text-muted font-bold ml-1 tracking-normal">kg</span>}
                </div>
              </div>
            </CardInner>
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          </Card>

          {/* Graph Card */}
          <Card className="px-0 pt-5 pb-0 bg-surface1">
            <div className="flex justify-between items-center px-5 mb-6">
              <span className="text-[10px] text-muted font-bold tracking-wider uppercase">History Trend</span>
              {/* Filter Buttons */}
              <div className="flex gap-1 border border-border/50 rounded-lg p-1 bg-surface2/50">
                {(["3m", "1y", "all"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFilter(opt)}
                    className={`text-[9px] font-bold uppercase px-3 py-1.5 rounded-md transition-colors tabular-nums tracking-wider ${
                      filter === opt ? "bg-accent text-background shadow-[0_0_10px_rgba(74,158,255,0.2)]" : "text-muted hover:text-primary hover:bg-surface3/50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {chartData.length > 1 ? (
              <div style={{ width: "100%", height: "240px" }} className="mt-2 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4A9EFF" stopOpacity={0.2}/>
                        <stop offset="100%" stopColor="#4A9EFF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="#888888" 
                      fontSize={9}
                      fontWeight="bold"
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => {
                        const date = new Date(val);
                        return `${date.getMonth()+1}/${date.getDate()}`;
                      }}
                      dy={10}
                      className="font-mono uppercase tracking-wider"
                      opacity={0.5}
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={9}
                      fontWeight="bold"
                      domain={['dataMin - 1', 'dataMax + 1']} 
                      tickLine={false} 
                      axisLine={false}
                      tickCount={5}
                      dx={-10}
                      className="font-mono uppercase tracking-wider"
                      opacity={0.5}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: "rgba(10, 10, 15, 0.95)", 
                        borderColor: "rgba(255,255,255,0.05)", 
                        borderRadius: "12px",
                        backdropFilter: "blur(12px)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                        padding: "12px 16px"
                      }} 
                      itemStyle={{ color: "#fff", fontSize: "14px", fontWeight: "900", fontFamily: "monospace" }}
                      labelStyle={{ color: "#888", fontSize: "9px", textTransform: "uppercase", fontWeight: "bold", marginBottom: "6px", letterSpacing: "0.05em" }}
                      formatter={(value: any) => [`${value} kg`, 'WEIGHT']}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      }}
                      cursor={{ stroke: 'rgba(74,158,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="weight_kg" 
                      stroke="#4A9EFF" 
                      strokeWidth={2}
                      activeDot={{ r: 4, fill: "#4A9EFF", stroke: "#0A0A0F", strokeWidth: 2 }}
                      fill="url(#colorWeight)" 
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center border-t border-border/30 mx-5 mt-4">
                <span className="text-muted text-[10px] font-bold uppercase tracking-wider">No trend data</span>
              </div>
            )}
          </Card>

          {/* Input Form */}
          <Card className="bg-surface1 p-5 border-border shadow-sm">
            <span className="text-[10px] text-muted font-bold tracking-wider uppercase block mb-3">Log weight today</span>
            <form onSubmit={handleLogWeight} className="flex gap-3">
              <input
                type="number"
                step="0.1"
                required
                placeholder="e.g. 71.2"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="flex-1 bg-surface2 py-3 px-4 border border-border/50 rounded-xl text-sm font-bold text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all tabular-nums placeholder:text-muted/50"
              />
              <button
                type="submit"
                disabled={submitting}
                className={`px-8 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                  submitting 
                    ? "bg-surface2 text-muted cursor-not-allowed" 
                    : "bg-accent text-background hover:bg-accent/90 active:scale-95 shadow-[0_0_15px_rgba(74,158,255,0.2)]"
                }`}
              >
                {submitting ? "Saving" : "Save"}
              </button>
            </form>
            {submitStatus && (
              <p className={`text-[10px] font-bold uppercase tracking-wider mt-3 px-2 ${submitStatus.type === "success" ? "text-success" : "text-danger"}`}>
                {submitStatus.msg}
              </p>
            )}
          </Card>
        </div>
      </div>
      <NavBar />
    </div>
  );
}
