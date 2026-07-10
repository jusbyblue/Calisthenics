"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { NavBar } from "@/components/ui/NavBar";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface SkillItem {
  id?: string;
  exercise_name: string;
  path: "legs" | "push" | "pull" | "core" | "skills" | "elite";
  mastery_percent: number;
  learned: boolean;
  correct_form: boolean;
  reps: number;
  target_reps: number;
  sessions_hit: number;
}

// Unified exercise catalog with unlock requirements and mastery targets
interface CatalogItem {
  name: string;
  path: "legs" | "push" | "pull" | "core" | "skills" | "elite";
  unlock_req: string;
  mastery_req: string;
  target_reps: number;
}

const GUILD_CATALOG: CatalogItem[] = [
  // Legs (33 items)
  { name: "Air Squat", path: "legs", unlock_req: "3 × 10", mastery_req: "3 × 25", target_reps: 25 },
  { name: "Box Squat", path: "legs", unlock_req: "3 × 12", mastery_req: "3 × 25", target_reps: 25 },
  { name: "Tempo Squat (3 sec down)", path: "legs", unlock_req: "3 × 8", mastery_req: "3 × 15", target_reps: 15 },
  { name: "Pause Squat (2 sec bottom)", path: "legs", unlock_req: "3 × 8", mastery_req: "3 × 15", target_reps: 15 },
  { name: "Narrow Squat", path: "legs", unlock_req: "3 × 10", mastery_req: "3 × 25", target_reps: 25 },
  { name: "Standard Squat", path: "legs", unlock_req: "3 × 10", mastery_req: "3 × 25", target_reps: 25 },
  { name: "Wide Squat", path: "legs", unlock_req: "3 × 10", mastery_req: "3 × 25", target_reps: 25 },
  { name: "Sumo Squat", path: "legs", unlock_req: "3 × 10", mastery_req: "3 × 25", target_reps: 25 },
  { name: "Squat Pulse", path: "legs", unlock_req: "3 × 15", mastery_req: "3 × 30", target_reps: 30 },
  { name: "Jump Squat", path: "legs", unlock_req: "3 × 8", mastery_req: "3 × 20", target_reps: 20 },
  { name: "180° Jump Squat", path: "legs", unlock_req: "3 × 8", mastery_req: "3 × 15", target_reps: 15 },
  { name: "Split Squat", path: "legs", unlock_req: "3 × 8", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Reverse Lunge", path: "legs", unlock_req: "3 × 8", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Walking Lunge", path: "legs", unlock_req: "3 × 8", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Bulgarian Split Squat", path: "legs", unlock_req: "3 × 8", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Cossack Squat", path: "legs", unlock_req: "3 × 8", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Shrimp Squat Assisted", path: "legs", unlock_req: "3 × 8", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Shrimp Squat", path: "legs", unlock_req: "3 × 5", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Assisted Pistol", path: "legs", unlock_req: "3 × 5", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Box Pistol", path: "legs", unlock_req: "3 × 5", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Negative Pistol", path: "legs", unlock_req: "3 × 5", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Pistol Squat", path: "legs", unlock_req: "3 × 5", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Paused Pistol", path: "legs", unlock_req: "3 × 5", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Weighted Pistol", path: "legs", unlock_req: "3 × 5", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Jumping Pistol", path: "legs", unlock_req: "3 × 5", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Dragon Pistol", path: "legs", unlock_req: "3 × 5", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Glute Bridge", path: "legs", unlock_req: "3 × 10", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Single Leg Glute Bridge", path: "legs", unlock_req: "3 × 8", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Nordic Curl Assisted", path: "legs", unlock_req: "3 × 5", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Nordic Curl Negative", path: "legs", unlock_req: "3 × 5", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Nordic Curl", path: "legs", unlock_req: "3 × 3", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Single Leg Nordic Curl", path: "legs", unlock_req: "3 × 1", mastery_req: "3 × 20", target_reps: 20 },
  { name: "LEG MASTER", path: "legs", unlock_req: "1 × 1", mastery_req: "1 × 1", target_reps: 1 },

  // Push (40 items)
  { name: "Wall Push-up", path: "push", unlock_req: "3 × 10", mastery_req: "3 × 20", target_reps: 20 },
  { name: "High Incline Push-up", path: "push", unlock_req: "3 × 10", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Incline Push-up", path: "push", unlock_req: "3 × 10", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Knee Push-up", path: "push", unlock_req: "3 × 10", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Negative Push-up", path: "push", unlock_req: "3 × 8", mastery_req: "3 × 15", target_reps: 15 },
  { name: "Standard Push-up", path: "push", unlock_req: "3 × 10", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Wide Push-up", path: "push", unlock_req: "3 × 10", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Decline Push-up", path: "push", unlock_req: "3 × 10", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Ring Push-up", path: "push", unlock_req: "3 × 8", mastery_req: "3 × 15", target_reps: 15 },
  { name: "Deep Ring Push-up", path: "push", unlock_req: "3 × 6", mastery_req: "3 × 12", target_reps: 12 },
  { name: "Diamond Push-up", path: "push", unlock_req: "3 × 8", mastery_req: "3 × 15", target_reps: 15 },
  { name: "Archer Push-up", path: "push", unlock_req: "3 × 6", mastery_req: "3 × 12", target_reps: 12 },
  { name: "Pseudo Planche Push-up", path: "push", unlock_req: "3 × 5", mastery_req: "3 × 10", target_reps: 10 },
  { name: "One-Arm Incline Push-up", path: "push", unlock_req: "3 × 5", mastery_req: "3 × 10", target_reps: 10 },
  { name: "One-Arm Push-up", path: "push", unlock_req: "3 × 3", mastery_req: "3 × 8", target_reps: 8 },
  { name: "Dips (Bench)", path: "push", unlock_req: "3 × 10", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Standard Dips", path: "push", unlock_req: "3 × 8", mastery_req: "3 × 15", target_reps: 15 },
  { name: "Ring Dips", path: "push", unlock_req: "3 × 5", mastery_req: "3 × 12", target_reps: 12 },
  { name: "Weighted Dips", path: "push", unlock_req: "3 × 5", mastery_req: "3 × 10", target_reps: 10 },
  { name: "Pike Push-up", path: "push", unlock_req: "3 × 6", mastery_req: "3 × 12", target_reps: 12 },
  { name: "Elevated Pike Push-up", path: "push", unlock_req: "3 × 5", mastery_req: "3 × 10", target_reps: 10 },
  { name: "Wall Handstand Kick-up", path: "push", unlock_req: "3 × 3", mastery_req: "3 × 8", target_reps: 8 },
  { name: "Wall Handstand Hold", path: "push", unlock_req: "Hold 10s", mastery_req: "Hold 30s", target_reps: 30 },
  { name: "Freestanding Handstand Hold", path: "push", unlock_req: "Hold 5s", mastery_req: "Hold 15s", target_reps: 15 },
  { name: "Handstand Wall Walk", path: "push", unlock_req: "3 × 3", mastery_req: "3 × 8", target_reps: 8 },
  { name: "Handstand Shoulder Tap", path: "push", unlock_req: "3 × 4", mastery_req: "3 × 10", target_reps: 10 },
  { name: "Handstand Push-up", path: "push", unlock_req: "3 × 1", mastery_req: "3 × 5", target_reps: 5 },
  { name: "90 Degree Push-up", path: "push", unlock_req: "1 × 1", mastery_req: "3 × 3", target_reps: 3 },
  { name: "L-Sit to Handstand Press", path: "push", unlock_req: "1 × 1", mastery_req: "3 × 3", target_reps: 3 },
  { name: "Clap Push-up", path: "push", unlock_req: "3 × 5", mastery_req: "3 × 12", target_reps: 12 },
  { name: "Superman Push-up", path: "push", unlock_req: "3 × 3", mastery_req: "3 × 8", target_reps: 8 },
  { name: "Explosive Dips", path: "push", unlock_req: "3 × 5", mastery_req: "3 × 10", target_reps: 10 },
  { name: "Planche Lean", path: "push", unlock_req: "Hold 10s", mastery_req: "Hold 25s", target_reps: 25 },
  { name: "Tuck Planche", path: "push", unlock_req: "Hold 3s", mastery_req: "Hold 12s", target_reps: 12 },
  { name: "Advanced Tuck Planche", path: "push", unlock_req: "Hold 3s", mastery_req: "Hold 10s", target_reps: 10 },
  { name: "Straddle Planche Lean", path: "push", unlock_req: "Hold 5s", mastery_req: "Hold 15s", target_reps: 15 },
  { name: "Straddle Planche Hold", path: "push", unlock_req: "Hold 2s", mastery_req: "Hold 8s", target_reps: 8 },
  { name: "Full Planche", path: "push", unlock_req: "Hold 1s", mastery_req: "Hold 5s", target_reps: 5 },
  { name: "One-Arm Handstand", path: "push", unlock_req: "Hold 1s", mastery_req: "Hold 5s", target_reps: 5 },
  { name: "PUSH MASTER", path: "push", unlock_req: "1 × 1", mastery_req: "1 × 1", target_reps: 1 },

  // Pull (40 items)
  { name: "Dead Hang", path: "pull", unlock_req: "Hold 20s", mastery_req: "Hold 60s", target_reps: 60 },
  { name: "Scapular Pull-up", path: "pull", unlock_req: "3 × 8", mastery_req: "3 × 15", target_reps: 15 },
  { name: "Australian Row", path: "pull", unlock_req: "3 × 8", mastery_req: "3 × 15", target_reps: 15 },
  { name: "Inverted Row", path: "pull", unlock_req: "3 × 8", mastery_req: "3 × 15", target_reps: 15 },
  { name: "Jackknife Pull-up", path: "pull", unlock_req: "3 × 6", mastery_req: "3 × 12", target_reps: 12 },
  { name: "Negative Chin-up", path: "pull", unlock_req: "3 × 5", mastery_req: "3 × 10", target_reps: 10 },
  { name: "Chin-up", path: "pull", unlock_req: "3 × 6", mastery_req: "3 × 12", target_reps: 12 },
  { name: "Neutral Grip Pull-up", path: "pull", unlock_req: "3 × 6", mastery_req: "3 × 12", target_reps: 12 },
  { name: "Standard Pull-up", path: "pull", unlock_req: "3 × 6", mastery_req: "3 × 12", target_reps: 12 },
  { name: "L-Sit Pull-up", path: "pull", unlock_req: "3 × 4", mastery_req: "3 × 8", target_reps: 8 },
  { name: "Weighted Pull-up", path: "pull", unlock_req: "3 × 4", mastery_req: "3 × 8", target_reps: 8 },
  { name: "Wide Grip Pull-up", path: "pull", unlock_req: "3 × 5", mastery_req: "3 × 10", target_reps: 10 },
  { name: "Commando Pull-up", path: "pull", unlock_req: "3 × 6", mastery_req: "3 × 12", target_reps: 12 },
  { name: "Towel Pull-up", path: "pull", unlock_req: "3 × 5", mastery_req: "3 × 10", target_reps: 10 },
  { name: "Archer Pull-up", path: "pull", unlock_req: "3 × 4", mastery_req: "3 × 8", target_reps: 8 },
  { name: "High Pull-up (Chest-to-bar)", path: "pull", unlock_req: "3 × 4", mastery_req: "3 × 8", target_reps: 8 },
  { name: "Kipping Muscle-up", path: "pull", unlock_req: "3 × 2", mastery_req: "3 × 8", target_reps: 8 },
  { name: "Clean Muscle-up", path: "pull", unlock_req: "3 × 1", mastery_req: "3 × 6", target_reps: 6 },
  { name: "L-Sit Muscle-up", path: "pull", unlock_req: "3 × 1", mastery_req: "3 × 5", target_reps: 5 },
  { name: "Weighted Muscle-up", path: "pull", unlock_req: "3 × 1", mastery_req: "3 × 5", target_reps: 5 },
  { name: "Ring Muscle-up", path: "pull", unlock_req: "3 × 2", mastery_req: "3 × 8", target_reps: 8 },
  { name: "Explosive Pull-up", path: "pull", unlock_req: "3 × 4", mastery_req: "3 × 10", target_reps: 10 },
  { name: "One-Arm Dead Hang", path: "pull", unlock_req: "Hold 10s", mastery_req: "Hold 30s", target_reps: 30 },
  { name: "One-Arm Inverted Row", path: "pull", unlock_req: "3 × 5", mastery_req: "3 × 10", target_reps: 10 },
  { name: "One-Arm Pull-up Assist", path: "pull", unlock_req: "3 × 3", mastery_req: "3 × 8", target_reps: 8 },
  { name: "One-Arm Negative", path: "pull", unlock_req: "3 × 3", mastery_req: "3 × 6", target_reps: 6 },
  { name: "One-Arm Pull-up", path: "pull", unlock_req: "3 × 1", mastery_req: "3 × 5", target_reps: 5 },
  { name: "Back Lever Hold", path: "pull", unlock_req: "Hold 5s", mastery_req: "Hold 15s", target_reps: 15 },
  { name: "Skin the Cat", path: "pull", unlock_req: "3 × 3", mastery_req: "3 × 8", target_reps: 8 },
  { name: "Tuck Front Lever", path: "pull", unlock_req: "Hold 5s", mastery_req: "Hold 15s", target_reps: 15 },
  { name: "Advanced Tuck Front Lever", path: "pull", unlock_req: "Hold 3s", mastery_req: "Hold 10s", target_reps: 10 },
  { name: "Straddle Front Lever", path: "pull", unlock_req: "Hold 2s", mastery_req: "Hold 8s", target_reps: 8 },
  { name: "Full Front Lever", path: "pull", unlock_req: "Hold 1s", mastery_req: "Hold 5s", target_reps: 5 },
  { name: "Pull-up to Front Lever", path: "pull", unlock_req: "3 × 2", mastery_req: "3 × 6", target_reps: 6 },
  { name: "Front Lever Pull-up", path: "pull", unlock_req: "3 × 1", mastery_req: "3 × 5", target_reps: 5 },
  { name: "Tuck Human Flag", path: "pull", unlock_req: "Hold 3s", mastery_req: "Hold 10s", target_reps: 10 },
  { name: "Human Flag Hold", path: "pull", unlock_req: "Hold 1s", mastery_req: "Hold 5s", target_reps: 5 },
  { name: "Dragon Flag", path: "pull", unlock_req: "3 × 3", mastery_req: "3 × 8", target_reps: 8 },
  { name: "Grip Master", path: "pull", unlock_req: "Hold 30s", mastery_req: "Hold 90s", target_reps: 90 },
  { name: "PULL MASTER", path: "pull", unlock_req: "1 × 1", mastery_req: "1 × 1", target_reps: 1 },

  // Core (33 items)
  { name: "Plank", path: "core", unlock_req: "Hold 30s", mastery_req: "Hold 90s", target_reps: 90 },
  { name: "Side Plank", path: "core", unlock_req: "Hold 20s", mastery_req: "Hold 60s", target_reps: 60 },
  { name: "Lying Leg Raise", path: "core", unlock_req: "3 × 8", mastery_req: "3 × 15", target_reps: 15 },
  { name: "Hollow Body Hold", path: "core", unlock_req: "Hold 15s", mastery_req: "Hold 45s", target_reps: 45 },
  { name: "Arch Hold", path: "core", unlock_req: "Hold 15s", mastery_req: "Hold 45s", target_reps: 45 },
  { name: "Knee Raise (Hanging)", path: "core", unlock_req: "3 × 8", mastery_req: "3 × 15", target_reps: 15 },
  { name: "Leg Raise (Hanging)", path: "core", unlock_req: "3 × 6", mastery_req: "3 × 12", target_reps: 12 },
  { name: "Windshield Wiper Assist", path: "core", unlock_req: "3 × 6", mastery_req: "3 × 12", target_reps: 12 },
  { name: "Windshield Wiper", path: "core", unlock_req: "3 × 5", mastery_req: "3 × 10", target_reps: 10 },
  { name: "Toes to Bar", path: "core", unlock_req: "3 × 4", mastery_req: "3 × 10", target_reps: 10 },
  { name: "L-Sit (Parallel Bars)", path: "core", unlock_req: "Hold 5s", mastery_req: "Hold 15s", target_reps: 15 },
  { name: "L-Sit (Floor)", path: "core", unlock_req: "Hold 3s", mastery_req: "Hold 12s", target_reps: 12 },
  { name: "V-Sit", path: "core", unlock_req: "Hold 2s", mastery_req: "Hold 8s", target_reps: 8 },
  { name: "Manna Assist", path: "core", unlock_req: "Hold 3s", mastery_req: "Hold 10s", target_reps: 10 },
  { name: "Manna Hold", path: "core", unlock_req: "Hold 1s", mastery_req: "Hold 5s", target_reps: 5 },
  { name: "Dragon Flag Assist", path: "core", unlock_req: "3 × 4", mastery_req: "3 × 10", target_reps: 10 },
  { name: "Dragon Flag", path: "core", unlock_req: "3 × 3", mastery_req: "3 × 8", target_reps: 8 },
  { name: "Human Flag Tuck Core", path: "core", unlock_req: "Hold 3s", mastery_req: "Hold 10s", target_reps: 10 },
  { name: "Human Flag Straddle Core", path: "core", unlock_req: "Hold 2s", mastery_req: "Hold 8s", target_reps: 8 },
  { name: "Human Flag Hold Core", path: "core", unlock_req: "Hold 1s", mastery_req: "Hold 5s", target_reps: 5 },
  { name: "Ab Wheel Rollout (Knees)", path: "core", unlock_req: "3 × 8", mastery_req: "3 × 15", target_reps: 15 },
  { name: "Ab Wheel Rollout (Feet)", path: "core", unlock_req: "3 × 3", mastery_req: "3 × 8", target_reps: 8 },
  { name: "Standing Cable Crunch", path: "core", unlock_req: "3 × 8", mastery_req: "3 × 15", target_reps: 15 },
  { name: "Russian Twist (Weighted)", path: "core", unlock_req: "3 × 10", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Hanging Rotational Raise", path: "core", unlock_req: "3 × 5", mastery_req: "3 × 10", target_reps: 10 },
  { name: "Core Twister", path: "core", unlock_req: "3 × 8", mastery_req: "3 × 15", target_reps: 15 },
  { name: "Reverse Hyperextension", path: "core", unlock_req: "3 × 10", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Superman Hold", path: "core", unlock_req: "Hold 15s", mastery_req: "Hold 45s", target_reps: 45 },
  { name: "Bird Dog", path: "core", unlock_req: "3 × 10", mastery_req: "3 × 20", target_reps: 20 },
  { name: "Pallof Press", path: "core", unlock_req: "3 × 8", mastery_req: "3 × 15", target_reps: 15 },
  { name: "Plank Walkout", path: "core", unlock_req: "3 × 5", mastery_req: "3 × 10", target_reps: 10 },
  { name: "Core Master (Plank Max)", path: "core", unlock_req: "Hold 60s", mastery_req: "Hold 120s", target_reps: 120 },
  { name: "CORE MASTER", path: "core", unlock_req: "1 × 1", mastery_req: "1 × 1", target_reps: 1 },

  // Skills & Balance (15 items)
  { name: "Crow Pose Hold", path: "skills", unlock_req: "Hold 10s", mastery_req: "Hold 30s", target_reps: 30 },
  { name: "Elbow Lever", path: "skills", unlock_req: "Hold 10s", mastery_req: "Hold 25s", target_reps: 25 },
  { name: "Headstand Hold", path: "skills", unlock_req: "Hold 15s", mastery_req: "Hold 45s", target_reps: 45 },
  { name: "Tripod Transition", path: "skills", unlock_req: "3 × 3", mastery_req: "3 × 8", target_reps: 8 },
  { name: "Kip-Up", path: "skills", unlock_req: "1 × 1", mastery_req: "3 × 3", target_reps: 3 },
  { name: "L-Sit Hold", path: "skills", unlock_req: "Hold 5s", mastery_req: "Hold 15s", target_reps: 15 },
  { name: "V-Sit Hold", path: "skills", unlock_req: "Hold 3s", mastery_req: "Hold 10s", target_reps: 10 },
  { name: "Handstand Kick-up Assist", path: "skills", unlock_req: "3 × 5", mastery_req: "3 × 10", target_reps: 10 },
  { name: "Wall Walk Handstand", path: "skills", unlock_req: "3 × 3", mastery_req: "3 × 8", target_reps: 8 },
  { name: "Freestanding Handstand Attempt", path: "skills", unlock_req: "Hold 3s", mastery_req: "Hold 10s", target_reps: 10 },
  { name: "Handstand Press tuck", path: "skills", unlock_req: "3 × 1", mastery_req: "3 × 5", target_reps: 5 },
  { name: "Back Lever Tuck", path: "skills", unlock_req: "Hold 5s", mastery_req: "Hold 15s", target_reps: 15 },
  { name: "Front Lever Tuck", path: "skills", unlock_req: "Hold 5s", mastery_req: "Hold 15s", target_reps: 15 },
  { name: "Clapping Pull-up", path: "skills", unlock_req: "3 × 3", mastery_req: "3 × 8", target_reps: 8 },
  { name: "SKILLS MASTER", path: "skills", unlock_req: "1 × 1", mastery_req: "1 × 1", target_reps: 1 },

  // Elite Skills (7 items)
  { name: "One-Arm Pull-up", path: "elite", unlock_req: "3 × 1", mastery_req: "3 × 5", target_reps: 5 },
  { name: "One-Arm Handstand Hold", path: "elite", unlock_req: "Hold 3s", mastery_req: "Hold 10s", target_reps: 10 },
  { name: "Full Planche Hold", path: "elite", unlock_req: "Hold 2s", mastery_req: "Hold 8s", target_reps: 8 },
  { name: "Iron Cross (Rings)", path: "elite", unlock_req: "Hold 2s", mastery_req: "Hold 8s", target_reps: 8 },
  { name: "Victorian Cross", path: "elite", unlock_req: "Hold 1s", mastery_req: "Hold 5s", target_reps: 5 },
  { name: "Manna Full Hold", path: "elite", unlock_req: "Hold 2s", mastery_req: "Hold 8s", target_reps: 8 },
  { name: "ELITE MASTER", path: "elite", unlock_req: "1 × 1", mastery_req: "1 × 1", target_reps: 1 }
];

function getXpForDifficulty(difficulty: number): number {
  const xpMapping: Record<number, number> = {
    1: 50, 2: 100, 3: 160, 4: 230, 5: 310,
    6: 400, 7: 500, 8: 620, 9: 760, 10: 950
  };
  return xpMapping[difficulty] ?? 50;
}

function getCalisthenicsLevelInfo(xp: number) {
  let level = 1;
  const getCumulativeXpForLevel = (l: number) => {
    if (l <= 1) return 0;
    return 200 * (l - 1) + 20 * (l - 1) * (l - 2);
  };

  while (xp >= getCumulativeXpForLevel(level + 1)) {
    level++;
  }

  const xpForCurrent = getCumulativeXpForLevel(level);
  const xpForNext = getCumulativeXpForLevel(level + 1);
  const currentLevelProgressXp = xp - xpForCurrent;
  const levelXpDifference = xpForNext - xpForCurrent;
  const progress = levelXpDifference > 0 
    ? Math.min(100, Math.max(0, (currentLevelProgressXp / levelXpDifference) * 100))
    : 100;

  let title = "Recruit";
  if (level >= 35) title = "Grandmaster Legend";
  else if (level >= 28) title = "Beast Mode Overlord";
  else if (level >= 22) title = "Bar Specialist Elite";
  else if (level >= 16) title = "Gymnast Pro";
  else if (level >= 10) title = "Consistent Performer";
  else if (level >= 5) title = "Dedicated Novice";

  return {
    level,
    currentXp: xp - xpForCurrent,
    nextLevelXp: levelXpDifference,
    totalXp: xp,
    progress,
    title,
  };
}

export default function AsvandCalisthenicsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [asvandId, setAsvandId] = useState<string | null>(null);

  // States
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [activeBook, setActiveBook] = useState<"legs" | "push" | "pull" | "core" | "skills" | "elite" | null>(null);

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
          sessions_hit: s.sessions_hit || 0
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

  // Compute total Calisthenics XP accumulated
  const totalCalisthenicsXp = useMemo(() => {
    let sum = 0;
    skills.forEach(s => {
      let difficulty = 3;
      if (s.exercise_name.includes("Air Squat") || s.exercise_name.includes("Wall Push-up")) difficulty = 1;
      else if (s.exercise_name.includes("Pistol Squat") || s.exercise_name.includes("Handstand Push-up")) difficulty = 8;
      else if (s.exercise_name.includes("Full Planche") || s.exercise_name.includes("LEG MASTER")) difficulty = 10;
      
      const xpVal = getXpForDifficulty(difficulty);
      sum += Math.round((s.mastery_percent / 100) * xpVal);
    });
    return sum;
  }, [skills]);

  const levelInfo = getCalisthenicsLevelInfo(totalCalisthenicsXp);

  // Path average calculations
  const getPathAvg = (pathName: string) => {
    const pathSkills = skills.filter(s => s.path === pathName);
    return pathSkills.length > 0
      ? Math.round(pathSkills.reduce((sum, item) => sum + item.mastery_percent, 0) / pathSkills.length)
      : 0;
  };

  const legsAvg = getPathAvg("legs");
  const pushAvg = getPathAvg("push");
  const pullAvg = getPathAvg("pull");
  const coreAvg = getPathAvg("core");
  const baseFourAvg = Math.round((legsAvg + pushAvg + pullAvg + coreAvg) / 4);

  const skillsLocked = baseFourAvg < 60;
  const skillsAvg = skillsLocked ? 0 : getPathAvg("skills");

  const eliteLocked = baseFourAvg < 100 || skillsAvg < 100;
  const eliteAvg = eliteLocked ? 0 : getPathAvg("elite");

  // Helper to check unlock status
  const isExerciseUnlocked = (exName: string, path: string) => {
    const list = GUILD_CATALOG.filter(item => item.path === path);
    const idx = list.findIndex(item => item.name === exName);
    if (idx <= 0) return true; // first exercise is always unlocked

    const prevEx = list[idx - 1];
    const prevSkill = skills.find(s => s.exercise_name === prevEx.name);
    return prevSkill ? prevSkill.mastery_percent >= 100 : false;
  };

  // Save inline PR
  const handleSaveInlinePr = async (exerciseName: string, value: number) => {
    if (!asvandId) return;

    try {
      const currentSkill = skills.find(s => s.exercise_name === exerciseName);
      const catalogItem = GUILD_CATALOG.find(item => item.name === exerciseName);
      if (!catalogItem) return;

      const pathName = catalogItem.path;
      const masteryReps = catalogItem.target_reps;
      
      let unlockReps = 8;
      if (catalogItem.unlock_req.includes("×")) {
        unlockReps = parseInt(catalogItem.unlock_req.split("×")[1]) || 8;
      }

      const learned = value > 0;
      const correctForm = value >= unlockReps;
      const calculatedMastery = Math.min(100, Math.round((value / masteryReps) * 100));

      if (currentSkill) {
        const { error } = await supabase
          .from("calisthenics_progress")
          .update({
            learned,
            correct_form: correctForm,
            reps: value,
            sessions_hit: value >= masteryReps ? 3 : 1,
            mastery_percent: calculatedMastery
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
            mastery_percent: calculatedMastery
          });
        if (error) throw error;
      }

      // Log to pr_logs
      const todayStr = new Date().toISOString().split("T")[0];
      await supabase
        .from("pr_logs")
        .insert({
          profile_id: asvandId,
          exercise: exerciseName,
          value: value,
          unit: catalogItem.mastery_req.toLowerCase().includes("s") || catalogItem.mastery_req.toLowerCase().includes("sec") ? "sec" : "reps",
          date: todayStr,
          notes: `Logged via inline PR Entry.`
        });

      // Reload
      await loadData(asvandId);
    } catch (err) {
      console.error("Error saving inline PR:", err);
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
              return (
                <Card className="bg-surface1/40 border-border/20 py-4 px-5">
                  <div className="flex justify-between items-center text-xs text-secondary mb-1.5 font-semibold">
                    <span>PATH PROGRESS</span>
                    <span className="text-accent font-extrabold">{progressVal}% COMPLETE</span>
                  </div>
                  <ProgressBar value={progressVal} color="var(--accent)" height={5} />
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

                return (
                  <div
                    key={exName}
                    className={`p-4 rounded-2xl border transition-all ${
                      isUnlocked 
                        ? "bg-surface1 border-border/40 text-white" 
                        : "bg-[#101018]/30 border-border/10 text-secondary/30 opacity-40 select-none"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Left: Name and requirement target details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {!isUnlocked && <span className="text-xs">🔒</span>}
                          <h3 className="font-extrabold text-sm">{exName}</h3>
                        </div>
                        <p className="text-[10px] text-secondary mt-1">
                          Require <span className={isUnlocked ? "text-white font-bold" : ""}>{ex.mastery_req}</span> to unlock next level
                        </p>
                      </div>

                      {/* Right: Inline PR display box and PR entry input */}
                      <div className="flex items-center gap-3">
                        
                        {/* Current PR Box */}
                        <div className="bg-[#181825] px-3.5 py-2 border border-border/30 rounded-xl text-center min-w-[90px]">
                          <span className="text-[8px] text-secondary block uppercase font-semibold">Current PR</span>
                          <span className="text-xs font-bold text-accent block mt-0.5">
                            {currentPrVal !== null ? `${currentPrVal} ${unit}` : "—"}
                          </span>
                        </div>

                        {/* Enter New PR Box */}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            disabled={!isUnlocked}
                            placeholder="Enter new PR"
                            defaultValue=""
                            id={`input-pr-${exName}`}
                            className="w-24 bg-[#181825] py-2 px-2.5 border border-border/30 rounded-xl text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-accent disabled:opacity-50"
                          />
                          <button
                            disabled={!isUnlocked}
                            onClick={async () => {
                              const inputEl = document.getElementById(`input-pr-${exName}`) as HTMLInputElement;
                              if (inputEl) {
                                const val = parseInt(inputEl.value);
                                if (!isNaN(val) && val >= 0) {
                                  await handleSaveInlinePr(exName, val);
                                  inputEl.value = "";
                                }
                              }
                            }}
                            className="px-3.5 py-2 text-xs font-bold text-[#000] bg-accent rounded-xl hover:filter hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>

                      </div>

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
