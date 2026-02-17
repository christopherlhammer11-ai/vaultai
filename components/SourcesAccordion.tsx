"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { SourceRef } from "@/lib/vault-store";

type SourcesAccordionProps = {
  sources: SourceRef[];
  summary?: string;
};

export default function SourcesAccordion({ sources, summary }: SourcesAccordionProps) {
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(() => setExpanded((prev) => !prev), []);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="sources-accordion" role="region" aria-label="Sources">
      <button
        className={`sources-header ${expanded ? "sources-expanded" : ""}`}
        onClick={toggle}
        aria-expanded={expanded}
        aria-controls="sources-list"
      >
        <span className="sources-label">
          <strong>Sources</strong>
          <span className="sources-count">({sources.length})</span>
          {summary && <span className="sources-summary">&mdash; {summary}</span>}
        </span>
        <ChevronDown
          size={14}
          className={`sources-chevron ${expanded ? "sources-chevron-up" : ""}`}
        />
      </button>

      {expanded && (
        <ol className="sources-list" id="sources-list">
          {sources.map((src, i) => (
            <li key={i} className="sources-item">
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="sources-link"
              >
                <span className="sources-title">{src.title}</span>
                <span className="sources-meta">
                  <span className="sources-domain">{src.domain}</span>
                  {src.age && <span className="sources-age">{src.age}</span>}
                  <ExternalLink size={10} className="sources-ext-icon" />
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
