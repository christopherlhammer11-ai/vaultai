"use client";

import { useState } from "react";
import { Download, ExternalLink, Globe, Lock, Mail, Monitor, Shield, Smartphone, Terminal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const DMG_URL =
  "https://github.com/christopherlhammer11-ai/hammerlock/releases/latest/download/HammerLock-AI.dmg";

export default function GetAppPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await fetch("/api/download-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "get-app", platform: "mac" }),
      });
      setUnlocked(true);
    } catch {
      // Still unlock even if API fails — don't block the download
      setUnlocked(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="success-page">
      <div className="success-hero">
        <div className="success-icon">
          <Image src="/brand/hammerlock-icon-192.png" alt="HammerLock AI" width={56} height={56} style={{ borderRadius: 10 }} />
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

            {!unlocked ? (
              <form className="download-email-gate" onSubmit={handleUnlock}>
                <p className="email-gate-label">
                  <Mail size={14} /> Enter your email to download
                </p>
                <div className="email-gate-row">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="email-gate-input"
                    required
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="btn-primary download-btn"
                    disabled={loading}
                  >
                    {loading ? "..." : <><Download size={16} /> Get DMG</>}
                  </button>
                </div>
                {error && <p className="email-gate-error">{error}</p>}
                <p className="email-gate-fine">
                  We&apos;ll only email you about major updates. No spam, ever.
                </p>
              </form>
            ) : (
              <>
                <a
                  href={DMG_URL}
                  className="btn-primary download-btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download size={16} /> {t.site_getapp_download_mac}
                </a>
                <span className="download-meta">{t.site_getapp_mac_meta} &middot; Apple Silicon &amp; Intel</span>
              </>
            )}
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
          <div className="setup-step">
            <div className="step-number">4</div>
            <div>
              <strong>{t.site_getapp_step4_title}</strong>
              <p>{t.site_getapp_step4_desc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* LOCAL AI ENGINE SECTION */}
      <div className="success-setup" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <h2><Terminal size={20} /> Power Your AI Locally</h2>
        <p className="success-hint" style={{ marginBottom: 24 }}>
          HammerLock AI is the interface. <strong>Ollama</strong> is the engine that runs AI models on your machine.
          You need both &mdash; the app does not include a model. Install Ollama, pull a model, and everything runs 100% offline.
        </p>

        <div className="download-grid">
          <div className="download-card">
            <div className="download-card-icon" style={{ fontSize: '1.5rem' }}>🦙</div>
            <h3>Ollama</h3>
            <p>Free, open-source local AI engine. Runs models on your hardware with one command. Required for local AI.</p>
            <a
              href="https://ollama.com"
              className="btn-primary download-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={14} /> Download Ollama
            </a>
            <span className="download-meta">ollama.com &middot; macOS, Windows, Linux</span>
          </div>

          <div className="download-card">
            <div className="download-card-icon" style={{ fontSize: '1.5rem' }}>🧠</div>
            <h3>Or Use Cloud API Keys</h3>
            <p>Prefer cloud models? Bring your own API keys from OpenAI, Anthropic, Google, Groq, Mistral, or DeepSeek. No Ollama needed.</p>
            <span className="download-meta">BYOK &mdash; your keys, your spend, your choice</span>
          </div>
        </div>
      </div>

      {/* SETUP PATH BY PLAN */}
      <div className="success-setup" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <h2><Shield size={20} /> Which Setup Is Right for You?</h2>
        <p className="success-hint" style={{ marginBottom: 24 }}>
          Your setup depends on your plan. Here&apos;s a quick guide:
        </p>
        <div className="download-grid">
          <div className="download-card" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="download-card-icon" style={{ fontSize: '1.2rem' }}>🆓</div>
            <h3>Free Plan</h3>
            <p style={{ fontSize: '0.88rem' }}>
              <strong>You need Ollama.</strong> The free plan runs entirely on local models. Install Ollama, pull a model (see table below), and you&apos;re set. No API keys, no cloud, no cost.
            </p>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
              <code style={{ background: 'rgba(0,255,136,0.08)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 4 }}>ollama pull llama3.1</code>
            </div>
          </div>

          <div className="download-card" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="download-card-icon" style={{ fontSize: '1.2rem' }}>🔑</div>
            <h3>Core ($15 one-time)</h3>
            <p style={{ fontSize: '0.88rem' }}>
              <strong>Bring Your Own Keys (BYOK).</strong> Core unlocks agents, vault, personas, and export. For AI, you provide your own API keys from OpenAI, Anthropic, etc. Or use Ollama for free local AI.
            </p>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Go to <strong>Settings → API Keys</strong> in the app
            </div>
          </div>

          <div className="download-card" style={{ borderColor: 'rgba(0,255,136,0.2)' }}>
            <div className="download-card-icon" style={{ fontSize: '1.2rem' }}>⚡</div>
            <h3>Pro ($29/mo)</h3>
            <p style={{ fontSize: '0.88rem' }}>
              <strong>Just type and go.</strong> Pro includes 1,000 monthly cloud AI credits — GPT-4o, Claude, Gemini, and more are built in. No API keys needed. Optionally add Ollama for unlimited free local AI, or your own keys for unlimited cloud.
            </p>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: 8 }}>
              ✓ Cloud AI included &middot; ✓ Web search &middot; ✓ Voice &middot; ✓ PDF &middot; ✓ Reports
            </div>
          </div>
        </div>
      </div>

      {/* RECOMMENDED MODELS */}
      <div className="success-setup" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <h2>Recommended Local Models</h2>
        <p className="success-hint" style={{ marginBottom: 24 }}>
          After installing Ollama, open a terminal and pull one of these models. Each one runs entirely on your hardware.
        </p>

        <div className="model-table-wrap" style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--accent)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--accent)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Best For</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--accent)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RAM Needed</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--accent)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Terminal Command</th>
              </tr>
            </thead>
            <tbody>
              {[
                { model: 'LLaMA 3.1 8B', best: 'Best all-rounder (recommended)', ram: '16 GB', cmd: 'ollama pull llama3.1', tag: '★' },
                { model: 'Mistral 7B', best: 'Fast & efficient', ram: '16 GB', cmd: 'ollama pull mistral', tag: '' },
                { model: 'Phi-3 Mini', best: 'Low-resource machines', ram: '8 GB', cmd: 'ollama pull phi3', tag: '' },
                { model: 'Gemma 2', best: 'Instruction following', ram: '16 GB', cmd: 'ollama pull gemma2', tag: '' },
                { model: 'Mixtral 8x7B', best: 'Near-GPT-4 quality', ram: '32 GB', cmd: 'ollama pull mixtral', tag: '' },
                { model: 'LLaMA 3.1 70B', best: 'Maximum capability', ram: '64 GB', cmd: 'ollama pull llama3.1:70b', tag: '' },
              ].map((m) => (
                <tr key={m.model} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {m.tag && <span style={{ color: 'var(--accent)', marginRight: 6 }}>{m.tag}</span>}
                    {m.model}
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{m.best}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{m.ram}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <code style={{ background: 'rgba(0,255,136,0.08)', color: 'var(--accent)', padding: '3px 8px', borderRadius: 4, fontSize: '0.82rem', fontFamily: 'var(--font-jetbrains), monospace' }}>{m.cmd}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 16, textAlign: 'center' }}>
          All models are free and open source. Download once &mdash; runs offline forever.
          <br />
          <a href="https://ollama.com/library" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
            Browse all models at ollama.com/library &rarr;
          </a>
        </p>
      </div>

      <div className="success-footer">
        <p>{t.site_getapp_questions} <strong>info@hammerlockai.com</strong></p>
        <Link href="/" className="success-home-link">{t.site_getapp_back}</Link>
      </div>
    </div>
  );
}
