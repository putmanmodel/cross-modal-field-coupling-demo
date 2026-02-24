// (c) 2026 Stephen A. Putman — CC BY-NC 4.0
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { AuditStore } from "./audit_store";
import { EchoMatcher } from "./echo_matcher";
import { MemoryTraceStore } from "./memory_trace_store";
import { ReceiverGovernance } from "./receiver_governance";
import { AssociativeTrace, SensorFingerprint, Tag } from "./types";

const SCENES = ["Kitchen", "Store", "Street"] as const;
const OBJECTS = ["Door", "Person", "Phone", "Counter", "Car"] as const;
const ECHO_THRESHOLD = 0.6;

type Scene = (typeof SCENES)[number];
type ObjectName = (typeof OBJECTS)[number];

function printBlock(title: string, obj: unknown): void {
  console.log(`=== ${title} ===`);
  console.log(JSON.stringify(obj, null, 2));
}

function buildSensorFingerprint(scene: Scene, objects: ObjectName[]): SensorFingerprint {
  const sceneVector = SCENES.map((s) => (s === scene ? 1 : 0));
  const objectVector = OBJECTS.map((obj) => (objects.includes(obj) ? 1 : 0));

  return {
    source: `${scene.toLowerCase()}-sensor`,
    vector: [...sceneVector, ...objectVector],
  };
}

function parseMenuChoice(inputText: string, max: number): number | null {
  const value = Number.parseInt(inputText.trim(), 10);
  if (!Number.isFinite(value) || value < 1 || value > max) {
    return null;
  }
  return value;
}

function parseObjectSelection(selection: string): ObjectName[] {
  const indexes = selection
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= OBJECTS.length);

  const uniqueIndexes = Array.from(new Set(indexes));
  uniqueIndexes.sort((a, b) => a - b);

  return uniqueIndexes.map((idx) => OBJECTS[idx - 1]);
}

async function promptScene(rl: ReturnType<typeof createInterface>): Promise<Scene> {
  console.log("Select Scene:");
  SCENES.forEach((scene, i) => {
    console.log(`${i + 1}) ${scene}`);
  });

  while (true) {
    const answer = await rl.question("Scene number: ");
    const choice = parseMenuChoice(answer, SCENES.length);
    if (choice !== null) {
      return SCENES[choice - 1];
    }
    console.log("Invalid scene selection. Try again.");
  }
}

async function promptObjects(rl: ReturnType<typeof createInterface>): Promise<ObjectName[]> {
  console.log("Select Objects (comma-separated numbers, example: 1,3,5):");
  OBJECTS.forEach((objectName, i) => {
    console.log(`${i + 1}) ${objectName}`);
  });

  const answer = await rl.question("Object selection: ");
  return parseObjectSelection(answer);
}

function buildTimestamp(step: number): string {
  const seconds = String(step).padStart(2, "0");
  return `2026-01-01T00:00:${seconds}.000Z`;
}

async function main(): Promise<void> {
  const rl = createInterface({ input, output });

  const auditStore = new AuditStore();
  const memoryStore = new MemoryTraceStore();
  const echoMatcher = new EchoMatcher(memoryStore);
  const governance = new ReceiverGovernance(auditStore);

  let traceCounter = 1;
  let stepCounter = 1;

  try {
    while (true) {
      console.log("\nMenu:");
      console.log("1) Add Trace");
      console.log("2) Query Echo");
      console.log("3) Show Audit");
      console.log("4) Exit");

      const menuAnswer = await rl.question("Choose option: ");
      const menuChoice = parseMenuChoice(menuAnswer, 4);

      if (menuChoice === null) {
        console.log("Invalid menu choice. Try again.");
        continue;
      }

      if (menuChoice === 4) {
        console.log("Exiting interactive demo.");
        break;
      }

      if (menuChoice === 1) {
        const scene = await promptScene(rl);
        const objects = await promptObjects(rl);
        const dialogue = await rl.question("Dialogue input: ");

        const sensorFingerprint = buildSensorFingerprint(scene, objects);
        const tagId = `tag-audio-${traceCounter}`;
        const traceId = `trace-${traceCounter}`;

        const emittedTag: Tag = {
          id: tagId,
          kind: "audio.salience",
          commitClass: "associative",
          semanticBasis: "measured",
          determinism: "deterministic",
          provenance: ["interactive.audio.v1"],
          sensorFingerprint,
          payload: {
            scene,
            objects,
            dialogue,
          },
        };

        const importance = Number((0.5 + objects.length * 0.1).toFixed(2));
        const decay = 0.95;

        const trace: AssociativeTrace = {
          id: traceId,
          sourceTagId: tagId,
          tagKind: emittedTag.kind,
          commitClass: "associative",
          sensorFingerprint,
          score: importance,
          importance,
          decay,
          note: `scene=${scene}; objects=${objects.join("|") || "none"}; dialogue=${dialogue}`,
        };

        memoryStore.append(trace);

        auditStore.append({
          id: `audit-${auditStore.list().length + 1}`,
          type: "TRACE_STORED",
          tagId: emittedTag.id,
          timestamp: buildTimestamp(stepCounter),
          reason: "interactive trace added",
        });

        printBlock("ADD TRACE RESULT", {
          emittedTag,
          storedTrace: trace,
        });

        traceCounter += 1;
        stepCounter += 1;
        continue;
      }

      if (menuChoice === 2) {
        const scene = await promptScene(rl);
        const objects = await promptObjects(rl);

        const queryFingerprint = buildSensorFingerprint(scene, objects);
        const echoes = echoMatcher.queryEcho(queryFingerprint);
        const rankedResults = echoes.map((echo, index) => ({
          rank: index + 1,
          ...echo,
        }));

        const associativeOnly = echoes.every((echo) => echo.commitClass === "associative");
        const durableStateWritesAllowed = echoes.some((echo) => governance.canEchoWriteDurableState(echo));
        const topScore = rankedResults.length > 0 ? rankedResults[0].score : null;

        if (rankedResults.length === 0 || (topScore !== null && topScore < ECHO_THRESHOLD)) {
          printBlock("NO ECHO", {
            threshold: ECHO_THRESHOLD,
            topScore,
            message: "NO ECHO (below threshold)",
            candidates: rankedResults.slice(0, 3),
            associativeOnly,
            durableStateWritesAllowed,
          });
        } else {
          printBlock("ECHO TRIGGERED", {
            threshold: ECHO_THRESHOLD,
            top: rankedResults[0],
            message: "ECHO TRIGGERED",
            results: rankedResults,
            associativeOnly,
            durableStateWritesAllowed,
          });
        }

        continue;
      }

      printBlock("AUDIT EVENTS", {
        events: auditStore.list(),
      });
    }
  } finally {
    rl.close();
  }
}

void main();
