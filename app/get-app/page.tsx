"use client";

import { Download, Globe, Lock, Monitor, Shield, Smartphone } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function GetAppPage() {
  const { t } = useI18n();

  return (
    <div className="success-page">
      <div className="success-hero">
        <div className="success-icon">
          <Lock size={48} />
        </div>
        <h1>{t.site_getapp_title}</h1>
        <p className="success-subtitle">
          {t.site_getapp_subtitle}
        </p>
      </div>

      <div className="success-downloads">
        <h2>{t.site_getapp_heading}</h2>
        <p className="success-hint">{t.site_getapp_choose}</p>
        <div className="download-grid">
          <div className="download-card">
            <div className="download-card-icon"><Monitor size={28} /></div>
            <h3>{t.site_getapp_desktop}</h3>
            <p>{t.site_getapp_desktop_desc}</p>
            <a
              href="https://github.com/christopherlhammer11-ai/hammerlock/releases/latest/download/HammerLock-AI.dmg"
              className="btn-primary download-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
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
        <h2><Shield size={20} /> {t.site_getapp_first_launch}</h2>
        <div className="setup-steps">
          <div className="setup-step">
            <div className="step-number">1</div>
            <div>
              <strong>{t.site_getapp_step1_title}</strong>
              <p>{t.site_getapp_step1_desc}</p>
            </div>
          </div>
          <div className="setup-step">
            <div className="step-number">2</div>
            <div>
              <strong>{t.site_getapp_step2_title}</strong>
              <p>{t.site_getapp_step2_desc}</p>
            </div>
          </div>
          <div className="setup-step">
            <div className="step-number">3</div>
            <div>
              <strong>{t.site_getapp_step3_title}</strong>
              <p>{t.site_getapp_step3_desc}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="success-footer">
        <p>{t.site_getapp_questions} <strong>info@hammerlockai.com</strong></p>
        <Link href="/" className="success-home-link">{t.site_getapp_back}</Link>
      </div>
    </div>
  );
}
