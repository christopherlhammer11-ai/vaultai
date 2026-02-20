"use client";

import { Eye, EyeOff, Lock, Shield, Globe, Brain, Mic } from "lucide-react";
import Image from "next/image";
import { useVault } from "@/lib/vault-store";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n";

function getPasswordStrength(pw: string): "weak" | "medium" | "strong" {
  if (!pw || pw.length < 6) return "weak";
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score >= 4) return "strong";
  if (score >= 2) return "medium";
  return "weak";
}

const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 30000;

// ── First-launch welcome phases ──
// WELCOME_FEATURES uses i18n keys — defined inside the component

export default function VaultPage() {
  const { hasVault, isUnlocked, initializeVault, unlockVault, clearVault } = useVault();
  const router = useRouter();
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const attemptsRef = useRef(0);
  const mode: "create" | "unlock" = hasVault ? "unlock" : "create";

  // Auto-redirect to /chat if session is already restored (survives refresh)
  useEffect(() => {
    if (isUnlocked) {
      router.replace("/chat");
    }
  }, [isUnlocked, router]);

  const WELCOME_FEATURES = [
    { icon: Lock, label: t.welcome_encrypted_label, desc: t.welcome_encrypted_desc },
    { icon: Brain, label: t.welcome_memory_label, desc: t.welcome_memory_desc },
    { icon: Globe, label: t.welcome_providers_label, desc: t.welcome_providers_desc },
    { icon: Mic, label: t.welcome_voice_label, desc: t.welcome_voice_desc },
  ];

  // ── Welcome sequence state ──
  // Phase 0 = brand reveal, 1 = features, 2 = fade to form
  const [welcomePhase, setWelcomePhase] = useState(-1); // -1 = not started
  const [welcomeDone, setWelcomeDone] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const strengthLabel = strength === "weak" ? t.vault_weak : strength === "medium" ? t.vault_medium : t.vault_strong;

  // ── First-launch detection: show welcome only for brand-new users ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem("hammerlock_welcomed");
    if (!hasVault && !seen) {
      // First launch — run welcome sequence
      setWelcomePhase(0);
    } else {
      // Returning user or vault exists — skip welcome
      setWelcomeDone(true);
      setTimeout(() => setCardVisible(true), 50);
    }
  }, [hasVault]);

  // ── Welcome phase progression ──
  useEffect(() => {
    if (welcomePhase < 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    if (welcomePhase === 0) {
      // After brand reveal plays, move to features
      timers.push(setTimeout(() => setWelcomePhase(1), 2800));
    } else if (welcomePhase === 1) {
      // After features play, move to form
      timers.push(setTimeout(() => setWelcomePhase(2), 3200));
    } else if (welcomePhase === 2) {
      // Fade out welcome, show form
      timers.push(setTimeout(() => {
        localStorage.setItem("hammerlock_welcomed", "1");
        setWelcomeDone(true);
        setTimeout(() => setCardVisible(true), 100);
      }, 600));
    }

    return () => timers.forEach(clearTimeout);
  }, [welcomePhase]);

  // Skip welcome on click/key
  const skipWelcome = useCallback(() => {
    if (welcomeDone) return;
    localStorage.setItem("hammerlock_welcomed", "1");
    setWelcomePhase(-1);
    setWelcomeDone(true);
    setTimeout(() => setCardVisible(true), 50);
  }, [welcomeDone]);

  useEffect(() => {
    if (welcomeDone) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") skipWelcome();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [welcomeDone, skipWelcome]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      attemptsRef.current = parseInt(sessionStorage.getItem("vault_attempts") || "0", 10);
      const lockUntil = parseInt(sessionStorage.getItem("vault_lock_until") || "0", 10);
      if (lockUntil > Date.now()) {
        setCooldownRemaining(lockUntil - Date.now());
      }
    }
  }, []);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1000) return 0;
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  useEffect(() => {
    if (isUnlocked) {
      router.replace("/chat");
    }
  }, [isUnlocked, router]);

  const handleSubmit = async () => {
    setError(null);
    if (cooldownRemaining > 0) {
      setError(t.vault_too_many(Math.ceil(cooldownRemaining / 1000)));
      return;
    }
    if (mode === "create" && password !== confirmPassword) {
      setError(t.vault_no_match);
      return;
    }
    if (!password) {
      setError(t.vault_required);
      return;
    }
    try {
      setLoading(true);
      if (mode === "create") {
        await initializeVault(password);
      } else {
        await unlockVault(password);
      }
      attemptsRef.current = 0;
      sessionStorage.removeItem("vault_attempts");
      sessionStorage.removeItem("vault_lock_until");
      router.replace("/chat");
    } catch (err) {
      if (mode === "unlock") {
        attemptsRef.current += 1;
        sessionStorage.setItem("vault_attempts", String(attemptsRef.current));
        if (attemptsRef.current >= MAX_ATTEMPTS) {
          const lockUntil = Date.now() + COOLDOWN_MS;
          sessionStorage.setItem("vault_lock_until", String(lockUntil));
          setCooldownRemaining(COOLDOWN_MS);
          attemptsRef.current = 0;
          sessionStorage.setItem("vault_attempts", "0");
          setError(t.vault_too_many(COOLDOWN_MS / 1000));
        } else {
          setError(`${(err as Error).message}. ${t.vault_attempts_remaining(MAX_ATTEMPTS - attemptsRef.current)}`);
        }
      } else {
        setError((err as Error).message || t.vault_create_error);
      }
    } finally {
      setLoading(false);
      setPassword("");
      setConfirmPassword("");
    }
  };

  const handleReset = () => {
    const confirmed = confirm(t.vault_reset_confirm);
    if (confirmed) {
      clearVault();
      setPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="vault-page" onClick={!welcomeDone ? skipWelcome : undefined}>
      {/* Ambient animated rings */}
      <div className="vault-ambient">
        <div className="vault-ring vault-ring-1" />
        <div className="vault-ring vault-ring-2" />
        <div className="vault-ring vault-ring-3" />
      </div>

      {/* ════════════════════════════════════════════════════════
          FIRST-LAUNCH WELCOME SEQUENCE
          ════════════════════════════════════════════════════════ */}
      {!welcomeDone && welcomePhase >= 0 && (
        <div className={`welcome-overlay ${welcomePhase === 2 ? "welcome-exit" : ""}`}>
          {/* Phase 0: Brand reveal */}
          <div className={`welcome-brand ${welcomePhase >= 0 ? "visible" : ""}`}>
            <div className="welcome-lock-wrap">
              <Image src="/brand/hammerlock-icon-192.png" alt="HammerLock AI" width={56} height={56} style={{ borderRadius: 8 }} />
            </div>
            <h1 className="welcome-title">HammerLock AI</h1>
            <p className="welcome-tagline">{t.welcome_tagline}</p>
          </div>

          {/* Phase 1: Feature cards cascade */}
          {welcomePhase >= 1 && (
            <div className="welcome-features">
              {WELCOME_FEATURES.map((feat, i) => (
                <div
                  key={feat.label}
                  className="welcome-feature"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <div className="welcome-feat-icon">
                    <feat.icon size={18} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="welcome-feat-label">{feat.label}</div>
                    <div className="welcome-feat-desc">{feat.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Skip hint */}
          <div className="welcome-skip">{t.welcome_skip}</div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          VAULT FORM CARD
          ════════════════════════════════════════════════════════ */}
      {welcomeDone && (
        <div className={`vault-card${cardVisible ? " vault-card-enter" : ""}`}>
          {/* Brand header */}
          <div className="vault-brand">
            <Image src="/brand/hammerlock-icon-192.png" alt="" width={16} height={16} style={{ borderRadius: 3 }} />
            <span>HammerLock AI</span>
          </div>

          {/* Animated lock/shield icon */}
          <div className={`vault-hero-icon ${mode === "create" ? "vault-hero-create" : ""}`}>
            {mode === "create" ? (
              <Shield size={36} strokeWidth={1.5} />
            ) : (
              <Lock size={36} strokeWidth={1.5} />
            )}
          </div>

          <h1>{mode === "create" ? t.vault_create_title : t.vault_unlock_title}</h1>
          <p className="vault-subtext">
            {mode === "create" ? t.vault_create_subtitle : t.vault_unlock_subtitle}
          </p>

          <div className="vault-form">
            <label>{t.vault_password}</label>
            <div className="vault-input-wrap">
              <input
                autoFocus
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(evt) => setPassword(evt.target.value)}
                onKeyDown={(evt) => {
                  if (evt.key === "Enter" && mode === "unlock") handleSubmit();
                }}
                className={error ? "error" : ""}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="vault-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t.vault_hide_password : t.vault_show_password}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {mode === "create" && password.length > 0 && (
              <>
                <div className="pw-strength">
                  <div className={`pw-strength-bar ${strength}`} />
                </div>
                <div className={`pw-strength-label ${strength}`}>
                  {strengthLabel}
                </div>
              </>
            )}

            {mode === "create" && (
              <>
                <label>{t.vault_confirm}</label>
                <div className="vault-input-wrap">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(evt) => setConfirmPassword(evt.target.value)}
                    onKeyDown={(evt) => {
                      if (evt.key === "Enter") handleSubmit();
                    }}
                    className={error ? "error" : ""}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="vault-toggle-pw"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? t.vault_hide_password : t.vault_show_password}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </>
            )}
            {error && <p className="vault-error">{error}</p>}
          </div>

          <button className="vault-submit" onClick={handleSubmit} disabled={loading || cooldownRemaining > 0}>
            {cooldownRemaining > 0
              ? t.vault_locked(Math.ceil(cooldownRemaining / 1000))
              : loading
                ? t.vault_processing
                : mode === "create"
                  ? t.vault_create_btn
                  : t.vault_unlock_btn}
          </button>

          {mode === "unlock" && (
            <button className="vault-reset" onClick={handleReset}>
              {t.vault_reset}
            </button>
          )}

          {/* Trust footer */}
          <div className="vault-trust">
            <span>{t.vault_trust_aes}</span>
            <span className="vault-trust-sep" />
            <span>{t.vault_trust_local}</span>
            <span className="vault-trust-sep" />
            <span>{t.vault_trust_zero}</span>
          </div>
        </div>
      )}
    </div>
  );
}
