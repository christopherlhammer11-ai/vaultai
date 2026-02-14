'use client';

import { Check, Lock, Menu, Smartphone, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

const terminalLines = [
  { text: <><span className="prompt">vault &gt;</span> <span className="command">who am I?</span></>, delay: 0 },
  { text: <>Loading persona... <span className="success">persona-loaded.md</span></>, delay: 0.3 },
  {
    text: (
      <>You&apos;re a founder. 15 years in your industry. Building something that matters.</>
    ),
    delay: 0.6
  },
  { text: <><span className="prompt">vault &gt;</span> <span className="command">search latest compliance updates 2026</span></>, delay: 0.9 },
  { text: <>Searching 4 sources... <span className="success">results encrypted locally ✓</span></>, delay: 1.2 }
];

const features = [
  {
    icon: '🔐',
    title: 'Encrypted Local Storage',
    body: 'Your conversations, personas, and files are AES-encrypted at rest on your device. When queries reach cloud LLMs, a built-in anonymizer scrubs personal details before they leave.'
  },
  {
    icon: '🌐',
    title: 'Brave-Powered Search',
    body: 'Live Brave Search with inline citations. Queries are PII-scrubbed before they leave your device, so search providers never see your name or company.'
  },
  {
    icon: '🧠',
    title: 'Persistent Memory',
    body: 'VaultAI remembers personas, plans, and preferences locally. Load it once and it stays encrypted in your vault.'
  },
  {
    icon: '🎙️',
    title: 'Voice Input',
    body: "Speak naturally and VaultAI transcribes on the fly. Hands-free dictation when you're moving fast and need answers faster."
  },
  {
    icon: '🌍',
    title: 'Multilingual Console',
    body: 'Switch the entire operator console between English, Spanish, Portuguese, German, French, Chinese, Japanese, Korean, Arabic, Hindi, and Russian.'
  },
  {
    icon: '💳',
    title: 'Transparent Compute Credits',
    body: 'Built-in meter that tracks bundled usage, Brave/API key overrides, and on-device fallbacks so you always know what runs where.'
  },
  {
    icon: '📄',
    title: 'PDF Upload & Markdown Export',
    body: 'Upload PDFs for instant analysis. Export conversations and reports as clean markdown. All files stay encrypted in your local vault.'
  },
  {
    icon: '🤖',
    title: 'Specialized Agents',
    body: 'Six built-in operators (strategy, research, legal, finance, ops, writing) plus the ability to spin up custom agents in seconds.'
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
    body: 'Chat naturally, run web searches, upload PDFs, generate reports. Personal details are scrubbed before they reach any cloud API. Close it and it is locked. Open it and you are right where you left off.'
  }
];

const comparisonRows = [
  ['Data stored on your device', '✕', '✓'],
  ['AES-256 encryption at rest', '✕', '✓'],
  ['PII scrubbed before cloud queries', '✕', '✓'],
  ['Never trains on your data', '✕', '✓'],
  ['Specialized AI agents', '✕', '6 built-in + custom'],
  ['Persistent memory across sessions', '✕', '✓'],
  ['Web search with cited sources', 'Limited', '✓'],
  ['Voice input', 'Some', '✓'],
  ['No account required', '✕', '✓']
];

const plans = [
  {
    name: 'Lite',
    description: 'For personal use and light research',
    monthlyPrice: 5,
    annualPrice: 49,
    annualSavings: '18%',
    features: [
      'AES-256 encrypted vault',
      'Local LLM (Ollama)',
      'Persistent memory',
      'Chat export (text)',
      'Mobile PWA access',
    ],
    monthlyPlan: 'lite-monthly',
    annualPlan: 'lite-annual',
  },
  {
    name: 'Premium',
    description: 'For operators, founders, and teams',
    monthlyPrice: 29,
    annualPrice: 249,
    annualSavings: '28%',
    popular: true,
    features: [
      'Everything in Lite',
      '6 specialized AI agents + custom agents',
      'Live web search (Brave)',
      'Cloud LLM fallback (GPT-4o, Claude) — PII-scrubbed',
      'Voice input (Whisper)',
      'PDF upload & analysis',
      'Persona files',
      'Priority support',
    ],
    monthlyPlan: 'premium-monthly',
    annualPlan: 'premium-annual',
  },
];

/** Detect if running inside Electron desktop app */
function isElectron(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as unknown as Record<string, unknown>).electron ||
    (typeof navigator !== "undefined" && navigator.userAgent.includes("Electron"));
}

export default function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [mobileUrl, setMobileUrl] = useState<string | null>(null);

  // Desktop app: skip marketing page, go straight to vault
  useEffect(() => {
    if (isElectron()) {
      window.location.replace("/vault");
    }
  }, []);

  useEffect(() => {
    fetch('/api/local-ip')
      .then((r) => r.json())
      .then((data) => {
        if (data.ip && data.ip !== 'localhost') {
          const port = window.location.port || '3000';
          setMobileUrl(`http://${data.ip}:${port}`);
        }
      })
      .catch(() => {});
  }, []);

  // Nav scroll effect
  useEffect(() => {
    const nav = document.querySelector('nav.site-nav');
    if (!nav) return;
    const onScroll = () => {
      if (window.scrollY > 40) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll fade-in for sections
  useEffect(() => {
    const sections = document.querySelectorAll('.fade-in-section');
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const handleCheckout = async (plan: string) => {
    setCheckoutLoading(plan);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Checkout unavailable. Try again later.');
      }
    } catch {
      alert('Checkout unavailable. Try again later.');
    } finally {
      setCheckoutLoading(null);
    }
  };


  return (
    <div className="page-wrapper">
      <nav className="site-nav">
        <a href="/" className="logo-mark" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Lock size={16} />
          VaultAI
        </a>
        <ul>
          <li><a href="#features">Features</a></li>
          <li><a href="#agents">Agents</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#how">How It Works</a></li>
          <li><a href="#why">Why Vault</a></li>
        </ul>
        <button className="nav-hamburger" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <a href="#pricing" className="btn-primary">Start Free Trial</a>
      </nav>

      {mobileNavOpen && (
        <>
          <div className="mobile-nav-overlay" onClick={() => setMobileNavOpen(false)} />
          <div className="mobile-nav-panel">
            <button className="mobile-nav-close" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">
              <X size={24} />
            </button>
            <a href="#features" onClick={() => setMobileNavOpen(false)}>Features</a>
            <a href="#agents" onClick={() => setMobileNavOpen(false)}>Agents</a>
            <a href="#pricing" onClick={() => setMobileNavOpen(false)}>Pricing</a>
            <a href="#how" onClick={() => setMobileNavOpen(false)}>How It Works</a>
            <a href="#why" onClick={() => setMobileNavOpen(false)}>Why Vault</a>
            <a href="#pricing" className="btn-primary" style={{ textAlign: 'center' }} onClick={() => setMobileNavOpen(false)}>Start Free Trial</a>
          </div>
        </>
      )}

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
          An AI assistant that lives on your device. Encrypted memory, PII-scrubbed queries, real-time search.
        </p>
        <div className="hero-cta">
          <a href="#pricing" className="btn-primary">Start 7-Day Free Trial</a>
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

      <section className="usecases fade-in-section">
        <div className="section-label">USE CASES</div>
        <h2>Built for people with something to protect.</h2>
        <p className="section-subtitle">
          If your conversations, research, or strategy would hurt you in the wrong hands — VaultAI was built for you.
        </p>
        <div className="usecases-grid">
          {[
            {
              label: "FOUNDERS & CEOs",
              headline: "Competitive intel without a paper trail",
              body:
                "Research competitors, draft investor decks, plan acquisitions — without your queries living on someone else's server. Your strategy stays yours.",
              prompt: '"summarize competitor landscape for health supplements in the EU"',
              response: "3 sources analyzed. Report saved locally. ✓"
            },
            {
              label: "LEGAL & COMPLIANCE",
              headline: "Privileged research stays privileged",
              body:
                "Review regulations, draft compliance memos, research case law. Attorney-client privilege doesn't survive a third-party AI server. VaultAI keeps it local.",
              prompt: '"summarize 2026 FDA guidance on dietary supplements"',
              response: "4 sources cited. Encrypted to device. ✓"
            },
            {
              label: "FINANCE & ADVISORY",
              headline: "Client data never touches the cloud",
              body:
                "Model scenarios, summarize earnings, draft client reports. Fiduciary duty means your clients' data doesn't belong on an AI company's training set.",
              prompt: '"analyze Q4 portfolio exposure to semiconductor tariffs"',
              response: "Analysis complete. Stored locally. ✓"
            },
            {
              label: "OPERATORS & BUILDERS",
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

      <section id="features" className="features fade-in-section">
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

      {/* AGENTS */}
      <section id="agents" className="features fade-in-section" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="section-label">Specialized Agents</div>
        <h2>Six agents. One vault. Zero data leakage.</h2>
        <p className="section-subtitle">
          Switch between specialized AI agents built for how professionals actually work.
          Each agent has domain-specific knowledge, a tailored communication style, and privacy guardrails.
          Plus, build your own custom agents in seconds.
        </p>
        <div className="features-grid">
                    {[
            {
              icon: '🎯',
              title: 'Strategist',
              body: 'Turns raw intel into board-ready plays—competitive teardowns, GTM roadmaps, and M&A sniff tests without leaking the thesis.',
            },
            {
              icon: '⚖️',
              title: 'Counsel',
              body: 'IRAC-form briefs, clause redlines, and regulatory heat maps that keep privilege intact and citations airtight.',
            },
            {
              icon: '📈',
              title: 'Analyst',
              body: 'Builds models on the fly, stress-tests scenarios, and distills earnings calls into next-step narratives.',
            },
            {
              icon: '📚',
              title: 'Researcher',
              body: 'Cross-examines sources, synthesizes papers, and delivers evidence stacks you can drop straight into a memo.',
            },
            {
              icon: '🔧',
              title: 'Operator',
              body: 'Breaks work into accountable steps, writes SOPs, and keeps execution ruthless and boring (the good kind).',
            },
            {
              icon: '✍️',
              title: 'Writer',
              body: 'Spins up founder letters, legalese, or launch copy in your voice—tight, on-brief, and press-ready.',
            },
          ].map((agent) => (
            <article key={agent.title} className="feature-card">
              <div style={{ fontSize: '1.75rem' }}>{agent.icon}</div>
              <h3>{agent.title}</h3>
              <p>{agent.body}</p>
            </article>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <a href="/agents" className="btn-secondary" style={{ textDecoration: 'none' }}>
            Read the Agent Guide &rarr;
          </a>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="pricing-section">
        <div className="section-label">Pricing</div>
        <h2>7 days free. Cancel anytime.</h2>
        <p className="section-subtitle">
          Try VaultAI free for 7 days. Cancel anytime — no questions asked. Your data never leaves your device, even if you cancel.
        </p>

        <div className="billing-toggle">
          <button
            className={billingCycle === 'monthly' ? 'active' : ''}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button
            className={billingCycle === 'annual' ? 'active' : ''}
            onClick={() => setBillingCycle('annual')}
          >
            Annual <span className="toggle-badge">Save up to 28%</span>
          </button>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <div key={plan.name} className={`pricing-card${plan.popular ? ' popular' : ''}`}>
              {plan.popular && <div className="pricing-badge">Most Popular</div>}
              <h3>{plan.name}</h3>
              <p className="pricing-description">{plan.description}</p>
              <div className="pricing-price">
                <span className="price-amount">
                  ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                </span>
                <span className="price-period">
                  /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>
              {billingCycle === 'annual' && (
                <div className="pricing-savings">Save {plan.annualSavings}</div>
              )}
              <div className="pricing-trial">7-day free trial included</div>
              <button
                className="btn-primary pricing-cta"
                onClick={() => handleCheckout(billingCycle === 'monthly' ? plan.monthlyPlan : plan.annualPlan)}
                disabled={checkoutLoading !== null}
              >
                {checkoutLoading === (billingCycle === 'monthly' ? plan.monthlyPlan : plan.annualPlan)
                  ? 'Loading...'
                  : 'Start Free Trial'}
              </button>
              <ul className="pricing-features">
                {plan.features.map((f) => (
                  <li key={f}><Check size={16} /> {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="timeline-section fade-in-section">
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

      {/* MOBILE QR CODE */}
      {mobileUrl && (
        <section className="qr-section">
          <div className="qr-card">
            <div className="qr-text">
              <div className="section-label">Mobile Access</div>
              <h2>Use VaultAI on your phone.</h2>
              <p className="section-subtitle">
                Scan this QR code from your phone to open VaultAI as a PWA.
                Same WiFi network required. Your data stays on this machine.
              </p>
              <div className="qr-steps">
                <div><Smartphone size={16} /> <strong>iPhone:</strong> Open in Safari → Share → Add to Home Screen</div>
                <div><Smartphone size={16} /> <strong>Android:</strong> Open in Chrome → Menu → Install app</div>
              </div>
              <div className="qr-url">{mobileUrl}</div>
            </div>
            <div className="qr-code-wrap">
              <QRCodeSVG
                value={mobileUrl}
                size={180}
                bgColor="#111111"
                fgColor="#00ff88"
                level="M"
                includeMargin={false}
              />
            </div>
          </div>
        </section>
      )}

      <section id="why" className="comparison fade-in-section">
        <div className="section-label">Why Vault</div>
        <h2>Not another chatbot.</h2>
        <p className="section-subtitle">
          Most AI tools store your data on their servers, train on your conversations, and sell your patterns.
          VaultAI does not.
        </p>
        <div className="comparison-table-wrap">
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
        </div>
      </section>

      <section className="openclaw fade-in-section">
        <div className="section-label">Under The Hood</div>
        <h2>Powered by OpenClaw.</h2>
        <p className="section-subtitle">
          VaultAI is built on a fork of OpenClaw — an open-source agentic AI framework.
          That means VaultAI inherits a battle-tested runtime for LLM routing, tool execution,
          and plugin management, while adding AES-256 encryption and local-first storage as a core layer.
        </p>
        <div className="openclaw-pills">
          {[
            { label: "MULTI-MODEL", desc: "Switch between OpenAI, Anthropic, or local LLMs (Ollama)" },
            { label: "PLUGIN READY", desc: "Extensible skill framework with a growing open-source ecosystem" },
            { label: "SELF-HOSTABLE", desc: "Deploy on your own infrastructure — no cloud required" },
            { label: "AUDITABLE", desc: "Open-source runtime. Inspect every line." },
          ].map((pill) => (
            <div key={pill.label} className="openclaw-pill">
              <span className="openclaw-pill-label">{pill.label}</span>
              <span>{pill.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="cta" className="final-cta fade-in-section">
        <div className="final-cta-card">
          <h2>Ready to own your AI?</h2>
          <p className="section-subtitle">
            Start your 7-day free trial. Your data stays yours.
          </p>
          <div className="cta-buttons">
            <a href="#pricing" className="btn-primary">Start Free Trial</a>
            <a href="https://github.com/christopherlhammer11-ai/vaultai" target="_blank" rel="noreferrer" className="btn-secondary">View on GitHub</a>
          </div>
          <p className="contact-line">Questions? Reach us at <a href="mailto:info@personalvaultai.com">info@personalvaultai.com</a></p>
        </div>
      </section>

      <footer className="site-footer">
        <a href="/" className="logo-mark" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Lock size={16} /> VaultAI
        </a>
        <div className="trust-badges">
          <span className="trust-badge">🔐 AES-256</span>
          <span className="trust-badge">🖥️ Local-First</span>
          <span className="trust-badge">🛡️ PII-Scrubbed Queries</span>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <a href="mailto:info@personalvaultai.com" style={{ color: 'var(--accent)', textDecoration: 'none' }}>info@personalvaultai.com</a>
        </div>
      </footer>
    </div>
  );
}
