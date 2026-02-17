"use client";

import { X, Settings, Bell, BellOff, RotateCcw } from "lucide-react";
import { useNudges } from "@/lib/use-nudges";

type SettingsPanelProps = {
  open: boolean;
  onClose: () => void;
};

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { isEnabled, setNudgesEnabled, resetNudges } = useNudges();

  if (!open) return null;

  return (
    <div className="onboarding-overlay" onClick={onClose}>
      <div
        className="onboarding-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 440 }}
        role="dialog"
        aria-label="Settings"
      >
        {/* Header */}
        <div className="onboarding-header">
          <Settings size={18} />
          <h3>Settings</h3>
          <button
            className="ghost-btn"
            onClick={onClose}
            aria-label="Close settings"
            style={{ padding: "4px 8px" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="settings-body">
          {/* ── Tips & Nudges ── */}
          <div className="settings-section">
            <div className="settings-section-title">Tips & Nudges</div>

            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">
                  {isEnabled ? (
                    <Bell size={14} style={{ color: "var(--accent)" }} />
                  ) : (
                    <BellOff size={14} style={{ color: "var(--text-muted)" }} />
                  )}
                  <span>Show helpful tips</span>
                </div>
                <div className="settings-row-desc">
                  Contextual suggestions, onboarding hints, and feature tips
                </div>
              </div>
              <label className="settings-toggle" aria-label="Toggle helpful tips">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setNudgesEnabled(e.target.checked)}
                />
                <span className="settings-toggle-track">
                  <span className="settings-toggle-thumb" />
                </span>
              </label>
            </div>

            {!isEnabled && (
              <button
                className="settings-restore-btn"
                onClick={async () => {
                  await resetNudges();
                }}
              >
                <RotateCcw size={12} />
                Restore all tips & reset dismissed nudges
              </button>
            )}
          </div>

          {/* Room for future settings sections */}
          <div className="settings-section">
            <div className="settings-section-title">About</div>
            <div className="settings-row-desc" style={{ padding: "0 0 8px" }}>
              HammerLock AI — encrypted, local-first AI assistant.
              <br />
              All data stays on your device.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
