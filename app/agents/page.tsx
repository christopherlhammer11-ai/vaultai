"use client";

import Link from "next/link";

const agentGuides = [
  {
    name: "Strategist",
    emoji: "\uD83C\uDFAF",
    color: "#ff6b35",
    who: "Founders, CEOs, business development leads",
    what: "Competitive analysis, go-to-market planning, M&A due diligence, investor deck feedback",
    tips: [
      "Start by describing your business in 2-3 sentences \u2014 the Strategist will remember this context for the whole conversation",
      "Ask it to challenge your assumptions: \"What am I missing in this go-to-market plan?\"",
      "Use it for framework-driven analysis: \"Run a SWOT on my current position\" or \"Map my competitive landscape\"",
      "Upload competitor pitch decks as PDFs and ask for a comparative analysis",
    ],
    example: "\"I'm launching a B2B SaaS for compliance teams in fintech. Help me map the competitive landscape and find the gaps.\"",
  },
  {
    name: "Counsel",
    emoji: "\u2696\uFE0F",
    color: "#4a9eff",
    who: "Legal professionals, compliance officers, founders navigating regulations",
    what: "Regulatory research, contract review, compliance memos, risk assessment",
    tips: [
      "Always specify the jurisdiction: \"Under California law...\" or \"Per EU GDPR requirements...\"",
      "Upload contracts as PDFs and ask: \"Flag any unusual clauses or missing protections\"",
      "Use it for research, not advice \u2014 it will always remind you to consult a licensed attorney",
      "Ask for IRAC format when you want structured legal analysis (Issue, Rule, Analysis, Conclusion)",
    ],
    example: "\"Review this vendor agreement and flag any one-sided terms, missing IP protections, or liability concerns.\"",
  },
  {
    name: "Analyst",
    emoji: "\uD83D\uDCC8",
    color: "#22d3ee",
    who: "Financial advisors, portfolio managers, founders doing fundraising math",
    what: "Financial modeling, scenario analysis (bull/base/bear), earnings digests, market sizing",
    tips: [
      "Give it numbers first \u2014 the Analyst works best when you provide specific data points",
      "Ask for structured scenarios: \"Build a bull/base/bear case for this acquisition\"",
      "Use it for quick market sizing: \"What's the TAM/SAM/SOM for [industry] in [region]?\"",
      "Combine with web search: \"Search latest Q4 earnings for [company] and summarize the key takeaways\"",
    ],
    example: "\"I'm raising a Series A at $15M pre. Our ARR is $1.2M growing 15% MoM. Help me build the financial model for the pitch.\"",
  },
  {
    name: "Researcher",
    emoji: "\uD83D\uDCDA",
    color: "#a78bfa",
    who: "Enterprise analysts, academics, anyone doing deep-dive research",
    what: "Literature review, evidence synthesis, source evaluation, structured reports",
    tips: [
      "Be specific about scope: \"Research the last 3 years of studies on [topic]\" vs. \"Tell me about [topic]\"",
      "Ask it to evaluate source quality: \"How credible is this? What's the methodology?\"",
      "Use web search + Researcher together for real-time research with academic rigor",
      "Request structured outputs: \"Give me background, methodology, findings, analysis, and limitations\"",
    ],
    example: "\"Search for recent studies on employee retention in remote-first companies. Synthesize the findings and note any conflicting evidence.\"",
  },
  {
    name: "Operator",
    emoji: "\uD83D\uDD27",
    color: "#f59e0b",
    who: "Project managers, ops leads, founders wearing many hats",
    what: "Task breakdown, SOP creation, status tracking, process optimization",
    tips: [
      "Start with the outcome: \"I need to launch [X] by [date]. Break it down for me.\"",
      "Use it as a daily standup partner: \"Here's what I did today, what should I focus on tomorrow?\"",
      "Ask for SOPs when you find yourself repeating a process: \"Create an SOP for our onboarding flow\"",
      "Have it prioritize: \"I have 12 tasks. Help me rank them P0/P1/P2.\"",
    ],
    example: "\"I'm shipping a product update next Friday. Here's what's left: [list]. Help me prioritize and create a day-by-day execution plan.\"",
  },
  {
    name: "Writer",
    emoji: "\u270D\uFE0F",
    color: "#ec4899",
    who: "Anyone who writes: founders, marketers, executives, content creators",
    what: "Emails, proposals, blog posts, executive summaries, editing and refinement",
    tips: [
      "Always state the audience: \"This is for our investors\" vs. \"This is for our engineering team\"",
      "Ask for drafts first, then iterate: \"Draft v1, then I'll give you feedback\"",
      "Use it for editing: paste your text and ask \"Make this sharper and cut it by 30%\"",
      "Specify tone: \"Write this like a CEO update \u2014 confident but not arrogant\"",
    ],
    example: "\"Draft a cold email to a potential enterprise customer. We sell compliance automation for fintech. Keep it under 150 words and end with a clear CTA.\"",
  },
];

export default function AgentsPage() {
  return (
    <div className="page-wrapper" style={{ padding: "0 20px", maxWidth: 900, margin: "0 auto" }}>
      <nav className="site-nav" style={{ justifyContent: "space-between" }}>
        <Link href="/" className="logo-mark" style={{ textDecoration: "none", color: "inherit" }}>{"\uD83D\uDD12"} HammerLock AI</Link>
        <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 4 }}>
          &larr; Back
        </Link>
      </nav>

      <main style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div className="badge" style={{ marginBottom: 16 }}>
          <span className="badge-dot" /> AGENT GUIDE
        </div>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, lineHeight: 1.15, marginBottom: 12 }}>
          <span className="gradient">Built-in Agents.</span><br />
          Your team, inside the vault.
        </h1>
        <p style={{ fontSize: "1.05rem", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 640, marginBottom: 48 }}>
          HammerLock AI comes with 6 specialized agents, each trained for a specific domain.
          Switch between them anytime. Your conversations stay encrypted regardless of which agent you use.
        </p>

        {/* Quick start */}
        <div style={{
          background: "var(--bg-card, #0a0a0a)", border: "1px solid var(--border-color, #1a1a1a)",
          borderRadius: 12, padding: 24, marginBottom: 48,
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 12, color: "var(--accent)" }}>Quick Start</h2>
          <ol style={{ margin: 0, paddingLeft: 20, color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "0.9rem" }}>
            <li>Open the <strong style={{ color: "var(--text-primary)" }}>Agents</strong> tab in the sidebar (next to Commands)</li>
            <li>Click any agent to activate it &mdash; you&apos;ll see the agent name in the top bar</li>
            <li>The agent&apos;s quick commands appear in the Commands tab and in the empty state</li>
            <li>Switch agents anytime &mdash; your conversation history stays, only the AI&apos;s behavior changes</li>
            <li>Create your own agents with the <strong style={{ color: "var(--text-primary)" }}>+ Create Custom Agent</strong> button</li>
          </ol>
        </div>

        {/* Agent guides */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {agentGuides.map(agent => (
            <div
              key={agent.name}
              style={{
                background: "var(--bg-card, #0a0a0a)", border: `1px solid ${agent.color}22`,
                borderRadius: 12, padding: 24, position: "relative", overflow: "hidden",
              }}
            >
              <div style={{
                position: "absolute", top: 0, left: 0, width: 4, height: "100%",
                background: agent.color, borderRadius: "12px 0 0 12px",
              }} />
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: agent.color, marginBottom: 4 }}>
                <span style={{ marginRight: 8 }}>{agent.emoji}</span>{agent.name}
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 16 }}>
                Best for: {agent.who}
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
                <strong style={{ color: "var(--text-primary)" }}>What it does:</strong> {agent.what}
              </p>

              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Tips for best results
                </h4>
                <ul style={{ margin: 0, paddingLeft: 16, color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.7 }}>
                  {agent.tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>

              <div style={{
                background: "var(--bg-tertiary, #111)", borderRadius: 8, padding: "12px 16px",
                fontSize: "0.85rem", color: "var(--text-secondary)", fontStyle: "italic",
              }}>
                <span style={{ color: agent.color, marginRight: 4 }}>&rsaquo;</span>
                <strong style={{ color: "var(--text-primary)", fontStyle: "normal" }}>Try:</strong> {agent.example}
              </div>
            </div>
          ))}
        </div>

        {/* Custom agents section */}
        <div style={{
          background: "var(--bg-card, #0a0a0a)", border: "1px solid var(--border-color, #1a1a1a)",
          borderRadius: 12, padding: 24, marginTop: 48,
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 12, color: "var(--accent)" }}>Custom Agents</h2>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
            Need something specific? Build your own agent in 30 seconds:
          </p>
          <ol style={{ margin: 0, paddingLeft: 20, color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "0.9rem" }}>
            <li>Go to <strong style={{ color: "var(--text-primary)" }}>Agents</strong> tab in sidebar</li>
            <li>Click <strong style={{ color: "var(--text-primary)" }}>+ Create Custom Agent</strong></li>
            <li>Give it a name, describe its expertise, and set a personality</li>
            <li>Choose an icon and color</li>
            <li>Your agent is saved to your encrypted vault and persists across sessions</li>
          </ol>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 16 }}>
            Examples: Deal Reviewer for M&amp;A, Content Calendar Manager, Technical Interviewer, Product Spec Writer, Customer Support Trainer
          </p>
        </div>

        {/* Pro tips */}
        <div style={{
          background: "var(--bg-card, #0a0a0a)", border: "1px solid var(--border-color, #1a1a1a)",
          borderRadius: 12, padding: 24, marginTop: 24,
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 12, color: "var(--accent)" }}>Pro Tips</h2>
          <ul style={{ margin: 0, paddingLeft: 16, color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.8 }}>
            <li><strong style={{ color: "var(--text-primary)" }}>Combine agents with web search:</strong> Ask the Researcher to &quot;search for [topic] and synthesize findings&quot; for real-time research with academic rigor</li>
            <li><strong style={{ color: "var(--text-primary)" }}>PDF + Agent:</strong> Upload a contract to Counsel, an earnings report to Analyst, or a competitor deck to Strategist</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Persona stacks with agents:</strong> Your persona context is shared across all agents, so they know your background and preferences</li>
            <li><strong style={{ color: "var(--text-primary)" }}>Switch mid-conversation:</strong> Start with Researcher for data gathering, switch to Writer for the final report</li>
            <li><strong style={{ color: "var(--text-primary)" }}>All agents are private:</strong> Custom agent definitions are encrypted in your vault. Nobody sees your specialized workflows.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
