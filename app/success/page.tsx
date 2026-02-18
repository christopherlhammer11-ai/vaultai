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
