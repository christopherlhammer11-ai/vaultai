'use client';

// 🔨🔐 HammerLock AI — Landing Page
// Your AI. Your Data. Your Rules.

import { Check, Globe, Lock, Menu, Smartphone, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [mobileUrl, setMobileUrl] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
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
    { icon: '🔐', title: t.site_feat_encrypt_title, body: t.site_feat_encrypt_body },
    { icon: '🌐', title: t.site_feat_search_title, body: t.site_feat_search_body },
    { icon: '🧠', title: t.site_feat_memory_title, body: t.site_feat_memory_body },
    { icon: '🎙️', title: t.site_feat_voice_title, body: t.site_feat_voice_body },
    { icon: '🌍', title: t.site_feat_lang_title, body: t.site_feat_lang_body },
    { icon: '💳', title: t.site_feat_credits_title, body: t.site_feat_credits_body },
    { icon: '📄', title: t.site_feat_pdf_title, body: t.site_feat_pdf_body },
    { icon: '🗄️', title: t.site_feat_vault_title, body: t.site_feat_vault_body },
    { icon: '🤖', title: t.site_feat_agents_title, body: t.site_feat_agents_body },
    { icon: '⚡', title: t.site_feat_perf_title, body: t.site_feat_perf_body },
  ];

  const steps = [
    { label: '01', title: t.site_step1_title, body: t.site_step1_body },
    { label: '02', title: t.site_step2_title, body: t.site_step2_body },
    { label: '03', title: t.site_step3_title, body: t.site_step3_body },
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
      price: billingCycle === 'monthly' ? 29 : 249,
      priceLabel: billingCycle === 'monthly' ? '$29' : '$249',
      pricePeriod: billingCycle === 'monthly' ? t.site_plan_per_mo : t.site_plan_per_yr,
      annualSavings: '28%',
      features: [t.site_plan_pro_f1, t.site_plan_pro_f2, t.site_plan_pro_f3, t.site_plan_pro_f4, t.site_plan_pro_f5, t.site_plan_pro_f6, t.site_plan_pro_f7],
      ctaAction: billingCycle === 'monthly' ? 'pro-monthly' : 'pro-annual',
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
          <Lock size={16} />
          HammerLock AI
        </a>
        <ul>
          <li><a href="#features">{t.site_nav_features}</a></li>
          <li><a href="#agents">{t.site_nav_agents}</a></li>
          <li><a href="#pricing">{t.site_nav_pricing}</a></li>
          <li><a href="#how">{t.site_nav_how}</a></li>
          <li><a href="#why">{t.site_nav_why}</a></li>
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
            <article key={card.label} className="usecase-card">
              <div className="usecase-label">{card.label}</div>
              <h3>{card.headline}</h3>
              <p>{card.body}</p>
              <div className="usecase-terminal">
                <div><span className="prompt">hammerlock &gt;</span> {card.prompt}</div>
                <div className="meta">{card.response}</div>
              </div>
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
        <div className="section-label">{t.site_section_agents}</div>
        <h2>{t.site_agents_h2}</h2>
        <p className="section-subtitle">
          {t.site_sub_agents}
        </p>
        <div className="features-grid">
          {[
            { icon: '🎯', title: t.site_agent_strategist_title, body: t.site_agent_strategist_body },
            { icon: '⚖️', title: t.site_agent_counsel_title, body: t.site_agent_counsel_body },
            { icon: '📈', title: t.site_agent_analyst_title, body: t.site_agent_analyst_body },
            { icon: '📚', title: t.site_agent_researcher_title, body: t.site_agent_researcher_body },
            { icon: '🔧', title: t.site_agent_operator_title, body: t.site_agent_operator_body },
            { icon: '✍️', title: t.site_agent_writer_title, body: t.site_agent_writer_body },
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

        <div className="billing-toggle">
          <button
            className={billingCycle === 'monthly' ? 'active' : ''}
            onClick={() => setBillingCycle('monthly')}
          >
            {t.site_billing_monthly}
          </button>
          <button
            className={billingCycle === 'annual' ? 'active' : ''}
            onClick={() => setBillingCycle('annual')}
          >
            {t.site_billing_annual} <span className="toggle-badge">{t.site_billing_save}</span>
          </button>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <div key={plan.name} className={`pricing-card${plan.popular ? ' popular' : ''}${plan.enterprise ? ' enterprise' : ''}`}>
              {plan.popular && <div className="pricing-badge">{t.site_plan_popular}</div>}
              {plan.tag && <div className="pricing-tag">{plan.tag}</div>}
              <h3>{plan.name}</h3>
              <p className="pricing-description">{plan.description}</p>
              <div className="pricing-price">
                <span className="price-amount">{plan.priceLabel}</span>
                {plan.pricePeriod && (
                  <span className="price-period">/{plan.pricePeriod}</span>
                )}
              </div>
              {billingCycle === 'annual' && plan.annualSavings && (
                <div className="pricing-savings">{t.site_plan_save(plan.annualSavings)}</div>
              )}
              {plan.ctaAction !== 'github' && plan.ctaAction !== 'contact' && (
                <div className="pricing-trial">{t.site_trial_included}</div>
              )}
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

      <footer className="site-footer">
        <a href="/" className="logo-mark" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Lock size={16} /> HammerLock AI
        </a>
        <div className="trust-badges">
          <span className="trust-badge">🔐 {t.site_footer_aes}</span>
          <span className="trust-badge">🖥️ {t.site_footer_local}</span>
          <span className="trust-badge">🛡️ {t.site_footer_pii}</span>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <a href="mailto:info@hammerlockai.com" style={{ color: 'var(--accent)', textDecoration: 'none' }}>info@hammerlockai.com</a>
        </div>
      </footer>
    </div>
  );
}
