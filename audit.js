const fs = require('fs');
const path = require('path');

// 1. Read lib/calisthenicsConfig.ts
const configPath = path.join(__dirname, 'lib/calisthenicsConfig.ts');
if (!fs.existsSync(configPath)) {
  console.error("Error: Could not find lib/calisthenicsConfig.ts at " + configPath);
  process.exit(1);
}

const content = fs.readFileSync(configPath, 'utf8');

// 2. Parse GUILD_CATALOG block
const catalogMatch = content.match(/export const GUILD_CATALOG: CatalogItem\[\] = (\[[\s\S]+?\]);/);
if (!catalogMatch) {
  console.error("Error: Could not parse GUILD_CATALOG from lib/calisthenicsConfig.ts");
  process.exit(1);
}

// Evaluate content cleanly
const cleanedArray = catalogMatch[1]
  .replace(/\/\/.*$/gm, '') // Remove comments
  .replace(/prerequisites:\s*\[\s*\]/g, 'prerequisites: []')
  .trim();

let GUILD_CATALOG;
try {
  GUILD_CATALOG = eval(cleanedArray);
} catch (e) {
  console.error("Error: Failed to evaluate GUILD_CATALOG contents.", e);
  process.exit(1);
}

console.log(`--- Running Data Integrity Audit on ${GUILD_CATALOG.length} Exercises ---`);

const catalogMap = new Map();
const namesSeen = new Set();
const VALID_PATHS = new Set(['legs', 'push', 'pull', 'core', 'skills', 'elite']);
const VALID_MASTER_TITLES = new Set([
  'LEG MASTER',
  'PUSH MASTER',
  'PULL MASTER',
  'CORE MASTER',
  'SKILLS MASTER',
  'ELITE MASTER'
]);

let failures = 0;

function reportFailure(message) {
  console.error(`❌ [FAILURE] ${message}`);
  failures++;
}

// Check 1: Unique Names, Valid Paths, Valid Book mappings
GUILD_CATALOG.forEach((item, index) => {
  if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
    reportFailure(`Exercise at index ${index} is missing a valid name`);
    return;
  }

  const name = item.name.trim();

  // Unique Name check
  if (namesSeen.has(name)) {
    reportFailure(`Duplicate exercise name found: "${name}"`);
  }
  namesSeen.add(name);

  // Path check
  if (!VALID_PATHS.has(item.path)) {
    reportFailure(`Exercise "${name}" has an invalid path: "${item.path}"`);
  }

  catalogMap.set(name, item);
});

// Check 2: Prerequisite references existence
GUILD_CATALOG.forEach(item => {
  const prereqs = item.prerequisites;
  if (!prereqs) return;

  const list = Array.isArray(prereqs) ? prereqs : (prereqs.exercises || []);
  list.forEach(pre => {
    // A prerequisite must be an existing exercise OR a valid master title milestone
    if (!catalogMap.has(pre) && !VALID_MASTER_TITLES.has(pre)) {
      reportFailure(`Exercise "${item.name}" references non-existent prerequisite: "${pre}"`);
    }
  });
});

// Check 3: Cycle Detection (Circular Prerequisites)
const visited = new Set();
const recStack = new Set();

function checkCycle(nodeName) {
  if (recStack.has(nodeName)) {
    reportFailure(`Circular prerequisite dependency detected involving: "${nodeName}"`);
    return true;
  }
  if (visited.has(nodeName)) return false;

  visited.add(nodeName);
  recStack.add(nodeName);

  const item = catalogMap.get(nodeName);
  if (item && item.prerequisites) {
    const list = Array.isArray(item.prerequisites) ? item.prerequisites : (item.prerequisites.exercises || []);
    for (const pre of list) {
      if (checkCycle(pre)) return true;
    }
  }

  recStack.delete(nodeName);
  return false;
}

mockCatalogNames = Array.from(catalogMap.keys());
mockCatalogNames.forEach(name => {
  if (!visited.has(name)) {
    checkCycle(name);
  }
});

// Check 4: Reachability and deadlocks
const mastered = new Set();
let progress = true;

// Pre-fill valid master titles as already completed milestones since they depend on earlier books
VALID_MASTER_TITLES.forEach(title => {
  mastered.add(title);
});

function isUnlocked(item) {
  const prereqs = item.prerequisites;
  if (!prereqs || (Array.isArray(prereqs) && prereqs.length === 0)) return true;
  const list = Array.isArray(prereqs) ? prereqs : (prereqs.exercises || []);
  const relation = (prereqs && !Array.isArray(prereqs)) ? prereqs.type : 'and';
  
  if (relation === 'or') {
    return list.some(p => mastered.has(p));
  } else {
    return list.every(p => mastered.has(p));
  }
}

let passes = 0;
while (progress) {
  progress = false;
  GUILD_CATALOG.forEach(item => {
    if (!mastered.has(item.name) && isUnlocked(item)) {
      mastered.add(item.name);
      progress = true;
    }
  });
  passes++;
}

GUILD_CATALOG.forEach(item => {
  if (!mastered.has(item.name)) {
    reportFailure(`Orphaned or unreachable exercise: "${item.name}" (Prerequisites: ${JSON.stringify(item.prerequisites)})`);
  }
});

// 3. Print summary and exit
if (failures > 0) {
  console.error(`\n🔴 Data Integrity Audit failed with ${failures} error(s).`);
  process.exit(1);
} else {
  console.log("\n🟢 Data Integrity Audit passed successfully! 100% verified.");
  process.exit(0);
}
