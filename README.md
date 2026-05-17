# Safiri — Group Trip Planner & Budget Tracker

> **Safiri** (Swahili: *journey*) — A PWA built for group travel in East Africa. Any number of users can create and manage trips as treasurers. Each treasurer controls their trips completely; the group gets a live read-only view. Designed to work at 1am when everyone else has been drinking.

---

## What It Does

Safiri solves the treasurer's problem on a group trip: tracking who paid what, who owes who, and keeping the group informed — without 47 WhatsApp messages.

Built specifically for the **Kenyan travel context**: KES currency, M-Pesa payment methods, SGR/matatu/ferry transport, local activity categories, and the one-person-controls-the-money model that's standard in Kenyan group travel.

---

## Features

### 1. Trip Setup
Configure members, trip dates, and per-person budget. Everything else in the app cascades from these settings — daily budget, itinerary columns, and budget calculations all auto-calculate from start/end dates.

### 2. Itinerary
Schedule, to-do list, and live group guide in one screen. Activities have time slots, locations, cost estimates, and status (scheduled / in-progress / done / cancelled).

### 3. Location-Aware Activities
Activity library with travel time flags, area colour-coding, and time-of-day constraints. The app knows that Haller Park is an afternoon activity and Fort Jesus is a full-day visit.

### 4. Adaptive Schedule (AI-powered)
Cancel an activity → gap analysis → filtered local suggestions → AI picks tailored to your group's remaining budget and time.

### 5. Expense Logging
- **Quick entry via AI**: type "paid 800 for lunch, split with Brian and Cynthia" and hit Parse — AI extracts description, amount, category, date, payer, and split
- **Manual form** with full control
- **Split between**: charge any expense to specific members, not the whole group
- **Pre-trip vs trip expenses** tracked separately
- Exact timestamps on every entry

### 6. Committed vs Flexible Costs
Flag expenses as committed (booked, non-refundable) vs flexible (still negotiable). Dashboard shows how much of the budget is locked in.

### 7. Budget Dashboard
Live totals, daily budget tracking, per-category spend, and alerts at 75% and 90% of budget.

### 8. Category Spending Caps
Set limits per category (especially Drinks). The app flags when you're approaching the cap.

### 9. Afford Calculator
"Can we afford this?" — input an activity cost and get an instant answer based on remaining group budget.

### 10. Group Size & Transport Simulator
SGR vs car rental crossover calculator. Enter group size and see which option is cheaper, with per-person cost breakdown.

### 11. Pre-Trip Checklist
Track bookings, confirmations, and packing items before the trip starts.

### 12. Read-Only Group View
Share a link with the group — they see Itinerary, Budget, and Settle Up with no edit access. Kills the "what's the plan?" WhatsApp questions.

### 13. Settle Up
After the trip: who owes who, how much, and exactly what each charge was for. Tap any payment to see the itemized breakdown. Uses greedy debt minimization to reduce the number of transactions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Animation | Framer Motion v12 |
| Icons | Lucide React |
| Date handling | date-fns v4 |
| AI parsing | Natural language processing API |
| Database & Auth | Supabase (PostgreSQL + Realtime + Auth) |
| PWA | vite-plugin-pwa |
| Deploy | Vercel |
| CI/CD | GitHub Actions → Vercel auto-deploy |

---

## Project Structure

```
src/
├── screens/          # One file per screen
│   ├── Setup.jsx
│   ├── Itinerary.jsx
│   ├── ExpenseLog.jsx
│   ├── Budget.jsx
│   ├── SettleUp.jsx
│   ├── Members.jsx
│   ├── Checklist.jsx
│   ├── Tools.jsx
│   └── Documents.jsx
├── context/
│   └── TripContext.jsx   # Global state (useReducer + localStorage)
├── lib/
│   ├── constants.js      # Categories, activities, KES formatter
│   ├── ai.js             # AI client + natural language expense parser
│   ├── supabase.js       # Supabase client
│   └── demoSeed.js       # Demo data for testing
├── components/           # Shared UI components
└── main.jsx
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (free)
- An AI API key (optional — app works without it, AI parsing disabled)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/safiri.git
cd safiri
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ANTHROPIC_API_KEY=sk-ant-...   # Optional — enables AI expense parsing
```

### 3. Run locally

```bash
npm run dev
```

App runs at `http://localhost:5173`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes (for sync) | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes (for sync) | Your Supabase anon/public key |
| `VITE_ANTHROPIC_API_KEY` | No | Enables AI-powered expense parsing. Without it, the app uses a local heuristic parser |

---

## Database Schema

Five tables on Supabase:

```sql
trips          -- Trip config: name, dates, budget, owner, status (active/complete/cancelled)
trip_members   -- Who's on the trip, their role (owner / member)
expenses       -- All expenses with split_between, category, paid_by
itinerary      -- Scheduled activities with status
checklist      -- Pre-trip to-do items
```

- Any user can be a treasurer — they own and manage their own trips independently
- A user can have many trips (past, active, and future) all stored in their account
- Trips are **never deleted** — completed and cancelled trips are archived and remain accessible forever
- Row-level security ensures users can only read/write their own trips

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repo to Vercel
3. Set environment variables in Vercel dashboard
4. Every push to `main` auto-deploys

### CI/CD Pipeline

GitHub Actions runs on every pull request:
- Lint check (`npm run lint`)
- Build check (`npm run build`)
- Vercel preview URL generated automatically

---

## Roadmap

The full roadmap lives in **[ROADMAP.md](./ROADMAP.md)** — 12 phases from core features to startup-tier platform, each item marked Shipped / In Progress / Planned.

### Current status at a glance

| Phase | Focus | Status |
|---|---|---|
| 1 — Core Trip Management | Setup, budget, afford calculator | ✅ Shipped |
| 2 — Expense Tracking | Logging, splits, M-Pesa tags | ✅ Shipped |
| 3 — Group Coordination | Members, settle-up, share view | ✅ Shipped |
| 4 — Itinerary & Experience | Day planner, activity library, tutorial | ✅ Shipped |
| 5 — Auth, Sync & Multi-User | Supabase, realtime, trip history, clone | ✅ Shipped (5C–5F in progress) |
| 6 — Trip Lifecycle | Completion, extension, member departure, trip split | ⬜ Planned |
| 7 — Multi-Trip Concurrency | Multiple active trips, trip switching | ⬜ Planned |
| 8 — Governance & Succession | Treasurer handoff, role transfer | ⬜ Planned |
| 9 — Social & Coordination | Member status, activity feed, polls | ⬜ Planned |
| 10 — Smart Money | Receipt scan, M-Pesa import, multi-currency, savings goals | ⬜ Planned |
| 11 — Trip Experience | Photo memories, smart packing, cross-trip analytics | ⬜ Planned |
| 12 — B2B & Platform | Operator portal, marketplace, white label, expansion | 🚀 Startup-tier |

→ [See full roadmap with all features](./ROADMAP.md)

---

## Design Principles

1. **Sobriety Principle**: The treasurer is the only operator. Every action must work at 1am under pressure with a tired brain.
2. **Dynamic dates**: Trip duration drives everything — budgets, itinerary columns, and daily spend all auto-calculate.
3. **KES-first**: Kenyan context is a constraint, not a nice-to-have. M-Pesa, matatus, nyama choma — not USD, Venmo, or pizza.
4. **No WhatsApp questions**: The group view must answer every "what's the plan / how much do I owe" question so the treasurer doesn't have to.

---

## Contributing

This project is currently built for a specific July 2026 trip to Mombasa (AWS Community Day Kenya). After the trip, contributions are welcome.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push and open a PR

---

## License

MIT — use it, fork it, adapt it for your own group trip.

---

*Built by Trevor Vuhyah*
