import type { AnalysisResult, FeedbackItem } from "./analysis";

type MockInput = {
  taskType: "task1" | "task2";
  prompt: string;
  text: string;
  revisionMode: "conservative" | "polished";
};

function firstSentence(text: string) {
  return text.split(/(?<=[.!?])\s+/)[0]?.trim().slice(0, 180) || text.slice(0, 180);
}

function findEvidence(text: string, pattern: RegExp, fallback: string) {
  const match = text.match(pattern);
  return match?.[0]?.trim().slice(0, 180) || fallback;
}

function polishText(text: string, mode: MockInput["revisionMode"]) {
  let revised = text
    .replace(/\bIn my opinion,?\s*/gi, "In my view, ")
    .replace(/\bNowadays,?\s*/gi, "Today, ")
    .replace(/\ba lot of\b/gi, "many")
    .replace(/\bvery important\b/gi, "essential")
    .replace(/\bpeople can\b/gi, "individuals can")
    .replace(/\bI think that\b/gi, "I would argue that")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/ {2,}/g, " ")
    .trim();

  if (mode === "polished") {
    revised = revised
      .replace(/\bAlso,\s*/g, "Furthermore, ")
      .replace(/\bBut,?\s*/g, "However, ")
      .replace(/\bSo,?\s*/g, "Consequently, ");
  }
  return revised;
}

export async function generateMockAnalysis(input: MockInput): Promise<AnalysisResult> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const words = input.text.trim().split(/\s+/).filter(Boolean);
  const sentenceCount = input.text.split(/[.!?]+/).filter((item) => item.trim()).length;
  const paragraphs = input.text.split(/\n\s*\n/).filter((item) => item.trim()).length;
  const target = input.taskType === "task1" ? 150 : 250;
  const lengthScore = words.length >= target ? 7 : words.length >= target * 0.7 ? 6.5 : 5.5;
  const structureScore = paragraphs >= 3 ? 7 : paragraphs === 2 ? 6.5 : 6;
  const varietyScore = /however|furthermore|consequently|whereas|although/i.test(input.text) ? 7 : 6.5;
  const grammarScore = sentenceCount >= 5 ? 6.5 : 6;
  const scores = {
    taskAchievement: lengthScore,
    coherenceCohesion: structureScore,
    lexicalResource: varietyScore,
    grammarAccuracy: grammarScore,
  };
  const overallBand = Math.round((Object.values(scores).reduce((a, b) => a + b, 0) / 4) * 2) / 2;
  const opening = firstSentence(input.text);
  const example = findEvidence(
    input.text,
    /(?:for example|for instance)[^.?!]*(?:[.?!]|$)/i,
    opening,
  );

  const feedback: FeedbackItem[] = [
    {
      id: "task-focus",
      criterion: "taskAchievement",
      severity: words.length < target ? "major" : "suggestion",
      title: words.length < target ? "Develop the response further" : "Make the central position more precise",
      evidence: opening,
      explanation:
        words.length < target
          ? `This response has ${words.length} words. IELTS ${input.taskType === "task1" ? "Task 1" : "Task 2"} normally requires at least ${target} words.`
          : "The position is visible, but it could preview the main reasons more explicitly.",
      suggestion: words.length < target
        ? "Add a fully developed supporting point with an explanation and a relevant example."
        : "State the two main lines of argument in the introduction and return to them in the conclusion.",
    },
    {
      id: "example-depth",
      criterion: "coherenceCohesion",
      severity: "minor",
      title: "Connect evidence to the argument",
      evidence: example,
      explanation: "The example is relevant, but its consequence is not fully explained.",
      suggestion: "Add one sentence showing exactly how this example supports the paragraph's main claim.",
    },
    {
      id: "lexical-precision",
      criterion: "lexicalResource",
      severity: "suggestion",
      title: "Use more precise academic wording",
      evidence: findEvidence(input.text, /\b(?:a lot of|very important|people can)[^.?!,]*/i, opening),
      explanation: "Some wording is accurate but general, which limits lexical precision.",
      suggestion: "Replace broad expressions with context-specific vocabulary while keeping the meaning natural.",
    },
    {
      id: "sentence-control",
      criterion: "grammarAccuracy",
      severity: "minor",
      title: "Balance sentence length",
      evidence: opening,
      explanation: "The response would be easier to follow with a more deliberate mix of simple and complex sentences.",
      suggestion: "Keep one main idea per sentence and use subordinate clauses only where the relationship is clear.",
    },
  ];

  return {
    overallBand,
    scores,
    summary: `This is a ${overallBand.toFixed(1)}-level response with a clear direction and generally relevant ideas. The strongest next step is to develop evidence more fully and make the progression between claims more explicit.`,
    feedback,
    revisedText: polishText(input.text, input.revisionMode),
    revisionNotes: [
      "Replaced general expressions with more precise academic wording.",
      "Improved transitions without changing the core position.",
      input.revisionMode === "polished"
        ? "Applied a more substantial stylistic edit for fluency and cohesion."
        : "Preserved the original structure and made only conservative edits.",
    ],
    disclaimer: "Mock evaluation for product demonstration only. This is not an official IELTS band score.",
  };
}
