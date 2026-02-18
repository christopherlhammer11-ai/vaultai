"use client";

import { Key, Shield, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";

const REMOTE_API = "https://hammerlockai.com";

export default function ActivatePage() {
  const router = useRouter();
  const [keyParts, setKeyParts] = useState(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handlePartChange = useCallback(
    (index: number, value: string) => {
      // Only allow valid characters, auto-uppercase
      const cleaned = value
        .toUpperCase()
        .replace(/[^23456789A-HJ-NP-Z]/g, "")
        .slice(0, 4);
      const next = [...keyParts];
      next[index] = cleaned;
      setKeyParts(next);
      setError(null);

      // Auto-advance to next input when 4 chars entered
      if (cleaned.length === 4 && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [keyParts]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      // Backspace on empty field → go to previous
      if (e.key === "Backspace" && keyParts[index] === "" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [keyParts]
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim().toUpperCase();

    // Try to parse HL-XXXX-XXXX-XXXX-XXXX format
    const match = pasted.match(
      /^(?:HL-)?([23456789A-HJ-NP-Z]{4})-?([23456789A-HJ-NP-Z]{4})-?([23456789A-HJ-NP-Z]{4})-?([23456789A-HJ-NP-Z]{4})$/
    );
    if (match) {
      setKeyParts([match[1], match[2], match[3], match[4]]);
      setError(null);
      inputRefs.current[3]?.focus();
    }
  }, []);

  const fullKey = `HL-${keyParts.join("-")}`;
  const isComplete = keyParts.every((p) => p.length === 4);

  const handleActivate = useCallback(async () => {
    if (!isComplete) return;
    setError(null);
    setLoading(true);

    try {
      // 1. Get device ID from local API
      const deviceRes = await fetch("/api/license/device-id");
      if (!deviceRes.ok) throw new Error("Failed to get device ID");
      const { deviceId, deviceName } = await deviceRes.json();

      // 2. Activate against remote server
      const activateRes = await fetch(`${REMOTE_API}/api/license/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: fullKey, deviceId, deviceName }),
      });

      const data = await activateRes.json();

      if (!activateRes.ok) {
        setError(data.error || "Activation failed");
        setLoading(false);
        return;
      }

      // 3. Cache the license locally
      await fetch("/api/license/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseKey: fullKey,
          tier: data.tier,
          billingType: data.billingType,
          currentPeriodEnd: data.currentPeriodEnd,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd,
          activatedAt: data.activatedAt,
          validatedAt: new Date().toISOString(),
          deviceId,
        }),
      });

      // 4. Navigate to vault
      router.push("/vault");
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes("fetch")
          ? "Cannot reach activation server. Check your internet connection."
          : (err as Error).message || "Activation failed"
      );
      setLoading(false);
    }
  }, [isComplete, fullKey, router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Logo / Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "rgba(0, 255, 136, 0.1)",
            border: "1px solid rgba(0, 255, 136, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <Key size={28} style={{ color: "var(--accent)" }} />
        </div>

        <h1 style={{ fontSize: "1.6rem", marginBottom: 8, letterSpacing: "-0.02em" }}>
          Activate HammerLock AI
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 32, lineHeight: 1.6 }}>
          Enter your license key to unlock your plan. You received this key after purchasing on{" "}
          <a
            href="https://hammerlockai.com/#pricing"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            hammerlockai.com
          </a>
          .
        </p>

        {/* License Key Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-jetbrains)",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--text-muted)",
            }}
          >
            HL
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: "1.2rem" }}>-</span>
          {keyParts.map((part, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                value={part}
                onChange={(e) => handlePartChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                maxLength={4}
                style={{
                  width: 72,
                  textAlign: "center",
                  fontFamily: "var(--font-jetbrains)",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  padding: "12px 8px",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${error ? "var(--danger)" : "var(--border-color)"}`,
                  background: "var(--bg-card)",
                  color: "var(--accent)",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = error
                    ? "var(--danger)"
                    : "var(--border-color)";
                }}
              />
              {i < 3 && (
                <span style={{ color: "var(--text-muted)", fontSize: "1.2rem" }}>-</span>
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "10px 16px",
              background: "var(--danger-bg)",
              border: "1px solid rgba(255, 82, 82, 0.3)",
              borderRadius: "var(--radius-sm)",
              color: "var(--danger-muted)",
              fontSize: "0.8rem",
              marginTop: 16,
            }}
          >
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Activate Button */}
        <button
          onClick={handleActivate}
          disabled={!isComplete || loading}
          style={{
            width: "100%",
            padding: "14px",
            marginTop: 24,
            borderRadius: "var(--radius-md)",
            border: "none",
            background: isComplete ? "var(--accent)" : "var(--border-color)",
            color: isComplete ? "#000" : "var(--text-muted)",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: isComplete && !loading ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.15s ease",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <>
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              Activating...
            </>
          ) : (
            <>
              <Shield size={18} />
              Activate License
            </>
          )}
        </button>

        {/* Continue Free */}
        <button
          onClick={() => router.push("/vault")}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: 12,
            borderRadius: "var(--radius-md)",
            border: `1px solid var(--border-color)`,
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: "0.85rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "all 0.15s ease",
          }}
        >
          Continue with Free tier
          <ArrowRight size={14} />
        </button>

        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.72rem",
            marginTop: 24,
            lineHeight: 1.5,
          }}
        >
          Don&apos;t have a key?{" "}
          <a
            href="https://hammerlockai.com/#pricing"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            Purchase a plan
          </a>{" "}
          to get one. Free tier includes local AI with Ollama.
        </p>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
