"use client";

import { CheckCircle, Copy, Download, Globe, Key, Monitor, Shield, Smartphone } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSubscription, SubscriptionTier } from "@/lib/subscription-store";
import { useI18n } from "@/lib/i18n";

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const planParam = params.get("plan");
  const { subscription, activateSubscription } = useSubscription();
  const [activated, setActivated] = useState(false);
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [licenseTier, setLicenseTier] = useState<string | null>(null);
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();

  // Activate subscription in localStorage (for web users)
  useEffect(() => {
    if (!sessionId || activated) return;
    if (subscription.sessionId === sessionId) { setActivated(true); return; }
    let tier: SubscriptionTier = "pro";
    if (planParam?.includes("core")) {
      tier = "core";
    } else if (planParam?.includes("teams")) {
      tier = "teams";
    } else if (planParam?.includes("enterprise")) {
      tier = "enterprise";
    }
    activateSubscription(tier, sessionId);
    setActivated(true);
  }, [sessionId, planParam, activated, subscription.sessionId, activateSubscription]);

  // Fetch license key from server (with retry for webhook timing)
  useEffect(() => {
    if (!sessionId || licenseKey) return;
    setLicenseLoading(true);

    let attempts = 0;
    const maxAttempts = 6;
    const delay = 2000;

    const fetchKey = async () => {
      try {
        const res = await fetch(`/api/license/key?session_id=${encodeURIComponent(sessionId)}`);
        if (res.ok) {
          const data = await res.json();
          setLicenseKey(data.licenseKey);
          setLicenseTier(data.tier);
          setLicenseLoading(false);
          return;
        }
        // 404 = webhook hasn't processed yet, retry
        if (res.status === 404 && attempts < maxAttempts) {
          attempts++;
          setTimeout(fetchKey, delay);
          return;
        }
      } catch {
        // Network error — retry
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(fetchKey, delay);
          return;
        }
      }
      setLicenseLoading(false);
    };

    fetchKey();
  }, [sessionId, licenseKey]);

  const handleCopy = useCallback(() => {
    if (!licenseKey) return;
    navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [licenseKey]);

  return (
    <div className="success-page">
      <div className="success-hero">
        <div className="success-icon">
          <CheckCircle size={48} />
        </div>
        <h1>{t.site_success_title}</h1>
        <p className="success-subtitle">
          {t.site_success_subtitle}
        </p>
        {subscription.active && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(0, 255, 136, 0.1)", border: "1px solid rgba(0, 255, 136, 0.3)", borderRadius: 8, color: "var(--accent)", fontSize: "0.85rem", marginTop: 12 }}>
            <Shield size={14} />
            {t.site_success_plan_activated(subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1))}
          </div>
        )}
        {sessionId && (
          <p className="success-session">
            {t.site_success_confirmation}: <code>{sessionId.slice(0, 16)}...</code>
          </p>
        )}
      </div>

      {/* License Key Section */}
      <div className="license-key-section" style={{
        maxWidth: 600,
        margin: "32px auto",
        padding: "28px",
        background: "var(--bg-card)",
        border: "1px solid var(--accent)",
        borderRadius: "var(--radius-lg)",
        textAlign: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
          <Key size={20} style={{ color: "var(--accent)" }} />
          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Your License Key</h3>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 16 }}>
          Enter this key in the desktop app to activate your {licenseTier ? licenseTier.charAt(0).toUpperCase() + licenseTier.slice(1) : ""} plan.
        </p>
        {licenseLoading ? (
          <div style={{
            padding: "16px",
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-muted)",
            fontFamily: "var(--font-jetbrains)",
            fontSize: "0.9rem",
          }}>
            Generating your license key...
          </div>
        ) : licenseKey ? (
          <>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "14px 20px",
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
            }}>
              <code style={{
                fontFamily: "var(--font-jetbrains)",
                fontSize: "1.2rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: "var(--accent)",
              }}>
                {licenseKey}
              </code>
              <button
                onClick={handleCopy}
                style={{
                  background: copied ? "var(--accent)" : "transparent",
                  border: `1px solid ${copied ? "var(--accent)" : "var(--border-color)"}`,
                  borderRadius: "var(--radius-sm)",
                  padding: "6px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: copied ? "#000" : "var(--text-secondary)",
                  fontSize: "0.8rem",
                  transition: "all 0.15s ease",
                }}
              >
                <Copy size={14} />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 12 }}>
              Save this key somewhere safe. You&apos;ll need it to activate the desktop app.
            </p>
          </>
        ) : (
          <div style={{
            padding: "16px",
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-muted)",
            fontSize: "0.85rem",
          }}>
            License key will appear here shortly.
          </div>
        )}
      </div>

      <div className="success-downloads">
        <h2>{t.site_success_get_started}</h2>
        <p className="success-hint">{t.site_success_choose}</p>
        <div className="download-grid">
          <div className="download-card">
            <div className="download-card-icon"><Monitor size={28} /></div>
            <h3>{t.site_getapp_desktop}</h3>
            <p>{t.site_getapp_desktop_desc}</p>
            <a href="https://github.com/christopherlhammer11-ai/hammerlock/releases/latest/download/HammerLock-AI.dmg" className="btn-primary download-btn" target="_blank" rel="noopener noreferrer">
              <Download size={16} /> {t.site_getapp_download_mac}
            </a>
            <span className="download-meta">{t.site_getapp_mac_meta} &middot; Apple Silicon &amp; Intel</span>
          </div>
          <div className="download-card">
            <div className="download-card-icon"><Globe size={28} /></div>
            <h3>{t.site_getapp_web}</h3>
            <p>{t.site_getapp_web_desc}</p>
            <span className="download-meta">{t.site_getapp_web_meta}</span>
          </div>
          <div className="download-card">
            <div className="download-card-icon"><Smartphone size={28} /></div>
            <h3>{t.site_getapp_pwa}</h3>
            <p>{t.site_getapp_pwa_desc}</p>
            <span className="download-meta">{t.site_getapp_pwa_meta} &middot; Add to Home Screen</span>
          </div>
        </div>
      </div>
      <div className="success-setup">
        <h2><Shield size={20} /> {t.site_success_quick_setup}</h2>

        {/* Tier-specific setup guide */}
        {(() => {
          const tier = licenseTier || (planParam?.includes("core") ? "core" : planParam?.includes("teams") ? "teams" : "pro");

          if (tier === "core") {
            return (
              <div className="setup-steps">
                <div className="setup-step">
                  <div className="step-number">1</div>
                  <div>
                    <strong>Download &amp; Install HammerLock AI</strong>
                    <p>Download the DMG above, drag to Applications, and launch. Create your encryption password on first run.</p>
                  </div>
                </div>
                <div className="setup-step">
                  <div className="step-number">2</div>
                  <div>
                    <strong>Enter Your License Key</strong>
                    <p>Copy the license key above and paste it when the app prompts you. This unlocks Core features: 11 AI agents, encrypted vault, personas, and chat export.</p>
                  </div>
                </div>
                <div className="setup-step">
                  <div className="step-number">3</div>
                  <div>
                    <strong>Set Up Your AI Engine</strong>
                    <p>Core uses <strong>your own API keys</strong> (Bring Your Own Key). Go to Settings in the app and enter at least one key from OpenAI, Anthropic, Google, Groq, Mistral, or DeepSeek. Or install <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" style={{color: "var(--accent)"}}>Ollama</a> for free local AI.</p>
                  </div>
                </div>
                <div className="setup-step">
                  <div className="step-number">4</div>
                  <div>
                    <strong>Load Your Persona</strong>
                    <p>Click the persona icon in chat to tell the AI about yourself — your name, role, industry, and preferences. This makes every response personally tailored to you.</p>
                  </div>
                </div>
              </div>
            );
          }

          if (tier === "pro" || tier === "teams") {
            return (
              <div className="setup-steps">
                <div className="setup-step">
                  <div className="step-number">1</div>
                  <div>
                    <strong>Download &amp; Install HammerLock AI</strong>
                    <p>Download the DMG above, drag to Applications, and launch. Create your encryption password on first run.</p>
                  </div>
                </div>
                <div className="setup-step">
                  <div className="step-number">2</div>
                  <div>
                    <strong>Enter Your License Key</strong>
                    <p>Copy the license key above and paste it when the app prompts you. This unlocks {tier === "teams" ? "Teams" : "Pro"} features including web search, voice I/O, PDF tools, reports, and <strong>1,000 monthly cloud AI credits</strong>.</p>
                  </div>
                </div>
                <div className="setup-step">
                  <div className="step-number">3</div>
                  <div>
                    <strong>Start Chatting — You&apos;re Ready</strong>
                    <p>Your Pro plan includes bundled cloud AI (GPT-4o, Claude, Gemini, and more). Just type and go — no API keys needed. Your 1,000 monthly credits reset every billing cycle.</p>
                  </div>
                </div>
                <div className="setup-step">
                  <div className="step-number">4</div>
                  <div>
                    <strong>Optional: Add Local AI for Unlimited Free Use</strong>
                    <p>Install <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" style={{color: "var(--accent)"}}>Ollama</a> and run <code style={{background: "rgba(0,255,136,0.08)", color: "var(--accent)", padding: "2px 6px", borderRadius: 4, fontSize: "0.85rem"}}>ollama pull llama3.1</code> for unlimited local AI that never uses credits. Great for everyday tasks.</p>
                  </div>
                </div>
                <div className="setup-step">
                  <div className="step-number">5</div>
                  <div>
                    <strong>Optional: Bring Your Own API Keys</strong>
                    <p>Want unlimited cloud AI? Go to Settings and add your own API keys from OpenAI, Anthropic, etc. When using your own keys, <strong>no credits are deducted</strong> — you pay the providers directly.</p>
                  </div>
                </div>
              </div>
            );
          }

          // Default / fallback
          return (
            <div className="setup-steps">
              <div className="setup-step">
                <div className="step-number">1</div>
                <div><strong>{t.site_getapp_step1_title}</strong><p>{t.site_getapp_step1_desc}</p></div>
              </div>
              <div className="setup-step">
                <div className="step-number">2</div>
                <div><strong>{t.site_getapp_step2_title}</strong><p>{t.site_getapp_step2_desc}</p></div>
              </div>
              <div className="setup-step">
                <div className="step-number">3</div>
                <div><strong>{t.site_success_step3_desc}</strong><p>Enter your license key when prompted to unlock your plan features.</p></div>
              </div>
            </div>
          );
        })()}

        {/* Credit info callout for Pro/Teams */}
        {(licenseTier === "pro" || licenseTier === "teams" || planParam?.includes("pro") || planParam?.includes("teams")) && (
          <div style={{
            marginTop: 28, padding: "20px 24px", background: "rgba(0,255,136,0.04)",
            border: "1px solid rgba(0,255,136,0.15)", borderRadius: 12, textAlign: "center",
          }}>
            <h4 style={{ margin: "0 0 8px", color: "var(--accent)", fontSize: "0.95rem" }}>
              Your Monthly Credits
            </h4>
            <p style={{ margin: "0 0 12px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              Your plan includes <strong>1,000 cloud AI credits/month</strong>. Each chat costs 1-3 credits depending on the model. Credits reset on your billing date.
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              <span>Local Ollama = <strong style={{color: "var(--accent)"}}>free, unlimited</strong></span>
              <span>•</span>
              <span>Your own API keys = <strong style={{color: "var(--accent)"}}>free, unlimited</strong></span>
              <span>•</span>
              <span>Need more? <strong>Booster +$10/mo</strong></span>
            </div>
          </div>
        )}
      </div>
      <div className="success-footer">
        <p>{t.site_success_questions} <strong>info@hammerlockai.com</strong></p>
        <Link href="/" className="success-home-link">{t.site_success_back}</Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<div className="success-page"><div className="success-hero"><h1>{t.site_success_loading}</h1></div></div>}>
      <SuccessContent />
    </Suspense>
  );
}
