import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const USE_EMAIL = !!resend && RECIPIENT_EMAIL && SENDER_EMAIL;

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt() {
  const today = new Date().toDateString();
  return `You are a world-class tech & science curator with broad knowledge. Search the web and find the most important and valuable content published in the past 2 days (be very recent) across these balanced categories:

1. AI & Machine Learning — significant breakthroughs, new models, research (10% of digest max)
2. Software & Development — programming, tools, frameworks, DevOps, databases, backend systems
3. Web & Frontend — UI/UX trends, web technologies, browser innovations, design systems
4. Cloud & Infrastructure — cloud platforms, Kubernetes, serverless, deployment tools
5. Security & Privacy — vulnerabilities, security tools, privacy updates, compliance news
6. Business & Startups — tech funding, acquisitions, company news, market trends
7. Open Source — notable releases, maintainer news, community projects
8. Science & Research — breakthroughs in physics, biology, climate, robotics, space (non-AI)
9. Other Tech — hardware, IoT, mobile, networking, emerging technologies

Return ONLY a valid JSON array — no markdown fences, no preamble, no explanation.

Each item must have exactly these fields:
- "title": string — the real title of the piece
- "url": string — actual URL if available, else ""
- "source": string — e.g. "TechCrunch", "The Verge", "GitHub Blog", "HackerNews", "Ars Technica", "WIRED"
- "summary": string — 2–3 concrete sentences: what it is and why it matters. Be specific, not generic.
- "tags": array — pick from: ["ai", "dev", "web", "cloud", "security", "business", "opensource", "science", "hardware"]
- "score": number 1–10 — importance for a tech professional
- "critical": boolean — true only if genuinely must-read (major acquisition, critical security issue, paradigm shift). Max 2–3 items.
- "why": string — one short phrase on why this specifically matters, e.g. "Breaking: Major cloud outage affects millions"

Aim for 12–15 items total. Ensure VARIETY across categories (no more than 20% from any single category). Prioritise signal over noise. Be recent and current. Today's date: ${today}.`;
}

// ─── Fetch Digest from Claude ──────────────────────────────────────────────────

async function fetchDigest() {
  console.log("🔍 Fetching digest from Claude with web search...");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{ role: "user", content: buildPrompt() }],
  });

  // Extract text blocks (web search tool results are separate blocks)
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No JSON array found in Claude response");

  const items = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(items) || items.length === 0)
    throw new Error("Empty or invalid digest returned");

  console.log(
    `✅ Got ${items.length} items (${items.filter((i) => i.critical).length} critical)`
  );
  return items;
}

// ─── Build Email HTML ──────────────────────────────────────────────────────────

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(monday)} – ${fmt(sunday)}, ${sunday.getFullYear()}`;
}

function tagEmoji(tag) {
  return (
    { ai: "🤖", research: "📄", video: "▶️", news: "📰", tool: "🛠️", blog: "✍️" }[
      tag
    ] || "📌"
  );
}

function buildEmailHTML(items) {
  const weekRange = getWeekRange();
  const critical = items.filter((i) => i.critical);
  const regular = items.filter((i) => !i.critical);

  const cardHTML = (item) => `
    <div style="background:#ffffff;border:1.5px solid ${item.critical ? "#ff3b3b" : "#e0ddd5"};border-radius:10px;padding:20px 24px;margin-bottom:14px;${item.critical ? "border-left:4px solid #ff3b3b;" : ""}">
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
        ${item.tags.map((t) => `<span style="background:#f0f0f0;color:#444;font-size:11px;padding:2px 8px;border-radius:99px;font-family:monospace;">${tagEmoji(t)} ${t}</span>`).join("")}
        ${item.critical ? `<span style="background:#ffe0e0;color:#cc0000;font-size:11px;padding:2px 8px;border-radius:99px;font-family:monospace;font-weight:700;">🔴 Must-Read</span>` : ""}
        <span style="margin-left:auto;font-size:11px;color:#999;font-family:monospace;">Score ${item.score}/10</span>
      </div>
      <div style="font-family:Georgia,serif;font-size:17px;font-weight:600;margin-bottom:8px;line-height:1.35;">
        ${item.url ? `<a href="${item.url}" style="color:#0d0d0d;text-decoration:none;">${item.title}</a>` : item.title}
      </div>
      <div style="font-size:14px;line-height:1.65;color:#333;margin-bottom:10px;">${item.summary}</div>
      <div style="font-size:12px;color:#888;font-family:monospace;">
        🔗 ${item.source}
        ${item.why ? `&nbsp;·&nbsp;<span style="color:#5c3bff;font-style:italic;">${item.why}</span>` : ""}
      </div>
    </div>`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f7f6f2;font-family:'Space Grotesk',Helvetica,Arial,sans-serif;">
  <div style="max-width:680px;margin:32px auto;background:#f7f6f2;padding:0 16px 40px;">

    <!-- Masthead -->
    <div style="border-bottom:2px solid #0d0d0d;padding-bottom:16px;margin-bottom:24px;">
      <div style="font-family:monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#999;margin-bottom:4px;">Weekly Intelligence Brief</div>
      <div style="font-family:Georgia,serif;font-size:36px;font-weight:700;line-height:1;letter-spacing:-0.02em;">Signal<span style="color:#00c27c;">.</span>AI</div>
      <div style="font-family:monospace;font-size:11px;color:#999;margin-top:4px;">Week of ${weekRange} · ${items.length} items curated</div>
    </div>

    ${
      critical.length
        ? `
    <!-- Critical Section -->
    <div style="background:#0d0d0d;color:#fff;padding:14px 18px;border-radius:8px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-family:Georgia,serif;font-size:16px;font-weight:600;">🔴 Must-Read This Week</span>
      <span style="background:#ff3b3b;color:#fff;font-size:10px;font-family:monospace;padding:3px 9px;border-radius:99px;">${critical.length} CRITICAL</span>
    </div>
    ${critical.map(cardHTML).join("")}
    <div style="border-top:1px solid #e0ddd5;margin:24px 0;"></div>
    `
        : ""
    }

    <!-- Regular Section -->
    <div style="font-family:monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#999;margin-bottom:16px;">This Week's Picks</div>
    ${regular.map(cardHTML).join("")}

    <!-- Footer -->
    <div style="border-top:1px solid #e0ddd5;margin-top:32px;padding-top:16px;font-size:12px;color:#aaa;font-family:monospace;text-align:center;">
      Signal.AI · Automated weekly digest powered by Claude + Web Search<br/>
      <a href="https://github.com" style="color:#aaa;">View on GitHub</a>
    </div>
  </div>
</body>
</html>`;
}

// ─── Build Plain Text Fallback ─────────────────────────────────────────────────

function buildEmailText(items) {
  const weekRange = getWeekRange();
  const critical = items.filter((i) => i.critical);
  const regular = items.filter((i) => !i.critical);

  const itemText = (item, idx) =>
    `${idx + 1}. ${item.title}
   Source: ${item.source} | Score: ${item.score}/10${item.url ? `\n   Link: ${item.url}` : ""}
   ${item.summary}${item.why ? `\n   → ${item.why}` : ""}`;

  return `SIGNAL.AI — WEEKLY DIGEST
Week of ${weekRange}
${"─".repeat(50)}
${
  critical.length
    ? `
🔴 MUST-READ THIS WEEK
${"─".repeat(50)}
${critical.map((item, i) => itemText(item, i + 1)).join("\n\n")}

`
    : ""
}THIS WEEK'S PICKS
${"─".repeat(50)}
${regular.map((item, i) => itemText(item, i + 1)).join("\n\n")}

${"─".repeat(50)}
Signal.AI · Powered by Claude + Web Search`;
}

// ─── Send Email via Resend ─────────────────────────────────────────────────────

async function sendDigest(items) {
  const weekRange = getWeekRange();
  const criticalCount = items.filter((i) => i.critical).length;
  const subject = criticalCount
    ? `🔴 Signal.AI — ${criticalCount} Must-Reads + Weekly Digest | ${weekRange}`
    : `Signal.AI — Weekly AI & Tech Digest | ${weekRange}`;

  if (USE_EMAIL) {
    console.log(`📬 Sending digest to ${RECIPIENT_EMAIL}...`);
    const { data, error } = await resend.emails.send({
      from: `Signal.AI <${SENDER_EMAIL}>`,
      to: RECIPIENT_EMAIL,
      subject,
      html: buildEmailHTML(items),
      text: buildEmailText(items),
    });
    if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
    console.log(`✅ Email sent! Message ID: ${data.id}`);
  } else {
    console.log("\n📰 Digest ready (email not configured):\n");
    console.log(`Subject: ${subject}\n`);
    console.log(buildEmailText(items));
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Signal.AI Digest Agent starting...");
  const items = await fetchDigest();
  await sendDigest(items);
  console.log("🎉 Done!");
}

main().catch((err) => {
  console.error("❌ Agent failed:", err.message);
  process.exit(1);
});
