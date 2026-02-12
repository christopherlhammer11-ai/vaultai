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
      'Live web search (Brave)',
      'Cloud LLM fallback (GPT-4o, Claude)',
      'Voice input & output',
      'PDF export',
      'Persona files',
      'Priority support',
    ],
    monthlyPlan: 'premium-monthly',
    annualPlan: 'premium-annual',
  },
];

export default function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [mobileUrl, setMobileUrl] = useState<string | null>(null);

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
        <div className="logo-mark">
          <Lock size={16} />
          VaultAI
        </div>
        <ul>
          <li><a href="#features">Features</a></li>
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
          VaultAI is a personal AI assistant that lives on your device. Encrypted memory. Real-time web search.
          Zero data harvesting. Built for people who do not hand over the keys.
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

      <section className="usecases">
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

      {/* PRICING */}
      <section id="pricing" className="pricing-section">
        <div className="section-label">Pricing</div>
        <h2>7 days free. Cancel anytime.</h2>
        <p className="section-subtitle">
          Try VaultAI for a full week. No credit card to start. Your data never leaves your device — even if you cancel.
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

      <section id="why" className="comparison">
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
        <div className="logo-mark">
          <Lock size={16} /> VaultAI
        </div>
        <div>Your data stays yours. &middot; <a href="mailto:info@personalvaultai.com" style={{ color: 'var(--accent)', textDecoration: 'none' }}>info@personalvaultai.com</a></div>
      </footer>
    </div>
  );
}
