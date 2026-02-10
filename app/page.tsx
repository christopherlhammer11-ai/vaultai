'use client';

import Image from "next/image";
import { Lock } from "lucide-react";

const terminalLines = [
  { text: <><span className="prompt">vault &gt;</span> <span className="command">who am I?</span></>, delay: 0 },
  { text: <>Loading persona... <span className="success">persona-chris.md</span></>, delay: 0.3 },
  {
    text: (
      <>You're Chris. President of Hammer Enterprises. 25 years in cannabis. Building VaultAI.</>
    ),
    delay: 0.6
  },
  { text: <><span className="prompt">vault &gt;</span> <span className="command">search latest hemp regulations 2026</span></>, delay: 0.9 },
  { text: <>Searching 4 sources... <span className="success">results encrypted locally ✓</span></>, delay: 1.2 }
];

const features = [
  {
    icon: '🔐',
    title: 'Encrypted Local Storage',
    body: 'Your conversations, personas, and files are AES-encrypted and stored on your device. Nothing leaves your machine unless you say so.'
  },
  {
    icon: '🌐',
    title: 'Live Web Search',
    body: 'Real-time search with cited sources. Get current market data, news, regulations, and research — without sacrificing your query history.'
  },
  {
    icon: '🧠',
    title: 'Persistent Memory',
    body: 'VaultAI remembers context across sessions. Load a persona file and it knows who you are, what you are working on, and how you think.'
  },
  {
    icon: '🎙️',
    title: 'Voice In / Voice Out',
    body: "Speak naturally, get spoken responses. Hands-free operation when you're moving fast and need answers faster."
  },
  {
    icon: '📄',
    title: 'PDF & File Export',
    body: 'Export any conversation, research summary, or generated document as a clean PDF. Ready for partners, investors, or your own archive.'
  },
  {
    icon: '⚡',
    title: 'Feather-Light Performance',
    body: 'Instant chat. Instant rendering. No bloat. Built on a stripped-down stack that prioritizes speed over feature creep.'
  }
];

const steps = [
  {
    label: '01',
    title: 'Open the Vault',
    body: "Launch VaultAI on your device. Set a password. That's your encryption key — we never see it, store it, or recover it. Your vault, your lock."
  },
  {
    label: '02',
    title: 'Load Your Persona',
    body: 'Drop in a persona file with your background, your business context, your preferences. VaultAI reads it once and remembers it forever — locally.'
  },
  {
    label: '03',
    title: 'Ask. Search. Build.',
    body: 'Chat naturally, run web searches, generate documents, export PDFs. Everything stays encrypted on your device. Close it and it is locked. Open it and you are right where you left off.'
  }
];

const comparisonRows = [
  ['Data stored on your device', '✕', '✓'],
  ['End-to-end encryption', '✕', '✓'],
  ['Never trains on your data', '✕', '✓'],
  ['Persistent memory across sessions', '✕', '✓'],
  ['Web search with cited sources', 'Limited', '✓'],
  ['Voice input & output', 'Some', '✓'],
  ['No account required', '✕', '✓']
];

export default function LandingPage() {
  return (
    <div className="page-wrapper">
      <nav className="site-nav">
        <div className="logo-mark">
          <Lock size={16} />
          VaultAI
        </div>
        <ul>
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How It Works</a></li>
          <li><a href="#why">Why Vault</a></li>
        </ul>
        <a href="#cta" className="btn-primary">Get Early Access</a>
      </nav>

      <main className="hero">
        <div className="badge">
          <span className="badge-dot" /> ENCRYPTED · LOCAL-FIRST · OPERATOR-GRADE
        </div>
        <h1>
          <span className="gradient">Your AI.</span><br />
          Your Data.<br />
          <span className="gradient">Your Rules.</span>
        </h1>
        <p className="subhead">
          VaultAI is a personal AI assistant that lives on your device. Encrypted memory. Real-time web search.
          Zero data harvesting. Built for people who do not hand over the keys.
        </p>
        <div className="hero-cta">
          <a href="#cta" className="btn-primary">Get Early Access</a>
          <a href="#how" className="btn-secondary">See How It Works</a>
        </div>
      </main>

      <section className="terminal-section">
        <div className="terminal-window">
          <div className="terminal-bar">
            <span className="window-dot red" />
            <span className="window-dot yellow" />
            <span className="window-dot green" />
            <span style={{ marginLeft: 12 }}>vaultai — session active</span>
          </div>
          <div className="terminal-body">
            {terminalLines.map((line, idx) => (
              <div
                key={idx}
                className="terminal-line"
                style={{ animationDelay: `${line.delay}s` }}
              >
                {line.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="usecases">
        <div className="section-label">Use Cases</div>
        <h2>Built for people with something to protect.</h2>
        <p className="section-subtitle">
          If your conversations, research, or strategy would hurt you in the wrong hands — VaultAI was built for you.
        </p>
        <div className="usecases-grid">
          {[
            {
              label: "Founders & CEOs",
              headline: "Competitive intel without a paper trail",
              body:
                "Research competitors, draft investor decks, plan acquisitions — without your queries living on someone else's server. Your strategy stays yours.",
              prompt: '"summarize competitor landscape for CBD supplements in the EU"',
              response: "3 sources analyzed. Report saved locally. ✓"
            },
            {
              label: "Legal & Compliance",
              headline: "Privileged research stays privileged",
              body:
                "Review regulations, draft compliance memos, research case law. Attorney-client privilege doesn't survive a third-party AI server. VaultAI keeps it local.",
              prompt: '"summarize 2026 FDA guidance on hemp-derived supplements"',
              response: "4 sources cited. Encrypted to device. ✓"
            },
            {
              label: "Finance & Advisory",
              headline: "Client data never touches the cloud",
              body:
                "Model scenarios, summarize earnings, draft client reports. Fiduciary duty means your clients' data doesn't belong on an AI company's training set.",
              prompt: '"analyze Q4 portfolio exposure to semiconductor tariffs"',
              response: "Analysis complete. Stored locally. ✓"
            },
            {
              label: "Operators & Builders",
              headline: "Your playbook, your machine",
              body:
                "Load your persona, your SOPs, your market research. VaultAI remembers how you think and what you're building — without broadcasting it to the world.",
              prompt: '"load persona and draft distributor outreach for Japan market"',
              response: "Persona loaded. Draft ready. Encrypted. ✓"
            }
          ].map((card) => (
            <article key={card.label} className="usecase-card">
              <div className="usecase-label">{card.label}</div>
              <h3>{card.headline}</h3>
              <p>{card.body}</p>
              <div className="usecase-terminal">
                <div><span className="prompt">vault &gt;</span> {card.prompt}</div>
                <div className="meta">{card.response}</div>
              </div>
            </article>
          ))}
        </div>
      </section>


      <section id="features" className="features">
        <div className="section-label">What You Get</div>
        <h2>Everything an AI should be. Nothing it shouldn&apos;t.</h2>
        <p className="section-subtitle">
          No cloud storage. No training on your data. No subscriptions that own your history. Just a fast,
          private, intelligent assistant that works for you.
        </p>
        <div className="features-grid">
          {features.map((feature) => (
            <article key={feature.title} className="feature-card">
              <div style={{ fontSize: "1.75rem" }}>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how" className="timeline-section">
        <div className="timeline-header">
          <div className="section-label">How It Works</div>
          <h2>Three steps. Full control.</h2>
          <p className="section-subtitle">
            No accounts. No onboarding funnels. No data consent forms that take your consent anyway.
          </p>
        </div>
        <div className="timeline-steps">
          {steps.map((step) => (
            <div key={step.label} className="timeline-step" data-step={step.label}>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="why" className="comparison">
        <div className="section-label">Why Vault</div>
        <h2>Not another chatbot.</h2>
        <p className="section-subtitle">
          Most AI tools store your data on their servers, train on your conversations, and sell your patterns.
          VaultAI does not.
        </p>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Typical AI</th>
              <th>VaultAI</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map(([label, typical, vault]) => (
              <tr key={label}>
                <td>{label}</td>
                <td>{typical}</td>
                <td>{vault}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="openclaw">
        <div className="section-label">Under The Hood</div>
        <h2>Built with OpenClaw.</h2>
        <div className="openclaw-card">
          VaultAI was built from the ground up using OpenClaw — an AI-native development environment that turns natural
          language into production code. The entire UI, architecture, and deployment pipeline were generated, iterated,
          and shipped through OpenClaw&apos;s agentic workflow. This isn&apos;t a mockup. It&apos;s a real product built by an operator
          who described what he needed and let the machine build it.
        </div>
      </section>

      <section id="cta" className="final-cta">
        <div className="final-cta-card">
          <h2>Ready to own your AI?</h2>
          <p className="section-subtitle">
            VaultAI is in early access. Get on the list and be first to lock in.
          </p>
          <div className="cta-buttons">
            <a href="#cta" className="btn-primary">Request Early Access</a>
            <a href="https://github.com/christopherlhammer11-ai/vaultai" target="_blank" rel="noreferrer" className="btn-secondary">View on GitHub</a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="logo-mark">
          <Lock size={16} /> VaultAI
        </div>
        <div>Your data stays yours.</div>
      </footer>
    </div>
  );
}
