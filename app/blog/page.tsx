"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/* ── Article data ── */
const ARTICLES = [
  {
    id: "a1",
    num: "01",
    pillar: "Philosophy & History",
    title: "The Code That Changed Everything: A Brief History of Open Source and Why It Still Matters",
    readTime: "12 min read",
    lede: "Open source wasn\u2019t born in Silicon Valley boardrooms. It was born from the radical idea that knowledge \u2014 especially code \u2014 should be free to inspect, modify, and share. That idea turned out to be one of the most consequential in the history of technology.",
    teamResponse: [
      "This history isn\u2019t background. It\u2019s the reason HammerLockAI exists. The enclosure pattern the article describes \u2014 open commons, proprietary capture, open source resistance \u2014 is playing out in real time with AI. We\u2019re at the exact inflection point where the open source response is mature enough to be genuinely competitive with the closed systems.",
      "When we forked OpenClaw and built HammerLockAI on local-first architecture, we were making a bet that the open source AI ecosystem \u2014 Ollama, LLaMA, Mistral, Gemma \u2014 would reach parity with cloud models for professional use cases. That bet has paid off.",
      "The four freedoms Stallman articulated in 1983 apply directly to AI: you should be able to run it as you wish, study how it works, and modify it. HammerLockAI is built to deliver all four. That\u2019s not a feature. It\u2019s a philosophy that happens to produce better software.",
    ],
    teamCta: "Try HammerLockAI Free",
  },
  {
    id: "a2",
    num: "02",
    pillar: "Open Source AI Models",
    title: "Ollama, LLaMA, Mistral, Gemma: Your 2026 Field Guide to Local AI Models",
    readTime: "15 min read",
    lede: "The local AI ecosystem has matured faster than almost anyone predicted. In 2026, running a frontier-capable model on your own hardware isn\u2019t a hobbyist experiment \u2014 it\u2019s a legitimate professional choice. Here\u2019s the landscape as it actually stands.",
    teamResponse: [
      "We\u2019ve run all of these models in production environments inside HammerLockAI, and the field guide above is accurate \u2014 but we want to add the integration layer that most guides skip.",
      "HammerLockAI\u2019s Ollama integration is designed so model switching is seamless. You don\u2019t reconfigure the application \u2014 you swap the model in settings and the rest of the stack adapts. The same AES-256-GCM encryption wraps every conversation regardless of which model you\u2019re running.",
      "In practice, most users settle on one primary model for their workflow within the first week and rarely switch. The choice matters, but not as much as the architecture underneath it. That part is built to last regardless of which direction the model ecosystem moves.",
    ],
    teamCta: "See Model Integration Docs",
  },
  {
    id: "a3",
    num: "03",
    pillar: "Why Open Source Wins",
    title: "Why Open Source Always Wins \u2014 And What Closed Systems Are Hiding From You",
    readTime: "11 min read",
    lede: "The pattern repeats across every major technology category: proprietary systems capture the early market, open source catches up, and then the proprietary players either open up or become irrelevant. AI is not an exception to this pattern. It\u2019s the latest example of it.",
    teamResponse: [
      "The article frames a macro argument. Here\u2019s the micro version: every business that runs professional AI workflows on cloud models is accumulating a liability that will become visible at the worst possible time \u2014 when the vendor changes terms, gets acquired, or simply decides your tier isn\u2019t worth the infrastructure cost.",
      "HammerLockAI is built on the open source AI stack specifically because we believe the inspection advantage, the innovation surface, and the absence of lock-in aren\u2019t just philosophical goods \u2014 they\u2019re durable competitive advantages for the businesses that understand them early.",
      "The history says open source wins. We built a product to make it easy to be on the right side of that outcome before it\u2019s obvious.",
    ],
    teamCta: "See How We\u2019re Built",
  },
  {
    id: "a4",
    num: "04",
    pillar: "Open Source + Privacy",
    title: "Open Source and Privacy Are the Same Fight \u2014 Here\u2019s Why They Always Win Together",
    readTime: "13 min read",
    lede: "Privacy and open source are often treated as separate conversations. One is about what you share. The other is about how software is built. But at their foundations, they\u2019re fighting the same battle \u2014 against the same adversary, using the same weapons.",
    teamResponse: [
      "The article\u2019s distinction between architecture and policy is worth underlining twice. Every privacy policy is a legal document describing intent. Intent can change. Architecture doesn\u2019t change unless you change the code, and with open source, you can see when that happens.",
      "HammerLockAI\u2019s AES-256-GCM implementation is open to inspection. The PBKDF2 key derivation is standard and documented. The Ollama integration is local-only \u2014 there is no code path that routes a query to an external server.",
      "That\u2019s the only kind of privacy guarantee worth anything. Everything else is a promise from a party with interests that aren\u2019t perfectly aligned with yours. Architecture is neutral. Math is neutral. We build on both.",
    ],
    teamCta: "Read Our Security Architecture",
  },
  {
    id: "a5",
    num: "05",
    pillar: "Business Case",
    title: "The Business Case for Open Source Infrastructure: Build on What You Can Inspect",
    readTime: "14 min read",
    lede: "Twenty-five years of watching industries get disrupted teaches you one thing clearly: the businesses that get caught flat-footed are almost always the ones that trusted systems they couldn\u2019t inspect. The open source infrastructure argument isn\u2019t philosophical. It\u2019s actuarial.",
    teamResponse: [
      "The payment processor that pulled out with 48 hours notice. The banking relationship that ended because the federal picture shifted. The software vendor who decided they didn\u2019t want cannabis revenue on their books anymore and gave us 30 days. These aren\u2019t hypotheticals.",
      "The AI version of this is coming for every industry, not just cannabis. The regulations are moving fast, the vendors are making bets, and the businesses that built their workflows on cloud AI systems they don\u2019t control are going to face renegotiations they didn\u2019t plan for.",
      "HammerLockAI exists because we\u2019ve lived that lesson enough times to build the tool we wish we\u2019d had. Local, encrypted, open \u2014 on terms you control. That\u2019s not a feature list. That\u2019s a philosophy about what sustainable business infrastructure looks like.",
    ],
    teamCta: "Start with HammerLockAI",
  },
];

/* ── How-To Guides ── */
const GUIDES = [
  {
    id: "g1",
    num: "01",
    pillar: "Getting Started",
    title: "Install Ollama & Run Your First Local AI Model in 5 Minutes",
    readTime: "5 min read",
    lede: "Everything you need to go from zero to a working local AI on your machine. No cloud accounts, no API keys, no data leaving your device.",
  },
  {
    id: "g2",
    num: "02",
    pillar: "API Keys",
    title: "How to Set Up API Keys for OpenAI, Anthropic, Gemini & More",
    readTime: "4 min read",
    lede: "Want to use cloud models alongside your local setup? Here\u2019s how to add API keys for every provider HammerLockAI supports \u2014 and when you\u2019d want to.",
  },
  {
    id: "g3",
    num: "03",
    pillar: "Agents",
    title: "Meet Your 11 Agents: What Each One Does and When to Use Them",
    readTime: "7 min read",
    lede: "HammerLockAI ships with 11 specialized agents. Each one has a distinct personality, skill set, and use case. Here\u2019s the complete field guide.",
  },
  {
    id: "g4",
    num: "04",
    pillar: "Personas",
    title: "Create a Persona File: Teach HammerLock Who You Are",
    readTime: "4 min read",
    lede: "A persona file gives the AI context about you, your business, your preferences \u2014 so every response is tailored without you repeating yourself.",
  },
  {
    id: "g5",
    num: "05",
    pillar: "Voice & PDF",
    title: "Voice Input, PDF Upload, and Report Generation: A Walkthrough",
    readTime: "6 min read",
    lede: "Talk to your AI, upload documents for analysis, and generate formatted reports \u2014 all locally encrypted, all on your hardware.",
  },
  {
    id: "g6",
    num: "06",
    pillar: "Security",
    title: "How HammerLock Encrypts Your Data: AES-256-GCM Explained Simply",
    readTime: "5 min read",
    lede: "What actually happens to your conversations and files when HammerLockAI encrypts them. No jargon, just the architecture.",
  },
];

/* ── Agent Setup Series ── */
const SERIES = [
  {
    id: "s1",
    num: "01",
    pillar: "Foundation",
    title: "What Is an AI Agent? A Plain English Guide for People Who\u2019ve Never Used One",
    readTime: "8 min read",
    lede: "You\u2019ve heard the word \u201cagent\u201d thrown around in AI conversations and probably nodded along. This article explains what it actually means \u2014 in plain language, with no assumed knowledge \u2014 and why it changes how you can work.",
    teamResponseName: "Pitchbot",
    teamResponseRole: "Product Vision & Market Positioning",
    teamResponse: [
      "The colleague analogy in this article is the clearest way we\u2019ve found to explain the shift. A chatbot answers questions. An agent completes tasks. That distinction is everything.",
      "When we designed HammerLockAI, we built it around the agent model from day one. Every one of our 11 agents follows the plan-act-observe-adjust loop described above. The architecture isn\u2019t a bolt-on &mdash; it\u2019s the foundation.",
      "The market is moving toward agents fast. The businesses that understand the difference now will have a structural advantage over the ones that figure it out later. This article is the on-ramp.",
    ],
    teamCta: "Try HammerLockAI Free",
  },
  {
    id: "s2",
    num: "02",
    pillar: "Setup",
    title: "Setting Up HammerLockAI for the First Time: Your Complete Installation Walkthrough",
    readTime: "10 min read",
    lede: "This is the article you follow with a browser tab open on one side and your installer on the other. By the end you\u2019ll have HammerLockAI running, configured, and ready to connect to Ollama. No steps skipped.",
    teamResponseName: "Vaultie",
    teamResponseRole: "Lead Developer",
    teamResponse: [
      "The PBKDF2 key derivation with 100,000 iterations isn\u2019t security theater. It\u2019s the same approach used by password managers like 1Password and Bitwarden. The vault password never touches disk in plaintext &mdash; ever.",
      "There is no password recovery by design. We don\u2019t have your password. We can\u2019t reset it. We can\u2019t decrypt your data. That\u2019s not a limitation &mdash; it\u2019s the architecture working as intended.",
      "The privacy settings in Step 3 are defaults we chose deliberately. PII scrubbing is on by default because most users want it. Network Isolation is off by default because most users want Ollama connected. Every default is reversible.",
    ],
    teamCta: "Download HammerLockAI",
  },
  {
    id: "s3",
    num: "03",
    pillar: "Infrastructure",
    title: "Installing and Configuring Ollama: The Engine Behind Your Local AI",
    readTime: "9 min read",
    lede: "Ollama downloads, manages, and runs AI models on your machine. It\u2019s the reason running local AI went from a specialist exercise to something anyone can do. Here\u2019s how to get it running in under ten minutes.",
    teamResponseName: "Vaultie",
    teamResponseRole: "Lead Developer",
    teamResponse: [
      "Ollama is the single best piece of infrastructure in the local AI ecosystem right now. It turned model management from a painful manual process into something anyone can do with one command.",
      "HammerLockAI connects to Ollama\u2019s local API on port 11434. Once Ollama is running, HammerLockAI detects it automatically. No configuration file editing, no environment variables, no port forwarding.",
      "The system is fully offline after the initial model download. That\u2019s the entire privacy argument in one sentence. Download once, disconnect if you want to, and everything still works.",
    ],
    teamCta: "See Integration Docs",
  },
  {
    id: "s4",
    num: "04",
    pillar: "Models",
    title: "Choosing Your First Local Model: A Beginner\u2019s Decision Guide",
    readTime: "10 min read",
    lede: "The model is the brain of your agent. Choosing the right one for your hardware and your work isn\u2019t complicated \u2014 but there are a few things worth understanding before you commit.",
    teamResponseName: "Vaultie",
    teamResponseRole: "Lead Developer",
    teamResponse: [
      "The hardware-to-model table in this article came from real usage data across our beta cohort. The recommendations aren\u2019t theoretical \u2014 they\u2019re what actually runs well on each tier of hardware.",
      "Most users end up on LLaMA 3.1 8B. It\u2019s the best all-rounder for the widest range of hardware. If you\u2019re not sure, start there. You can always swap later without losing any data.",
      "Quantization is the single most important concept for local AI performance. The difference between Q4 and Q8 on constrained hardware is the difference between usable and unusable. This article explains it correctly.",
    ],
    teamCta: "See Model Recommendations",
  },
  {
    id: "s5",
    num: "05",
    pillar: "First Workflow",
    title: "Building Your First Agent Workflow Inside HammerLockAI",
    readTime: "12 min read",
    lede: "You\u2019ve installed HammerLockAI, set up Ollama, and chosen a model. Now you\u2019re going to build an actual agent workflow that does real work \u2014 step by step, with a concrete example you can follow exactly.",
    teamResponseName: "The User",
    teamResponseRole: "Community Voice",
    teamResponse: [
      "The Research Summarizer workflow described in this article is the single most-used custom agent in our community. It\u2019s simple, practical, and it works on day one.",
      "What surprised us was how many users modified the system prompt within the first week. The article\u2019s advice about iteration is spot-on \u2014 your first prompt is a draft, not a final product.",
      "The memory settings section is underrated. Persistent context across sessions is what turns a chatbot into something that actually knows your work. Don\u2019t skip it.",
    ],
    teamCta: "Try It Yourself",
  },
  {
    id: "s6",
    num: "06",
    pillar: "Advanced",
    title: "Multi-Agent Setups in HammerLock: How to Build a Team of AI That Works for You",
    readTime: "13 min read",
    lede: "One agent is useful. Multiple specialized agents working in sequence are transformative. This article introduces multi-agent architecture inside HammerLockAI \u2014 what it is, when it matters, and how to build your first pipeline.",
    teamResponseName: "Vaultie",
    teamResponseRole: "Lead Developer",
    teamResponse: [
      "Multi-agent architecture is where the OpenClaw framework we forked really shines. The pipeline pattern described in this article is native to the platform \u2014 it\u2019s not a workaround or a hack.",
      "The three patterns \u2014 Pipeline, Panel, Loop \u2014 cover about 90% of real-world multi-agent use cases. Most users start with Pipeline and never need the others. But they\u2019re there when you do.",
      "The content pipeline example (Researcher &rarr; Drafter &rarr; Editor) is running in production for several of our early users. One user reported it cut their blog production time from 4 hours to 45 minutes.",
    ],
    teamCta: "Explore Multi-Agent Docs",
  },
  {
    id: "s7",
    num: "07",
    pillar: "Integration",
    title: "Connecting Your Documents and Files to Your Agent",
    readTime: "11 min read",
    lede: "An agent without access to your documents is like a brilliant assistant who\u2019s never been shown the filing cabinet. This article covers how to connect your files to HammerLockAI \u2014 from quick drag-and-drop to persistent encrypted document vaults.",
    teamResponseName: "The User",
    teamResponseRole: "Community Voice",
    teamResponse: [
      "The Document Vault feature is the one that convinced me to switch from cloud AI. Knowing that my client files are AES-256-GCM encrypted and never leave my machine changed the risk calculation entirely.",
      "Folder Watch is the sleeper feature. I pointed it at my project folder and now my agent always has current context. No uploading, no manual syncing. It just works.",
      "The supported formats list keeps growing. When HammerLockAI added .docx and .xlsx parsing, it eliminated the last reason I had to use a cloud tool for document analysis.",
    ],
    teamCta: "See Document Features",
  },
  {
    id: "s8",
    num: "08",
    pillar: "Privacy & Use Cases",
    title: "Privacy First: PII Scrubbing, Encryption Settings & Real-World Use Cases",
    readTime: "14 min read",
    lede: "You\u2019ve set up your system. Now let\u2019s make sure the privacy architecture is configured correctly for your use case \u2014 and look at what professionals in law, research, writing, and analysis are actually doing with HammerLockAI every day.",
    teamResponseName: "Locksmith",
    teamResponseRole: "Security & Encryption",
    teamResponse: [
      "The four-layer privacy stack described in this article isn\u2019t marketing. It\u2019s the actual architecture. PII scrubbing, AES-256-GCM encryption, local execution, and vault isolation each address a different threat vector.",
      "Network Isolation Mode is the feature that gets the most attention from security-conscious users. When it\u2019s enabled, the application physically cannot make outbound network requests. That\u2019s not a policy \u2014 it\u2019s a code path that doesn\u2019t exist.",
      "The use cases in this article are drawn from real users. The attorney who processes client intake documents, the researcher who analyzes proprietary datasets, the writer who iterates on drafts \u2014 these are people using HammerLockAI in production, every day, with confidence.",
    ],
    teamCta: "Read Our Security Architecture",
  },
];

const GUIDE_BODIES: Record<string, React.ReactNode> = {
  g1: (
    <>
      <h2>Step 1: Install Ollama</h2>
      <p>Head to <strong>ollama.com</strong> and download the installer for your platform. On Mac, it&apos;s a single .dmg file. On Linux, one command in your terminal.</p>
      <div className="blog-callout">
        <strong>Mac</strong>
        Download the .dmg from ollama.com, drag to Applications, and open it. Ollama runs in the background as a menubar app.
      </div>
      <div className="blog-callout">
        <strong>Linux</strong>
        Run: <code>curl -fsSL https://ollama.com/install.sh | sh</code>
      </div>

      <h2>Step 2: Pull a Model</h2>
      <p>Open your terminal and run:</p>
      <div className="blog-callout">
        <strong>Command</strong>
        <code>ollama pull llama3.1</code> &mdash; This downloads the LLaMA 3.1 8B model (~4.7 GB). It&apos;s the best all-rounder for most tasks.
      </div>
      <p>Other popular models you can try:</p>
      <p><code>ollama pull mistral</code> &mdash; Fast and efficient, great for constrained hardware.</p>
      <p><code>ollama pull gemma2</code> &mdash; Strong instruction following for agent workflows.</p>
      <p><code>ollama pull phi3</code> &mdash; Tiny but capable, runs on almost anything.</p>

      <h2>Step 3: Test It</h2>
      <p>Run <code>ollama run llama3.1</code> in your terminal. Type a question. If you get a response, you&apos;re set. Quit with <code>/bye</code>.</p>

      <h2>Step 4: Connect to HammerLockAI</h2>
      <p>Open HammerLockAI. It automatically detects Ollama running on your machine. Go to the chat, type <code>status</code>, and you should see <strong>Ollama: connected</strong> with a green indicator.</p>
      <p>That&apos;s it. You now have a fully private, locally-running AI assistant. No accounts, no API keys, no data leaving your device.</p>
    </>
  ),
  g2: (
    <>
      <h2>Why Use API Keys?</h2>
      <p>HammerLockAI works completely offline with Ollama. But if you want access to cloud models like GPT-4o, Claude, or Gemini alongside your local setup, you can add API keys. The app will use them as fallbacks or when you specifically request a cloud model.</p>
      <p>Your API keys are stored locally in your <code>~/.hammerlock/.env</code> file, encrypted at rest. They never leave your machine except to authenticate with the provider.</p>

      <h2>OpenAI (GPT-4o, GPT-4 Turbo)</h2>
      <div className="blog-callout">
        <strong>Steps</strong>
        1. Go to platform.openai.com &rarr; API Keys &rarr; Create new secret key. 2. Copy the key (starts with <code>sk-</code>). 3. In HammerLockAI, open Settings &rarr; paste in the OpenAI API Key field.
      </div>

      <h2>Anthropic (Claude)</h2>
      <div className="blog-callout">
        <strong>Steps</strong>
        1. Go to console.anthropic.com &rarr; API Keys &rarr; Create Key. 2. Copy the key (starts with <code>sk-ant-</code>). 3. Paste in Settings &rarr; Anthropic API Key.
      </div>

      <h2>Google Gemini</h2>
      <div className="blog-callout">
        <strong>Steps</strong>
        1. Go to aistudio.google.com &rarr; Get API Key. 2. Copy the key. 3. Paste in Settings &rarr; Gemini API Key.
      </div>

      <h2>Groq, Mistral, DeepSeek</h2>
      <p>Same pattern: create an account on the provider&apos;s platform, generate an API key, paste it into the corresponding field in HammerLockAI settings. All providers are optional &mdash; add as many or as few as you want.</p>

      <h2>Brave Search</h2>
      <p>For web search capabilities, you&apos;ll need a Brave Search API key. Get one at <strong>brave.com/search/api</strong> (free tier available). This powers the @researcher agent&apos;s live web search.</p>
    </>
  ),
  g3: (
    <>
      <h2>How Agents Work</h2>
      <p>Each agent is a specialized personality with its own system prompt, expertise area, and communication style. You can switch agents using the sidebar, or mention them inline with <code>@agent-name</code> in the chat input.</p>

      <h2>The 11 Agents</h2>

      <h3>General</h3>
      <p>Your default all-purpose assistant. Good at everything, specialized in nothing. Use this when you don&apos;t need a specific expert.</p>

      <h3>Strategist</h3>
      <p>Business strategy and planning. Thinks in frameworks, market positioning, competitive analysis. Ask it to evaluate a business plan, identify risks, or build a go-to-market strategy.</p>

      <h3>Counsel</h3>
      <p>Legal analysis and compliance. Reviews contracts, identifies red flags, explains regulations. Not a lawyer &mdash; but a fast first pass that saves you hours before you talk to one.</p>

      <h3>Analyst</h3>
      <p>Financial modeling and data analysis. Give it numbers and it&apos;ll find patterns. Revenue projections, unit economics, market sizing &mdash; this is your spreadsheet brain.</p>

      <h3>Researcher</h3>
      <p>Deep research with live web search (requires Brave API key). Finds sources, synthesizes information, cites everything. Use for market research, competitive intel, or fact-checking.</p>

      <h3>Operator</h3>
      <p>Operations and project management. SOPs, process optimization, vendor evaluation, team workflows. The agent that thinks about how things actually get done.</p>

      <h3>Writer</h3>
      <p>Content creation and copywriting. Blog posts, emails, marketing copy, social media. Adapts tone based on your persona file.</p>

      <h3>Coach</h3>
      <p>Health and wellness. Workout plans, meal prep, habit building, sleep optimization. Supportive but realistic &mdash; no bro-science.</p>

      <h3>Money</h3>
      <p>Personal finance. Budgeting, debt payoff strategies, savings goals, tax prep basics. Judgment-free, practical, and private.</p>

      <h3>Content</h3>
      <p>Social media and content creation. Captions, hooks, content calendars, platform-specific strategy for Instagram, TikTok, LinkedIn, X, and YouTube.</p>

      <h3>Director</h3>
      <p>Video marketing. Scripts, shot lists, product demo walkthroughs, voiceover writing. Thinks like a filmmaker, talks like a marketer.</p>

      <div className="blog-callout">
        <strong>Pro Tip</strong>
        Type <code>@</code> in the chat input to open the agent picker. Start typing an agent name to filter. Press Enter to select. The agent stays active for that conversation until you switch.
      </div>
    </>
  ),
  g4: (
    <>
      <h2>What&apos;s a Persona File?</h2>
      <p>A persona file is a text document that tells HammerLockAI who you are. Your name, your role, your company, your preferences, your communication style. Every agent reads it before responding, so the AI tailors its output to you without you having to repeat context.</p>

      <h2>Creating Your Persona</h2>
      <p>In the chat, type: <code>create my persona</code></p>
      <p>The AI will walk you through a series of questions and generate a persona file saved to <code>~/.hammerlock/persona.md</code>. You can edit it anytime.</p>

      <h2>What to Include</h2>
      <div className="blog-callout">
        <strong>Recommended Sections</strong>
        <strong>Identity:</strong> Name, title, company, industry. <strong>Context:</strong> What you&apos;re working on, your team size, your stage (startup, growth, enterprise). <strong>Preferences:</strong> Communication style (brief vs. detailed), formatting preferences, tone. <strong>Goals:</strong> What you&apos;re optimizing for right now. <strong>Constraints:</strong> Regulations, budget limits, tech stack requirements.
      </div>

      <h2>Example</h2>
      <p>A solo founder&apos;s persona might be: &ldquo;I&apos;m Sarah, CEO of a 5-person fintech startup. We&apos;re pre-Series A, focused on B2B payments. I prefer concise answers with actionable next steps. I&apos;m technical but time-constrained. Our stack is Next.js + PostgreSQL.&rdquo;</p>
      <p>That single paragraph transforms every agent&apos;s output from generic to specific. The Strategist knows your stage. The Counsel knows your industry. The Writer knows your tone.</p>

      <h2>Updating It</h2>
      <p>Say <code>update my persona</code> anytime to add new context. The file is append-friendly &mdash; add sections as your situation evolves.</p>
    </>
  ),
  g5: (
    <>
      <h2>Voice Input</h2>
      <p>Click the microphone icon in the chat input bar (or use the keyboard shortcut). Speak your message &mdash; it&apos;s transcribed locally and sent to the active agent. Requires the Pro tier or higher.</p>
      <div className="blog-callout">
        <strong>Tips for Voice</strong>
        Speak naturally &mdash; the transcription handles conversational speech well. Pause briefly between thoughts for better punctuation. Works in all 11 languages the app supports.
      </div>

      <h2>Voice Output</h2>
      <p>Enable text-to-speech in Settings to have the AI read its responses aloud. Useful for hands-free workflows or accessibility. The voice is generated locally &mdash; no audio leaves your device.</p>

      <h2>PDF Upload</h2>
      <p>Drag a PDF into the chat or click the attachment icon. The document is parsed locally and the text is available to the AI for analysis. Works on all tiers &mdash; PDF upload is free for everyone.</p>
      <p>Try prompts like:</p>
      <p>&ldquo;Summarize this contract and flag any unusual clauses.&rdquo;</p>
      <p>&ldquo;Extract all financial figures from this report.&rdquo;</p>
      <p>&ldquo;Compare this NDA to standard market terms.&rdquo;</p>

      <h2>Report Generation</h2>
      <p>Ask any agent to generate a report and it will create a formatted document you can export. Say: <code>generate a competitive analysis report on [topic]</code></p>
      <p>Reports include headers, sections, and structured formatting. Export as PDF from the share menu. Available on Pro tier and above.</p>
    </>
  ),
  g6: (
    <>
      <h2>The Short Version</h2>
      <p>Every conversation, file, and persona in HammerLockAI is encrypted with AES-256-GCM before it touches your disk. The encryption key is derived from your vault password using PBKDF2 with 100,000 iterations. No one &mdash; including us &mdash; can read your data without your password.</p>

      <h2>What Gets Encrypted</h2>
      <div className="blog-callout">
        <strong>Everything.</strong>
        Chat history. Uploaded documents. Persona files. Agent configurations. Vault contents. The encryption is applied at the application layer before anything is written to storage.
      </div>

      <h2>How AES-256-GCM Works</h2>
      <p><strong>AES-256</strong> is the encryption standard used by governments and financial institutions worldwide. The &ldquo;256&rdquo; refers to the key size in bits &mdash; making brute-force attacks computationally infeasible.</p>
      <p><strong>GCM</strong> (Galois/Counter Mode) adds authenticated encryption &mdash; meaning it not only encrypts the data but also verifies that it hasn&apos;t been tampered with. If even one bit changes, decryption fails.</p>

      <h2>Key Derivation</h2>
      <p>Your vault password is never stored directly. It&apos;s run through PBKDF2 (Password-Based Key Derivation Function 2) with a random salt and 100,000 iterations to produce the encryption key. This makes dictionary attacks and rainbow table attacks impractical.</p>

      <h2>What&apos;s NOT Encrypted</h2>
      <p>Your API keys in <code>~/.hammerlock/.env</code> are stored in plaintext (they need to be readable by the app to make API calls). Keep your system account secure and your disk encrypted at the OS level for full protection.</p>

      <h2>Local-Only Architecture</h2>
      <p>The encryption matters because the data stays on your machine. There&apos;s no server to breach, no cloud backup to subpoena, no third-party database that could leak. The attack surface is your device and only your device. Encrypt the device, lock the vault, and the data is as secure as anything in commercial software.</p>
    </>
  ),
};

/* ── Article body content ── */
const ARTICLE_BODIES: Record<string, React.ReactNode> = {
  a1: (
    <>
      <p>Before there was open source, there was just software. And software, in the early days of computing, was something people shared freely. Researchers at universities and national labs passed code around the way academics shared papers. The idea that software could be proprietary, owned, locked behind a license, was the invention that came later.</p>
      <p>The story of how we got from that original spirit of sharing to today&apos;s trillion-dollar intellectual property regime &mdash; and then back again through open source &mdash; is one of the defining narratives of the digital age.</p>
      <h2>The Enclosure of the Digital Commons</h2>
      <p>In the 1950s and 60s, IBM and other hardware companies gave away software with their machines. Software wasn&apos;t the product. Hardware was. Code was documentation. Users modified it, improved it, and sent fixes back.</p>
      <p>The shift began in 1969 when the U.S. Department of Justice brought an antitrust case against IBM, forcing the company to separate its software pricing from its hardware pricing. Software became a standalone product &mdash; and standalone products could be owned.</p>
      <p>By the late 1970s and early 80s, proprietary software was the norm. The digital commons was being enclosed, field by field.</p>
      <h2>Richard Stallman&apos;s Moral Argument</h2>
      <p>In 1983, a programmer at MIT named Richard Stallman launched the GNU Project and articulated a philosophy: software freedom as a fundamental right. His four freedoms became the founding document of the movement.</p>
      <div className="blog-callout">
        <strong>The Four Freedoms</strong>
        Freedom 0: Run the program as you wish. Freedom 1: Study the source code and change it. Freedom 2: Redistribute copies. Freedom 3: Distribute your modified versions. Every open source license that matters is built on these four pillars.
      </div>
      <h2>Linus, Linux, and the Cathedral vs. the Bazaar</h2>
      <p>In 1991, Linus Torvalds announced a small hobby project: a free operating system kernel. He called it Linux. Linux became the testbed for a new model of development &mdash; the bazaar model where thousands of contributors worked openly and in public.</p>
      <p>The key insight: with enough eyeballs, all bugs are shallow. The math is brutal and the proprietary world has never recovered from it.</p>
      <h2>The Enterprise Awakening</h2>
      <p>Apache powered the web servers. Linux ran the machines. The backbone of the commercial internet was built on code that anyone could read, modify, and redistribute. The enterprise world didn&apos;t plan this. It just happened to be true.</p>
      <h2>The AI Frontier</h2>
      <p>Every technology cycle produces a new enclosure movement. The current one is artificial intelligence. The open source response is already underway. Meta&apos;s LLaMA models, Mistral&apos;s releases, the Ollama ecosystem &mdash; these are the GNU Project of the AI age.</p>
      <p>History suggests this argument wins. It always has.</p>
      <h2>Why It Still Matters</h2>
      <p>The philosophy of open source isn&apos;t nostalgia. It&apos;s a framework for thinking clearly about power &mdash; who has it, who grants it, and who can take it away. That distinction matters enormously when the tool in question is an AI system processing your most sensitive professional communications.</p>
    </>
  ),
  a2: (
    <>
      <p>Two years ago, the choice between local and cloud AI was really a choice between capability and privacy. That tradeoff has largely collapsed. The open source model ecosystem has caught up to the point where for most real professional workloads, a well-chosen local model is indistinguishable from its cloud counterpart.</p>
      <h2>The Infrastructure Layer: Ollama</h2>
      <p>Before models, there is Ollama. It handles model downloading, versioning, and serving &mdash; think of it as Docker for language models. One command to pull a model. One command to run it. A local API endpoint that any application can call.</p>
      <div className="blog-callout">
        <strong>Getting Started with Ollama</strong>
        Install with a single command. Pull any model with <code>ollama pull [model-name]</code>. Run interactively with <code>ollama run [model-name]</code>. HammerLockAI handles all of this automatically &mdash; you pick the model, we handle the rest.
      </div>
      <h2>LLaMA: Meta&apos;s Open Weight Bet</h2>
      <p>Meta&apos;s LLaMA series changed the trajectory of open source AI. The 8B parameter version runs comfortably on modern consumer hardware with 8GB VRAM. LLaMA is the generalist&apos;s choice &mdash; strong across writing, analysis, coding, and conversation.</p>
      <h2>Mistral: The European Challenger</h2>
      <p>Paris-based Mistral AI produces models that consistently punch above their weight class. The Mixtral series uses a mixture-of-experts architecture that delivers near-70B quality at 7B inference costs. For professionals running constrained hardware, Mistral&apos;s family is often the right call.</p>
      <h2>Gemma: Google&apos;s Contribution to the Commons</h2>
      <p>Gemma 2 shows strong performance on reasoning benchmarks and is notably good at following complex, multi-step instructions &mdash; which matters enormously for agent-based workflows.</p>
      <h2>Phi: Microsoft&apos;s Small Model Research</h2>
      <p>Phi-3 and its successors are 3.8B parameter models that perform remarkably well on reasoning tasks. Phi models run on hardware that most other competitive models can&apos;t touch &mdash; a phone, a Raspberry Pi 5, a laptop without a discrete GPU.</p>
      <h2>How to Choose</h2>
      <p>Start with LLaMA 3.1 8B as your baseline. If you&apos;re hardware-constrained, try Mistral 7B. If you need strong instruction following for agent pipelines, evaluate Gemma 2. If you need edge deployment, look at Phi-3.</p>
      <p>All of them run on Ollama. All of them integrate with HammerLockAI. None of them send your data anywhere.</p>
    </>
  ),
  a3: (
    <>
      <p>There is a case to be made that closed, proprietary systems win in technology. They capture early-mover advantage. In the short run, this case is often correct. In the long run, it is almost never correct. The reasons are structural, not accidental.</p>
      <h2>The Inspection Advantage</h2>
      <p>When the source code is open, every bug is a public problem. The result is a form of distributed quality assurance that no proprietary team can replicate. The inspection advantage compounds over time. Proprietary systems accumulate hidden technical debt. Open systems accumulate inspectors.</p>
      <h2>The Innovation Surface</h2>
      <p>Closed systems innovate from the inside. Open systems innovate from everywhere. Linux is used in more contexts than any proprietary operating system ever built &mdash; from the International Space Station to the Android phone in your pocket &mdash; precisely because anyone could adapt it.</p>
      <h2>The Lock-In Trap</h2>
      <p>Your data is in their format. Your workflows depend on their API. Your team is trained on their interface. Switching costs accumulate until the cost of leaving exceeds the cost of staying.</p>
      <div className="blog-callout">
        <strong>The Hidden Cost of Proprietary Lock-In</strong>
        Every time a cloud AI provider changes their pricing, updates their ToS, or deprecates a model, every business built on that provider faces an unplanned migration. Open source infrastructure evolves on terms you can inspect and influence.
      </div>
      <h2>What Closed Systems Are Hiding</h2>
      <p>First, their failure modes. Second, their training data. Third, their business model&apos;s relationship to your data. When you send queries to a proprietary AI, you are feeding a system whose improvement depends on that data.</p>
      <h2>The Current AI Moment</h2>
      <p>Open source doesn&apos;t always win because it&apos;s philosophically correct. It wins because the structural advantages compound over time until they become insurmountable. The philosophy is the reason people build it. The economics are the reason it wins.</p>
    </>
  ),
  a4: (
    <>
      <p>The connection between open source software and privacy isn&apos;t obvious at first. Open source means your code is visible to anyone. Privacy means your data is visible to no one. In practice, they are deeply complementary.</p>
      <h2>The Trust Problem in Software</h2>
      <p>When you use any piece of software, you are extending trust. With proprietary software, that trust is blind. Open source software doesn&apos;t eliminate these risks. But it transforms them. Claims about what the software does can be verified. Trust can be earned through inspection.</p>
      <h2>Encryption You Can Verify</h2>
      <p>Modern cryptography is entirely an open source achievement. AES, RSA, elliptic curve cryptography &mdash; are all publicly defined, publicly analyzed, and publicly implemented. The security doesn&apos;t come from secrecy. It comes from the mathematical properties of the algorithms.</p>
      <div className="blog-callout">
        <strong>Architecture vs. Policy</strong>
        A privacy policy is a legal commitment. Architecture is a physical constraint. &ldquo;We won&apos;t share your data&rdquo; is a promise. &ldquo;The software is incapable of sharing your data because it never has access to a server&rdquo; is a fact. Open source local software offers the second kind of privacy guarantee.
      </div>
      <h2>The AI Convergence</h2>
      <p>AI systems process information at a level of intimacy that previous software never approached. The queries you send to an AI reveal your thinking, your concerns, your strategy, your knowledge gaps, and your intentions.</p>
      <p>Local open source AI resolves this structurally. When the model runs on your hardware, the queries never leave. When the code is open, you can verify that. When the encryption uses open standards, you can verify even that. The three layers of protection compound into a privacy guarantee no cloud system can match.</p>
      <h2>The Political Dimension</h2>
      <p>Privacy and open source share another deep connection: they are both responses to concentration of power. Open source and privacy are tools for restoring symmetry. The fight for inspectable software and the fight for personal data sovereignty are the same fight.</p>
    </>
  ),
  a5: (
    <>
      <p>Twenty-five years in industries that operate at the margins of the mainstream teaches a healthy skepticism of any system you don&apos;t control. When someone says a system is reliable and trustworthy, the first question is: reliable on whose terms?</p>
      <h2>The Total Cost of Dependency</h2>
      <p>The first invisible cost is migration risk. The second is pricing power &mdash; a vendor with low switching costs can raise prices to the point just below where migration becomes worthwhile. The third is existential risk. Vendors get acquired. APIs get deprecated. Products get sunsetted.</p>
      <h2>The Inspection Premium</h2>
      <p>In regulated industries, the ability to demonstrate compliance requires describing exactly what your systems do. With proprietary software, this is difficult. With open source running locally, it&apos;s straightforward.</p>
      <div className="blog-callout">
        <strong>The Compliance Advantage</strong>
        When a regulator asks &ldquo;what does your AI system do with client data?&rdquo; you have two possible answers. One requires a vendor to provide documentation you can&apos;t verify. The other requires you to point at code you&apos;ve reviewed yourself. In a compliance context, the second answer is always stronger.
      </div>
      <h2>The Cannabis Industry as Case Study</h2>
      <p>No industry illustrates infrastructure dependency risk more clearly than cannabis. Federal illegality creates a permanent compliance overhang. Banking access, payment processing, accounting software &mdash; all have been disrupted for cannabis operators by policy changes. The businesses that navigated these disruptions best were the ones who owned their infrastructure.</p>
      <h2>Building for Longevity</h2>
      <p>The Linux kernel is 33 years old and running on more devices than any operating system in history. These systems outlasted every proprietary competitor not because they were better-marketed, but because the communities that maintained them had incentives aligned with long-term health rather than quarterly revenue targets.</p>
      <h2>The Practical Implementation</h2>
      <p>Running local AI on open source models is no longer a specialist exercise. Ollama handles model management. Tools like HammerLockAI handle the application layer. The decision has simplified to a single question: do you want to own your AI infrastructure, or rent it?</p>
    </>
  ),
};

/* ── Series body content ── */
const SERIES_BODIES: Record<string, React.ReactNode> = {
  s1: (
    <>
      <p>If you&apos;ve used ChatGPT, Claude, or Gemini, you&apos;ve used a chatbot. You type a question, it gives you an answer. That&apos;s a passive interaction &mdash; you ask, it responds, and then it waits for you to ask again.</p>
      <p>An AI agent is fundamentally different. An agent doesn&apos;t just answer questions. It completes tasks. It can plan a sequence of steps, execute them, observe the results, and adjust its approach &mdash; all without you holding its hand through every decision.</p>

      <h2>The Simplest Possible Analogy</h2>
      <p>Think of the difference between asking a colleague a question and giving a colleague a task.</p>
      <p><strong>Question:</strong> &ldquo;What are the key points in this contract?&rdquo; &mdash; The colleague reads the contract and tells you the key points. Done.</p>
      <p><strong>Task:</strong> &ldquo;Review all five contracts from this vendor, flag anything unusual, compare the terms to our standard agreement, and write me a summary I can send to legal.&rdquo; &mdash; The colleague plans how to approach this, works through each contract, keeps track of findings, and produces a deliverable.</p>
      <p>A chatbot handles the question. An agent handles the task.</p>

      <div className="blog-step-block">
        <div className="blog-step-label">A Simple Example</div>
        <p>Imagine you have 50 contract PDFs in a folder. You need to know which ones contain non-standard indemnification clauses.</p>
        <p>With a chatbot, you&apos;d upload each PDF one at a time, ask the same question 50 times, and compile the results yourself.</p>
        <p>With an agent, you point it at the folder and say: &ldquo;Review every contract in this folder. Flag any non-standard indemnification clauses. Give me a table with the contract name, the clause, and why it&apos;s non-standard.&rdquo; The agent reads each document, applies the criteria, tracks its progress, and delivers the result.</p>
      </div>

      <h2>What Makes a Local Agent Different</h2>
      <p>Most AI agents you&apos;ve heard about run in the cloud. Your data goes to someone else&apos;s server, gets processed there, and the results come back. A local agent runs on your machine. Your data never leaves.</p>
      <blockquote className="blog-pull-quote">
        The question isn&apos;t whether AI is useful. It&apos;s where the AI does its thinking. A local agent thinks on your hardware, with your data, under your control.
      </blockquote>
      <p>This isn&apos;t a minor technical distinction. If you work with client data, financial records, legal documents, medical information, or anything sensitive, where the processing happens is a compliance question, a liability question, and an ethical question.</p>

      <h2>How Agents Think</h2>
      <p>Every agent follows a loop, whether it&apos;s built by OpenAI, Anthropic, or running locally on your machine:</p>
      <p><strong>1. Plan</strong> &mdash; Break the task into steps.</p>
      <p><strong>2. Act</strong> &mdash; Execute the first step.</p>
      <p><strong>3. Observe</strong> &mdash; Look at the result.</p>
      <p><strong>4. Adjust</strong> &mdash; Modify the plan based on what happened.</p>
      <p>This loop repeats until the task is complete. It&apos;s the same basic pattern humans use when working through any complex task. The difference is that the agent can execute it faster, more consistently, and without forgetting context between steps.</p>

      <h2>Why This Is the Right Moment to Start</h2>
      <p>Two things have changed in the last year that make local agents genuinely practical for non-technical users:</p>
      <p><strong>Models got small enough.</strong> You no longer need a $10,000 GPU to run a useful AI model. Models like LLaMA 3.1 8B and Mistral 7B run comfortably on a laptop with 16GB of RAM.</p>
      <p><strong>Tools got simple enough.</strong> Ollama made model management a one-command operation. HammerLockAI wrapped the entire experience in an interface that doesn&apos;t require terminal commands, configuration files, or any technical background.</p>
      <p>The gap between &ldquo;I&apos;ve heard about AI agents&rdquo; and &ldquo;I have one running on my laptop&rdquo; has closed. This series walks you across it.</p>
    </>
  ),
  s2: (
    <>
      <h2>Before You Start</h2>
      <p>Make sure your system meets the minimum requirements:</p>
      <table className="blog-hw-table">
        <thead>
          <tr>
            <th>Requirement</th>
            <th>Minimum</th>
            <th>Recommended</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>OS</td>
            <td>macOS 12+, Windows 10+, Ubuntu 20.04+</td>
            <td>macOS 14+, Windows 11</td>
          </tr>
          <tr>
            <td>RAM</td>
            <td>8 GB</td>
            <td>16 GB or more</td>
          </tr>
          <tr>
            <td>Storage</td>
            <td>5 GB free</td>
            <td>20 GB free (for models)</td>
          </tr>
          <tr>
            <td>GPU</td>
            <td>Not required</td>
            <td>Any GPU with 6+ GB VRAM</td>
          </tr>
          <tr>
            <td>Internet</td>
            <td>Required for download only</td>
            <td>Not needed after setup</td>
          </tr>
        </tbody>
      </table>

      <h2>Step 1: Download and Install</h2>
      <p>Go to <strong>hammerlockai.com/get-app</strong> and download the installer for your operating system. The file is under 100 MB.</p>
      <p><strong>macOS:</strong> Open the .dmg file, drag HammerLockAI to your Applications folder, and launch it.</p>
      <p><strong>Windows:</strong> Run the .exe installer and follow the prompts. Default installation path is fine.</p>
      <p><strong>Linux:</strong> Download the .AppImage, make it executable, and run it.</p>
      <div className="blog-callout">
        <strong>macOS First Launch</strong>
        On first launch, macOS may warn you that the app is from an unidentified developer. Go to System Settings &rarr; Privacy &amp; Security and click &ldquo;Open Anyway.&rdquo; This only happens once.
      </div>

      <h2>Step 2: Create Your Vault</h2>
      <p>When HammerLockAI opens for the first time, it asks you to create a vault. A vault is an encrypted container for all your conversations, documents, and agent configurations.</p>
      <p>Choose a strong password. This password is used to derive your encryption key via <strong>PBKDF2 with 100,000 iterations</strong>. The password itself is never stored &mdash; only the derived key is used to encrypt and decrypt your data.</p>
      <div className="blog-warning">
        <strong>Important:</strong> There is no password recovery. If you forget your vault password, your data cannot be recovered. This is by design &mdash; it means no one (including the HammerLockAI team) can access your data.
      </div>

      <h2>Step 3: Configure Privacy Settings</h2>
      <p>After creating your vault, you&apos;ll see the Privacy Settings panel. Three settings matter here:</p>
      <p><strong>PII Scrubbing (default: ON)</strong> &mdash; Automatically detects and redacts personally identifiable information before it reaches the AI model. Names, emails, phone numbers, SSNs, and more are replaced with placeholders.</p>
      <p><strong>Conversation Encryption (default: ON)</strong> &mdash; Every conversation is encrypted with AES-256-GCM before it&apos;s written to disk. This is separate from vault encryption and provides an additional layer.</p>
      <p><strong>Network Isolation (default: OFF)</strong> &mdash; When enabled, the app cannot make any outbound network requests. All AI processing must happen via Ollama on your local machine. Turn this on if you want absolute certainty that nothing leaves your device.</p>

      <h2>Step 4: Connect to Ollama</h2>
      <p>If you already have Ollama installed and running, HammerLockAI will detect it automatically. You&apos;ll see a green status indicator in the bottom-left corner.</p>
      <p>If you don&apos;t have Ollama yet, the next article in this series covers installation. For now, you can verify the connection by opening the chat and typing:</p>
      <div className="blog-code-block">
        <div className="blog-code-label">Chat Command</div>
        <code>status</code>
      </div>
      <p>You should see <strong>Ollama: connected</strong> with the model name and version. If it says &ldquo;not detected,&rdquo; make sure Ollama is running &mdash; check for the menubar icon (macOS) or run <code>ollama serve</code> in your terminal.</p>
      <p>That&apos;s it. HammerLockAI is installed, your vault is created, your privacy settings are configured, and you&apos;re ready to connect a model. The next article walks you through Ollama setup.</p>
    </>
  ),
  s3: (
    <>
      <h2>What Ollama Actually Does</h2>
      <p>Ollama is a local server that downloads, manages, and runs AI models on your machine. When HammerLockAI sends a prompt to a model, it&apos;s actually sending it to Ollama&apos;s API running on <code>localhost:11434</code>. Ollama handles the heavy lifting &mdash; loading the model into memory, running inference, and returning the response.</p>
      <p>Think of Ollama as the engine and HammerLockAI as the dashboard. You interact with the dashboard. The engine does the work.</p>

      <h2>Installation</h2>

      <h3>macOS</h3>
      <p>Download the installer from <strong>ollama.com</strong>. Open the .dmg file and drag Ollama to your Applications folder. Launch it &mdash; it runs as a menubar app in the background.</p>

      <h3>Windows</h3>
      <p>Download the Windows installer from <strong>ollama.com</strong>. Run the .exe and follow the setup wizard. Ollama will run as a system tray application.</p>

      <h3>Linux</h3>
      <p>Open a terminal and run:</p>
      <div className="blog-code-block">
        <div className="blog-code-label">Terminal</div>
        <code>curl -fsSL https://ollama.com/install.sh | sh</code>
      </div>
      <p>This installs Ollama and starts the service automatically.</p>

      <h2>Verify the Installation</h2>
      <p>Open a terminal (any platform) and run:</p>
      <div className="blog-code-block">
        <div className="blog-code-label">Terminal</div>
        <code>ollama --version</code>
      </div>
      <p>You should see a version number. If you get &ldquo;command not found,&rdquo; the installation didn&apos;t complete correctly &mdash; try restarting your terminal or reinstalling.</p>

      <h2>Pull Your First Model</h2>
      <p>Now download a model. We recommend starting with LLaMA 3.1 8B:</p>
      <div className="blog-code-block">
        <div className="blog-code-label">Terminal</div>
        <code>ollama pull llama3.1</code>
      </div>
      <p>This downloads approximately 4.7 GB. The download only happens once &mdash; after that, the model is stored locally and loads from disk.</p>

      <div className="blog-callout">
        <strong>Where Models Are Stored</strong>
        macOS: <code>~/.ollama/models</code>. Windows: <code>C:\Users\[you]\.ollama\models</code>. Linux: <code>~/.ollama/models</code>. Each model takes 2&ndash;8 GB depending on size and quantization. You can delete models you no longer need with <code>ollama rm [model-name]</code>.
      </div>

      <h2>Test the Model</h2>
      <p>Run the model interactively to make sure everything works:</p>
      <div className="blog-code-block">
        <div className="blog-code-label">Terminal</div>
        <code>ollama run llama3.1</code>
      </div>
      <p>Type a question. If you get a coherent response, Ollama is working correctly. Type <code>/bye</code> to exit.</p>

      <h2>Connect to HammerLockAI</h2>
      <p>With Ollama running, open HammerLockAI. The app automatically detects the local Ollama instance. You should see a green connection indicator. If you don&apos;t, make sure Ollama is running in the background (check your menubar or system tray).</p>
      <p>Ollama and HammerLockAI communicate entirely over localhost. No data ever leaves your machine. After the initial model download, you can disconnect from the internet entirely and everything continues to work.</p>
    </>
  ),
  s4: (
    <>
      <h2>The Most Common Mistake</h2>
      <p>The most common mistake new users make is downloading the biggest model they can find. Bigger is not always better in local AI. The right model is the one that runs well on your hardware and handles your specific tasks. A fast 7B model that responds in 2 seconds will always beat a sluggish 70B model that takes 45 seconds per response.</p>

      <h2>Hardware-to-Model Recommendations</h2>
      <table className="blog-hw-table">
        <thead>
          <tr>
            <th>Your Hardware</th>
            <th>Recommended Model</th>
            <th>Pull Command</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>8 GB RAM, no GPU</td>
            <td>Phi-3 Mini (3.8B)</td>
            <td><code>ollama pull phi3</code></td>
          </tr>
          <tr>
            <td>16 GB RAM, no GPU</td>
            <td>Mistral 7B or LLaMA 3.1 8B</td>
            <td><code>ollama pull mistral</code></td>
          </tr>
          <tr>
            <td>16 GB RAM, 6+ GB VRAM</td>
            <td>LLaMA 3.1 8B</td>
            <td><code>ollama pull llama3.1</code></td>
          </tr>
          <tr>
            <td>32 GB RAM, 8+ GB VRAM</td>
            <td>Mixtral 8x7B or LLaMA 3.1 70B (Q4)</td>
            <td><code>ollama pull mixtral</code></td>
          </tr>
          <tr>
            <td>64+ GB RAM, 24+ GB VRAM</td>
            <td>LLaMA 3.1 70B (Q8)</td>
            <td><code>ollama pull llama3.1:70b</code></td>
          </tr>
        </tbody>
      </table>

      <div className="blog-callout">
        <strong>What Is Quantization?</strong>
        Quantization reduces a model&apos;s precision to make it smaller and faster. <strong>Q4</strong> uses 4-bit precision &mdash; smallest and fastest, slight quality loss. <strong>Q5</strong> is a good middle ground. <strong>Q8</strong> is near-original quality but requires more RAM and VRAM. For most users, Q4 or Q5 is the right choice.
      </div>

      <h2>Model Families</h2>
      <p><strong>LLaMA 3.1 (Meta)</strong> &mdash; The best all-rounder. Strong at writing, analysis, coding, and conversation. The 8B version is the default recommendation for most users. Available in 8B, 70B, and 405B sizes.</p>
      <p><strong>Mistral 7B (Mistral AI)</strong> &mdash; Fast, efficient, and punches above its weight. Excellent for constrained hardware. The Mixtral 8x7B variant uses mixture-of-experts for near-70B quality at lower resource cost.</p>
      <p><strong>Phi-3 Mini (Microsoft)</strong> &mdash; A 3.8B model that performs surprisingly well on reasoning tasks. Runs on almost any hardware, including machines without a discrete GPU. Good for edge cases and lightweight deployments.</p>
      <p><strong>Gemma 2 (Google)</strong> &mdash; Strong instruction following and reasoning. Particularly good for agent workflows where the model needs to follow multi-step plans reliably.</p>

      <h2>How to Pull a Model</h2>
      <p>Every model is one command away. Open a terminal and run:</p>
      <div className="blog-code-block">
        <div className="blog-code-label">Terminal</div>
        <code>ollama pull llama3.1{"\n"}ollama pull mistral{"\n"}ollama pull phi3{"\n"}ollama pull gemma2</code>
      </div>
      <p>You can have multiple models installed simultaneously and switch between them in HammerLockAI&apos;s settings. Each model takes 2&ndash;8 GB of storage depending on size and quantization.</p>

      <h2>Our Recommendation</h2>
      <p>If you&apos;re reading this series in order and don&apos;t know which model to pick: start with <strong>LLaMA 3.1 8B</strong>. It works on the widest range of hardware, handles the widest range of tasks, and has the largest community for troubleshooting. You can always add more models later.</p>
    </>
  ),
  s5: (
    <>
      <h2>What We&apos;re Building</h2>
      <p>In this article, you&apos;re going to build a <strong>Research Summarizer</strong> &mdash; an agent that takes a topic, finds relevant information from your documents, and produces a structured summary with key findings, sources, and recommended next steps.</p>
      <p>This is a practical workflow that works immediately. Once you understand how it&apos;s built, you can modify it for any use case.</p>

      <h2>Understanding Agent Configuration</h2>
      <p>Every agent in HammerLockAI has four configurable components:</p>
      <p><strong>System Prompt</strong> &mdash; The instructions that define the agent&apos;s behavior, expertise, and output format.</p>
      <p><strong>Tools</strong> &mdash; The capabilities the agent can use (document search, web search, file operations).</p>
      <p><strong>Memory</strong> &mdash; How the agent retains context across conversations.</p>
      <p><strong>Model</strong> &mdash; Which AI model powers the agent (set in your global settings).</p>

      <h2>Step 1: Write Your System Prompt</h2>
      <p>Open HammerLockAI and go to <strong>Settings &rarr; Agents &rarr; Create New Agent</strong>. Give it the name &ldquo;Research Summarizer.&rdquo;</p>
      <p>In the System Prompt field, enter:</p>
      <div className="blog-code-block">
        <div className="blog-code-label">System Prompt</div>
        <code>You are a research summarizer. When given a topic:{"\n"}1. Search available documents for relevant information.{"\n"}2. Identify key findings, data points, and quotes.{"\n"}3. Organize findings into a structured summary.{"\n"}4. List all sources with page/section references.{"\n"}5. Suggest 3 follow-up questions for deeper research.{"\n"}{"\n"}Format: Use headers, bullet points, and bold text.{"\n"}Tone: Professional, concise, evidence-based.{"\n"}Length: 500-1000 words unless otherwise specified.</code>
      </div>

      <blockquote className="blog-pull-quote">
        A system prompt is not a suggestion. It&apos;s the operating manual the agent follows for every interaction. The more specific you are, the more consistent the output.
      </blockquote>

      <h2>Step 2: Configure Tools</h2>
      <p>Below the system prompt, you&apos;ll see the Tools panel. For the Research Summarizer, enable:</p>
      <p><strong>Document Search</strong> &mdash; Allows the agent to search your uploaded documents and vault contents.</p>
      <p><strong>Citation Generator</strong> &mdash; Automatically formats source references.</p>
      <p>Leave other tools (Web Search, File Operations) disabled for now. You can add them later.</p>

      <h2>Step 3: Configure Memory</h2>
      <p>Set memory to <strong>Persistent</strong>. This means the agent remembers previous research sessions. If you ask it to research &ldquo;market trends in renewable energy&rdquo; on Monday and &ldquo;solar panel manufacturers&rdquo; on Wednesday, it can connect the two topics automatically.</p>
      <p>If you prefer each session to start fresh, set memory to <strong>Session Only</strong>.</p>

      <h2>Step 4: Save and Run</h2>
      <div className="blog-step-block">
        <div className="blog-step-label">Test Your Agent</div>
        <p>1. Click <strong>Save Agent</strong>.</p>
        <p>2. Go to the chat and select your new Research Summarizer from the agent picker.</p>
        <p>3. Upload a document (or make sure you have documents in your vault).</p>
        <p>4. Type: &ldquo;Summarize the key findings related to [your topic] from my documents.&rdquo;</p>
        <p>5. Review the output. Is the format right? Is it finding the right information? Is the length appropriate?</p>
      </div>

      <h2>Iterating on Your Agent</h2>
      <p>Your first version will work. It won&apos;t be perfect. That&apos;s expected.</p>
      <p>Common adjustments after the first test:</p>
      <p><strong>Too verbose?</strong> Add &ldquo;Be concise. Maximum 3 sentences per finding.&rdquo; to the system prompt.</p>
      <p><strong>Missing context?</strong> Add &ldquo;Always include the document name and section where you found each finding.&rdquo;</p>
      <p><strong>Wrong tone?</strong> Adjust the Tone line in the system prompt. &ldquo;Casual and direct&rdquo; produces very different output than &ldquo;formal and analytical.&rdquo;</p>
      <p>Iteration is the process. The system prompt is a living document. Treat it that way.</p>
    </>
  ),
  s6: (
    <>
      <h2>Why Multiple Agents?</h2>
      <p>A single agent tries to do everything. Multiple specialized agents each do one thing well. The insight is the same one that makes teams more effective than individuals: specialization produces better results when the coordination cost is low enough.</p>
      <p>HammerLockAI makes the coordination cost effectively zero. You define the agents, define the sequence, and the platform handles the handoffs.</p>

      <h2>Three Patterns</h2>
      <p><strong>Pipeline</strong> &mdash; Agents run in sequence. Output from Agent A becomes input for Agent B. The most common pattern.</p>
      <p><strong>Panel</strong> &mdash; Multiple agents process the same input independently. You get parallel perspectives. Useful for analysis and review tasks.</p>
      <p><strong>Loop</strong> &mdash; An agent runs, evaluates its own output, and iterates until a quality threshold is met. Useful for drafting and refinement.</p>

      <h2>Building a Content Pipeline</h2>
      <p>Let&apos;s build the most popular multi-agent workflow: a content pipeline that takes a topic and produces a polished blog post.</p>

      <div className="blog-step-block">
        <div className="blog-step-label">Agent 1: Researcher</div>
        <p>Finds relevant information, data points, and sources on the given topic. Outputs a structured research brief with key facts, statistics, and quotes.</p>
        <p>System prompt emphasis: &ldquo;Find facts and data. Cite sources. Do not write prose &mdash; output a research brief.&rdquo;</p>
      </div>

      <div className="blog-step-block">
        <div className="blog-step-label">Agent 2: Drafter</div>
        <p>Takes the research brief and writes a full blog post draft. Follows your tone, style, and formatting preferences from your persona file.</p>
        <p>System prompt emphasis: &ldquo;Write a complete blog post using only the provided research. Match the user&apos;s tone and style.&rdquo;</p>
      </div>

      <div className="blog-step-block">
        <div className="blog-step-label">Agent 3: Editor</div>
        <p>Reviews the draft for clarity, accuracy, flow, and SEO. Makes specific revision suggestions and produces a final version.</p>
        <p>System prompt emphasis: &ldquo;Edit for clarity, accuracy, and engagement. Preserve the author&apos;s voice. Output the final version.&rdquo;</p>
      </div>

      <h2>Pipeline Configuration</h2>
      <p>In HammerLockAI, go to <strong>Settings &rarr; Workflows &rarr; Create Pipeline</strong>. Add your three agents in sequence:</p>
      <div className="blog-code-block">
        <div className="blog-code-label">Pipeline Configuration</div>
        <code>Pipeline: Content Production{"\n"}Step 1: Researcher &rarr; Output: Research Brief{"\n"}Step 2: Drafter &rarr; Input: Research Brief &rarr; Output: Draft{"\n"}Step 3: Editor &rarr; Input: Draft &rarr; Output: Final Post</code>
      </div>
      <p>Save the pipeline. Now when you type a topic in the chat with this pipeline active, all three agents run in sequence automatically. You get a researched, drafted, edited blog post from a single prompt.</p>

      <h2>When Multi-Agent Is Worth It</h2>
      <p>Not every task needs multiple agents. Here&apos;s the decision framework:</p>
      <p><strong>Use a single agent when:</strong> the task is straightforward, the output format is simple, and one pass is enough.</p>
      <p><strong>Use multiple agents when:</strong> the task has distinct phases (research, creation, review), different phases require different expertise, or quality improves with iteration.</p>
      <p>The content pipeline is the canonical example because it has all three properties. Other good candidates: contract review (extract &rarr; analyze &rarr; summarize), financial analysis (gather data &rarr; model &rarr; report), and competitive intelligence (research &rarr; compare &rarr; brief).</p>
    </>
  ),
  s7: (
    <>
      <h2>Three Ways to Connect Your Files</h2>
      <p>HammerLockAI gives you three methods for connecting documents, each suited to a different workflow:</p>
      <p><strong>Session Upload</strong> &mdash; Drag and drop files into the chat. They&apos;re available for that conversation only. Best for quick, one-off analysis.</p>
      <p><strong>Folder Watch</strong> &mdash; Point HammerLockAI at a folder on your machine. Any file added to that folder becomes available to your agents automatically. Best for ongoing projects.</p>
      <p><strong>Document Vault</strong> &mdash; Upload files to the encrypted vault. They persist across sessions, are searchable by all agents, and are protected by AES-256-GCM encryption. Best for sensitive or frequently-referenced documents.</p>

      <div className="blog-step-block">
        <div className="blog-step-label">Supported Formats</div>
        <p><strong>Documents:</strong> .pdf, .docx, .doc, .txt, .md, .rtf</p>
        <p><strong>Spreadsheets:</strong> .xlsx, .xls, .csv</p>
        <p><strong>Presentations:</strong> .pptx, .ppt</p>
        <p><strong>Code:</strong> .py, .js, .ts, .java, .go, .rs, .cpp, .h, and most common programming languages</p>
        <p><strong>Data:</strong> .json, .xml, .yaml, .toml</p>
      </div>

      <h2>Setting Up Folder Watch</h2>
      <p>Go to <strong>Settings &rarr; Documents &rarr; Folder Watch</strong>. Click &ldquo;Add Folder&rdquo; and select a directory on your machine.</p>
      <div className="blog-code-block">
        <div className="blog-code-label">Example Configuration</div>
        <code>Watch Folder: ~/Projects/client-alpha/docs{"\n"}Sync Frequency: On change (real-time){"\n"}Include Subdirectories: Yes{"\n"}File Types: All supported</code>
      </div>
      <p>Once configured, any file you add to that folder is automatically indexed and available to your agents. Remove a file from the folder and it&apos;s removed from the index.</p>

      <div className="blog-callout">
        <strong>How Document Search Works</strong>
        When you upload or watch documents, HammerLockAI creates a local vector database index. This means your agents don&apos;t just do keyword matching &mdash; they understand the semantic meaning of your documents and can find relevant passages even when the exact words don&apos;t match. The vector database runs entirely on your machine.
      </div>

      <h2>Using the Document Vault</h2>
      <p>The Document Vault is for files you want encrypted, persistent, and always available. Go to <strong>Vault &rarr; Documents &rarr; Add</strong>.</p>
      <p>Files in the vault are encrypted with AES-256-GCM using your vault password. They&apos;re indexed for semantic search and available to every agent across every conversation. This is where you put contracts, policies, reference material, and anything you consult regularly.</p>

      <h2>Privacy and Document Security</h2>
      <p>Regardless of which method you use, your documents never leave your machine. Session uploads are held in memory and discarded when the conversation ends. Folder Watch reads from your local filesystem. The Document Vault encrypts everything at rest.</p>
      <p>If you have PII Scrubbing enabled, it applies to document content before it reaches the model. Names, emails, phone numbers, and other identifiers are redacted in transit &mdash; the original files are never modified.</p>
    </>
  ),
  s8: (
    <>
      <h2>The Four-Layer Privacy Stack</h2>
      <p>HammerLockAI&apos;s privacy architecture isn&apos;t a single feature. It&apos;s four independent layers, each addressing a different threat vector. Even if one layer is disabled or compromised, the others continue to protect your data.</p>

      <h3>Layer 1: PII Scrubbing</h3>
      <p>Before your text reaches the AI model, the PII scrubber scans for personally identifiable information and replaces it with placeholders:</p>
      <div className="blog-code-block">
        <div className="blog-code-label">PII Scrubbing Example</div>
        <code>Input:  &quot;John Smith (john@acme.com) signed the NDA on 3/15/2026.&quot;{"\n"}Scrubbed: &quot;[NAME_1] ([EMAIL_1]) signed the NDA on [DATE_1].&quot;{"\n"}Output: The AI processes the scrubbed version.{"\n"}Display: Original PII is restored in the response for you.</code>
      </div>
      <p>The scrubber detects: names, email addresses, phone numbers, Social Security numbers, credit card numbers, addresses, dates of birth, and custom patterns you define.</p>

      <h3>Layer 2: AES-256-GCM Encryption</h3>
      <div className="blog-callout">
        <strong>Encryption at Rest</strong>
        Every conversation, document, and configuration file is encrypted with AES-256-GCM before it touches your disk. The encryption key is derived from your vault password via PBKDF2 with 100,000 iterations and a random salt. The password is never stored. The key is never written to disk. If someone copies your data files, they get ciphertext.
      </div>

      <h3>Layer 3: Local Execution</h3>
      <p>When you use Ollama, all AI processing happens on your hardware. Your prompts, your documents, and the model&apos;s responses never touch a server. The network is not involved. This is the most fundamental privacy guarantee: data that never leaves your machine cannot be intercepted, subpoenaed, or breached remotely.</p>

      <h3>Layer 4: Vault Isolation</h3>
      <p>Each vault is a self-contained encrypted container. If you maintain multiple vaults (e.g., one for personal use, one for client work), they are cryptographically isolated from each other. Different passwords, different keys, different data. Unlocking one vault reveals nothing about the others.</p>

      <h2>Configuring Privacy for Your Use Case</h2>

      <h3>For Legal Professionals</h3>
      <p>Enable PII Scrubbing, Conversation Encryption, and Network Isolation. Use the Document Vault for all client files. Create separate vaults for different clients or matters. This configuration meets the most stringent client confidentiality requirements.</p>

      <h3>For Researchers</h3>
      <p>Enable Conversation Encryption. PII Scrubbing is optional depending on whether your data contains personal information. Folder Watch is ideal for pointing at research directories. Network Isolation depends on whether you need web search capabilities.</p>

      <h3>For Writers</h3>
      <p>Conversation Encryption is recommended to protect drafts and ideas. PII Scrubbing can be disabled if you&apos;re working with fictional content. Folder Watch pointed at your manuscripts folder keeps your agent current with your latest work.</p>

      <h3>For Business Analysts</h3>
      <p>Enable all four layers. Financial data, competitive intelligence, and strategic planning documents are high-value targets. Use the Document Vault for all sensitive materials. Consider Network Isolation if your analysis involves proprietary or pre-public information.</p>

      <h2>You&apos;re Set Up</h2>
      <p>If you&apos;ve followed this series from the beginning, you now have:</p>
      <p>A working understanding of what AI agents are and how they think. HammerLockAI installed and configured. Ollama running with a local model. Your first custom agent workflow. Knowledge of multi-agent pipelines. Your documents connected and searchable. Privacy settings tuned for your profession.</p>
      <p>That&apos;s a complete local AI setup &mdash; private, powerful, and entirely under your control.</p>
      <div className="blog-callout">
        <strong>Join the Community</strong>
        Have questions, want to share your agent configurations, or need help troubleshooting? Join the HammerLockAI Discord community. It&apos;s where users share workflows, custom prompts, and help each other get the most out of their setup.
      </div>
    </>
  ),
};

type ContentType = "article" | "guide" | "series";

export default function BlogPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<ContentType>("article");

  // Scroll progress bar
  useEffect(() => {
    const onScroll = () => {
      const bar = document.getElementById("blog-progress");
      if (!bar) return;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openContent = (id: string, type: ContentType) => {
    setActiveId(id);
    setActiveType(type);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeContent = () => {
    setActiveId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const article = activeId && activeType === "article" ? ARTICLES.find((a) => a.id === activeId) : null;
  const guide = activeId && activeType === "guide" ? GUIDES.find((g) => g.id === activeId) : null;
  const seriesItem = activeId && activeType === "series" ? SERIES.find((s) => s.id === activeId) : null;

  return (
    <div className="blog-page">
      <div className="blog-progress" id="blog-progress" />

      {/* NAV */}
      <nav className="blog-nav">
        <Link href="/" className="blog-nav-logo">
          <Image src="/brand/hammerlock-icon-192.png" alt="" width={18} height={18} style={{ borderRadius: 3 }} /> Hammer<span>Lock</span>AI
        </Link>
        <span className="blog-nav-tag">Research & Guides</span>
      </nav>

      {/* ARTICLE RAIL */}
      <div className="blog-rail">
        <button
          className={`blog-rail-btn${!activeId ? " active" : ""}`}
          onClick={closeContent}
        >
          All
        </button>
        {ARTICLES.map((a) => (
          <button
            key={a.id}
            className={`blog-rail-btn${activeId === a.id ? " active" : ""}`}
            onClick={() => openContent(a.id, "article")}
          >
            {a.num} &mdash; {a.pillar}
          </button>
        ))}
        <span className="blog-rail-divider" />
        {GUIDES.slice(0, 3).map((g) => (
          <button
            key={g.id}
            className={`blog-rail-btn${activeId === g.id ? " active" : ""}`}
            onClick={() => openContent(g.id, "guide")}
          >
            How To: {g.pillar}
          </button>
        ))}
        <span className="blog-rail-divider" />
        {SERIES.slice(0, 4).map((s) => (
          <button
            key={s.id}
            className={`blog-rail-btn${activeId === s.id ? " active" : ""}`}
            onClick={() => openContent(s.id, "series")}
          >
            {s.num} &mdash; {s.pillar}
          </button>
        ))}
      </div>

      {/* INDEX VIEW */}
      {!activeId && (
        <>
          <div className="blog-index">
            <div className="blog-index-header">
              <div className="blog-eyebrow">Open Source Series &mdash; 5 Articles</div>
              <h1 className="blog-index-title">
                The Open Source<br />Intelligence Files
              </h1>
              <p className="blog-index-subtitle">
                Five deep dives into why open source isn&apos;t just a philosophy &mdash; it&apos;s the only architecture that puts you in control of your own intelligence.
              </p>
            </div>
            <div className="blog-article-grid">
              {ARTICLES.map((a) => (
                <div key={a.id} className="blog-article-card" onClick={() => openContent(a.id, "article")}>
                  <div className="blog-card-num">{a.num} / {a.pillar}</div>
                  <div className="blog-card-title">{a.title}</div>
                  <div className="blog-card-meta">
                    <span className="blog-card-voice">{a.readTime}</span>
                    <span className="blog-card-arrow">&rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HOW-TO GUIDES SECTION */}
          <div className="blog-index" style={{ paddingTop: 0 }}>
            <div className="blog-index-header">
              <div className="blog-eyebrow">How-To Guides &mdash; 6 Tutorials</div>
              <h2 className="blog-index-title" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                Get Started with<br />HammerLockAI
              </h2>
              <p className="blog-index-subtitle">
                Step-by-step walkthroughs for setup, configuration, and getting the most out of every feature.
              </p>
            </div>
            <div className="blog-article-grid">
              {GUIDES.map((g) => (
                <div key={g.id} className="blog-article-card" onClick={() => openContent(g.id, "guide")}>
                  <div className="blog-card-num">{g.num} / {g.pillar}</div>
                  <div className="blog-card-title">{g.title}</div>
                  <div className="blog-card-meta">
                    <span className="blog-card-voice">{g.readTime}</span>
                    <span className="blog-card-arrow">&rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AGENT SETUP SERIES SECTION */}
          <div className="blog-index" style={{ paddingTop: 0 }}>
            <div className="blog-index-header">
              <div className="blog-eyebrow">Agent Setup Series &mdash; 8 Parts</div>
              <h2 className="blog-index-title" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                From Zero to Your Own<br />Private AI Agent
              </h2>
              <p className="blog-index-subtitle">
                Eight plain-English guides that walk you from &ldquo;what is an agent?&rdquo; to a fully configured, privacy-first AI system running on your own hardware.
              </p>
            </div>
            <div className="blog-article-grid">
              {SERIES.map((s) => (
                <div key={s.id} className="blog-article-card" onClick={() => openContent(s.id, "series")}>
                  <div className="blog-card-num">{s.num} / {s.pillar}</div>
                  <div className="blog-card-title">{s.title}</div>
                  <div className="blog-card-meta">
                    <span className="blog-card-voice">{s.readTime}</span>
                    <span className="blog-card-arrow">&rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ARTICLE VIEW */}
      {article && (
        <div className="blog-article-view">
          <button className="blog-back-btn" onClick={closeContent}>
            <ArrowLeft size={14} /> Back to all articles
          </button>

          <div className="blog-article-hero">
            <div className="blog-pillar">{article.pillar}</div>
            <h1 className="blog-article-title">{article.title}</h1>
            <div className="blog-article-meta">
              <span className="blog-meta-author">HammerLock Research Desk</span>
              <span className="blog-meta-divider">&mdash;</span>
              <span className="blog-meta-read">{article.readTime}</span>
            </div>
            <p className="blog-lede">{article.lede}</p>
          </div>

          <div className="blog-article-body">
            {ARTICLE_BODIES[article.id]}
          </div>

          {/* TEAM RESPONSE */}
          <div className="blog-team-response">
            <div className="blog-team-label">HammerLock Team Response</div>
            <div className="blog-team-body">
              {article.teamResponse.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <Link href="/#pricing" className="blog-team-cta">
              {article.teamCta} &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* GUIDE VIEW */}
      {guide && (
        <div className="blog-article-view">
          <button className="blog-back-btn" onClick={closeContent}>
            <ArrowLeft size={14} /> Back to all guides
          </button>

          <div className="blog-article-hero">
            <div className="blog-pillar">How-To: {guide.pillar}</div>
            <h1 className="blog-article-title">{guide.title}</h1>
            <div className="blog-article-meta">
              <span className="blog-meta-author">HammerLock Docs</span>
              <span className="blog-meta-divider">&mdash;</span>
              <span className="blog-meta-read">{guide.readTime}</span>
            </div>
            <p className="blog-lede">{guide.lede}</p>
          </div>

          <div className="blog-article-body">
            {GUIDE_BODIES[guide.id]}
          </div>

          <div className="blog-team-response">
            <div className="blog-team-label">Next Steps</div>
            <div className="blog-team-body">
              <p>Download HammerLockAI and follow this guide hands-on. The free tier includes all 11 agents, PDF upload, and full Ollama integration &mdash; no credit card required.</p>
            </div>
            <Link href="/get-app" className="blog-team-cta">
              Download HammerLockAI &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* SERIES VIEW */}
      {seriesItem && (
        <div className="blog-article-view">
          <button className="blog-back-btn" onClick={closeContent}>
            <ArrowLeft size={14} /> Back to all articles
          </button>

          <div className="blog-article-hero">
            <div className="blog-pillar">Part {seriesItem.num}: {seriesItem.pillar}</div>
            <h1 className="blog-article-title">{seriesItem.title}</h1>
            <div className="blog-article-meta">
              <span className="blog-meta-author">HammerLock Agent Series</span>
              <span className="blog-meta-divider">&mdash;</span>
              <span className="blog-meta-read">{seriesItem.readTime}</span>
            </div>
            <p className="blog-lede">{seriesItem.lede}</p>
          </div>

          <div className="blog-article-body">
            {SERIES_BODIES[seriesItem.id]}
          </div>

          {/* TEAM RESPONSE */}
          <div className="blog-team-response">
            <div className="blog-team-label">HammerLock Team Response</div>
            <div className="blog-team-name">{seriesItem.teamResponseName}</div>
            <div className="blog-team-role">{seriesItem.teamResponseRole}</div>
            <div className="blog-team-body">
              {seriesItem.teamResponse.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <Link href="/#pricing" className="blog-team-cta">
              {seriesItem.teamCta} &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="blog-footer">
        <Link href="/" className="blog-footer-link">
          <Image src="/brand/hammerlock-icon-192.png" alt="" width={14} height={14} style={{ borderRadius: 2 }} /> Back to HammerLockAI.com
        </Link>
      </footer>
    </div>
  );
}
