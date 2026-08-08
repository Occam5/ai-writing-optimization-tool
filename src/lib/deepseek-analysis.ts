import { z } from "zod";
import type { AnalysisResult } from "./analysis";

const resultSchema = z.object({
  overallBand: z.number(),
  scores: z.object({
    taskAchievement: z.number(), coherenceCohesion: z.number(), lexicalResource: z.number(), grammarAccuracy: z.number(),
  }),
  summary: z.string(),
  feedback: z.array(z.object({
    id: z.string(),
    criterion: z.enum(["taskAchievement", "coherenceCohesion", "lexicalResource", "grammarAccuracy"]),
    severity: z.enum(["major", "minor", "suggestion"]),
    title: z.string(), evidence: z.string(), explanation: z.string(), suggestion: z.string(),
  })),
  revisedText: z.string(), revisionNotes: z.array(z.string()), disclaimer: z.string(),
});

type Input = {
  taskType: "research" | "coursework"; prompt: string; text: string;
  revisionMode: "conservative" | "polished";
};

export async function generateAnalysis(input: Input): Promise<AnalysisResult> {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) throw new Error("DEEPSEEK_API_KEY is not configured.");

  const model = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";

  const instruction = `You are an academic writing editor. Evaluate this ${input.taskType} paper using four criteria: Argument and Contribution, Structure and Coherence, Academic Style, and Clarity and Language. Revision mode: ${input.revisionMode}. Do not invent evidence, citations, findings, or references. Return exactly four feedback items, one per criterion. Quote evidence only from the submitted text. Scores must be from 0 to 10 in 0.5 increments. The disclaimer must state that this is AI writing feedback and does not verify factual accuracy or academic integrity.

TITLE OR BRIEF: ${input.prompt || "Not provided."}
PAPER:
${input.text}

Return a valid JSON object with exactly this structure:
{
  "overallBand": <number 0-10 in 0.5 steps>,
  "scores": {
    "taskAchievement": <number>, "coherenceCohesion": <number>,
    "lexicalResource": <number>, "grammarAccuracy": <number>
  },
  "summary": "<brief overall summary>",
  "feedback": [
    {
      "id": "<unique id>",
      "criterion": "<taskAchievement|coherenceCohesion|lexicalResource|grammarAccuracy>",
      "severity": "<major|minor|suggestion>",
      "title": "<short title>",
      "evidence": "<quoted text from response>",
      "explanation": "<explanation>",
      "suggestion": "<how to improve>"
    }
  ],
  "revisedText": "<full revised version of the response>",
  "revisionNotes": ["<note 1>", "<note 2>"],
  "disclaimer": "AI writing feedback only; factual accuracy, citations, and academic integrity have not been verified."
}`;

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: instruction }],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(90_000),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || `DeepSeek API returned ${response.status}`);
  }
  const raw = payload?.choices?.[0]?.message?.content;
  if (typeof raw !== "string") throw new Error("DeepSeek returned an empty response.");
  return resultSchema.parse(JSON.parse(raw)) as AnalysisResult;
}
