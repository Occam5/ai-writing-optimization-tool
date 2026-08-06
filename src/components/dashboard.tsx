"use client";

import {
  ArrowRight,
  Check,
  Clipboard,
  Clock3,
  Download,
  FileText,
  ImagePlus,
  History,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  PenLine,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { diffWords } from "diff";
import type { AnalysisRecord, FeedbackItem, ScoreKey } from "@/lib/analysis";
import { criterionLabels } from "@/lib/analysis";

type Props = {
  email: string;
  initialRemaining: number;
  initialHistory: AnalysisRecord[];
};

const samplePrompt =
  "Some people believe that technology has made education more accessible, while others think it has reduced the quality of classroom interaction. Discuss both views and give your own opinion.";

const sampleResponse = `Some people believe that technology has made education more accessible, while others argue that it has reduced the quality of classroom interaction. In my opinion, digital tools can improve learning when they support, rather than replace, teachers.

One major advantage is that students can access educational materials regardless of their location. For example, online courses allow learners in rural areas to study subjects that may not be offered locally. This gives a lot of people a chance to continue their education and develop useful skills.

However, technology cannot provide every part of a successful education. Face-to-face lessons encourage discussion and allow teachers to notice when a student is confused. I think that schools should therefore combine digital resources with regular classroom teaching.

In conclusion, technology is very important for widening access to education, but it should be used as a tool rather than a replacement for human teachers.`;

const scoreOrder: ScoreKey[] = [
  "taskAchievement",
  "coherenceCohesion",
  "lexicalResource",
  "grammarAccuracy",
];

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function FeedbackCard({ item }: { item: FeedbackItem }) {
  return (
    <article className="feedback-card">
      <div className="feedback-heading">
        <span className={`severity severity-${item.severity}`}>{item.severity}</span>
        <span>{criterionLabels[item.criterion]}</span>
      </div>
      <h3>{item.title}</h3>
      <blockquote>{item.evidence}</blockquote>
      <p>{item.explanation}</p>
      <div className="suggestion"><Sparkles size={15} /><span>{item.suggestion}</span></div>
    </article>
  );
}

export function Dashboard({ email, initialRemaining, initialHistory }: Props) {
  const [taskType, setTaskType] = useState<"task1" | "task2">("task2");
  const [revisionMode, setRevisionMode] = useState<"conservative" | "polished">("conservative");
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<{ data: string; mimeType: "image/jpeg" | "image/png" | "image/webp"; preview: string } | null>(null);
  const [text, setText] = useState("");
  const [remaining, setRemaining] = useState(initialRemaining);
  const [history, setHistory] = useState(initialHistory);
  const [active, setActive] = useState<AnalysisRecord | null>(initialHistory[0] ?? null);
  const [resultTab, setResultTab] = useState<"overview" | "feedback" | "revised" | "changes">("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const target = taskType === "task1" ? 150 : 250;
  const changes = useMemo(
    () => active ? diffWords(active.originalText, active.result.revisedText) : [],
    [active],
  );

  function useSample() {
    setTaskType("task2");
    setPrompt(samplePrompt);
    setText(sampleResponse);
    setImage(null);
    setError("");
  }

  async function analyse() {
    if (remaining === 0) {
      setUpgradeOpen(true);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskType, revisionMode, prompt, text, image: image ? { data: image.data, mimeType: image.mimeType } : undefined }),
      });
      const data = await response.json();
      if (data.error === "FREE_LIMIT_REACHED") {
        setRemaining(0);
        setUpgradeOpen(true);
        return;
      }
      if (!response.ok) throw new Error(data.error || "Analysis failed. Please try again.");
      setActive(data.analysis);
      setHistory((items) => [data.analysis, ...items].slice(0, 5));
      setRemaining(data.remaining);
      setResultTab("overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function selectImage(file?: File) {
    if (!file) return;
    if (!(["image/jpeg", "image/png", "image/webp"].includes(file.type)) || file.size > 5_000_000) {
      setError("Use a JPG, PNG, or WebP image smaller than 5 MB."); return;
    }
    // Show a warning that the image will not be analysed by the current AI model
    setError("Image uploaded for reference only — the current AI model (DeepSeek) is text-only. Please also describe the question in the text box above.");
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result); const data = value.split(",")[1];
      setImage({ data, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp", preview: value });
    };
    reader.readAsDataURL(file);
  }

  async function copyRevision() {
    if (!active) return;
    await navigator.clipboard.writeText(active.result.revisedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function downloadReport() {
    if (!active) return;
    const scores = scoreOrder.map((key) => `- ${criterionLabels[key]}: ${active.result.scores[key].toFixed(1)}`).join("\n");
    const feedback = active.result.feedback.map((item) => `### ${item.title}\n\n**Evidence:** ${item.evidence}\n\n${item.explanation}\n\n**Suggestion:** ${item.suggestion}`).join("\n\n");
    const report = `# L2Write IELTS Writing Report\n\n**Estimated band:** ${active.result.overallBand.toFixed(1)}\n\n## Scores\n${scores}\n\n## Summary\n${active.result.summary}\n\n## Feedback\n${feedback}\n\n## Revised response\n${active.result.revisedText}\n\n---\n${active.result.disclaimer}\n`;
    const url = URL.createObjectURL(new Blob([report], { type: "text/markdown" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `l2write-report-${active.id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="dashboard-page">
      <header className="app-header">
        <Link className="brand" href="/"><span className="brand-mark">L2</span><span>L2Write</span></Link>
        <div className="app-header-right">
          <button className="usage-button" onClick={() => remaining === 0 && setUpgradeOpen(true)}>
            <Zap size={15} /> <strong>{remaining}</strong> of 5 analyses left
          </button>
          <span className="account-email">{email}</span>
          <form action="/api/auth/logout" method="post">
            <button className="icon-button" title="Sign out" type="submit"><LogOut size={18} /></button>
          </form>
        </div>
      </header>

      <div className="workspace-shell">
        <aside className="history-sidebar">
          <div className="sidebar-title"><History size={16} /><span>Recent analyses</span></div>
          <button className="new-analysis" onClick={() => { setActive(null); setText(""); setPrompt(""); }}>
            <PenLine size={16} /> New analysis
          </button>
          <div className="history-list">
            {history.length === 0 && <p className="empty-history">Your five most recent analyses will appear here.</p>}
            {history.map((item) => (
              <button className={`history-item ${active?.id === item.id ? "is-active" : ""}`} key={item.id} onClick={() => { setActive(item); setResultTab("overview"); }}>
                <span>{item.taskType === "task1" ? "Task 1" : "Task 2"} · Band {item.result.overallBand.toFixed(1)}</span>
                <strong>{item.prompt}</strong>
                <small><Clock3 size={11} /> {dateLabel(item.createdAt)}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="workspace-main">
          <div className="workspace-heading">
            <div><p className="eyebrow"><span /> Writing workspace</p><h1>Improve your IELTS response.</h1></div>
            <button className="sample-button" onClick={useSample}>Use sample response</button>
          </div>

          <div className="editor-card">
            <div className="editor-toolbar">
              <div className="segmented" aria-label="IELTS task type">
                <button className={taskType === "task1" ? "selected" : ""} onClick={() => setTaskType("task1")}>Task 1</button>
                <button className={taskType === "task2" ? "selected" : ""} onClick={() => setTaskType("task2")}>Task 2</button>
              </div>
              <div className="mode-control">
                <span>Revision</span>
                <select value={revisionMode} onChange={(event) => setRevisionMode(event.target.value as typeof revisionMode)}>
                  <option value="conservative">Conservative</option>
                  <option value="polished">Polished</option>
                </select>
              </div>
            </div>
            <label className="field-label" htmlFor="question">IELTS question</label>
            <textarea id="question" className="question-input" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={taskType === "task1" ? "Paste the Task 1 chart or letter prompt..." : "Paste the Task 2 essay question..."} />
            <div className="image-upload-row">
              <label className="image-upload"><ImagePlus size={16} /><span>{image ? "Replace question image" : "Upload question image"}</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => selectImage(event.target.files?.[0])} /></label>
              <small style={{ color: "var(--text-muted, #888)" }}>⚠️ Current AI (DeepSeek) is text-only — image for reference only</small>
            </div>
            {image && <div className="question-image"><Image src={image.preview} alt="Uploaded IELTS question" width={900} height={600} unoptimized /><button title="Remove image" onClick={() => setImage(null)}><X size={15} /></button></div>}
            <div className="response-label"><label className="field-label" htmlFor="response">Your response</label><span className={wordCount < target ? "under-target" : ""}>{wordCount} words · target {target}+</span></div>
            <textarea id="response" className="response-input" value={text} onChange={(event) => setText(event.target.value)} placeholder="Write or paste your response here..." />
            {error && <p className="workspace-error" role="alert">{error}</p>}
            <div className="editor-footer">
              <p><LockKeyhole size={13} /> Demo data stays in your local database.</p>
              <button className="button analyse-button" disabled={loading || (!prompt.trim() && !image) || text.trim().length < 50} onClick={analyse}>
                {loading ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}
                {loading ? "Analysing response..." : remaining === 0 ? "Upgrade to continue" : "Analyse writing"}
                {!loading && <ArrowRight size={17} />}
              </button>
            </div>
          </div>

          {active ? (
            <section className="results-card">
              <div className="results-header">
                <div><span>Writing evaluation</span><strong>{active.taskType === "task1" ? "IELTS Task 1" : "IELTS Task 2"}</strong></div>
                <div className="result-actions">
                  <button title="Copy revised response" onClick={copyRevision}>{copied ? <Check size={16} /> : <Clipboard size={16} />}</button>
                  <button title="Download report" onClick={downloadReport}><Download size={16} /></button>
                </div>
              </div>
              <div className="result-tabs" role="tablist">
                {(["overview", "feedback", "revised", "changes"] as const).map((tab) => (
                  <button className={resultTab === tab ? "selected" : ""} key={tab} onClick={() => setResultTab(tab)}>{tab}</button>
                ))}
              </div>
              <div className="result-content">
                {resultTab === "overview" && (
                  <div className="overview-grid">
                    <div className="band-panel"><span>Estimated band</span><strong>{active.result.overallBand.toFixed(1)}</strong><small>Mock evaluation</small></div>
                    <div className="criteria-panel">
                      {scoreOrder.map((key) => (
                        <div className="criterion-row" key={key}>
                          <div><span>{criterionLabels[key]}</span><div className="criterion-track"><i style={{ width: `${active.result.scores[key] * 10}%` }} /></div></div>
                          <strong>{active.result.scores[key].toFixed(1)}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="summary-panel"><h3>Examiner-style summary</h3><p>{active.result.summary}</p><small>{active.result.disclaimer}</small></div>
                  </div>
                )}
                {resultTab === "feedback" && <div className="feedback-grid">{active.result.feedback.map((item) => <FeedbackCard item={item} key={item.id} />)}</div>}
                {resultTab === "revised" && (
                  <div className="revised-view">
                    <div className="revision-copy"><h3>Improved response</h3><p>{active.result.revisedText}</p></div>
                    <aside><h3>What changed</h3>{active.result.revisionNotes.map((note) => <p key={note}><Check size={14} />{note}</p>)}</aside>
                  </div>
                )}
                {resultTab === "changes" && (
                  <div className="diff-view"><h3>Original vs revised</h3><p>{changes.map((part, index) => <span className={part.added ? "diff-added" : part.removed ? "diff-removed" : ""} key={index}>{part.value}</span>)}</p><div className="diff-legend"><span><i className="added" />Added</span><span><i className="removed" />Removed</span></div></div>
                )}
              </div>
            </section>
          ) : (
            <section className="result-empty"><FileText size={24} /><div><strong>Your evaluation will appear here.</strong><p>Use the sample response to preview the complete workflow.</p></div></section>
          )}
        </section>
      </div>

      {upgradeOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setUpgradeOpen(false)}>
          <section className="upgrade-modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" title="Close" onClick={() => setUpgradeOpen(false)}><X size={19} /></button>
            <span className="modal-icon"><Zap size={24} /></span>
            <p className="eyebrow"><span /> L2Write Pro</p>
            <h2 id="upgrade-title">More practice is coming soon.</h2>
            <p>Unlimited analyses, longer responses, and advanced progress reports are being prepared.</p>
            <button className="button" onClick={() => setUpgradeOpen(false)}>Got it</button>
          </section>
        </div>
      )}
    </main>
  );
}
