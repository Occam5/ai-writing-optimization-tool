"use client";

import {
  ArrowRight,
  Check,
  Clipboard,
  Clock3,
  Download,
  FileText,
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
import { useMemo, useState } from "react";
import { diffWords } from "diff";
import type { AnalysisRecord, FeedbackItem, ScoreKey } from "@/lib/analysis";
import { criterionLabels } from "@/lib/analysis";

type Props = {
  email: string;
  initialRemaining: number;
  initialHistory: AnalysisRecord[];
};

const samplePrompt = "Digital technology and access to education";

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
  const [taskType, setTaskType] = useState<"research" | "coursework">("research");
  const [revisionMode, setRevisionMode] = useState<"conservative" | "polished">("conservative");
  const [prompt, setPrompt] = useState("");
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
  const changes = useMemo(
    () => active ? diffWords(active.originalText, active.result.revisedText) : [],
    [active],
  );

  function useSample() {
    setTaskType("research");
    setPrompt(samplePrompt);
    setText(sampleResponse);
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
        body: JSON.stringify({ taskType, revisionMode, prompt, text }),
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
    const report = `# L2Write Academic Writing Report\n\n**Overall score:** ${active.result.overallBand.toFixed(1)}/10\n\n## Scores\n${scores}\n\n## Summary\n${active.result.summary}\n\n## Feedback\n${feedback}\n\n## Revised paper\n${active.result.revisedText}\n\n---\n${active.result.disclaimer}\n`;
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
                <span>{item.taskType === "research" ? "Research paper" : "Coursework"} · {item.result.overallBand.toFixed(1)}/10</span>
                <strong>{item.prompt}</strong>
                <small><Clock3 size={11} /> {dateLabel(item.createdAt)}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="workspace-main">
          <div className="workspace-heading">
            <div><p className="eyebrow"><span /> Academic writing workspace</p><h1>Strengthen your paper.</h1></div>
            <button className="sample-button" onClick={useSample}>Use sample paper</button>
          </div>

          <div className="editor-card">
            <div className="editor-toolbar">
              <div className="segmented" aria-label="Paper type">
                <button className={taskType === "research" ? "selected" : ""} onClick={() => setTaskType("research")}>Research paper</button>
                <button className={taskType === "coursework" ? "selected" : ""} onClick={() => setTaskType("coursework")}>Coursework</button>
              </div>
              <div className="mode-control">
                <span>Revision</span>
                <select value={revisionMode} onChange={(event) => setRevisionMode(event.target.value as typeof revisionMode)}>
                  <option value="conservative">Conservative</option>
                  <option value="polished">Polished</option>
                </select>
              </div>
            </div>
            <label className="field-label" htmlFor="question">Paper title or assignment brief (optional)</label>
            <textarea id="question" className="question-input" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Add a title, research question, or assignment brief..." />
            <div className="response-label"><label className="field-label" htmlFor="response">Your paper</label><span>{wordCount} words</span></div>
            <textarea id="response" className="response-input" value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste your paper or draft here..." />
            {error && <p className="workspace-error" role="alert">{error}</p>}
            <div className="editor-footer">
              <p><LockKeyhole size={13} /> Demo data stays in your local database.</p>
              <button className="button analyse-button" disabled={loading || text.trim().length < 50} onClick={analyse}>
                {loading ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}
                {loading ? "Analysing paper..." : remaining === 0 ? "Upgrade to continue" : "Analyse paper"}
                {!loading && <ArrowRight size={17} />}
              </button>
            </div>
          </div>

          {active ? (
            <section className="results-card">
              <div className="results-header">
                <div><span>Academic writing evaluation</span><strong>{active.taskType === "research" ? "Research paper" : "Coursework paper"}</strong></div>
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
                    <div className="band-panel"><span>Overall score</span><strong>{active.result.overallBand.toFixed(1)}</strong><small>Out of 10</small></div>
                    <div className="criteria-panel">
                      {scoreOrder.map((key) => (
                        <div className="criterion-row" key={key}>
                          <div><span>{criterionLabels[key]}</span><div className="criterion-track"><i style={{ width: `${active.result.scores[key] * 10}%` }} /></div></div>
                          <strong>{active.result.scores[key].toFixed(1)}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="summary-panel"><h3>Editorial summary</h3><p>{active.result.summary}</p><small>{active.result.disclaimer}</small></div>
                  </div>
                )}
                {resultTab === "feedback" && <div className="feedback-grid">{active.result.feedback.map((item) => <FeedbackCard item={item} key={item.id} />)}</div>}
                {resultTab === "revised" && (
                  <div className="revised-view">
                    <div className="revision-copy"><h3>Improved paper</h3><p>{active.result.revisedText}</p></div>
                    <aside><h3>What changed</h3>{active.result.revisionNotes.map((note) => <p key={note}><Check size={14} />{note}</p>)}</aside>
                  </div>
                )}
                {resultTab === "changes" && (
                  <div className="diff-view"><h3>Original vs revised</h3><p>{changes.map((part, index) => <span className={part.added ? "diff-added" : part.removed ? "diff-removed" : ""} key={index}>{part.value}</span>)}</p><div className="diff-legend"><span><i className="added" />Added</span><span><i className="removed" />Removed</span></div></div>
                )}
              </div>
            </section>
          ) : (
            <section className="result-empty"><FileText size={24} /><div><strong>Your evaluation will appear here.</strong><p>Use the sample paper to preview the complete workflow.</p></div></section>
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
