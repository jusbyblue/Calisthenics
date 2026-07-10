"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { NavBar } from "@/components/ui/NavBar";
import { Card, CardLabel } from "@/components/ui/Card";

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

export default function AsvandMeasurementsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [asvandId, setAsvandId] = useState<string | null>(null);

  // States
  const [records, setRecords] = useState<MeasurementRecord[]>([]);
  const [wrist, setWrist] = useState("");
  const [waist, setWaist] = useState("");
  const [arm, setArm] = useState("");
  const [forearm, setForearm] = useState("");
  const [chest, setChest] = useState("");
  const [hip, setHip] = useState("");
  const [weight, setWeight] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asvandId) return;

    setSubmitting(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];

      const { error } = await supabase
        .from("measurements")
        .insert({
          profile_id: asvandId,
          date: todayStr,
          wrist_cm: wrist ? parseFloat(wrist) : null,
          waist_cm: waist ? parseFloat(waist) : null,
          arm_cm: arm ? parseFloat(arm) : null,
          forearm_cm: forearm ? parseFloat(forearm) : null,
          chest_cm: chest ? parseFloat(chest) : null,
          hip_cm: hip ? parseFloat(hip) : null,
          weight_kg: weight ? parseFloat(weight) : null
        });

      if (error) throw error;

      setStatusMsg({ type: "success", text: "Logged successfully!" });
      setWrist("");
      setWaist("");
      setArm("");
      setForearm("");
      setChest("");
      setHip("");
      setWeight("");
      loadData(asvandId);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to log measurements" });
    } finally {
      setSubmitting(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-[#0A0A0A]">
        <div className="w-8 h-8 border-4 border-[#4A9EFF] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#888888] text-sm mt-4 font-semibold animate-pulse">Syncing body measurements...</p>
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
          <h1 className="text-2xl font-bold text-white">Body Measurements</h1>
        </div>

        {/* Form */}
        <Card>
          <CardLabel>Log Measurements today</CardLabel>
          <form onSubmit={handleLog} className="flex flex-col gap-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-secondary uppercase block mb-1">Wrist (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 16.5"
                  value={wrist}
                  onChange={(e) => setWrist(e.target.value)}
                  className="w-full bg-[#111111] py-2 px-3 border border-[#2A2A2A] rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-secondary uppercase block mb-1">Waist (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 82.0"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  className="w-full bg-[#111111] py-2 px-3 border border-[#2A2A2A] rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-secondary uppercase block mb-1">Arm (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 34.0"
                  value={arm}
                  onChange={(e) => setArm(e.target.value)}
                  className="w-full bg-[#111111] py-2 px-3 border border-[#2A2A2A] rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-secondary uppercase block mb-1">Forearm (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 28.5"
                  value={forearm}
                  onChange={(e) => setForearm(e.target.value)}
                  className="w-full bg-[#111111] py-2 px-3 border border-[#2A2A2A] rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-secondary uppercase block mb-1">Chest (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 96.0"
                  value={chest}
                  onChange={(e) => setChest(e.target.value)}
                  className="w-full bg-[#111111] py-2 px-3 border border-[#2A2A2A] rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-secondary uppercase block mb-1">Hip (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 90.0"
                  value={hip}
                  onChange={(e) => setHip(e.target.value)}
                  className="w-full bg-[#111111] py-2 px-3 border border-[#2A2A2A] rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-secondary uppercase block mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 71.0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-[#111111] py-2 px-3 border border-[#2A2A2A] rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            {statusMsg && (
              <p className={`text-xs font-bold ${statusMsg.type === "success" ? "text-success" : "text-danger"}`}>
                {statusMsg.text}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn btn-primary text-xs font-bold py-2.5">
              {submitting ? "Saving..." : "Save Record"}
            </button>
          </form>
        </Card>

        {/* History */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Historical Logs</p>
          {records.length === 0 ? (
            <Card className="text-center py-6 text-xs text-secondary italic">
              No measurements recorded yet
            </Card>
          ) : (
            records.map((r) => (
              <Card key={r.id}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-bold text-xs">{r.date}</span>
                  {r.weight_kg && <span className="text-xs text-accent font-bold">{r.weight_kg} kg</span>}
                </div>
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {r.wrist_cm && <div className="text-[10px] text-secondary">Wrist: {r.wrist_cm}cm</div>}
                  {r.waist_cm && <div className="text-[10px] text-secondary">Waist: {r.waist_cm}cm</div>}
                  {r.arm_cm && <div className="text-[10px] text-secondary">Arm: {r.arm_cm}cm</div>}
                  {r.forearm_cm && <div className="text-[10px] text-secondary">Forearm: {r.forearm_cm}cm</div>}
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
