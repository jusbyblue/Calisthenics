"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { NavBar } from "@/components/ui/NavBar";
import { Card, CardLabel } from "@/components/ui/Card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

interface WeightLog {
  id: string;
  date: string;
  weight_kg: number;
}

export default function AsvandWeightPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [asvandId, setAsvandId] = useState<string | null>(null);

  // States
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [filter, setFilter] = useState<"3m" | "1y" | "all">("3m");
  const [weightInput, setWeightInput] = useState("");
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const loadWeightData = async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from("health_logs")
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
    } catch (err) {
      console.error("Error loading weight logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "asvand")
        .single();
      
      if (profile) {
        setAsvandId(profile.id);
        loadWeightData(profile.id);
      } else {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus(null);
    if (!asvandId || !weightInput) return;

    const val = parseFloat(weightInput);
    if (isNaN(val) || val <= 0) {
      setSubmitStatus({ type: "error", msg: "Please enter a valid weight" });
      return;
    }

    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const { error } = await supabase.rpc("log_health_metric", {
        p_profile_id: asvandId,
        p_date: todayStr,
        p_metric: "weight_kg",
        p_value: val,
      });

      if (error) throw error;

      setSubmitStatus({ type: "success", msg: "Weight logged successfully!" });
      setWeightInput("");
      loadWeightData(asvandId);
    } catch (err: any) {
      setSubmitStatus({ type: "error", msg: err.message || "Failed to log weight" });
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
    <div className="page" style={{ background: "var(--bg)" }}>
      <div className="page-content pb-24">
        {/* Back navigation & Title */}
        <div className="flex items-center gap-3 mb-2 pt-2">
          <button
            onClick={() => router.push("/")}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#1A1A1A] border border-[#2A2A2A] text-white active:scale-95 transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-white">Weight Tracker</h1>
        </div>

        {/* Current Weight Card */}
        <Card>
          <CardLabel>Current Weight</CardLabel>
          <span className="value-lg text-success">{latestWeight ? `${latestWeight} kg` : "—"}</span>
        </Card>

        {/* Graph Card */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <CardLabel>History Trend</CardLabel>
            {/* Filter Buttons */}
            <div className="flex gap-1.5 border border-[#2A2A2A] rounded-xl p-1 bg-[#111111]">
              {(["3m", "1y", "all"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilter(opt)}
                  className={`text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg transition-all ${
                    filter === opt ? "bg-accent text-black shadow" : "text-secondary hover:text-white"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {chartData.length > 1 ? (
            <div style={{ width: "100%", height: "180px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <XAxis dataKey="date" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={9} domain={["auto", "auto"]} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#111111", borderColor: "#2A2A2A" }} />
                  <Line type="monotone" dataKey="weight_kg" stroke="#4A9EFF" strokeWidth={2} dot={true} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-secondary italic py-8 text-center">Add more weight logs to see trend chart</p>
          )}
        </Card>

        {/* Input Form */}
        <Card>
          <CardLabel>Log weight today</CardLabel>
          <form onSubmit={handleLogWeight} className="flex gap-2 mt-2">
            <input
              type="number"
              step="0.1"
              required
              placeholder="e.g. 71.2"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="flex-1 bg-[#111111] py-2.5 px-3 border border-[#2A2A2A] rounded-xl text-sm font-semibold text-white focus:outline-none"
            />
            <button type="submit" className="btn btn-primary py-2.5 text-xs font-bold">Save</button>
          </form>
          {submitStatus && (
            <p className={`text-xs font-bold mt-2 ${submitStatus.type === "success" ? "text-success" : "text-danger"}`}>
              {submitStatus.msg}
            </p>
          )}
        </Card>
      </div>

      <NavBar />
    </div>
  );
}
