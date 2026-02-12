"use client";

import { CheckCircle, Download, Globe, Monitor, Shield, Smartphone } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");

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
            <div className="download-card-icon">
              <Monitor size={28} />
            </div>
            <h3>Desktop App</h3>
            <p>Full offline capability with local AI. Your data never leaves your machine.</p>
            <a
              href="https://github.com/christopherlhammer11-ai/vaultai/releases/latest/download/VaultAI-0.1.0-arm64.dmg"
              className="btn-primary download-btn"
            >
              <Download size={16} /> Download for Mac
            </a>
            <span className="download-meta">macOS 12+ &middot; Apple Silicon &amp; Intel</span>
          </div>

          <div className="download-card">
            <div className="download-card-icon">
              <Globe size={28} />
            </div>
            <h3>Web App</h3>
            <p>Access from any browser, any device. End-to-end encrypted in your browser.</p>
            <Link href="/vault" className="btn-primary download-btn">
              <Shield size={16} /> Launch Web App
            </Link>
            <span className="download-meta">Works on any device with a browser</span>
          </div>

          <div className="download-card">
            <div className="download-card-icon">
              <Smartphone size={28} />
            </div>
            <h3>Mobile (PWA)</h3>
            <p>Add to your home screen for an app-like experience on iPhone or Android.</p>
            <Link href="/vault" className="btn-primary download-btn" style={{ background: "var(--text-secondary)", color: "#000" }}>
              <Smartphone size={16} /> Open &amp; Add to Home Screen
            </Link>
            <span className="download-meta">iOS Safari &middot; Android Chrome</span>
          </div>
        </div>
      </div>

      <div className="success-setup">
        <h2><Shield size={20} /> Quick Setup</h2>
        <div className="setup-steps">
          <div className="setup-step">
            <div className="step-number">1</div>
            <div>
              <strong>Create your vault password</strong>
              <p>This password encrypts everything locally. We never see it.</p>
            </div>
          </div>
          <div className="setup-step">
            <div className="step-number">2</div>
            <div>
              <strong>Set up your profile</strong>
              <p>Tell VaultAI about yourself so it can personalize your experience.</p>
            </div>
          </div>
          <div className="setup-step">
            <div className="step-number">3</div>
            <div>
              <strong>Start chatting</strong>
              <p>Ask anything. Upload PDFs. Use voice. Everything stays encrypted.</p>
            </div>
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
