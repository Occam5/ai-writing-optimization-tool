import {
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  Gauge,
  Menu,
  Sparkles,
} from "lucide-react";

const scores = [
  ["Task response", "7.0"],
  ["Coherence & cohesion", "6.5"],
  ["Lexical resource", "7.0"],
  ["Grammar", "6.5"],
];

const features = [
  {
    icon: Gauge,
    title: "IELTS-aligned scoring",
    text: "See estimated band scores across the four official writing criteria.",
  },
  {
    icon: FileText,
    title: "Evidence-based feedback",
    text: "Every suggestion points to a specific phrase in your response.",
  },
  {
    icon: Sparkles,
    title: "A stronger revision",
    text: "Compare your draft with a clearer version that preserves your ideas.",
  },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#" aria-label="L2Write home">
          <span className="brand-mark">L2</span>
          <span>L2Write</span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="header-actions">
          <a className="sign-in" href="/login">Sign in</a>
          <a className="button button-small" href="/register">
            Try for free <ArrowRight size={16} />
          </a>
        </div>
        <button className="menu-button" aria-label="Open navigation">
          <Menu size={22} />
        </button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span /> AI-powered IELTS writing practice</p>
          <h1>Know exactly how to improve your IELTS writing.</h1>
          <p className="hero-lede">
            Get instant band estimates, criterion-based feedback, and a stronger
            revision for every Task 1 and Task 2 response.
          </p>
          <div className="hero-actions">
            <a className="button" href="/register">
              Analyse your writing <ArrowRight size={18} />
            </a>
            <a className="text-link" href="#how-it-works">
              See how it works <ChevronRight size={17} />
            </a>
          </div>
          <div className="free-note">
            <span className="check-icon"><Check size={14} /></span>
            5 free analyses every day. No credit card required.
          </div>
        </div>

        <div className="product-preview" aria-label="IELTS writing evaluation preview">
          <div className="preview-topbar">
            <div>
              <span className="document-label">Writing evaluation</span>
              <strong>Task 2 · Opinion essay</strong>
            </div>
            <span className="usage-pill">4 of 5 left today</span>
          </div>
          <div className="preview-body">
            <div className="essay-panel">
              <div className="essay-meta"><span>Your response</span><span>286 words</span></div>
              <h2>Technology and education</h2>
              <p>
                Some people believe that technology has made education more
                accessible, while others argue that it has reduced the quality of
                classroom interaction. In my view, digital tools can improve
                learning when they support, rather than replace, teachers.
              </p>
              <p>
                One major advantage is that students can access educational
                materials regardless of their location. <mark>For example, online
                courses allow learners in rural areas to study subjects that may
                not be offered locally.</mark>
              </p>
              <div className="inline-comment">
                <span>TR</span>
                <p><strong>Develop this example</strong>Add a clear consequence to strengthen your argument.</p>
              </div>
            </div>
            <aside className="score-panel">
              <div className="overall-score">
                <span>Estimated band</span>
                <strong>6.5</strong>
                <small>Good foundation</small>
              </div>
              <div className="score-list">
                {scores.map(([label, score]) => (
                  <div className="score-row" key={label}>
                    <div><span>{label}</span><div className="score-track"><i style={{ width: `${Number(score) * 10}%` }} /></div></div>
                    <strong>{score}</strong>
                  </div>
                ))}
              </div>
              <button className="revision-button">View improved version <ArrowRight size={15} /></button>
            </aside>
          </div>
        </div>
      </section>

      <section className="feature-band" id="features">
        <div className="section-intro">
          <p className="eyebrow"><span /> Built for focused practice</p>
          <h2>More useful than a generic AI chat.</h2>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, text }, index) => (
            <article className="feature-item" key={title}>
              <span className="feature-number">0{index + 1}</span>
              <Icon size={23} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="closing-strip" id="pricing">
        <p>Practice more deliberately.</p>
        <strong>Five complete writing analyses, free every day.</strong>
        <a className="button button-light" href="/register">Start writing <ArrowRight size={17} /></a>
      </section>
    </main>
  );
}
