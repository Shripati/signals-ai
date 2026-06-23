# 📡 Signal.AI — Automated Weekly Digest

> A self-running AI agent that curates the week's best AI & tech content and delivers it to your inbox every Sunday — powered by Claude with live web search.

![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-Scheduled-00c27c?style=flat-square&logo=github-actions)
![Claude](https://img.shields.io/badge/Claude-haiku--3.5-5c3bff?style=flat-square)
![Resend](https://img.shields.io/badge/Email-Resend_(optional)-000000?style=flat-square)
![Node](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js)

---

## What it does

Every Sunday at 8 AM IST, a GitHub Actions workflow:

1. **Calls Claude Haiku 3.5** with web search enabled (live content scraping)
2. **Curates 12–15 items** across AI research, papers, news, tools, videos & blogs
3. **Scores each item** (1–10) and flags genuine must-reads 🔴
4. **Sends a beautiful HTML email** via Resend (optional) or outputs to console

You can also trigger it manually anytime from the **Actions** tab. Email delivery is optional—run locally to view in console.

---

## Categories covered

| Category | Sources |
|---|---|
| 🤖 AI & Models | OpenAI, Anthropic, Google DeepMind, Meta AI, Mistral, Hugging Face |
| 📄 Research Papers | arXiv (cs.AI, cs.LG, cs.CL), Papers With Code |
| 📰 Tech News | Hacker News, TechCrunch, The Verge |
| ▶️ Video | Two Minute Papers, Andrej Karpathy, Fireship, AI Explained |
| 🛠️ Tools | Open source releases, new developer tools, product launches |
| ✍️ Blogs | Lilian Weng, Simon Willison, Sebastian Raschka & more |

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/ai-weekly-digest.git
cd ai-weekly-digest
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your keys
```

You need:
- **`ANTHROPIC_API_KEY`** — from [console.anthropic.com](https://console.anthropic.com) (get Claude API credit)
- **`RECIPIENT_EMAIL`** — where you want the digest sent
- **`SENDER_EMAIL`** — (optional, needed for email) a verified sender in Resend
- **`RESEND_API_KEY`** — (optional) from [resend.com](https://resend.com) for email delivery. If not set, digest outputs to console

### 3. Test locally

```bash
npm run dev
```

### 4. Add GitHub Secrets

In your repo: **Settings → Secrets and variables → Actions → New repository secret**

**Required**: `ANTHROPIC_API_KEY`
**Optional** (for email delivery):
- `RESEND_API_KEY`
- `RECIPIENT_EMAIL` 
- `SENDER_EMAIL`

Without email secrets, the workflow will run and output the digest to the Actions log.

### 5. Push to GitHub

```bash
git add .
git commit -m "feat: initial Signal.AI digest agent"
git push origin main
```

GitHub Actions picks up the workflow automatically. You can also trigger a manual run from the **Actions** tab to test it end-to-end.

---

## Project structure

```
ai-weekly-digest/
├── .github/
│   └── workflows/
│       └── weekly-digest.yml   # Cron schedule + Actions config
├── digest.js                   # The agent — Claude + Resend
├── package.json
├── .env.example                # Template for local config
├── .gitignore
└── README.md
```

---

## Customising

**Change the schedule** — edit the cron in `.github/workflows/weekly-digest.yml`:
```yaml
- cron: "30 2 * * 0"   # Every Sunday 2:30 UTC (8:00 AM IST)
- cron: "30 2 * * 1"   # Every Monday instead
```

**Add topics** — edit the prompt in `buildPrompt()` inside `digest.js`

**Change recipient** — update `RECIPIENT_EMAIL` in your GitHub Secrets

---

## Tech stack

- [Claude API (Haiku 3.5)](https://anthropic.com) — cost-effective curation with live web search
- [Resend](https://resend.com) — optional transactional email delivery
- [GitHub Actions](https://github.com/features/actions) — free serverless cron scheduler & automation

---

## License

MIT
