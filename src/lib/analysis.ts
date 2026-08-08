export type ScoreKey =
  | "taskAchievement"
  | "coherenceCohesion"
  | "lexicalResource"
  | "grammarAccuracy";

export type FeedbackItem = {
  id: string;
  criterion: ScoreKey;
  severity: "major" | "minor" | "suggestion";
  title: string;
  evidence: string;
  explanation: string;
  suggestion: string;
};

export type AnalysisResult = {
  overallBand: number;
  scores: Record<ScoreKey, number>;
  summary: string;
  feedback: FeedbackItem[];
  revisedText: string;
  revisionNotes: string[];
  disclaimer: string;
};

export type AnalysisRecord = {
  id: string;
  taskType: "research" | "coursework";
  prompt: string;
  revisionMode: "conservative" | "polished";
  originalText: string;
  createdAt: string;
  result: AnalysisResult;
};

export const criterionLabels: Record<ScoreKey, string> = {
  taskAchievement: "Argument & contribution",
  coherenceCohesion: "Structure & coherence",
  lexicalResource: "Academic style",
  grammarAccuracy: "Clarity & language",
};
