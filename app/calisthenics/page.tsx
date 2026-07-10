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
  x3_completed?: boolean;
  best_performance_date?: string;
}

interface PrereqRule {
  type: "and" | "or";
  exercises: string[];
}

// Unified exercise catalog with unlock requirements and mastery targets
interface CatalogItem {
  name: string;
  path: "legs" | "push" | "pull" | "core" | "skills" | "elite";
  unlock_req?: string;
  mastery_req: string;
  target_reps: number;
  prerequisites?: string[] | PrereqRule;
}

const GUILD_CATALOG: CatalogItem[] = [
  // Legs (33 items)
  { name: "Air Squat", path: "legs", mastery_req: "3 × 25", target_reps: 25, prerequisites: [] },
  { name: "Box Squat", path: "legs", mastery_req: "3 × 25", target_reps: 25, prerequisites: ["Air Squat"] },
  { name: "Tempo Squat (3 sec down)", path: "legs", mastery_req: "3 × 15", target_reps: 15, prerequisites: ["Box Squat"] },
  { name: "Pause Squat (2 sec bottom)", path: "legs", mastery_req: "3 × 15", target_reps: 15, prerequisites: ["Tempo Squat (3 sec down)"] },
  { name: "Narrow Squat", path: "legs", mastery_req: "3 × 25", target_reps: 25, prerequisites: ["Pause Squat (2 sec bottom)"] },
  { name: "Standard Squat", path: "legs", mastery_req: "3 × 25", target_reps: 25, prerequisites: ["Pause Squat (2 sec bottom)"] },
  { name: "Wide Squat", path: "legs", mastery_req: "3 × 25", target_reps: 25, prerequisites: ["Pause Squat (2 sec bottom)"] },
  { name: "Sumo Squat", path: "legs", mastery_req: "3 × 25", target_reps: 25, prerequisites: ["Pause Squat (2 sec bottom)"] },
  { name: "Squat Pulse", path: "legs", mastery_req: "3 × 20", target_reps: 20, prerequisites: ["Narrow Squat", "Standard Squat", "Wide Squat", "Sumo Squat"] },
  { name: "Jump Squat", path: "legs", mastery_req: "3 × 15", target_reps: 15, prerequisites: ["Squat Pulse"] },
  { name: "180° Jump Squat", path: "legs", mastery_req: "3 × 15", target_reps: 15, prerequisites: ["Jump Squat"] },
  { name: "Split Squat", path: "legs", mastery_req: "3 × 20 each leg", target_reps: 20, prerequisites: [] },
  { name: "Reverse Lunge", path: "legs", mastery_req: "3 × 20 each leg", target_reps: 20, prerequisites: ["Split Squat"] },
  { name: "Walking Lunge", path: "legs", mastery_req: "3 × 20 each leg", target_reps: 20, prerequisites: ["Reverse Lunge"] },
  { name: "Bulgarian Split Squat", path: "legs", mastery_req: "3 × 15 each leg", target_reps: 15, prerequisites: ["Walking Lunge"] },
  { name: "Cossack Squat", path: "legs", mastery_req: "3 × 15 each leg", target_reps: 15, prerequisites: ["Bulgarian Split Squat"] },
  { name: "Shrimp Squat Assisted", path: "legs", mastery_req: "3 × 15 each leg", target_reps: 15, prerequisites: ["Bulgarian Split Squat"] },
  { name: "Shrimp Squat", path: "legs", mastery_req: "3 × 10 each leg", target_reps: 10, prerequisites: ["Shrimp Squat Assisted"] },
  { name: "Assisted Pistol", path: "legs", mastery_req: "3 × 15 each leg", target_reps: 15, prerequisites: ["Bulgarian Split Squat"] },
  { name: "Box Pistol", path: "legs", mastery_req: "3 × 12 each leg", target_reps: 12, prerequisites: ["Assisted Pistol"] },
  { name: "Negative Pistol", path: "legs", mastery_req: "3 × 10 each leg", target_reps: 10, prerequisites: ["Box Pistol"] },
  { name: "Pistol Squat", path: "legs", mastery_req: "3 × 10 each leg", target_reps: 10, prerequisites: ["Negative Pistol"] },
  { name: "Paused Pistol", path: "legs", mastery_req: "3 × 8 each leg", target_reps: 8, prerequisites: ["Pistol Squat"] },
  { name: "Weighted Pistol", path: "legs", mastery_req: "3 × 8 each leg", target_reps: 8, prerequisites: ["Paused Pistol"] },
  { name: "Jumping Pistol", path: "legs", mastery_req: "3 × 8 each leg", target_reps: 8, prerequisites: ["Weighted Pistol"] },
  { name: "Dragon Pistol", path: "legs", mastery_req: "3 × 5 each leg", target_reps: 5, prerequisites: ["Jumping Pistol"] },
  { name: "Glute Bridge", path: "legs", mastery_req: "3 × 20", target_reps: 20, prerequisites: ["Bulgarian Split Squat"] },
  { name: "Single Leg Glute Bridge", path: "legs", mastery_req: "3 × 15 each leg", target_reps: 15, prerequisites: ["Glute Bridge"] },
  { name: "Nordic Curl Assisted", path: "legs", mastery_req: "3 × 10", target_reps: 10, prerequisites: ["Single Leg Glute Bridge"] },
  { name: "Nordic Curl Negative", path: "legs", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["Nordic Curl Assisted"] },
  { name: "Nordic Curl", path: "legs", mastery_req: "3 × 5", target_reps: 5, prerequisites: ["Nordic Curl Negative"] },
  { name: "Single Leg Nordic Curl", path: "legs", mastery_req: "3 × 3 each leg", target_reps: 3, prerequisites: ["Nordic Curl"] },
  { name: "LEG MASTER", path: "legs", mastery_req: "1 × 1", target_reps: 1, prerequisites: ["180° Jump Squat", "Shrimp Squat", "Dragon Pistol", "Single Leg Nordic Curl", "Cossack Squat"] },

  // Push (40 items)
  // Foundation Branch
  { name: "Wall Push-up", path: "push", mastery_req: "3 × 20", target_reps: 20, prerequisites: [] },
  { name: "High Incline Push-up", path: "push", mastery_req: "3 × 20", target_reps: 20, prerequisites: ["Wall Push-up"] },
  { name: "Incline Push-up", path: "push", mastery_req: "3 × 20", target_reps: 20, prerequisites: ["High Incline Push-up"] },
  { name: "Knee Push-up", path: "push", mastery_req: "3 × 20", target_reps: 20, prerequisites: ["Incline Push-up"] },
  { name: "Negative Push-up", path: "push", mastery_req: "3 × 15", target_reps: 15, prerequisites: ["Knee Push-up"] },
  { name: "Standard Push-up", path: "push", mastery_req: "3 × 20", target_reps: 20, prerequisites: ["Negative Push-up"] },

  // Strength Branch
  { name: "Wide Push-up", path: "push", mastery_req: "3 × 20", target_reps: 20, prerequisites: ["Standard Push-up"] },
  { name: "Decline Push-up", path: "push", mastery_req: "3 × 20", target_reps: 20, prerequisites: ["Standard Push-up"] },
  { name: "Ring Push-up", path: "push", mastery_req: "3 × 15", target_reps: 15, prerequisites: ["Standard Push-up"] },
  { name: "Deep Ring Push-up", path: "push", mastery_req: "3 × 12", target_reps: 12, prerequisites: ["Ring Push-up"] },
  { name: "Diamond Push-up", path: "push", mastery_req: "3 × 15", target_reps: 15, prerequisites: ["Standard Push-up"] },
  { name: "Archer Push-up", path: "push", mastery_req: "3 × 12", target_reps: 12, prerequisites: ["Diamond Push-up"] },
  { name: "Pseudo Planche Push-up", path: "push", mastery_req: "3 × 10", target_reps: 10, prerequisites: ["Archer Push-up"] },
  { name: "One-Arm Incline Push-up", path: "push", mastery_req: "3 × 10", target_reps: 10, prerequisites: ["Pseudo Planche Push-up"] },
  { name: "One-Arm Push-up", path: "push", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["One-Arm Incline Push-up"] },

  // Dip Branch
  { name: "Dips (Bench)", path: "push", mastery_req: "3 × 20", target_reps: 20, prerequisites: ["Standard Push-up"] },
  { name: "Standard Dips", path: "push", mastery_req: "3 × 15", target_reps: 15, prerequisites: ["Dips (Bench)"] },
  { name: "Ring Dips", path: "push", mastery_req: "3 × 12", target_reps: 12, prerequisites: ["Standard Dips", "Deep Ring Push-up"] },
  { name: "Weighted Dips", path: "push", mastery_req: "3 × 10", target_reps: 10, prerequisites: ["Ring Dips"] },

  // Explosive Branch
  { name: "Clap Push-up", path: "push", mastery_req: "3 × 12", target_reps: 12, prerequisites: ["Standard Push-up"] },
  { name: "Superman Push-up", path: "push", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["Clap Push-up"] },
  { name: "Explosive Dips", path: "push", mastery_req: "3 × 10", target_reps: 10, prerequisites: ["Superman Push-up"] },

  // Handstand Branch
  { name: "Pike Push-up", path: "push", mastery_req: "3 × 12", target_reps: 12, prerequisites: ["Decline Push-up"] },
  { name: "Elevated Pike Push-up", path: "push", mastery_req: "3 × 10", target_reps: 10, prerequisites: ["Pike Push-up"] },
  { name: "Wall Handstand Kick-up", path: "push", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["Elevated Pike Push-up"] },
  { name: "Wall Handstand Hold", path: "push", mastery_req: "Hold 30s", target_reps: 30, prerequisites: ["Wall Handstand Kick-up"] },
  { name: "Handstand Wall Walk", path: "push", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["Wall Handstand Hold"] },
  { name: "Handstand Shoulder Tap", path: "push", mastery_req: "3 × 10", target_reps: 10, prerequisites: ["Handstand Wall Walk"] },
  { name: "Freestanding Handstand Hold", path: "push", mastery_req: "Hold 15s", target_reps: 15, prerequisites: ["Handstand Wall Walk"] },
  { name: "Handstand Push-up", path: "push", mastery_req: "3 × 5", target_reps: 5, prerequisites: ["Handstand Shoulder Tap", "Freestanding Handstand Hold"] },

  // Planche Branch
  { name: "Planche Lean", path: "push", mastery_req: "Hold 25s", target_reps: 25, prerequisites: ["Pseudo Planche Push-up"] },
  { name: "Tuck Planche", path: "push", mastery_req: "Hold 12s", target_reps: 12, prerequisites: ["Planche Lean"] },
  { name: "Advanced Tuck Planche", path: "push", mastery_req: "Hold 10s", target_reps: 10, prerequisites: ["Tuck Planche"] },
  { name: "Straddle Planche Lean", path: "push", mastery_req: "Hold 15s", target_reps: 15, prerequisites: ["Advanced Tuck Planche"] },
  { name: "Straddle Planche Hold", path: "push", mastery_req: "Hold 8s", target_reps: 8, prerequisites: ["Straddle Planche Lean"] },
  { name: "Full Planche", path: "push", mastery_req: "Hold 5s", target_reps: 5, prerequisites: ["Straddle Planche Hold"] },

  // Elite Branch
  { name: "90 Degree Push-up", path: "push", mastery_req: "3 × 3", target_reps: 3, prerequisites: ["Handstand Push-up", "Pseudo Planche Push-up"] },
  { name: "L-Sit to Handstand Press", path: "push", mastery_req: "3 × 3", target_reps: 3, prerequisites: ["Handstand Push-up", "L-Sit (Floor)"] },
  { name: "One-Arm Handstand", path: "push", mastery_req: "Hold 5s", target_reps: 5, prerequisites: ["Full Planche", "Freestanding Handstand Hold"] },
  { name: "PUSH MASTER", path: "push", mastery_req: "1 × 1", target_reps: 1, prerequisites: ["One-Arm Push-up", "Weighted Dips", "Explosive Dips", "90 Degree Push-up", "L-Sit to Handstand Press", "One-Arm Handstand"] },

  // Pull (40 items)
  // Foundation Branch
  { name: "Dead Hang", path: "pull", mastery_req: "Hold 60s", target_reps: 60, prerequisites: [] },
  { name: "Scapular Pull-up", path: "pull", mastery_req: "3 × 15", target_reps: 15, prerequisites: ["Dead Hang"] },
  { name: "Australian Row", path: "pull", mastery_req: "3 × 15", target_reps: 15, prerequisites: ["Scapular Pull-up"] },
  { name: "Inverted Row", path: "pull", mastery_req: "3 × 15", target_reps: 15, prerequisites: ["Australian Row"] },
  { name: "Jackknife Pull-up", path: "pull", mastery_req: "3 × 12", target_reps: 12, prerequisites: ["Inverted Row"] },
  { name: "Negative Chin-up", path: "pull", mastery_req: "3 × 10", target_reps: 10, prerequisites: ["Jackknife Pull-up"] },
  { name: "Chin-up", path: "pull", mastery_req: "3 × 12", target_reps: 12, prerequisites: ["Negative Chin-up"] },
  { name: "Neutral Grip Pull-up", path: "pull", mastery_req: "3 × 12", target_reps: 12, prerequisites: ["Chin-up"] },
  { name: "Standard Pull-up", path: "pull", mastery_req: "3 × 12", target_reps: 12, prerequisites: ["Neutral Grip Pull-up"] },

  // Strength Branch
  { name: "Wide Grip Pull-up", path: "pull", mastery_req: "3 × 10", target_reps: 10, prerequisites: ["Standard Pull-up"] },
  { name: "Commando Pull-up", path: "pull", mastery_req: "3 × 12", target_reps: 12, prerequisites: ["Standard Pull-up"] },
  { name: "Towel Pull-up", path: "pull", mastery_req: "3 × 10", target_reps: 10, prerequisites: ["Standard Pull-up"] },
  { name: "L-Sit Pull-up", path: "pull", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["Standard Pull-up"] },
  { name: "Archer Pull-up", path: "pull", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["Wide Grip Pull-up"] },
  { name: "Weighted Pull-up", path: "pull", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["Archer Pull-up"] },
  { name: "Pull-up to Front Lever", path: "pull", mastery_req: "3 × 6", target_reps: 6, prerequisites: ["Weighted Pull-up"] },

  // Muscle-up Branch
  { name: "High Pull-up (Chest-to-bar)", path: "pull", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["Standard Pull-up"] },
  { name: "Explosive Pull-up", path: "pull", mastery_req: "3 × 10", target_reps: 10, prerequisites: ["High Pull-up (Chest-to-bar)"] },
  { name: "Kipping Muscle-up", path: "pull", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["Explosive Pull-up"] },
  { name: "Clean Muscle-up", path: "pull", mastery_req: "3 × 6", target_reps: 6, prerequisites: ["Kipping Muscle-up"] },
  { name: "Ring Muscle-up", path: "pull", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["Clean Muscle-up"] },
  { name: "L-Sit Muscle-up", path: "pull", mastery_req: "3 × 5", target_reps: 5, prerequisites: ["Ring Muscle-up"] },
  { name: "Weighted Muscle-up", path: "pull", mastery_req: "3 × 5", target_reps: 5, prerequisites: ["L-Sit Muscle-up"] },

  // One Arm Branch
  { name: "One-Arm Dead Hang", path: "pull", mastery_req: "Hold 30s", target_reps: 30, prerequisites: ["Standard Pull-up"] },
  { name: "One-Arm Inverted Row", path: "pull", mastery_req: "3 × 10", target_reps: 10, prerequisites: ["One-Arm Dead Hang"] },
  { name: "One-Arm Pull-up Assist", path: "pull", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["One-Arm Inverted Row"] },
  { name: "One-Arm Negative", path: "pull", mastery_req: "3 × 6", target_reps: 6, prerequisites: ["One-Arm Pull-up Assist"] },
  { name: "One-Arm Pull-up", path: "pull", mastery_req: "3 × 5", target_reps: 5, prerequisites: ["One-Arm Negative"] },

  // Front Lever Branch
  { name: "Skin the Cat", path: "pull", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["Standard Pull-up", "L-Sit Pull-up"] },
  { name: "Tuck Front Lever", path: "pull", mastery_req: "Hold 15s", target_reps: 15, prerequisites: ["Skin the Cat"] },
  { name: "Advanced Tuck Front Lever", path: "pull", mastery_req: "Hold 10s", target_reps: 10, prerequisites: ["Tuck Front Lever"] },
  { name: "Straddle Front Lever", path: "pull", mastery_req: "Hold 8s", target_reps: 8, prerequisites: ["Advanced Tuck Front Lever"] },
  { name: "Full Front Lever", path: "pull", mastery_req: "Hold 5s", target_reps: 5, prerequisites: ["Straddle Front Lever"] },
  { name: "Front Lever Pull-up", path: "pull", mastery_req: "3 × 5", target_reps: 5, prerequisites: ["Full Front Lever"] },

  // Back Lever Branch
  { name: "Tuck Back Lever", path: "pull", mastery_req: "Hold 15s", target_reps: 15, prerequisites: ["Skin the Cat"] },
  { name: "Advanced Tuck Back Lever", path: "pull", mastery_req: "Hold 10s", target_reps: 10, prerequisites: ["Tuck Back Lever"] },
  { name: "Straddle Back Lever", path: "pull", mastery_req: "Hold 8s", target_reps: 8, prerequisites: ["Advanced Tuck Back Lever"] },
  { name: "Full Back Lever", path: "pull", mastery_req: "Hold 5s", target_reps: 5, prerequisites: ["Straddle Back Lever"] },

  // Elite Branch
  { name: "Impossible Pull-up", path: "pull", mastery_req: "3 × 3", target_reps: 3, prerequisites: ["One-Arm Pull-up", "Front Lever Pull-up"] },
  { name: "PULL MASTER", path: "pull", mastery_req: "1 × 1", target_reps: 1, prerequisites: ["One-Arm Pull-up", "Weighted Muscle-up", "Full Back Lever", "Impossible Pull-up"] },

  // Core (27 items)
  // Foundation Branch
  { name: "Plank", path: "core", mastery_req: "Hold 90s", target_reps: 90, prerequisites: [] },
  { name: "Lying Leg Raise", path: "core", mastery_req: "3 × 15", target_reps: 15, prerequisites: ["Plank"] },
  { name: "Hollow Body Hold", path: "core", mastery_req: "Hold 45s", target_reps: 45, prerequisites: ["Lying Leg Raise"] },
  { name: "Arch Hold", path: "core", mastery_req: "Hold 45s", target_reps: 45, prerequisites: ["Hollow Body Hold"] },

  // Hanging Core Branch
  { name: "Knee Raise (Hanging)", path: "core", mastery_req: "3 × 15", target_reps: 15, prerequisites: ["Hollow Body Hold"] },
  { name: "Leg Raise (Hanging)", path: "core", mastery_req: "3 × 12", target_reps: 12, prerequisites: ["Knee Raise (Hanging)"] },
  { name: "Toes to Bar", path: "core", mastery_req: "3 × 10", target_reps: 10, prerequisites: ["Leg Raise (Hanging)"] },
  { name: "Hanging Rotational Raise", path: "core", mastery_req: "3 × 10", target_reps: 10, prerequisites: ["Leg Raise (Hanging)"] },

  // Compression Branch
  { name: "L-Sit (Parallel Bars)", path: "core", mastery_req: "Hold 15s", target_reps: 15, prerequisites: ["Hollow Body Hold", "Leg Raise (Hanging)"] },
  { name: "L-Sit (Floor)", path: "core", mastery_req: "Hold 12s", target_reps: 12, prerequisites: ["L-Sit (Parallel Bars)"] },
  { name: "V-Sit", path: "core", mastery_req: "Hold 8s", target_reps: 8, prerequisites: ["L-Sit (Floor)"] },
  { name: "Manna Assist", path: "core", mastery_req: "Hold 10s", target_reps: 10, prerequisites: ["V-Sit"] },
  { name: "Manna Hold", path: "core", mastery_req: "Hold 5s", target_reps: 5, prerequisites: ["Manna Assist"] },

  // Rotation Branch
  { name: "Side Plank", path: "core", mastery_req: "Hold 60s", target_reps: 60, prerequisites: ["Plank"] },
  { name: "Windshield Wiper Assist", path: "core", mastery_req: "3 × 12", target_reps: 12, prerequisites: ["Side Plank"] },
  { name: "Windshield Wiper", path: "core", mastery_req: "3 × 10", target_reps: 10, prerequisites: ["Windshield Wiper Assist"] },

  // Extension Branch
  { name: "Bird Dog", path: "core", mastery_req: "3 × 20", target_reps: 20, prerequisites: ["Plank"] },
  { name: "Superman Hold", path: "core", mastery_req: "Hold 45s", target_reps: 45, prerequisites: ["Bird Dog"] },
  { name: "Reverse Hyperextension", path: "core", mastery_req: "3 × 20", target_reps: 20, prerequisites: ["Superman Hold"] },

  // Anti Rotation Branch
  { name: "Pallof Press", path: "core", mastery_req: "3 × 15", target_reps: 15, prerequisites: ["Side Plank"] },
  { name: "Plank Walkout", path: "core", mastery_req: "3 × 10", target_reps: 10, prerequisites: ["Pallof Press"] },

  // Advanced Strength Branch
  { name: "Dragon Flag Assist", path: "core", mastery_req: "3 × 10", target_reps: 10, prerequisites: ["Hollow Body Hold"] },
  { name: "Dragon Flag", path: "core", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["Dragon Flag Assist"] },
  { name: "Ab Wheel Rollout (Knees)", path: "core", mastery_req: "3 × 15", target_reps: 15, prerequisites: ["Dragon Flag"] },
  { name: "Ab Wheel Rollout (Feet)", path: "core", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["Ab Wheel Rollout (Knees)"] },

  // Mastery Endpoints
  { name: "Core Master (Plank Max)", path: "core", mastery_req: "Hold 120s", target_reps: 120, prerequisites: ["Arch Hold", "Toes to Bar", "V-Sit", "Windshield Wiper", "Reverse Hyperextension", "Plank Walkout", "Ab Wheel Rollout (Feet)"] },
  { name: "CORE MASTER", path: "core", mastery_req: "1 × 1", target_reps: 1, prerequisites: ["Core Master (Plank Max)", "Manna Hold", "Dragon Flag", "Ab Wheel Rollout (Feet)"] },

  // Skills & Balance (25 items)
  // Balance Branch
  { name: "Crow Pose Hold", path: "skills", mastery_req: "Hold 30s", target_reps: 30, prerequisites: [] },
  { name: "Crane Pose Hold", path: "skills", mastery_req: "Hold 20s", target_reps: 20, prerequisites: ["Crow Pose Hold"] },
  { name: "Elbow Lever", path: "skills", mastery_req: "Hold 25s", target_reps: 25, prerequisites: ["Crane Pose Hold"] },
  { name: "One-Arm Crow Pose", path: "skills", mastery_req: "Hold 10s", target_reps: 10, prerequisites: ["Elbow Lever"] },

  // Inversions Branch
  { name: "Headstand Hold", path: "skills", mastery_req: "Hold 45s", target_reps: 45, prerequisites: ["Crane Pose Hold"] },
  { name: "Tripod Transition", path: "skills", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["Headstand Hold"] },
  { name: "Handstand Kick-up Assist", path: "skills", mastery_req: "3 × 10", target_reps: 10, prerequisites: ["Tripod Transition"] },
  { name: "Wall Walk Handstand", path: "skills", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["Handstand Kick-up Assist"] },
  { name: "Freestanding Handstand Attempt", path: "skills", mastery_req: "Hold 10s", target_reps: 10, prerequisites: ["Wall Walk Handstand"] },
  { name: "Handstand Press tuck", path: "skills", mastery_req: "3 × 5", target_reps: 5, prerequisites: ["Freestanding Handstand Attempt", "Elbow Lever"] },

  // Movement Branch
  { name: "Forward Roll", path: "skills", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["Headstand Hold"] },
  { name: "Backward Roll", path: "skills", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["Forward Roll"] },
  { name: "Shoulder Roll", path: "skills", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["Backward Roll"] },
  { name: "Kip-Up", path: "skills", mastery_req: "3 × 3", target_reps: 3, prerequisites: ["Shoulder Roll"] },
  { name: "Dive Roll", path: "skills", mastery_req: "3 × 5", target_reps: 5, prerequisites: ["Kip-Up"] },

  // Coordination Branch
  { name: "Bear Crawl", path: "skills", mastery_req: "3 × 15m", target_reps: 15, prerequisites: ["Forward Roll"] },
  { name: "Crab Walk", path: "skills", mastery_req: "3 × 15m", target_reps: 15, prerequisites: ["Bear Crawl"] },
  { name: "Ape Walk", path: "skills", mastery_req: "3 × 15m", target_reps: 15, prerequisites: ["Bear Crawl"] },
  { name: "Frog Walk", path: "skills", mastery_req: "3 × 10m", target_reps: 10, prerequisites: ["Crab Walk", "Ape Walk"] },
  { name: "Cartwheel", path: "skills", mastery_req: "3 × 5 each side", target_reps: 5, prerequisites: ["Frog Walk"] },
  { name: "Macaco", path: "skills", mastery_req: "3 × 4 each side", target_reps: 4, prerequisites: ["Cartwheel"] },

  // Bridge Branch
  { name: "Bridge Hold", path: "skills", mastery_req: "Hold 30s", target_reps: 30, prerequisites: ["Bear Crawl"] },
  { name: "Bridge Rock", path: "skills", mastery_req: "3 × 12", target_reps: 12, prerequisites: ["Bridge Hold"] },
  { name: "Bridge Kickover", path: "skills", mastery_req: "3 × 5", target_reps: 5, prerequisites: ["Bridge Rock"] },

  // Mastery Endpoint
  { name: "SKILLS MASTER", path: "skills", mastery_req: "1 × 1", target_reps: 1, prerequisites: ["One-Arm Crow Pose", "Handstand Press tuck", "Dive Roll", "Macaco", "Bridge Kickover"] },

  // Elite Skills (7 items)
  { name: "One-Arm Pull-up", path: "elite", unlock_req: "3 × 1", mastery_req: "3 × 5", target_reps: 5 },
  { name: "One-Arm Handstand Hold", path: "elite", unlock_req: "Hold 3s", mastery_req: "Hold 10s", target_reps: 10 },
  { name: "Full Planche Hold", path: "elite", unlock_req: "Hold 2s", mastery_req: "Hold 8s", target_reps: 8 },
  { name: "Iron Cross (Rings)", path: "elite", unlock_req: "Hold 2s", mastery_req: "Hold 8s", target_reps: 8 },
  { name: "Victorian Cross", path: "elite", unlock_req: "Hold 1s", mastery_req: "Hold 5s", target_reps: 5 },
  { name: "Manna Full Hold", path: "elite", unlock_req: "Hold 2s", mastery_req: "Hold 8s", target_reps: 8 },
  { name: "ELITE MASTER", path: "elite", unlock_req: "1 × 1", mastery_req: "1 × 1", target_reps: 1 }
];

const LEG_PATHS = {
  "Foundation": ["Air Squat", "Box Squat", "Tempo Squat (3 sec down)", "Pause Squat (2 sec bottom)"],
  "Stance": ["Narrow Squat", "Standard Squat", "Wide Squat", "Sumo Squat", "Squat Pulse", "Jump Squat", "180° Jump Squat"],
  "Single Leg": ["Split Squat", "Reverse Lunge", "Walking Lunge", "Bulgarian Split Squat", "Cossack Squat"],
  "Shrimp": ["Shrimp Squat Assisted", "Shrimp Squat"],
  "Pistol": ["Assisted Pistol", "Box Pistol", "Negative Pistol", "Pistol Squat", "Paused Pistol", "Weighted Pistol", "Jumping Pistol", "Dragon Pistol"],
  "Posterior Chain": ["Glute Bridge", "Single Leg Glute Bridge", "Nordic Curl Assisted", "Nordic Curl Negative", "Nordic Curl", "Single Leg Nordic Curl"]
} as const;

const PUSH_PATHS = {
  "Foundation": ["Wall Push-up", "High Incline Push-up", "Incline Push-up", "Knee Push-up", "Negative Push-up", "Standard Push-up"],
  "Strength": ["Wide Push-up", "Ring Push-up", "Deep Ring Push-up", "Diamond Push-up", "Archer Push-up", "Pseudo Planche Push-up", "One-Arm Incline Push-up", "One-Arm Push-up"],
  "Dips": ["Dips (Bench)", "Standard Dips", "Ring Dips", "Weighted Dips"],
  "Explosive": ["Clap Push-up", "Superman Push-up", "Explosive Dips"],
  "Handstand": ["Decline Push-up", "Pike Push-up", "Elevated Pike Push-up", "Wall Handstand Kick-up", "Wall Handstand Hold", "Handstand Wall Walk", "Handstand Shoulder Tap", "Freestanding Handstand Hold", "Handstand Push-up"],
  "Planche": ["Planche Lean", "Tuck Planche", "Advanced Tuck Planche", "Straddle Planche Lean", "Straddle Planche Hold", "Full Planche"],
  "Elite": ["90 Degree Push-up", "L-Sit to Handstand Press", "One-Arm Handstand"]
} as const;

const PULL_PATHS = {
  "Foundation": ["Dead Hang", "Scapular Pull-up", "Australian Row", "Inverted Row", "Jackknife Pull-up", "Negative Chin-up", "Chin-up", "Neutral Grip Pull-up", "Standard Pull-up"],
  "Strength": ["Wide Grip Pull-up", "Commando Pull-up", "Towel Pull-up", "L-Sit Pull-up", "Archer Pull-up", "Weighted Pull-up", "Pull-up to Front Lever"],
  "Muscle-up": ["High Pull-up (Chest-to-bar)", "Explosive Pull-up", "Kipping Muscle-up", "Clean Muscle-up", "Ring Muscle-up", "L-Sit Muscle-up", "Weighted Muscle-up"],
  "One Arm": ["One-Arm Dead Hang", "One-Arm Inverted Row", "One-Arm Pull-up Assist", "One-Arm Negative", "One-Arm Pull-up"],
  "Front Lever": ["Skin the Cat", "Tuck Front Lever", "Advanced Tuck Front Lever", "Straddle Front Lever", "Full Front Lever", "Front Lever Pull-up"],
  "Back Lever": ["Tuck Back Lever", "Advanced Tuck Back Lever", "Straddle Back Lever", "Full Back Lever"],
  "Elite": ["Impossible Pull-up"]
} as const;

const CORE_PATHS = {
  "Foundation": ["Plank", "Lying Leg Raise", "Hollow Body Hold", "Arch Hold"],
  "Hanging": ["Knee Raise (Hanging)", "Leg Raise (Hanging)", "Toes to Bar", "Hanging Rotational Raise"],
  "Compression": ["L-Sit (Parallel Bars)", "L-Sit (Floor)", "V-Sit", "Manna Assist", "Manna Hold"],
  "Rotation": ["Side Plank", "Windshield Wiper Assist", "Windshield Wiper"],
  "Extension": ["Bird Dog", "Superman Hold", "Reverse Hyperextension"],
  "Anti Rotation": ["Side Plank", "Pallof Press", "Plank Walkout"],
  "Advanced": ["Dragon Flag Assist", "Dragon Flag", "Ab Wheel Rollout (Knees)", "Ab Wheel Rollout (Feet)"]
} as const;

const SKILLS_PATHS = {
  "Balance": ["Crow Pose Hold", "Crane Pose Hold", "Elbow Lever", "One-Arm Crow Pose"],
  "Inversions": ["Headstand Hold", "Tripod Transition", "Handstand Kick-up Assist", "Wall Walk Handstand", "Freestanding Handstand Attempt", "Handstand Press tuck"],
  "Movement": ["Forward Roll", "Backward Roll", "Shoulder Roll", "Kip-Up", "Dive Roll"],
  "Coordination": ["Bear Crawl", "Crab Walk", "Ape Walk", "Frog Walk", "Cartwheel", "Macaco"],
  "Bridge": ["Bridge Hold", "Bridge Rock", "Bridge Kickover"]
} as const;

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

  const skillsLocked = false;
  const skillsAvg = getPathAvg("skills");

  const eliteLocked = false;
  const eliteAvg = getPathAvg("elite");

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

  // Helper to check if an exercise is mastered (x3 completed and reps/seconds >= target reps/seconds)
  const isExerciseMastered = (exName: string) => {
    const catalogItem = GUILD_CATALOG.find(item => item.name === exName);
    if (!catalogItem) return false;
    const skill = skills.find(s => s.exercise_name === exName);
    return skill ? (skill.x3_completed && skill.reps >= catalogItem.target_reps) : false;
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
  const isPathComplete = (pathName: string, book: "legs" | "push" | "pull" | "core" | "skills") => {
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
    } else {
      const p = pathName as keyof typeof SKILLS_PATHS;
      return SKILLS_PATHS[p]?.every(isExerciseMastered) || false;
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
    if (!asvandId) return;

    try {
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
      const todayStr = new Date().toISOString().split("T")[0];
      
      // Update best performance only if value >= currentPrVal
      if (value >= currentPrVal) {
        const learned = value > 0;
        const correctForm = value >= unlockReps;
        const calculatedMastery = Math.min(100, Math.round((value / masteryReps) * 100));
        const x3Completed = isX3Click || sets >= 3;

        if (currentSkill) {
          const { error } = await supabase
            .from("calisthenics_progress")
            .update({
              learned,
              correct_form: correctForm,
              reps: value,
              sessions_hit: value >= masteryReps ? 3 : 1,
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
              reps: value,
              target_reps: masteryReps,
              sessions_hit: value >= masteryReps ? 3 : 1,
              mastery_percent: calculatedMastery,
              x3_completed: x3Completed,
              best_performance_date: todayStr
            });
          if (error) throw error;
        }
      }

      // ALWAYS log to training history (pr_logs)
      const details = [];
      details.push(`${sets} set${sets > 1 ? "s" : ""}`);
      if (weight !== null && !isNaN(weight)) {
        details.push(`@ ${weight} kg`);
      }
      const prefix = details.join(" ");
      const finalNotes = notes 
        ? `[${prefix}] ${notes}` 
        : `Logged performance: ${prefix}.`;

      await supabase
        .from("pr_logs")
        .insert({
          profile_id: asvandId,
          exercise: exerciseName,
          value: value,
          unit: catalogItem.mastery_req.toLowerCase().includes("s") || catalogItem.mastery_req.toLowerCase().includes("sec") ? "sec" : "reps",
          date: todayStr,
          notes: finalNotes
        });

      // Reload
      await loadData(asvandId);
    } catch (err) {
      console.error("Error logging performance:", err);
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
                <Card className="bg-surface1/40 border-border/20 py-4.5 px-5">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-extrabold text-white uppercase tracking-wider">{treeTitle}</span>
                    <span className="text-accent font-mono font-bold">{progressVal}% COMPLETE</span>
                  </div>
                  <div className="mb-2">
                    <ProgressBar value={progressVal} color="var(--accent)" height={6} />
                  </div>
                  <div className="text-[10px] text-secondary font-semibold font-mono">
                    {masteredCount} / {totalCount} Exercises Mastered
                  </div>
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
                    className={`p-5 rounded-2xl border transition-all ${
                      isUnlocked 
                        ? "bg-surface1 border-border/40 text-white" 
                        : "bg-[#101018]/30 border-border/10 text-secondary/30 opacity-60"
                    }`}
                  >
                    <div className="flex flex-col gap-3">
                      {/* Title & Status */}
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-base tracking-wide">{exName}</h3>
                        {(() => {
                          if (!isUnlocked) {
                            return <span className="text-xs text-danger font-bold uppercase tracking-wider">🔒 Locked</span>;
                          }
                          const mastered = isExerciseMastered(exName);
                          if (mastered) {
                            return <span className="text-xs text-success font-bold uppercase tracking-wider">✅ Mastered</span>;
                          }
                          const masteryPercent = skillProgress?.mastery_percent || 0;
                          return (
                            <span className="text-xs text-accent font-bold uppercase tracking-wider">
                              ⚡ {masteryPercent}%
                            </span>
                          );
                        })()}
                      </div>

                      <div className="divider opacity-30 my-0.5" />

                      {isUnlocked && !isExerciseMastered(exName) && (
                        <div className="mb-1">
                          <ProgressBar value={skillProgress?.mastery_percent || 0} color="var(--accent)" height={4} />
                        </div>
                      )}

                      {!isUnlocked ? (
                        /* Locked Exercise Layout: Show Prerequisite Checklist */
                        <div className="mt-1">
                          <span className="text-[9px] text-secondary block uppercase font-bold tracking-wider mb-0.5">Requirements</span>
                          {exName === "LEG MASTER" || exName === "PUSH MASTER" || exName === "PULL MASTER" || exName === "CORE MASTER" || exName === "SKILLS MASTER" ? (
                            <div className="flex flex-col gap-1.5 mt-2">
                              {Object.keys(
                                exName === "LEG MASTER" 
                                  ? LEG_PATHS 
                                  : exName === "PUSH MASTER" 
                                    ? PUSH_PATHS 
                                    : exName === "PULL MASTER"
                                      ? PULL_PATHS
                                      : exName === "CORE MASTER"
                                        ? CORE_PATHS
                                        : SKILLS_PATHS
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
                                          : "skills"
                                );
                                return (
                                  <div key={pathKey} className="flex items-center gap-2 text-xs">
                                    <span>{complete ? "✅" : "⬜"}</span>
                                    <span className={complete ? "text-white font-medium line-through decoration-success/40" : "text-secondary/50"}>
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
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] text-secondary/70 block mb-1 font-mono">
                                    {remaining} {remaining === 1 ? "requirement" : "requirements"} remaining
                                  </span>
                                  {isOrRelation && (
                                    <span className="text-[10px] text-secondary/70 italic block mb-1">
                                      Complete any one of the following:
                                    </span>
                                  )}
                                  {list.map(prereqName => {
                                    const mastered = isExerciseMastered(prereqName);
                                    return (
                                      <div key={prereqName} className="flex items-center gap-2 text-xs">
                                        <span>{mastered ? "✅" : "⬜"}</span>
                                        <span className={mastered ? "text-white font-medium line-through decoration-success/40" : "text-secondary/50"}>
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
                          <div className="grid grid-cols-2 gap-4">
                            {/* Mastery Requirement */}
                            <div>
                              <span className="text-[9px] text-secondary block uppercase font-bold tracking-wider">Mastery Requirement</span>
                              <span className="text-xs font-bold text-white">
                                {exName === "LEG MASTER" || exName === "PUSH MASTER" || exName === "PULL MASTER" || exName === "CORE MASTER" || exName === "SKILLS MASTER"
                                  ? `Complete all ${
                                      exName === "LEG MASTER" 
                                        ? "Leg" 
                                        : exName === "PUSH MASTER" 
                                          ? "Push" 
                                          : exName === "PULL MASTER" 
                                            ? "Pull" 
                                            : exName === "CORE MASTER"
                                              ? "Core"
                                              : "Skills"
                                    } Mastery paths` 
                                  : ex.mastery_req}
                              </span>
                            </div>

                            {/* Best Performance */}
                            <div>
                              <span className="text-[9px] text-secondary block uppercase font-bold tracking-wider">Best Performance</span>
                              <span className="text-xs font-bold text-accent block">
                                {currentPrVal !== null 
                                  ? (skillProgress?.x3_completed ? `3 × ${currentPrVal} ${unit}` : `1 × ${currentPrVal} ${unit}`) 
                                  : "—"}
                              </span>
                              {skillProgress?.best_performance_date && (
                                <span className="text-[9px] text-secondary/50 block font-mono mt-0.5">
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
                                <div className="grid grid-cols-2 gap-4">
                                  {/* Direct Unlocks */}
                                  {directUnlocks.length > 0 && (
                                    <div>
                                      <span className="text-[9px] text-secondary block uppercase font-bold tracking-wider">Unlocks</span>
                                      <div className="mt-1 flex flex-col gap-1">
                                        {directUnlocks.map(unlockEx => {
                                          const isUnlockExUnlocked = isExerciseUnlocked(unlockEx.name);
                                          return (
                                            <div key={unlockEx.name} className="flex items-center gap-1.5 text-xs">
                                              <span className={isUnlockExUnlocked ? "text-success font-bold" : "text-secondary/30"}>
                                                {isUnlockExUnlocked ? "✓" : "•"}
                                              </span>
                                              <button
                                                onClick={() => {
                                                  const targetEl = document.getElementById(`exercise-card-${unlockEx.name.replace(/\s+/g, "-")}`);
                                                  if (targetEl) {
                                                    targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
                                                    targetEl.classList.add("ring-2", "ring-accent", "ring-offset-2", "ring-offset-[#0d0d12]");
                                                    setTimeout(() => {
                                                      targetEl.classList.remove("ring-2", "ring-accent", "ring-offset-2", "ring-offset-[#0d0d12]");
                                                    }, 2000);
                                                  }
                                                }}
                                                className={`text-left font-medium hover:underline hover:cursor-pointer flex items-center gap-0.5 ${
                                                  isUnlockExUnlocked ? "text-accent" : "text-secondary/40"
                                                }`}
                                              >
                                                <span>{unlockEx.name}</span>
                                                <span className="text-[9px] opacity-80 font-bold">→</span>
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
                                      <span className="text-[9px] text-secondary block uppercase font-bold tracking-wider">Contributes To</span>
                                      <div className="mt-1 flex flex-col gap-1">
                                        {contributesTo.map(unlockEx => {
                                          const isUnlockExUnlocked = isExerciseUnlocked(unlockEx.name);
                                          return (
                                            <div key={unlockEx.name} className="flex items-center gap-1.5 text-xs">
                                              <span className={isUnlockExUnlocked ? "text-success font-bold" : "text-secondary/30"}>
                                                {isUnlockExUnlocked ? "✓" : "•"}
                                              </span>
                                              <button
                                                onClick={() => {
                                                  const targetEl = document.getElementById(`exercise-card-${unlockEx.name.replace(/\s+/g, "-")}`);
                                                  if (targetEl) {
                                                    targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
                                                    targetEl.classList.add("ring-2", "ring-accent", "ring-offset-2", "ring-offset-[#0d0d12]");
                                                    setTimeout(() => {
                                                      targetEl.classList.remove("ring-2", "ring-accent", "ring-offset-2", "ring-offset-[#0d0d12]");
                                                    }, 2000);
                                                  }
                                                }}
                                                className={`text-left font-medium hover:underline hover:cursor-pointer flex items-center gap-0.5 ${
                                                  isUnlockExUnlocked ? "text-accent" : "text-secondary/40"
                                                }`}
                                              >
                                                <span>{unlockEx.name}</span>
                                                <span className="text-[9px] opacity-80 font-bold">→</span>
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
                            <div className="flex flex-col gap-2.5">
                              <div>
                                <span className="text-[9px] text-secondary block uppercase font-bold tracking-wider">Prerequisite Branches</span>
                                <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
                                  {Object.keys(
                                    exName === "LEG MASTER" 
                                      ? LEG_PATHS 
                                      : exName === "PUSH MASTER" 
                                        ? PUSH_PATHS 
                                        : exName === "PULL MASTER"
                                          ? PULL_PATHS
                                          : exName === "CORE MASTER"
                                            ? CORE_PATHS
                                            : SKILLS_PATHS
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
                                              : "skills"
                                    );
                                    return (
                                      <div key={pathKey} className="flex items-center gap-1 text-xs">
                                        <span className={complete ? "text-success font-bold" : "text-secondary/30"}>
                                          {complete ? "✓" : "•"}
                                        </span>
                                        <span className={complete ? "text-white font-medium" : "text-secondary/40"}>
                                          {pathKey} Tree
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              <div className="mt-1.5 p-3 rounded-xl bg-accent/5 border border-accent/20">
                                <span className="text-[9px] text-accent block uppercase font-bold tracking-wider">Reward</span>
                                <div className="mt-1 flex flex-col gap-1 text-xs text-white/95 font-medium">
                                  <span>🏆 {exName === "LEG MASTER" ? "Leg Master" : exName === "PUSH MASTER" ? "Push Master" : exName === "PULL MASTER" ? "Pull Master" : exName === "CORE MASTER" ? "Core Master" : "Skills Master"} Title</span>
                                  <span>⚡ +500 XP</span>
                                  <span>📚 Book Complete</span>
                                  <span>📜 Certificate Unlocked</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Log Training Input Container */}
                          <div className="mt-3 bg-[#13131c] p-3.5 rounded-xl border border-border/20 flex flex-col gap-2.5">
                            <span className="text-[9px] text-accent block uppercase font-bold tracking-wider">Log Training</span>
                            
                            <div className="grid grid-cols-3 gap-2">
                              {/* Sets Input */}
                              <div>
                                <label className="text-[8px] text-secondary block uppercase font-semibold mb-0.5">Sets</label>
                                <input
                                  type="number"
                                  placeholder="Sets"
                                  defaultValue="3"
                                  id={`input-sets-${exName}`}
                                  className="w-full bg-[#181825] py-1 px-1.5 border border-border/30 rounded-lg text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-accent"
                                />
                              </div>

                              {/* Primary Input (Reps or Seconds) */}
                              {exerciseType === "duration" ? (
                                <div>
                                  <label className="text-[8px] text-secondary block uppercase font-semibold mb-0.5">Seconds</label>
                                  <input
                                    type="number"
                                    placeholder="Sec"
                                    defaultValue=""
                                    id={`input-value-${exName}`}
                                    className="w-full bg-[#181825] py-1 px-1.5 border border-border/30 rounded-lg text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-accent"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <label className="text-[8px] text-secondary block uppercase font-semibold mb-0.5">Reps</label>
                                  <input
                                    type="number"
                                    placeholder="Reps"
                                    defaultValue=""
                                    id={`input-value-${exName}`}
                                    className="w-full bg-[#181825] py-1 px-1.5 border border-border/30 rounded-lg text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-accent"
                                  />
                                </div>
                              )}

                              {/* Secondary Input (Weight) */}
                              {exerciseType === "weighted_reps" && (
                                <div>
                                  <label className="text-[8px] text-secondary block uppercase font-semibold mb-0.5">Weight (kg)</label>
                                  <input
                                    type="number"
                                    placeholder="Weight"
                                    defaultValue=""
                                    id={`input-weight-${exName}`}
                                    className="w-full bg-[#181825] py-1 px-1.5 border border-border/30 rounded-lg text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-accent"
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
                                className="w-full bg-[#181825] py-1.5 px-2.5 border border-border/30 rounded-lg text-xs text-white focus:outline-none focus:border-accent"
                              />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-1.5 mt-0.5">
                              <button
                                onClick={async () => {
                                  const inputValEl = document.getElementById(`input-value-${exName}`) as HTMLInputElement;
                                  const inputSetsEl = document.getElementById(`input-sets-${exName}`) as HTMLInputElement;
                                  const inputWeightEl = document.getElementById(`input-weight-${exName}`) as HTMLInputElement;
                                  const inputNotesEl = document.getElementById(`input-notes-${exName}`) as HTMLInputElement;
                                  
                                  if (inputValEl) {
                                    const val = parseInt(inputValEl.value);
                                    if (!isNaN(val) && val >= 0) {
                                      const sets = parseInt(inputSetsEl?.value) || 1;
                                      const weight = inputWeightEl ? parseFloat(inputWeightEl.value) : null;
                                      const userNotes = inputNotesEl?.value || "";
                                      
                                      await handleSaveInlinePr(exName, val, sets >= 3, sets, weight, userNotes);
                                      
                                      inputValEl.value = "";
                                      if (inputNotesEl) inputNotesEl.value = "";
                                      if (inputWeightEl) inputWeightEl.value = "";
                                    }
                                  }
                                }}
                                className="px-4 py-1.5 text-xs font-bold text-[#000] bg-accent rounded-lg hover:filter hover:brightness-110 active:scale-95 transition-all"
                              >
                                Record
                              </button>
                              
                              <button
                                onClick={async () => {
                                  const inputValEl = document.getElementById(`input-value-${exName}`) as HTMLInputElement;
                                  const inputNotesEl = document.getElementById(`input-notes-${exName}`) as HTMLInputElement;
                                  const inputWeightEl = document.getElementById(`input-weight-${exName}`) as HTMLInputElement;
                                  
                                  if (inputValEl) {
                                    const val = parseInt(inputValEl.value);
                                    if (!isNaN(val) && val >= 0) {
                                      const weight = inputWeightEl ? parseFloat(inputWeightEl.value) : null;
                                      const userNotes = inputNotesEl?.value || "";
                                      
                                      await handleSaveInlinePr(exName, val, true, 3, weight, userNotes);
                                      
                                      inputValEl.value = "";
                                      if (inputNotesEl) inputNotesEl.value = "";
                                      if (inputWeightEl) inputWeightEl.value = "";
                                    }
                                  }
                                }}
                                className="px-4 py-1.5 text-xs font-bold text-[#000] bg-success rounded-lg hover:filter hover:brightness-110 active:scale-95 transition-all"
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
