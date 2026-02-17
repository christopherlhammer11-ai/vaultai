"use client";

import { CheckCircle, Download, Globe, Monitor, Shield, Smartphone } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useSubscription, SubscriptionTier } from "@/lib/subscription-store";
import { useI18n } from "@/lib/i18n";

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const planParam = params.get("plan");
  const { subscription, activateSubscription } = useSubscription();
  const [activated, setActivated] = useState(false);
  const { t } = useI18n();

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
            <div><strong>{t.site_getapp_step3_title}</strong><p>{t.site_success_step3_desc}</p></div>
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
