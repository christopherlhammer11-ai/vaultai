"use client";

import { CheckCircle, Download, Globe, Lock, Monitor, Shield, Smartphone } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useSubscription, SubscriptionTier } from "@/lib/subscription-store";

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const planParam = params.get("plan");
  const { subscription, activateSubscription } = useSubscription();
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (!sessionId || activated) return;
    // Skip only if already activated with THIS exact session ID (prevent double-fire)
    if (subscription.sessionId === sessionId) { setActivated(true); return; }
    let tier: SubscriptionTier = "premium";
    if (planParam?.includes("lite")) {
      tier = "lite";
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
        <h1>Welcome to VaultAI</h1>
        <p className="success-subtitle">
          Your subscription is active. Your 7-day free trial starts now.
        </p>
        {subscription.active && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(0, 255, 136, 0.1)", border: "1px solid rgba(0, 255, 136, 0.3)", borderRadius: 8, color: "var(--accent)", fontSize: "0.85rem", marginTop: 12 }}>
            <Shield size={14} />
            {subscription.tier === "premium" ? "Premium" : "Lite"} plan activated
          </div>
        )}
        {sessionId && (
          <p className="success-session">
            Confirmation: <code>{sessionId.slice(0, 16)}...</code>
          </p>
        )}
      </div>
      <div className="success-downloads">
        <h2>Get Started</h2>
        <p className="success-hint">Choose how you want to use VaultAI</p>
        <div className="download-grid">
          <div className="download-card">
            <div className="download-card-icon"><Monitor size={28} /></div>
            <h3>Desktop App</h3>
            <p>Full offline capability with local AI. Your data never leaves your machine.</p>
            <a href="https://github.com/christopherlhammer11-ai/vaultai/releases/latest/download/VaultAI.dmg" className="btn-primary download-btn" target="_blank" rel="noopener noreferrer">
              <Download size={16} /> Download for Mac
            </a>
            <span className="download-meta">macOS 12+ · Apple Silicon & Intel</span>
          </div>
          <div className="download-card">
            <div className="download-card-icon"><Globe size={28} /></div>
            <h3>Web App</h3>
            <p>Access from any browser, any device. End-to-end encrypted in your browser.</p>
            <Link href="/vault" className="btn-primary download-btn">
              <Shield size={16} /> Launch Web App
            </Link>
            <span className="download-meta">Works on any device with a browser</span>
          </div>
          <div className="download-card">
            <div className="download-card-icon"><Smartphone size={28} /></div>
            <h3>Mobile (PWA)</h3>
            <p>Add to your home screen for an app-like experience on iPhone or Android.</p>
            <Link href="/vault" className="btn-primary download-btn" style={{ background: "var(--text-secondary)", color: "#000" }}>
              <Smartphone size={16} /> Open & Add to Home Screen
            </Link>
            <span className="download-meta">iOS Safari · Android Chrome</span>
          </div>
        </div>
      </div>
      <div className="success-setup">
        <h2><Shield size={20} /> Quick Setup</h2>
        <div className="setup-steps">
          <div className="setup-step">
            <div className="step-number">1</div>
            <div><strong>Create your vault password</strong><p>This password encrypts everything locally. We never see it.</p></div>
          </div>
          <div className="setup-step">
            <div className="step-number">2</div>
            <div><strong>Set up your profile</strong><p>Tell VaultAI about yourself so it can personalize your experience.</p></div>
          </div>
          <div className="setup-step">
            <div className="step-number">3</div>
            <div><strong>Start chatting</strong><p>Ask anything. Upload PDFs. Use voice. Everything stays encrypted.</p></div>
          </div>
        </div>
      </div>
      <div className="success-footer">
        <p>Questions? Reach us at <strong>info@personalvaultai.com</strong></p>
        <Link href="/" className="success-home-link">Back to Home</Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="success-page"><div className="success-hero"><h1>Loading...</h1></div></div>}>
      <SuccessContent />
    </Suspense>
  );
}
