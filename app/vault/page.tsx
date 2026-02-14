"use client";

import { Eye, EyeOff, Lock, Shield } from "lucide-react";
import { useVault } from "@/lib/vault-store";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useMemo, useState } from "react";
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
  const [mounted, setMounted] = useState(false);
  const attemptsRef = useRef(0);
  const mode: "create" | "unlock" = hasVault ? "unlock" : "create";

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const strengthLabel = strength === "weak" ? t.vault_weak : strength === "medium" ? t.vault_medium : t.vault_strong;

  useEffect(() => { setMounted(true); }, []);

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
          setError(`${(err as Error).message}. ${MAX_ATTEMPTS - attemptsRef.current} attempts remaining.`);
        }
      } else {
        setError((err as Error).message || "Unable to create vault.");
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
    <div className="vault-page">
      {/* Ambient animated rings */}
      <div className="vault-ambient">
        <div className="vault-ring vault-ring-1" />
        <div className="vault-ring vault-ring-2" />
        <div className="vault-ring vault-ring-3" />
      </div>

      <div className={`vault-card${mounted ? " vault-card-enter" : ""}`}>
        {/* Brand header */}
        <div className="vault-brand">
          <Lock size={14} />
          <span>VaultAI</span>
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
              aria-label={showPassword ? "Hide password" : "Show password"}
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
                  aria-label={showConfirm ? "Hide password" : "Show password"}
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
          <span>AES-256</span>
          <span className="vault-trust-sep" />
          <span>Local-Only</span>
          <span className="vault-trust-sep" />
          <span>Zero-Knowledge</span>
        </div>
      </div>
    </div>
  );
}
