"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import type { NudgeDef } from "@/lib/use-nudges";

type NudgeToastProps = {
  nudge: NudgeDef;
  /** Called when the user clicks the X or swipes away */
  onDismiss: () => void;
  /** Called when the user clicks "Don't show again" */
  onDismissPermanent: () => void;
  /** Called when the user clicks "Turn off all tips" */
  onDisableAll: () => void;
  /** Called when the user clicks a CTA (sends a command) */
  onCta?: (command: string) => void;
  /** Auto-dismiss after ms (0 = no auto-dismiss, default 8000) */
  autoHideMs?: number;
};

export default function NudgeToast({
  nudge,
  onDismiss,
  onDismissPermanent,
  onDisableAll,
  onCta,
  autoHideMs = 8000,
}: NudgeToastProps) {
  const [exiting, setExiting] = useState(false);

  const animateOut = useCallback(
    (cb: () => void) => {
      setExiting(true);
      setTimeout(cb, 280); // match CSS exit animation
    },
    []
  );

  // Auto-dismiss timer
  useEffect(() => {
    if (autoHideMs <= 0) return;
    const timer = setTimeout(() => animateOut(onDismiss), autoHideMs);
    return () => clearTimeout(timer);
  }, [autoHideMs, animateOut, onDismiss]);

  return (
    <div
      className={`nudge-toast ${exiting ? "nudge-exit" : ""}`}
      role="alert"
      aria-live="polite"
      aria-label="Helpful tip"
    >
      <div className="nudge-body">
        {nudge.icon && <span className="nudge-icon">{nudge.icon}</span>}
        <span className="nudge-message">{nudge.message}</span>
        <button
          className="nudge-close"
          onClick={() => animateOut(onDismiss)}
          aria-label="Dismiss tip"
        >
          <X size={14} />
        </button>
      </div>

      {/* CTA row */}
      {nudge.ctaLabel && nudge.ctaCommand && onCta && (
        <button
          className="nudge-cta"
          onClick={() => {
            onCta(nudge.ctaCommand!);
            animateOut(onDismiss);
          }}
        >
          {nudge.ctaLabel}
        </button>
      )}

      {/* Opt-out links */}
      <div className="nudge-opt-out">
        <button
          className="nudge-link"
          onClick={() => animateOut(onDismissPermanent)}
        >
          Don&apos;t show this again
        </button>
        <span className="nudge-sep">|</span>
        <button className="nudge-link" onClick={() => animateOut(onDisableAll)}>
          Turn off tips
        </button>
      </div>
    </div>
  );
}
