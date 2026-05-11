import { base44 } from "@/api/base44Client";

async function invokeLLM(params, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await base44.integrations.Core.InvokeLLM(params);
    } catch (err) {
      const is429 = err?.response?.status === 429 || err?.message?.includes("429");
      if (is429 && i < retries - 1) {
        await new Promise(res => setTimeout(res, delay * (i + 1)));
      } else {
        throw err;
      }
    }
  }
}

export async function generateThemes(topic, mode) {
  const result = await invokeLLM({
    prompt: `Topic: ${topic}
Mode: ${mode}

The user wants to explore this topic as a branching decision tree.
Break this topic into exactly 4-5 distinct themes that together cover the full space of this topic.
Each theme should be a noun phrase (e.g. "Growth Strategy", "Customer Segment", "Execution Risk").

Return a JSON array only, no commentary:
[
  { "id": "1", "title": "Theme Name", "description": "One sentence explaining what this theme covers and why it matters for this topic." }
]`,
    response_json_schema: {
      type: "object",
      properties: {
        themes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              description: { type: "string" }
            }
          }
        }
      }
    }
  });
  return result.themes;
}

export async function generateRootAndBranches(topic, mode, themeTitle, themeDescription) {
  const result = await invokeLLM({
    prompt: `Topic: ${topic}
Mode: ${mode}
Theme: ${themeTitle} — ${themeDescription}

Generate the root question for this theme and 3-4 answer branches.
Each branch is a distinct strategic choice or belief the user might hold.
The root question should be specific to this topic, not generic.

In Mentor mode: mark one branch as aiSuggested: true (the one you think is strongest) and add a short rationale.
In Coach mode: all aiSuggested: false, no rationale.

Return JSON only:
{
  "rootQuestion": "The central question for this theme?",
  "branches": [
    { "id": "uuid", "label": "Branch label (3-8 words)", "assumption": "The underlying assumption this choice represents (one sentence).", "aiSuggested": false, "aiRationale": "" }
  ]
}`,
    response_json_schema: {
      type: "object",
      properties: {
        rootQuestion: { type: "string" },
        branches: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              label: { type: "string" },
              assumption: { type: "string" },
              aiSuggested: { type: "boolean" },
              aiRationale: { type: "string" }
            }
          }
        }
      }
    }
  });
  return result;
}

export async function generateSubBranches(topic, mode, parentLabel, parentAssumption, depth) {
  if (depth >= 3) return [];
  
  const result = await invokeLLM({
    prompt: `Topic: ${topic}
Mode: ${mode}
Parent branch: ${parentLabel}
Parent assumption: ${parentAssumption}
Depth: ${depth} (max 3, do not generate if depth is already 3)

Generate 3-4 sub-branches that logically follow from choosing the parent branch.
Each sub-branch should go deeper into a specific aspect or consequence of the parent choice.

Return JSON only:
[
  { "id": "uuid", "label": "Sub-branch label (3-8 words)", "assumption": "The underlying assumption (one sentence).", "aiSuggested": false, "aiRationale": "" }
]`,
    response_json_schema: {
      type: "object",
      properties: {
        branches: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              label: { type: "string" },
              assumption: { type: "string" },
              aiSuggested: { type: "boolean" },
              aiRationale: { type: "string" }
            }
          }
        }
      }
    }
  });
  return result.branches;
}

export async function pressureTestNode(topic, mode, nodeLabel, nodeAssumption) {
  const result = await invokeLLM({
    prompt: `Topic: ${topic}
Mode: ${mode}
Selected node: ${nodeLabel}
Assumption: ${nodeAssumption}

You are a red-team analyst. Challenge this assumption adversarially.
Be specific to this exact assumption — do not give generic advice.
Be direct and provocative, not polite.

In Mentor mode: after each question, add one sentence with your read on the risk level.
In Coach mode: questions only, riskRead should be empty string.

Return JSON only:
{
  "financial": { "question": "...", "riskRead": "..." },
  "market": { "question": "...", "riskRead": "..." },
  "execution": { "question": "...", "riskRead": "..." }
}`,
    response_json_schema: {
      type: "object",
      properties: {
        financial: {
          type: "object",
          properties: { question: { type: "string" }, riskRead: { type: "string" } }
        },
        market: {
          type: "object",
          properties: { question: { type: "string" }, riskRead: { type: "string" } }
        },
        execution: {
          type: "object",
          properties: { question: { type: "string" }, riskRead: { type: "string" } }
        }
      }
    }
  });
  return result;
}

export async function suggestAlternative(topic, parentLabel, currentNodeLabel) {
  const result = await invokeLLM({
    prompt: `Topic: ${topic}
Parent node: ${parentLabel}
Current branch chosen: ${currentNodeLabel}

Propose one alternative strategic choice the user did not consider, for the same parent.
It should be genuinely different — not a variation of what was chosen.
Explain in one sentence why it is worth considering.

Return JSON only:
{
  "label": "Alternative branch label (3-8 words)",
  "assumption": "The underlying assumption (one sentence).",
  "reason": "Why this alternative is worth considering (one sentence)."
}`,
    response_json_schema: {
      type: "object",
      properties: {
        label: { type: "string" },
        assumption: { type: "string" },
        reason: { type: "string" }
      }
    }
  });
  return result;
}

export async function generateReport(topic, mode, likedBranches) {
  const result = await invokeLLM({
    prompt: `Topic: ${topic}
Mode: ${mode}
Liked branches (JSON): ${JSON.stringify(likedBranches)}

Generate a red team report based on the branches the user selected and liked.

Rules:
- Be specific — name the actual assumptions, do not paraphrase generically
- Weak assumptions: explain exactly why they are vulnerable
- Strong branches: explain exactly what makes them defensible
- Synthesis: identify patterns in what the user kept choosing and what that reveals about their thinking
- Next step: one concrete action, not "do more research"

Also decide: is this topic best served by (a) a Cursor/Lovable coding prompt (outputFormat = "prompt"), or (b) an argument/strategy summary (outputFormat = "summary")? Output whichever fits.

Return JSON only with these exact fields:
{
  "weakAssumptions": [{ "name": "assumption name", "why": "why it is weak" }],
  "strongBranches": [{ "name": "branch name", "why": "why it is strong" }],
  "synthesis": ["observation 1", "observation 2", "observation 3"],
  "nextStep": "one concrete next action",
  "outputFormat": "prompt",
  "outputContent": "the content text"
}`,
    response_json_schema: {
      type: "object",
      properties: {
        weakAssumptions: {
          type: "array",
          items: {
            type: "object",
            properties: { name: { type: "string" }, why: { type: "string" } }
          }
        },
        strongBranches: {
          type: "array",
          items: {
            type: "object",
            properties: { name: { type: "string" }, why: { type: "string" } }
          }
        },
        synthesis: { type: "array", items: { type: "string" } },
        nextStep: { type: "string" },
        outputFormat: { type: "string", enum: ["prompt", "summary"] },
        outputContent: { type: "string" }
      },
      required: ["weakAssumptions", "strongBranches", "synthesis", "nextStep", "outputFormat", "outputContent"]
    }
  });
  return result;
}