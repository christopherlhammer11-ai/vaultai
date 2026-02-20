'use client';

// 🔨🔐 HammerLock AI — Landing Page
// Your AI. Your Data. Your Rules.

import { Check, Globe, Lock, Menu, Smartphone, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useI18n, LOCALE_LABELS, type Locale } from "@/lib/i18n";

// Terminal lines are built inside the component to access i18n

// Features array is built inside the component to access i18n

// Steps array is built inside the component to access i18n

// Comparison rows are built inside the component to access i18n

// Plans array is built inside the component to access i18n

/** Detect if running inside Electron desktop app */
function isElectron(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as unknown as Record<string, unknown>).electron ||
    (typeof navigator !== "undefined" && navigator.userAgent.includes("Electron"));
}

export default function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [mobileUrl, setMobileUrl] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [expandedUseCase, setExpandedUseCase] = useState<string | null>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const { t, locale, setLocale } = useI18n();

  const terminalLines = [
    { text: <><span className="prompt">hammerlock &gt;</span> <span className="command">{t.site_term_who}</span></>, delay: 0 },
    { text: <>{t.site_term_loading} <span className="success">{t.site_term_persona_file}</span></>, delay: 0.3 },
    { text: <>{t.site_term_persona_desc}</>, delay: 0.6 },
    { text: <><span className="prompt">hammerlock &gt;</span> <span className="command">{t.site_term_search_cmd}</span></>, delay: 0.9 },
    { text: <>{t.site_term_search_result} <span className="success">{t.site_term_search_done}</span></>, delay: 1.2 },
  ];

  const features = [
    { icon: '🔐', title: t.site_feat_encrypt_title, body: t.site_feat_encrypt_body,
      detail: 'AES-256-GCM encryption with PBKDF2 key derivation. Your data never leaves your device unencrypted — not even metadata.',
      cta: 'See Security Details', ctaLink: '#why' },
    { icon: '🌐', title: t.site_feat_search_title, body: t.site_feat_search_body,
      detail: 'Real-time web search powered by Brave Search API. Get current information with source citations — all processed locally.',
      cta: 'Try Pro Free', ctaLink: '#pricing' },
    { icon: '🧠', title: t.site_feat_memory_title, body: t.site_feat_memory_body,
      detail: 'Your personal vault remembers your role, preferences, and context. Every conversation builds on what came before.',
      cta: 'Learn More', ctaLink: '#how' },
    { icon: '🎙️', title: t.site_feat_voice_title, body: t.site_feat_voice_body,
      detail: 'Whisper-powered transcription for voice input. Text-to-speech for hands-free responses. Works offline with Ollama.',
      cta: 'Get Pro', ctaLink: '#pricing' },
    { icon: '🌍', title: t.site_feat_lang_title, body: t.site_feat_lang_body,
      detail: '11 languages supported: English, Spanish, Portuguese, French, German, Chinese, Japanese, Korean, Arabic, Hindi, and Russian.',
      cta: 'Try It Free', ctaLink: '#pricing' },
    { icon: '💳', title: t.site_feat_credits_title, body: t.site_feat_credits_body,
      detail: 'Pro includes 1,000 monthly credits. Need more? Add a Booster (+1,500) or Power Pack (+5,000). Or bring your own API keys for unlimited.',
      cta: 'View Plans', ctaLink: '#pricing' },
    { icon: '📄', title: t.site_feat_pdf_title, body: t.site_feat_pdf_body,
      detail: 'Upload any PDF and ask questions about it. Generate formatted reports and export conversations. All processing stays local.',
      cta: 'Get Pro', ctaLink: '#pricing' },
    { icon: '🗄️', title: t.site_feat_vault_title, body: t.site_feat_vault_body,
      detail: 'Encrypted personal vault stores your profile, notes, and preferences. Synced across sessions, never sent to the cloud.',
      cta: 'Start Free', ctaLink: '#pricing' },
    { icon: '🤖', title: t.site_feat_agents_title, body: t.site_feat_agents_body,
      detail: '6 built-in specialist agents plus custom agent builder. Each agent has domain expertise and tailored system prompts.',
      cta: 'Meet the Agents', ctaLink: '#agents' },
    { icon: '⚡', title: t.site_feat_perf_title, body: t.site_feat_perf_body,
      detail: 'Parallel provider racing across 6+ LLMs. Streaming responses start in under 1 second. Token-aware context management.',
      cta: 'Get Started', ctaLink: '#pricing' },
  ];

  const steps = [
    { label: '01', title: t.site_step1_title, body: t.site_step1_body },
    { label: '02', title: t.site_step2_title, body: t.site_step2_body },
    { label: '03', title: t.site_step3_title, body: t.site_step3_body },
    { label: '04', title: t.site_step4_title, body: t.site_step4_body },
  ];

  const comparisonRows = [
    [t.site_cmp_local_storage, '✕', '✓'],
    [t.site_cmp_aes, '✕', '✓'],
    [t.site_cmp_pii, '✕', '✓'],
    [t.site_cmp_no_train, '✕', '✓'],
    [t.site_cmp_agents, '✕', t.site_cmp_agents_val],
    [t.site_cmp_memory, '✕', '✓'],
    [t.site_cmp_search, t.site_cmp_search_typical, '✓'],
    [t.site_cmp_voice, t.site_cmp_voice_typical, '✓'],
    [t.site_cmp_no_account, '✕', '✓'],
  ];

  const plans = [
    {
      name: t.site_plan_free, tag: t.site_plan_free_tag, description: t.site_plan_free_desc,
      price: 0, priceLabel: '$0', pricePeriod: '',
      features: [t.site_plan_free_f1, t.site_plan_free_f2, t.site_plan_free_f3, t.site_plan_free_f4, t.site_plan_free_f5],
      ctaLabel: t.site_cta_trial, ctaAction: 'github', // links to GitHub
    },
    {
      name: t.site_plan_core, description: t.site_plan_core_desc,
      price: 15, priceLabel: '$15', pricePeriod: t.site_plan_one_time,
      features: [t.site_plan_core_f1, t.site_plan_core_f2, t.site_plan_core_f3, t.site_plan_core_f4, t.site_plan_core_f5],
      ctaAction: 'core-onetime',
    },
    {
      name: t.site_plan_pro, description: t.site_plan_pro_desc, popular: true,
      price: 29, priceLabel: '$29', pricePeriod: t.site_plan_per_mo,
      features: [t.site_plan_pro_f1, t.site_plan_pro_f2, t.site_plan_pro_f3, t.site_plan_pro_f4, t.site_plan_pro_f5, t.site_plan_pro_f6, t.site_plan_pro_f7],
      ctaAction: 'pro-monthly',
    },
    {
      name: t.site_plan_teams, description: t.site_plan_teams_desc,
      price: 49, priceLabel: '$49', pricePeriod: t.site_plan_per_user,
      features: [t.site_plan_teams_f1, t.site_plan_teams_f2, t.site_plan_teams_f3, t.site_plan_teams_f4, t.site_plan_teams_f5],
      ctaAction: 'teams-monthly',
    },
    {
      name: t.site_plan_enterprise, description: t.site_plan_enterprise_desc, enterprise: true,
      price: -1, priceLabel: t.site_plan_custom, pricePeriod: '',
      features: [t.site_plan_ent_f1, t.site_plan_ent_f2, t.site_plan_ent_f3, t.site_plan_ent_f4, t.site_plan_ent_f5],
      ctaLabel: t.site_plan_contact_sales, ctaAction: 'contact',
    },
  ];

  // Close language picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Desktop app: skip marketing page, go straight to vault
  useEffect(() => {
    if (isElectron()) {
      window.location.replace("/vault");
    }
  }, []);

  // QR code only in local dev — never on production (Vercel returns container IPs)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      fetch('/api/local-ip')
        .then((r) => r.json())
        .then((data) => {
          if (data.ip && data.ip !== 'localhost') {
            const port = window.location.port || '3000';
            setMobileUrl(`http://${data.ip}:${port}`);
          }
        })
        .catch(() => {});
    }
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
        alert(data.error || t.site_checkout_error);
      }
    } catch {
      alert(t.site_checkout_error);
    } finally {
      setCheckoutLoading(null);
    }
  };


  return (
    <div className="page-wrapper">
      <nav className="site-nav">
        <a href="/" className="logo-mark" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Image src="/brand/hammerlock-icon-192.png" alt="" width={22} height={22} style={{ borderRadius: 4 }} />
          HammerLock AI
        </a>
        <ul>
          <li><a href="#features">{t.site_nav_features}</a></li>
          <li><a href="#agents">{t.site_nav_agents}</a></li>
          <li><a href="#pricing">{t.site_nav_pricing}</a></li>
          <li><a href="#how">{t.site_nav_how}</a></li>
          <li><a href="#why">{t.site_nav_why}</a></li>
          <li><a href="/blog/blog-index.html">Research</a></li>
        </ul>
        <div className="lang-picker" ref={langRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            aria-label="Change language"
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '6px 10px', color: 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              fontSize: '0.8rem', transition: 'border-color 0.2s',
            }}
          >
            <Globe size={14} /> {LOCALE_LABELS[locale]}
          </button>
          {langOpen && (
            <div style={{
              position: 'absolute', top: '110%', right: 0, background: 'rgba(20,20,20,0.95)',
              backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: 6, zIndex: 1000, minWidth: 140,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
              {(Object.keys(LOCALE_LABELS) as Locale[]).map(loc => (
                <button
                  key={loc}
                  onClick={() => { setLocale(loc); setLangOpen(false); }}
                  style={{
                    display: 'block', width: '100%', padding: '7px 12px',
                    background: loc === locale ? 'rgba(0,255,136,0.1)' : 'transparent',
                    border: 'none', color: loc === locale ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: '0.8rem', textAlign: 'left', borderRadius: 6, cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (loc !== locale) (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { if (loc !== locale) (e.target as HTMLElement).style.background = 'transparent'; }}
                >
                  {LOCALE_LABELS[loc]}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="nav-hamburger" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <a href="#pricing" className="btn-primary">{t.site_cta}</a>
      </nav>

      {mobileNavOpen && (
        <>
          <div className="mobile-nav-overlay" onClick={() => setMobileNavOpen(false)} />
          <div className="mobile-nav-panel">
            <button className="mobile-nav-close" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">
              <X size={24} />
            </button>
            <a href="#features" onClick={() => setMobileNavOpen(false)}>{t.site_nav_features}</a>
            <a href="#agents" onClick={() => setMobileNavOpen(false)}>{t.site_nav_agents}</a>
            <a href="#pricing" onClick={() => setMobileNavOpen(false)}>{t.site_nav_pricing}</a>
            <a href="#how" onClick={() => setMobileNavOpen(false)}>{t.site_nav_how}</a>
            <a href="#why" onClick={() => setMobileNavOpen(false)}>{t.site_nav_why}</a>
            <a href="/blog" onClick={() => setMobileNavOpen(false)}>Research</a>
            <a href="#pricing" className="btn-primary" style={{ textAlign: 'center' }} onClick={() => setMobileNavOpen(false)}>{t.site_cta}</a>
          </div>
        </>
      )}

      <main className="hero">
        <div className="badge">
          <span className="badge-dot" /> {t.site_hero_badge}
        </div>
        <h1>
          <span className="gradient">{t.site_hero_h1_1}</span><br />
          {t.site_hero_h1_2}<br />
          <span className="gradient">{t.site_hero_h1_3}</span>
        </h1>
        <p className="subhead">
          {t.site_hero_sub}
        </p>
        <div className="hero-cta">
          <a href="#pricing" className="btn-primary">{t.site_cta_trial}</a>
          <a href="#how" className="btn-secondary">{t.site_cta_how}</a>
        </div>
      </main>

      <section className="terminal-section">
        <div className="terminal-window">
          <div className="terminal-bar">
            <span className="window-dot red" />
            <span className="window-dot yellow" />
            <span className="window-dot green" />
            <span style={{ marginLeft: 12 }}>{t.site_term_session}</span>
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
        <div className="section-label">{t.site_section_usecases}</div>
        <h2>{t.site_usecases_h2}</h2>
        <p className="section-subtitle">
          {t.site_sub_usecases}
        </p>
        <div className="usecases-grid">
          {[
            {
              label: t.site_uc_founders_label,
              headline: t.site_uc_founders_headline,
              body: t.site_uc_founders_body,
              prompt: `"${t.site_uc_founders_prompt}"`,
              response: t.site_uc_founders_response,
            },
            {
              label: t.site_uc_legal_label,
              headline: t.site_uc_legal_headline,
              body: t.site_uc_legal_body,
              prompt: `"${t.site_uc_legal_prompt}"`,
              response: t.site_uc_legal_response,
            },
            {
              label: t.site_uc_finance_label,
              headline: t.site_uc_finance_headline,
              body: t.site_uc_finance_body,
              prompt: `"${t.site_uc_finance_prompt}"`,
              response: t.site_uc_finance_response,
            },
            {
              label: t.site_uc_ops_label,
              headline: t.site_uc_ops_headline,
              body: t.site_uc_ops_body,
              prompt: `"${t.site_uc_ops_prompt}"`,
              response: t.site_uc_ops_response,
            },
          ].map((card) => (
            <article
              key={card.label}
              className={`usecase-card${expandedUseCase === card.label ? ' expanded' : ''}`}
              onClick={() => setExpandedUseCase(expandedUseCase === card.label ? null : card.label)}
              style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            >
              <div className="usecase-label">{card.label}</div>
              <h3>{card.headline}</h3>
              <p>{card.body}</p>
              <div className="usecase-terminal">
                <div><span className="prompt">hammerlock &gt;</span> {card.prompt}</div>
                <div className="meta">{card.response}</div>
              </div>
              {expandedUseCase === card.label && (
                <div className="card-expand" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,255,136,0.15)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                    {card.label === t.site_uc_founders_label && 'Pitch decks, competitor analysis, investor prep, go-to-market plans — all with your encrypted context. Your strategy stays yours.'}
                    {card.label === t.site_uc_legal_label && 'Contract review, clause flagging, NDA drafts, compliance checklists — processed locally with zero cloud exposure.'}
                    {card.label === t.site_uc_finance_label && 'Revenue modeling, expense tracking, cash flow projections, investor reporting — your financials never leave your machine.'}
                    {card.label === t.site_uc_ops_label && 'SOPs, workflow automation, team scheduling, process optimization — operational intelligence that learns your business.'}
                  </p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <a href="#agents" onClick={(e) => e.stopPropagation()} className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '0.85rem', borderRadius: 8 }}>Meet the Agents &rarr;</a>
                    <a href="#pricing" onClick={(e) => e.stopPropagation()} className="cta-main" style={{ display: 'inline-block', padding: '8px 20px', fontSize: '0.85rem', textDecoration: 'none', borderRadius: 8 }}>Get Started &rarr;</a>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="features fade-in-section">
        <div className="section-label">{t.site_section_features}</div>
        <h2>{t.site_features_h2}</h2>
        <p className="section-subtitle">
          {t.site_sub_features}
        </p>
        <div className="features-grid">
          {features.map((feature) => (
            <article
              key={feature.title}
              className={`feature-card${expandedFeature === feature.title ? ' expanded' : ''}`}
              onClick={() => setExpandedFeature(expandedFeature === feature.title ? null : feature.title)}
              style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            >
              <div style={{ fontSize: "1.75rem" }}>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
              {expandedFeature === feature.title && (
                <div className="card-expand" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,255,136,0.15)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>{feature.detail}</p>
                  <a
                    href={feature.ctaLink}
                    onClick={(e) => e.stopPropagation()}
                    className="cta-main"
                    style={{ display: 'inline-block', padding: '8px 20px', fontSize: '0.85rem', textDecoration: 'none', borderRadius: 8 }}
                  >
                    {feature.cta} &rarr;
                  </a>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* AGENTS */}
      <section id="agents" className="features fade-in-section" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="section-label">{t.site_section_agents}</div>
        <h2>{t.site_agents_h2}</h2>
        <p className="section-subtitle">
          {t.site_sub_agents}
        </p>
        <div className="features-grid">
          {[
            { icon: '🎯', title: t.site_agent_strategist_title, body: t.site_agent_strategist_body,
              detail: 'Build pitch decks, analyze market positioning, model scenarios, and plan go-to-market strategy. Thinks like a founder.',
              cta: 'Get Pro', ctaLink: '#pricing' },
            { icon: '⚖️', title: t.site_agent_counsel_title, body: t.site_agent_counsel_body,
              detail: 'Review contracts, flag risky clauses, draft NDAs, and summarize legal documents. Not legal advice — but a powerful first pass.',
              cta: 'Get Pro', ctaLink: '#pricing' },
            { icon: '📈', title: t.site_agent_analyst_title, body: t.site_agent_analyst_body,
              detail: 'Financial modeling, revenue projections, expense analysis, and KPI dashboards. Speak in numbers, get answers in context.',
              cta: 'Get Pro', ctaLink: '#pricing' },
            { icon: '📚', title: t.site_agent_researcher_title, body: t.site_agent_researcher_body,
              detail: 'Deep web research with source citations. Competitive analysis, market sizing, industry reports — all summarized for you.',
              cta: 'Get Pro', ctaLink: '#pricing' },
            { icon: '🔧', title: t.site_agent_operator_title, body: t.site_agent_operator_body,
              detail: 'Your default general-purpose agent. Handles everything from quick questions to complex multi-step tasks. Always ready.',
              cta: 'Try Free', ctaLink: '#pricing' },
            { icon: '✍️', title: t.site_agent_writer_title, body: t.site_agent_writer_body,
              detail: 'Blog posts, emails, social media copy, product descriptions — all in your voice. Learns your tone from your vault persona.',
              cta: 'Get Pro', ctaLink: '#pricing' },
          ].map((agent) => (
            <article
              key={agent.title}
              className={`feature-card${expandedAgent === agent.title ? ' expanded' : ''}`}
              onClick={() => setExpandedAgent(expandedAgent === agent.title ? null : agent.title)}
              style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            >
              <div style={{ fontSize: '1.75rem' }}>{agent.icon}</div>
              <h3>{agent.title}</h3>
              <p>{agent.body}</p>
              {expandedAgent === agent.title && (
                <div className="card-expand" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,255,136,0.15)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>{agent.detail}</p>
                  <a
                    href={agent.ctaLink}
                    onClick={(e) => e.stopPropagation()}
                    className="cta-main"
                    style={{ display: 'inline-block', padding: '8px 20px', fontSize: '0.85rem', textDecoration: 'none', borderRadius: 8 }}
                  >
                    {agent.cta} &rarr;
                  </a>
                </div>
              )}
            </article>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <a href="/agents" className="btn-secondary" style={{ textDecoration: 'none' }}>
            {t.site_agent_guide} &rarr;
          </a>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="pricing-section fade-in-section">
        <div className="section-label">{t.site_section_pricing}</div>
        <h2>{t.site_pricing_h2}</h2>
        <p className="section-subtitle">
          {t.site_sub_pricing}
        </p>


        <div className="pricing-grid">
          {plans.map((plan) => (
            <div key={plan.name} className={`pricing-card${plan.popular ? ' popular' : ''}${plan.enterprise ? ' enterprise' : ''}`}>
              {plan.popular && <div className="pricing-badge">{t.site_plan_popular}</div>}
              <div className="pricing-tag-row">
                {plan.tag && <span className="pricing-tag">{plan.tag}</span>}
              </div>
              <h3>{plan.name}</h3>
              <p className="pricing-description">{plan.description}</p>
              <div className="pricing-price">
                <span className="price-amount">{plan.priceLabel}</span>
                {plan.pricePeriod && (
                  <span className="price-period">/{plan.pricePeriod}</span>
                )}
              </div>
              {plan.ctaAction === 'github' ? (
                <a
                  href="https://github.com/christopherlhammer11-ai/hammerlock"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary pricing-cta"
                  style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}
                >
                  {plan.ctaLabel || t.site_cta}
                </a>
              ) : plan.ctaAction === 'contact' ? (
                <a
                  href="mailto:info@hammerlockai.com"
                  className="btn-secondary pricing-cta"
                  style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}
                >
                  {plan.ctaLabel || t.site_cta}
                </a>
              ) : (
                <button
                  className="btn-primary pricing-cta"
                  onClick={() => handleCheckout(plan.ctaAction)}
                  disabled={checkoutLoading !== null}
                >
                  {checkoutLoading === plan.ctaAction ? t.site_plan_loading : (plan.ctaLabel || t.site_cta)}
                </button>
              )}
              <ul className="pricing-features">
                {plan.features.map((f) => (
                  <li key={f}><Check size={14} /> {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Credit Booster Add-ons */}
        <div className="booster-addons" style={{
          marginTop: 40, padding: '24px 32px', background: 'rgba(0,255,136,0.03)',
          border: '1px solid rgba(0,255,136,0.12)', borderRadius: 14, textAlign: 'center',
          maxWidth: 680, marginLeft: 'auto', marginRight: 'auto',
        }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--accent)', marginBottom: 12 }}>
            {t.site_plan_need_more}
          </h3>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <strong>{t.site_plan_booster}</strong> <span style={{ color: 'var(--accent)' }}>{t.site_plan_booster_price}</span>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.site_plan_booster_desc}</div>
              <button
                onClick={() => handleCheckout('booster-monthly')}
                disabled={checkoutLoading !== null}
                className="cta-main"
                style={{ marginTop: 4, padding: '6px 18px', fontSize: '0.85rem' }}
              >
                {checkoutLoading === 'booster-monthly' ? t.site_plan_loading : 'Add Booster'}
              </button>
            </div>
            <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <strong>{t.site_plan_power}</strong> <span style={{ color: 'var(--accent)' }}>{t.site_plan_power_price}</span>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.site_plan_power_desc}</div>
              <button
                onClick={() => handleCheckout('power-monthly')}
                disabled={checkoutLoading !== null}
                className="cta-main"
                style={{ marginTop: 4, padding: '6px 18px', fontSize: '0.85rem' }}
              >
                {checkoutLoading === 'power-monthly' ? t.site_plan_loading : 'Add Power Pack'}
              </button>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            {t.site_plan_byok_unlimited}
          </p>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 20, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          {t.site_plan_credits_footnote}
        </p>

        {/* Cancel anytime + contact */}
        <div style={{ textAlign: 'center', marginTop: 24, padding: '16px 24px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 6px', fontWeight: 600 }}>
            Cancel anytime. No long-term contracts. No hidden fees.
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            All subscriptions can be cancelled instantly from your Stripe dashboard. Questions? Reach us at{' '}
            <a href="mailto:info@hammerlockai.com" style={{ color: 'var(--accent)', textDecoration: 'none' }}>info@hammerlockai.com</a>
          </p>
        </div>
      </section>

      <section id="how" className="timeline-section fade-in-section">
        <div className="timeline-header">
          <div className="section-label">{t.site_section_how}</div>
          <h2>{t.site_how_h2}</h2>
          <p className="section-subtitle">
            {t.site_sub_how}
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
        <div style={{
          marginTop: 40, padding: '20px 28px', background: 'rgba(0,255,136,0.04)',
          border: '1px solid rgba(0,255,136,0.12)', borderRadius: 12,
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, justifyContent: 'center',
        }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Need the AI engine?
          </span>
          <a
            href="https://ollama.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ textDecoration: 'none', fontSize: '0.85rem', padding: '8px 16px' }}
          >
            Download Ollama (free) &rarr;
          </a>
          <a
            href="/get-app"
            className="btn-secondary"
            style={{ textDecoration: 'none', fontSize: '0.85rem', padding: '8px 16px' }}
          >
            See all models &amp; setup guide &rarr;
          </a>
        </div>
      </section>

      {/* MOBILE QR CODE */}
      {mobileUrl && (
        <section className="qr-section">
          <div className="qr-card">
            <div className="qr-text">
              <div className="section-label">{t.site_mobile_label}</div>
              <h2>{t.site_mobile_title}</h2>
              <p className="section-subtitle">
                {t.site_mobile_sub}
              </p>
              <div className="qr-steps">
                <div><Smartphone size={16} /> <strong>iPhone:</strong> {t.site_mobile_iphone}</div>
                <div><Smartphone size={16} /> <strong>Android:</strong> {t.site_mobile_android}</div>
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
        <div className="section-label">{t.site_section_why}</div>
        <h2>{t.site_why_h2}</h2>
        <p className="section-subtitle">
          {t.site_sub_why}
        </p>
        <div className="comparison-table-wrap">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>{t.site_comparison_feature}</th>
                <th>{t.site_comparison_typical}</th>
                <th>{t.site_comparison_vault}</th>
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
        <div className="section-label">{t.site_section_openclaw}</div>
        <h2>{t.site_openclaw_h2}</h2>
        <p className="section-subtitle">
          {t.site_sub_openclaw}
        </p>

        {/* Core pillars */}
        <div className="openclaw-pills">
          {[
            { label: t.site_oc_multi, desc: t.site_oc_multi_desc },
            { label: t.site_oc_byok, desc: t.site_oc_byok_desc },
            { label: t.site_oc_self, desc: t.site_oc_self_desc },
            { label: t.site_oc_audit, desc: t.site_oc_audit_desc },
          ].map((pill) => (
            <div key={pill.label} className="openclaw-pill">
              <span className="openclaw-pill-label">{pill.label}</span>
              <span>{pill.desc}</span>
            </div>
          ))}
        </div>

        {/* How OpenClaw Works — Architecture */}
        <div style={{ marginTop: 60, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
          <h3 style={{ textAlign: 'center', fontSize: '1.3rem', marginBottom: 8, letterSpacing: '-0.02em' }}>
            How OpenClaw Works
          </h3>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 32, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            OpenClaw is the open-source AI runtime that powers HammerLock. It handles provider routing, failover, streaming, and local model management — so you never depend on a single AI vendor.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              { icon: '🔄', title: 'Parallel Provider Racing', desc: 'Sends your query to multiple AI providers simultaneously. The fastest response wins. If one provider is down, you never notice.', blogLabel: 'How racing works →', blogHref: '/blog/parallel-provider-racing.html' },
              { icon: '🏠', title: 'Local-First with Ollama', desc: 'Run Llama, Mistral, Phi, or Gemma locally with Ollama. Zero latency, zero cost, zero data leaving your machine. Perfect for sensitive work.', blogLabel: 'Read the field guide →', blogHref: '/blog/blog-index.html' },
              { icon: '🔀', title: 'Automatic Failover', desc: 'If OpenAI is slow, Groq picks it up. If Groq is down, Anthropic steps in. Your workflow never stops, regardless of provider outages.', blogLabel: 'Inside OpenClaw →', blogHref: '/blog/automatic-failover.html' },
              { icon: '🌊', title: 'Real-Time Streaming', desc: 'Tokens stream to your screen as they generate. No more staring at loading spinners — see the AI think in real time.', blogLabel: 'Speed benchmarks →', blogHref: '/blog/token-streaming.html' },
              { icon: '🔑', title: 'Bring Your Own Keys', desc: 'Use your own API keys from any provider. Pay the providers directly at their rates. No markup, no middleman, no data routing through us.', blogLabel: 'API key guide →', blogHref: '/blog/byok-guide.html' },
              { icon: '🛡️', title: 'PII Anonymization', desc: 'Built-in anonymizer strips personal data before it reaches any cloud API. Names, emails, phone numbers — automatically redacted and restored.', blogLabel: 'Privacy architecture →', blogHref: '/blog/privacy-architecture.html' },
            ].map((item) => (
              <div key={item.title} style={{
                padding: '20px 24px', background: 'rgba(17,17,17,0.6)',
                border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12,
                transition: 'all 0.2s ease',
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{item.icon}</div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>{item.title}</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                <a href={item.blogHref} style={{ display: 'inline-block', marginTop: 10, fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>{item.blogLabel}</a>
              </div>
            ))}
          </div>
        </div>

        {/* OpenClaw Use Cases */}
        <div style={{ marginTop: 60, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
          <h3 style={{ textAlign: 'center', fontSize: '1.3rem', marginBottom: 8, letterSpacing: '-0.02em' }}>
            What You Can Build with OpenClaw
          </h3>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 32, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            OpenClaw isn&apos;t just for HammerLock. It&apos;s a standalone runtime you can embed in any application.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { title: 'Private Legal AI', desc: 'Law firms processing client documents with zero cloud exposure. Contract review, case research, and compliance checks — all running locally with attorney-client privilege intact.', tag: 'Legal', blogLabel: 'Read the case study →' },
              { title: 'Healthcare Data Analysis', desc: 'HIPAA-compliant AI processing of patient data. Medical record summarization, clinical trial matching, and research synthesis without data leaving the hospital network.', tag: 'Healthcare', blogLabel: 'HIPAA compliance guide →' },
              { title: 'Financial Modeling', desc: 'Investment firms running AI analysis on proprietary trading data. Portfolio optimization, risk assessment, and market research with no data leakage to third parties.', tag: 'Finance', blogLabel: 'Enterprise use cases →' },
              { title: 'Government & Defense', desc: 'Air-gapped AI deployments for classified environments. Intelligence analysis, document processing, and decision support on isolated networks.', tag: 'Gov/Defense', blogLabel: 'Air-gap deployment →' },
              { title: 'Enterprise Knowledge Base', desc: 'Companies deploying internal AI assistants trained on proprietary documentation. SOPs, product specs, and internal wikis — searchable and conversational.', tag: 'Enterprise', blogLabel: 'Enterprise architecture →' },
              { title: 'Developer Tools', desc: 'Embed OpenClaw in your own applications. Build AI-powered features without vendor lock-in. Switch providers, add local models, or go fully offline — your architecture, your choice.', tag: 'Developers', blogLabel: 'Developer docs →' },
            ].map((uc) => (
              <div key={uc.title} style={{
                padding: '24px', background: 'rgba(17,17,17,0.6)',
                border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12,
                transition: 'all 0.2s ease', position: 'relative',
              }}>
                <span style={{
                  display: 'inline-block', padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)',
                  background: 'rgba(0,255,136,0.08)', borderRadius: 4, marginBottom: 10,
                }}>{uc.tag}</span>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>{uc.title}</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{uc.desc}</p>
                <a href="/blog" style={{ display: 'inline-block', marginTop: 12, fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>{uc.blogLabel}</a>
              </div>
            ))}
          </div>
        </div>

        {/* Supported Providers */}
        <div style={{ marginTop: 60, textAlign: 'center', maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 16, letterSpacing: '-0.02em' }}>
            Supported AI Providers
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {['OpenAI (GPT-4o, GPT-4o-mini)', 'Anthropic (Claude Sonnet)', 'Google (Gemini Flash, Gemini Pro)', 'Groq (Llama 3.3 70B)', 'Mistral (Mistral Small)', 'DeepSeek (DeepSeek Chat)', 'Ollama (Llama, Phi, Gemma, Mistral — local)'].map((p) => (
              <span key={p} style={{
                padding: '6px 14px', fontSize: '0.78rem', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, color: 'var(--text-secondary)',
              }}>{p}</span>
            ))}
          </div>
          <p style={{ marginTop: 20, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            New providers added regularly. All providers are optional — use one, some, or all.
          </p>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <a href="#pricing" className="cta-main" style={{ display: 'inline-block', padding: '12px 32px', fontSize: '1rem', textDecoration: 'none', borderRadius: 10 }}>
            Get Started with OpenClaw &rarr;
          </a>
          <div style={{ marginTop: 12 }}>
            <a href="https://github.com/christopherlhammer11-ai/hammerlock" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textDecoration: 'none' }}>
              View source on GitHub &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* BLOG / RESEARCH */}
      <section className="features fade-in-section" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="section-label">Research</div>
        <h2>The Open Source Intelligence Files</h2>
        <p className="section-subtitle">
          Deep dives into why open source isn&apos;t just a philosophy &mdash; it&apos;s the only architecture that puts you in control.
        </p>
        <div className="blog-preview-grid">
          {[
            { num: "01", pillar: "Philosophy", title: "The Code That Changed Everything: A Brief History of Open Source" },
            { num: "02", pillar: "AI Models", title: "Ollama, LLaMA, Mistral, Gemma: Your 2026 Field Guide to Local AI" },
            { num: "03", pillar: "Why OSS Wins", title: "Why Open Source Always Wins \u2014 And What Closed Systems Hide" },
            { num: "04", pillar: "Privacy + OSS", title: "Open Source and Privacy Are the Same Fight" },
            { num: "05", pillar: "Business Case", title: "Build on What You Can Inspect: The Business Case for Open Source" },
          ].map((a) => (
            <a key={a.num} href="/blog" className="blog-preview-card">
              <span className="blog-preview-num">{a.num} / {a.pillar}</span>
              <span className="blog-preview-title">{a.title}</span>
              <span className="blog-preview-meta">HammerLock Research Desk</span>
            </a>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <a href="/blog" className="btn-secondary" style={{ textDecoration: 'none' }}>
            Read all articles &rarr;
          </a>
        </div>
      </section>

      <section id="cta" className="final-cta fade-in-section">
        <div className="final-cta-card">
          <h2>{t.site_cta_final}</h2>
          <p className="section-subtitle">
            {t.site_cta_final_sub}
          </p>
          <div className="cta-buttons">
            <a href="#pricing" className="btn-primary">{t.site_cta}</a>
            <a href="https://github.com/christopherlhammer11-ai/hammerlock" target="_blank" rel="noreferrer" className="btn-secondary">{t.site_github}</a>
          </div>
          <p className="contact-line">{t.site_footer_contact} <a href="mailto:info@hammerlockai.com">info@hammerlockai.com</a></p>
        </div>
      </section>

      <footer className="site-footer" style={{ padding: '60px 24px 32px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 }}>
          {/* Brand */}
          <div>
            <a href="/" className="logo-mark" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Image src="/brand/hammerlock-icon-192.png" alt="" width={22} height={22} style={{ borderRadius: 4 }} /> HammerLock AI
            </a>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px' }}>
              Your AI. Your Data. Your Rules.<br />Private, encrypted, open-source AI for professionals.
            </p>
            <div className="trust-badges" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <span className="trust-badge">🔐 {t.site_footer_aes}</span>
              <span className="trust-badge">🖥️ {t.site_footer_local}</span>
              <span className="trust-badge">🛡️ {t.site_footer_pii}</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Product</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.82rem' }}>Features</a>
              <a href="#agents" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.82rem' }}>AI Agents</a>
              <a href="#pricing" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.82rem' }}>Pricing</a>
              <a href="/get-app" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.82rem' }}>Download App</a>
              <a href="/blog" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.82rem' }}>Blog &amp; Guides</a>
            </div>
          </div>

          {/* OpenClaw */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>OpenClaw</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="https://github.com/christopherlhammer11-ai/hammerlock" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.82rem' }}>GitHub Repository</a>
              <a href="/blog" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.82rem' }}>OpenClaw Framework</a>
              <a href="/blog" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.82rem' }}>Enterprise Use Cases</a>
              <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.82rem' }}>Ollama (Local AI)</a>
            </div>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Contact &amp; Support</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="mailto:info@hammerlockai.com" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>info@hammerlockai.com</a>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Customer Service &amp; Sales</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Enterprise Inquiries</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Partnership Opportunities</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>We typically respond within 24 hours.</span>
            </div>

            {/* Social Media */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              <a href="https://x.com/hammerlockai" target="_blank" rel="noopener noreferrer" title="Follow us on X" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1.1rem', transition: 'color 0.2s' }}>𝕏</a>
              <a href="https://youtube.com/@hammerlockai" target="_blank" rel="noopener noreferrer" title="Subscribe on YouTube" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1.1rem' }}>▶</a>
              <a href="https://instagram.com/hammerlockai" target="_blank" rel="noopener noreferrer" title="Follow on Instagram" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1.1rem' }}>📷</a>
              <a href="https://tiktok.com/@hammerlockai" target="_blank" rel="noopener noreferrer" title="Follow on TikTok" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1.1rem' }}>♪</a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ maxWidth: 1100, margin: '0 auto', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            &copy; {new Date().getFullYear()} HammerLock AI. All rights reserved. Built on OpenClaw (MIT License).
          </p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.75rem' }}>Terms of Service</a>
            <a href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.75rem' }}>Privacy Policy</a>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cancel anytime &middot; No long-term contracts</span>
            <a href="mailto:info@hammerlockai.com" style={{ color: 'var(--text-muted)', textDecoration: 'underline', fontSize: '0.75rem' }}>Contact us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
