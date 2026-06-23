# Signal.AI — Project Documentation

## Overview
Signal.AI is an automated weekly digest agent that curates the best AI & tech content from across the web and delivers it to your inbox. Runs on a schedule via GitHub Actions.

## Architecture

### Core Flow
1. **Trigger** — GitHub Actions runs on schedule (Sunday 2:30 UTC) or manual dispatch
2. **Search** — Claude Haiku calls web_search tool to find latest content in AI/tech space
3. **Curate** — Claude analyzes results and returns structured JSON with 12-15 top items
4. **Score** — Each item gets a 1-10 score and optional "critical" flag (max 2-3)
5. **Format** — Build beautiful HTML email + plain text fallback
6. **Deliver** — Send via Resend (optional) or output to console/logs

### Files
- `digest.js` — Main agent logic (Claude API calls, email formatting, web search handling)
- `package.json` — Dependencies (Anthropic SDK, Resend, dotenv)
- `.env.example` — Template for environment variables
- `.github/workflows/weekly-digest.yml` — GitHub Actions cron scheduler
- `.gitignore` — Standard Node.js excludes + .env files

## Setup & Development

### Local Development
```bash
# Copy template
cp .env.example .env.local

# Edit with your keys
nano .env.local

# Run once
npm run dev

# Or test in GitHub Actions
git push && check Actions tab
```

### Environment Variables
- `ANTHROPIC_API_KEY` (required) — Claude API key from console.anthropic.com
- `RECIPIENT_EMAIL` (optional) — Where to send digest email
- `SENDER_EMAIL` (optional) — From address for email (needs Resend verification)
- `RESEND_API_KEY` (optional) — Email delivery service. Without it, digest outputs to console/logs

### GitHub Setup
1. Push repo to GitHub
2. **Settings → Secrets and variables → Actions**
3. Add only: `ANTHROPIC_API_KEY` (required)
4. Optional: `RESEND_API_KEY`, `RECIPIENT_EMAIL`, `SENDER_EMAIL`
5. Workflow runs automatically Sundays at 2:30 UTC

## Customization

### Change Schedule
Edit `.github/workflows/weekly-digest.yml` cron expression:
```yaml
- cron: "30 2 * * 0"   # Sunday 2:30 UTC
- cron: "30 2 * * 1"   # Monday 2:30 UTC
- cron: "0 18 * * *"   # Daily 6 PM UTC
```

### Add/Remove Content Categories
Edit `buildPrompt()` in `digest.js`:
- Add new categories in the prompt text
- Claude will search and curate for them

### Adjust Scoring Logic
Modify the JSON schema in `buildPrompt()`:
- Change `score` scale (currently 1-10)
- Adjust "critical" threshold (currently max 2-3)
- Add/remove tags

### Change Email Design
- `buildEmailHTML()` — HTML template with inline CSS
- `buildEmailText()` — Plain text fallback
- Styling is tuned for Gmail/Outlook

## Monitoring & Debugging

### Local Testing
```bash
npm run dev
# Output appears in console
# Check: JSON parsing, item counts, email formatting
```

### GitHub Actions Logs
1. Push to main branch
2. Go to **Actions** tab → **Weekly Digest** workflow
3. Click latest run to see full logs
4. Check for errors in Claude API calls or Resend delivery

### Common Issues
| Issue | Fix |
|-------|-----|
| `No JSON array found` | Claude didn't return valid JSON — check prompt format |
| `ANTHROPIC_API_KEY not set` | Add secret to GitHub Actions settings |
| `Resend error` | Missing `RESEND_API_KEY` or email not verified — run locally to test without email |
| `Empty or invalid digest` | Web search returned no results — check network, try manual trigger |

## Cost Optimization

- **Model**: Claude Haiku 3.5 (~$0.80 per 1M input tokens, $4 per 1M output)
- **Frequency**: Weekly runs = ~4 calls/month
- **Expected**: $0.05-0.10 per month with $5 Claude credit

## Future Enhancements

- [ ] Add digest archive/history page
- [ ] Support multiple recipient emails
- [ ] Add category filters (only AI news, only research papers, etc.)
- [ ] Store digest history in database
- [ ] Add web UI to view past digests
- [ ] Support digest preferences per user

## License
MIT
