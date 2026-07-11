export interface PrereqRule {
  type: "and" | "or";
  exercises: string[];
}

export interface CatalogItem {
  name: string;
  path: "legs" | "push" | "pull" | "core" | "skills" | "elite";
  mastery_req: string;
  target_reps: number;
  prerequisites?: string[] | PrereqRule;
  unlock_req?: string;
}

export const GUILD_CATALOG: CatalogItem[] = [
  // Legs (33 items)
  // Foundation Branch
  { name: "Air Squat", path: "legs", mastery_req: "3 × 25", target_reps: 25, prerequisites: [] },
  { name: "Box Squat", path: "legs", mastery_req: "3 × 20", target_reps: 20, prerequisites: ["Air Squat"] },
  { name: "Tempo Squat (3 sec down)", path: "legs", mastery_req: "3 × 15", target_reps: 15, prerequisites: ["Box Squat"] },
  { name: "Pause Squat (2 sec bottom)", path: "legs", mastery_req: "3 × 12", target_reps: 12, prerequisites: ["Tempo Squat (3 sec down)"] },

  // Stance Branch
  { name: "Narrow Squat", path: "legs", mastery_req: "3 × 20", target_reps: 20, prerequisites: ["Pause Squat (2 sec bottom)"] },
  { name: "Standard Squat", path: "legs", mastery_req: "3 × 20", target_reps: 20, prerequisites: ["Pause Squat (2 sec bottom)"] },
  { name: "Wide Squat", path: "legs", mastery_req: "3 × 20", target_reps: 20, prerequisites: ["Pause Squat (2 sec bottom)"] },
  { name: "Sumo Squat", path: "legs", mastery_req: "3 × 20", target_reps: 20, prerequisites: ["Pause Squat (2 sec bottom)"] },
  { name: "Squat Pulse", path: "legs", mastery_req: "3 × 30", target_reps: 30, prerequisites: ["Narrow Squat", "Standard Squat", "Wide Squat", "Sumo Squat"] },
  { name: "Jump Squat", path: "legs", mastery_req: "3 × 15", target_reps: 15, prerequisites: ["Squat Pulse"] },
  { name: "180° Jump Squat", path: "legs", mastery_req: "3 × 15", target_reps: 15, prerequisites: ["Jump Squat"] },

  // Single Leg Branch
  { name: "Split Squat", path: "legs", mastery_req: "3 × 20 each leg", target_reps: 20, prerequisites: [] },
  { name: "Reverse Lunge", path: "legs", mastery_req: "3 × 20 each leg", target_reps: 20, prerequisites: ["Split Squat"] },
  { name: "Walking Lunge", path: "legs", mastery_req: "3 × 20 each leg", target_reps: 20, prerequisites: ["Reverse Lunge"] },
  { name: "Bulgarian Split Squat", path: "legs", mastery_req: "3 × 15 each leg", target_reps: 15, prerequisites: ["Walking Lunge"] },
  { name: "Cossack Squat", path: "legs", mastery_req: "3 × 15 each leg", target_reps: 15, prerequisites: ["Bulgarian Split Squat"] },

  // Shrimp Branch
  { name: "Shrimp Squat Assisted", path: "legs", mastery_req: "3 × 15 each leg", target_reps: 15, prerequisites: ["Bulgarian Split Squat"] },
  { name: "Shrimp Squat", path: "legs", mastery_req: "3 × 10 each leg", target_reps: 10, prerequisites: ["Shrimp Squat Assisted"] },

  // Pistol Branch
  { name: "Assisted Pistol", path: "legs", mastery_req: "3 × 15 each leg", target_reps: 15, prerequisites: ["Bulgarian Split Squat"] },
  { name: "Box Pistol", path: "legs", mastery_req: "3 × 12 each leg", target_reps: 12, prerequisites: ["Assisted Pistol"] },
  { name: "Negative Pistol", path: "legs", mastery_req: "3 × 10 each leg", target_reps: 10, prerequisites: ["Box Pistol"] },
  { name: "Pistol Squat", path: "legs", mastery_req: "3 × 10 each leg", target_reps: 10, prerequisites: ["Negative Pistol"] },
  { name: "Paused Pistol", path: "legs", mastery_req: "3 × 8 each leg", target_reps: 8, prerequisites: ["Pistol Squat"] },
  { name: "Weighted Pistol", path: "legs", mastery_req: "3 × 8 each leg", target_reps: 8, prerequisites: ["Paused Pistol"] },
  { name: "Jumping Pistol", path: "legs", mastery_req: "3 × 8 each leg", target_reps: 8, prerequisites: ["Weighted Pistol"] },
  { name: "Dragon Pistol", path: "legs", mastery_req: "3 × 5 each leg", target_reps: 5, prerequisites: ["Jumping Pistol"] },

  // Posterior Chain Branch
  { name: "Glute Bridge", path: "legs", mastery_req: "3 × 20", target_reps: 20, prerequisites: ["Bulgarian Split Squat"] },
  { name: "Single Leg Glute Bridge", path: "legs", mastery_req: "3 × 15 each leg", target_reps: 15, prerequisites: ["Glute Bridge"] },
  { name: "Nordic Curl Assisted", path: "legs", mastery_req: "3 × 10", target_reps: 10, prerequisites: ["Single Leg Glute Bridge"] },
  { name: "Nordic Curl Negative", path: "legs", mastery_req: "3 × 8", target_reps: 8, prerequisites: ["Nordic Curl Assisted"] },
  { name: "Nordic Curl", path: "legs", mastery_req: "3 × 5", target_reps: 5, prerequisites: ["Nordic Curl Negative"] },
  { name: "Single Leg Nordic Curl", path: "legs", mastery_req: "3 × 3 each leg", target_reps: 3, prerequisites: ["Nordic Curl"] },

  // Leg Master Milestone
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

  // Push Mastery
  { name: "90 Degree Push-up", path: "push", mastery_req: "3 × 3", target_reps: 3, prerequisites: ["Handstand Push-up", "Pseudo Planche Push-up"] },
  { name: "L-Sit to Handstand Press", path: "push", mastery_req: "3 × 3", target_reps: 3, prerequisites: ["Handstand Push-up", "L-Sit (Floor)"] },
  { name: "PUSH MASTER", path: "push", mastery_req: "1 × 1", target_reps: 1, prerequisites: ["One-Arm Push-up", "Weighted Dips", "Explosive Dips", "Straddle Planche Hold", "90 Degree Push-up", "L-Sit to Handstand Press"] },

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

  // Pull Mastery
  { name: "PULL MASTER", path: "pull", mastery_req: "1 × 1", target_reps: 1, prerequisites: ["Pull-up to Front Lever", "Weighted Muscle-up", "One-Arm Negative", "Front Lever Pull-up", "Full Back Lever"] },

  // Core (33 items)
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

  // Skills Mastery
  { name: "SKILLS MASTER", path: "skills", mastery_req: "1 × 1", target_reps: 1, prerequisites: ["One-Arm Crow Pose", "Handstand Press tuck", "Dive Roll", "Macaco", "Bridge Kickover"] },

  // Elite Skills (8 items)
  { name: "Impossible Pull-up", path: "elite", mastery_req: "3 × 3", target_reps: 3, prerequisites: ["PULL MASTER"] },
  { name: "One-Arm Pull-up", path: "elite", mastery_req: "3 × 5", target_reps: 5, prerequisites: ["PULL MASTER", "Impossible Pull-up"] },
  { name: "Full Planche", path: "elite", mastery_req: "Hold 5s", target_reps: 5, prerequisites: ["PUSH MASTER"] },
  { name: "One-Arm Handstand", path: "elite", mastery_req: "Hold 5s", target_reps: 5, prerequisites: ["Full Planche", "Handstand Press tuck"] },
  { name: "Manna Full Hold", path: "elite", mastery_req: "Hold 8s", target_reps: 8, prerequisites: ["CORE MASTER", "SKILLS MASTER"] },
  { name: "Iron Cross (Rings)", path: "elite", mastery_req: "Hold 8s", target_reps: 8, prerequisites: ["PUSH MASTER", "PULL MASTER"] },
  { name: "Victorian Cross", path: "elite", mastery_req: "Hold 5s", target_reps: 5, prerequisites: ["Iron Cross (Rings)"] },
  { name: "ELITE MASTER", path: "elite", mastery_req: "1 × 1", target_reps: 1, prerequisites: ["One-Arm Pull-up", "Full Planche", "One-Arm Handstand", "Iron Cross (Rings)", "Victorian Cross", "Manna Full Hold"] },
];

export const LEG_PATHS = {
  "Foundation": ["Air Squat", "Box Squat", "Tempo Squat (3 sec down)", "Pause Squat (2 sec bottom)"],
  "Stance": ["Narrow Squat", "Standard Squat", "Wide Squat", "Sumo Squat", "Squat Pulse", "Jump Squat", "180° Jump Squat"],
  "Single Leg": ["Split Squat", "Reverse Lunge", "Walking Lunge", "Bulgarian Split Squat", "Cossack Squat"],
  "Shrimp": ["Shrimp Squat Assisted", "Shrimp Squat"],
  "Pistol": ["Assisted Pistol", "Box Pistol", "Negative Pistol", "Pistol Squat", "Paused Pistol", "Weighted Pistol", "Jumping Pistol", "Dragon Pistol"],
  "Posterior Chain": ["Glute Bridge", "Single Leg Glute Bridge", "Nordic Curl Assisted", "Nordic Curl Negative", "Nordic Curl", "Single Leg Nordic Curl"]
} as const;

export const PUSH_PATHS = {
  "Foundation": ["Wall Push-up", "High Incline Push-up", "Incline Push-up", "Knee Push-up", "Negative Push-up", "Standard Push-up"],
  "Strength": ["Wide Push-up", "Ring Push-up", "Deep Ring Push-up", "Diamond Push-up", "Archer Push-up", "Pseudo Planche Push-up", "One-Arm Incline Push-up", "One-Arm Push-up"],
  "Dips": ["Dips (Bench)", "Standard Dips", "Ring Dips", "Weighted Dips"],
  "Explosive": ["Clap Push-up", "Superman Push-up", "Explosive Dips"],
  "Handstand": ["Decline Push-up", "Pike Push-up", "Elevated Pike Push-up", "Wall Handstand Kick-up", "Wall Handstand Hold", "Handstand Wall Walk", "Handstand Shoulder Tap", "Freestanding Handstand Hold", "Handstand Push-up"],
  "Planche": ["Planche Lean", "Tuck Planche", "Advanced Tuck Planche", "Straddle Planche Lean", "Straddle Planche Hold"],
  "Elite": ["90 Degree Push-up", "L-Sit to Handstand Press"]
} as const;

export const PULL_PATHS = {
  "Foundation": ["Dead Hang", "Scapular Pull-up", "Australian Row", "Inverted Row", "Jackknife Pull-up", "Negative Chin-up", "Chin-up", "Neutral Grip Pull-up", "Standard Pull-up"],
  "Strength": ["Wide Grip Pull-up", "Commando Pull-up", "Towel Pull-up", "L-Sit Pull-up", "Archer Pull-up", "Weighted Pull-up", "Pull-up to Front Lever"],
  "Muscle-up": ["High Pull-up (Chest-to-bar)", "Explosive Pull-up", "Kipping Muscle-up", "Clean Muscle-up", "Ring Muscle-up", "L-Sit Muscle-up", "Weighted Muscle-up"],
  "One Arm": ["One-Arm Dead Hang", "One-Arm Inverted Row", "One-Arm Pull-up Assist", "One-Arm Negative"],
  "Front Lever": ["Skin the Cat", "Tuck Front Lever", "Advanced Tuck Front Lever", "Straddle Front Lever", "Full Front Lever", "Front Lever Pull-up"],
  "Back Lever": ["Tuck Back Lever", "Advanced Tuck Back Lever", "Straddle Back Lever", "Full Back Lever"]
} as const;

export const CORE_PATHS = {
  "Foundation": ["Plank", "Lying Leg Raise", "Hollow Body Hold", "Arch Hold"],
  "Hanging": ["Knee Raise (Hanging)", "Leg Raise (Hanging)", "Toes to Bar", "Hanging Rotational Raise"],
  "Compression": ["L-Sit (Parallel Bars)", "L-Sit (Floor)", "V-Sit", "Manna Assist", "Manna Hold"],
  "Rotation": ["Side Plank", "Windshield Wiper Assist", "Windshield Wiper"],
  "Extension": ["Bird Dog", "Superman Hold", "Reverse Hyperextension"],
  "Anti Rotation": ["Side Plank", "Pallof Press", "Plank Walkout"],
  "Advanced": ["Dragon Flag Assist", "Dragon Flag", "Ab Wheel Rollout (Knees)", "Ab Wheel Rollout (Feet)"]
} as const;

export const SKILLS_PATHS = {
  "Balance": ["Crow Pose Hold", "Crane Pose Hold", "Elbow Lever", "One-Arm Crow Pose"],
  "Inversions": ["Headstand Hold", "Tripod Transition", "Handstand Kick-up Assist", "Wall Walk Handstand", "Freestanding Handstand Attempt", "Handstand Press tuck"],
  "Movement": ["Forward Roll", "Backward Roll", "Shoulder Roll", "Kip-Up", "Dive Roll"],
  "Coordination": ["Bear Crawl", "Crab Walk", "Ape Walk", "Frog Walk", "Cartwheel", "Macaco"],
  "Bridge": ["Bridge Hold", "Bridge Rock", "Bridge Kickover"]
} as const;

export const ELITE_PATHS = {
  "Pull Mastery": ["Impossible Pull-up", "One-Arm Pull-up"],
  "Push Mastery": ["Full Planche"],
  "Inversion Mastery": ["One-Arm Handstand"],
  "Compression Mastery": ["Manna Full Hold"],
  "Rings Mastery": ["Iron Cross (Rings)", "Victorian Cross"]
} as const;

export function getXpForDifficulty(difficulty: number): number {
  const xpMapping: Record<number, number> = {
    1: 50, 2: 100, 3: 160, 4: 230, 5: 310,
    6: 400, 7: 500, 8: 620, 9: 760, 10: 950
  };
  return xpMapping[difficulty] ?? 50;
}

export function getCalisthenicsLevelInfo(xp: number) {
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
  else if (level >= 10) title = "Warrior";
  else if (level >= 5) title = "Dedicated Novice";

  return { 
    level, 
    progress, 
    xpForCurrent, 
    xpForNext, 
    title,
    currentXp: xp - xpForCurrent,
    nextLevelXp: levelXpDifference,
    totalXp: xp
  };
}

export const skillsLocked = (baseFourAvg: number) => baseFourAvg < 60;
export const eliteLocked = (baseFourAvg: number, skillsAvg: number) => baseFourAvg < 100 || skillsAvg < 100;

export interface CalisthenicsProgress {
  exercise_name: string;
  path: string;
  mastery_percent: number;
  learned: boolean;
  correct_form?: boolean;
  reps: number;
  target_reps?: number;
  sessions_hit?: number;
  x3_completed?: boolean;
  best_performance_date?: string | null;
}

export function isExerciseMastered(exName: string, skills: CalisthenicsProgress[]): boolean {
  const catalogItem = GUILD_CATALOG.find(item => item.name === exName);
  if (!catalogItem) return false;
  const skill = skills.find(s => s.exercise_name === exName);
  return skill ? (!!skill.x3_completed && skill.reps >= catalogItem.target_reps) : false;
}

export function calculateTotalXp(skills: { exercise_name: string; mastery_percent: number }[]): number {
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
}

export function getExerciseUnit(masteryReq: string): "sec" | "m" | "reps" {
  const req = masteryReq.toLowerCase();
  if (req.includes("sec") || req.includes("hold") || req.endsWith("s")) {
    return "sec";
  }
  if (req.endsWith("m") || req.includes("m ")) {
    return "m";
  }
  return "reps";
}

export const CALISTHENICS_PR_MAP: Record<string, string> = {
  "Standard Push-up": "Push-up",
  "Diamond Push-up": "Diamond Push-up",
  "Wide Push-up": "Wide Push-up",
  "Archer Push-up": "Archer Push-up",
  "Pseudo Planche Push-up": "Pseudo Planche Push-up",
  "Standard Dips": "Dips",
  "Standard Pull-up": "Pull-up",
  "Chin-up": "Chin-up",
  "Neutral Grip Pull-up": "Neutral Grip Pull-up",
  "Wide Grip Pull-up": "Wide Pull-up",
  "Commando Pull-up": "Commando Pull-up",
  "Australian Row": "Australian Row",
  "Inverted Row": "Inverted Row",
  "Air Squat": "Air Squat",
  "Jump Squat": "Jump Squat",
  "Bulgarian Split Squat": "Bulgarian Split Squat",
  "Walking Lunge": "Walking Lunge",
  "Cossack Squat": "Cossack Squat",
  "Pistol Squat": "Pistol Squat",
  "Plank": "Plank",
  "Side Plank": "Side Plank",
  "Hollow Body Hold": "Hollow Hold",
  "Arch Hold": "Arch Hold",
  "L-Sit (Floor)": "L-Sit",
  "V-Sit": "V-Sit",
  "Dead Hang": "Dead Hang",
  "Wall Handstand Hold": "Wall Handstand Hold",
  "Crow Pose Hold": "Crow Hold",
  "Weighted Dips": "Weighted Dips",
  "Reverse Lunge": "Reverse Lunge",
  "Split Squat": "Split Squat",
  "Sumo Squat": "Sumo Squat",
  "Nordic Curl": "Nordic Curl",
  "Glute Bridge": "Glute Bridge",
  "Dragon Flag": "Dragon Flag",
  "Ab Wheel Rollout (Feet)": "Ab Wheel Rollout",
  "Plank Walkout": "Plank Walkout",
  "Bird Dog": "Bird Dog",
  "Knee Raise (Hanging)": "Hanging Knee Raise",
  "Leg Raise (Hanging)": "Hanging Leg Raise",
  "Toes to Bar": "Toes to Bar"
};

export const PR_CALISTHENICS_MAP: Record<string, string> = Object.entries(CALISTHENICS_PR_MAP).reduce((acc, [cal, pr]) => {
  acc[pr] = cal;
  return acc;
}, {} as Record<string, string>);
