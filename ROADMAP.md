# Safiri — Product Roadmap

> Legend: ✅ Shipped · 🔄 In progress · ⬜ Planned · 🚀 Startup-tier

---

## Phase 1 — Core Trip Management ✅
*The minimum viable treasurer tool*

- ✅ Trip setup wizard — name, destination, dates, group size, budget per person
- ✅ Budget dashboard — live totals, daily budget, spent vs remaining, progress bar
- ✅ Alert banners — warning at 75%, danger at 90% of budget
- ✅ Afford calculator — "can we afford this?" against remaining budget
- ✅ Category spending caps — set a limit per category, bar turns red when exceeded
- ✅ Committed vs flexible costs — flag booked/non-refundable expenses separately
- ✅ Transport simulator — SGR vs car rental cost crossover calculator

---

## Phase 2 — Expense Tracking ✅ + ⬜
*Logging what the group actually spends*

- ✅ Manual expense entry — amount, category, date, payer, split between specific members
- ✅ Pre-trip vs trip expenses — tagged separately, tracked independently
- ✅ Payment method tagging — M-Pesa, cash, card
- ✅ Edit and delete expenses
- ✅ Expense log grouped by date
- ✅ Per-member spend tracking — who has spent how much of their share
- ⬜ **Kitty vs Out-of-Pocket model** — clearly distinguish two flows that happen on every Kenyan trip: (1) expense paid directly from the shared trip kitty, and (2) individual paid out of their own pocket and needs to be reimbursed by the group; these are different money movements and must be modelled separately in the UI and settle-up calculations
- ⬜ **Kenyan expense categories** — replace generic Western labels with defaults that match how Kenyan groups actually spend: Transport/Fuel, Accommodation, Food/Choma, Drinks/Liquor, Park Fees, Activities, Ferry/Boat, Miscellaneous/Tips

---

## Phase 3 — Group Coordination ✅ + ⬜
*Keeping everyone on the same page*

- ✅ Member management — add members, set Confirmed/Maybe/Dropped status
- ✅ Budget pool analysis — total committed vs trip plan, who's under target
- ✅ Per-member budget allocation — custom budget per member
- ✅ Cash contribution tracking — money physically handed over, "still owed" gap
- ✅ Settle-up screen — who pays who, greedy debt minimisation, itemised breakdown
- ✅ Read-only share view — group link with itinerary, budget, and settle-up, no edit access
- ✅ Checklist — pre-trip bookings, confirmations, and packing items
- ✅ Document vault — store tickets, bookings, and IDs in one place
- ⬜ **M-Pesa limit awareness** — warn the treasurer when the trip kitty approaches the KES 300,000 M-Pesa holding limit or KES 500,000 daily transaction limit; prompt to shift overflow funds to a bank account or Till Number; critical for large groups on high-end trips (15 people to a Watamu villa will hit this fast)

---

## Phase 4 — Itinerary & Experience ✅ + ⬜
*Planning the actual trip*

- ✅ Day-by-day itinerary — time slots, locations, activity types, cost estimates
- ✅ Activity status tracking — scheduled / in-progress / done / cancelled
- ✅ Activity library — Mombasa-specific activities with time-of-day flags and area colour coding
- ✅ Gap analysis — cancelled activity triggers filtered local suggestions
- ✅ Tutorial overlay — 13-step guided tour on first launch, replayable from More menu
- ⬜ **Payment method indicator on activities** — tag each activity and venue with how they accept payment: Accepts M-Pesa Till / Cash Only (ferries, local guides, roadside) / Card Preferred; helps the group plan how much physical cash to carry at each stage of the trip

---

## Phase 5 — Auth, Sync & Multi-User ✅ / 🔄
*Making it work for more than one person on more than one device*

- ✅ Supabase auth — email/password sign-up and sign-in
- ✅ Splash screen + login flow
- ✅ localStorage persistence — offline-first, works without a connection
- ✅ Supabase sync — trips, members, expenses all synced to PostgreSQL in real time
- ✅ Realtime subscription — live expense and member updates across devices
- ✅ Multiple trips per account — past, active, and future all stored
- ✅ Trip history — completed trips archived forever, never deleted, with spend snapshot
- ✅ Clone trip — prefill a new trip from any past trip (name, destination, dates, budget, transport, members)
- ✅ Use this group — import a previous trip's member list into a fresh trip setup
- ✅ Home tab in nav bar — return to My Trips from anywhere inside a trip
- ✅ Onboarding cancel — abort trip creation at any step without data loss
- ✅ PWA — installable on iOS and Android home screen
- ✅ Vercel deploy + GitHub Actions CI/CD
- 🔄 **5C** — Expense status UI — pending badge on Expenses tab, pending section, approve/reject buttons for treasurer
- ⬜ **5D** — WhatsApp invite link *(elevated — this is the primary viral growth lever)*  — one shareable link sent via WhatsApp; recipient taps it, app opens, they are pre-joined to the trip; eliminates manual name entry for 15 people during setup; mandatory before any marketing push
- ⬜ **5E** — Email auto-invite — Vercel Edge Function + Resend, invite sent on member add as a fallback to WhatsApp
- ⬜ **5F** — Member role UI + Treasurer inbox — role badges on member cards, pending submissions view, read-only mode for non-treasurer members
- ⬜ **5G** — Offline action queue — IndexedDB-backed queue for all actions taken with zero signal (logging expenses on the Kilifi ferry, at a campsite in Tsavo); Service Worker syncs the full queue to Supabase the moment a stable connection returns; replaces the current localStorage-only approach with a proper offline-first architecture

---

## Phase 6 — Trip Lifecycle
*Controlling when a trip starts, pauses, extends, and ends*

- ⬜ **6A** — Trip completion flow — treasurer taps "End trip"; auto-prompt when end date passes; prompt also fires when all members have settled up; trip moves to history with full financial summary
- ⬜ **6B** — Trip extension — treasurer pushes the end date forward from inside the trip; daily budget and days remaining recalculate automatically
- ⬜ **6C** — Member departure — any member marks themselves "Departed" mid-trip; expenses after their cutoff date exclude them from splits; settle-up reflects their final balance at point of departure
- ⬜ **6D** — Trip split — when some members extend and others go home, the budget forks: departing members settle at current totals, remaining members continue on a new budget slice with their own daily rate

---

## Phase 7 — Multi-Trip & Concurrency
*Running more than one trip at the same time*

- ⬜ **7A** — Multiple active trips — Home screen supports N active trips simultaneously, each with its own budget, members, and expenses; no data bleed between trips
- ⬜ **7B** — Trip switching — tap any active trip card on Home to enter it; context switches cleanly without a reload

---

## Phase 8 — Governance & Succession
*What happens when leadership changes mid-trip*

- ⬜ **8A** — Treasurer succession — when the current treasurer marks themselves Departed or leaves, the app immediately prompts the remaining group to elect a replacement; until confirmed, the trip enters read-only budget mode (expenses can be submitted but not approved)
- ⬜ **8B** — Complete role transfer — old treasurer loses all admin rights the moment the new one is confirmed; audit trail records who held the role and when; treasurer nominates a successor before departing if possible

---

## Phase 9 — Social & Group Coordination
*Lightweight awareness without becoming a chat app*

- ⬜ **9A** — Member status — each member posts a short manual status ("At the beach", "Heading to lunch", "On the ferry"); visible to the whole group inside the trip; no GPS, no background tracking, no battery drain
- ⬜ **9B** — Trip activity feed — a chronological timeline inside the trip showing: expenses logged, members joined or departed, status updates, settle-up events; gives the group a shared record of what happened and when
- ⬜ **9C** — Group polls — lightweight in-trip voting ("Where should we eat tonight?"); three options, tap to vote, auto-closes; no WhatsApp thread needed

---

## Phase 10 — Smart Money
*Making the financial layer intelligent and integrated*

- ⬜ **10A** — M-Pesa Statement PDF upload *(Priority — replaces live Daraja API plan)* — treasurer exports their M-Pesa statement as a PDF from the mySafaricom app and uploads it to Safiri; app parses the structured text, extracts transaction amounts and dates, and presents a list of transactions the treasurer can tap to convert into trip expenses instantly; covers 95% of real Kenyan trip transactions without requiring a business registration or Safaricom partnership
- ⬜ **10B** — Spending predictions — "At your current pace you'll exhaust the budget in 3 days, 1 day before the trip ends"; rule-based engine, no AI required
- ⬜ **10C** — Multi-currency support — enter expenses in USD, EUR, or any currency; auto-converts to KES at live exchange rates; essential for international trips and Kenyan diaspora groups visiting home
- ⬜ **10D** — Pre-trip savings goals — per-member savings tracker before the trip; "We need KES 25K each by March 15 — you have saved KES 8K so far"; treasurer sees at a glance who is ready and who is not; integrates with the Kitty model from Phase 2
- ⬜ **10E** — "Lipa-Pole-Pole" group savings wallet — members contribute small amounts monthly toward an upcoming trip over 3–6 months; funds held in a locked wallet through partnership with a licensed Kenyan financial entity; Safiri earns a small percentage or interest yield on pooled funds; turns the app into a fintech product, not just a tracker
- ⬜ **10F** — Export — PDF trip report and M-Pesa-formatted expense summary for reimbursement and record keeping
- ⬜ **10G** — M-Pesa screenshot parser — paste or upload an M-Pesa confirmation SMS or screenshot; app reads the amount, recipient, and timestamp and pre-fills an expense form; faster than the PDF upload for single transactions

---

## Phase 11 — Trip Experience
*The parts that make people want to use it again*

- ⬜ **11A** — Photo memories — attach a photo to any expense or itinerary item; end of trip, the app generates a visual timeline of the journey
- ⬜ **11B** — Smart packing list — based on destination, trip duration, and transport mode the app suggests a starter checklist; Mombasa beach trip looks different from a Maasai Mara safari
- ⬜ **11C** — Cross-trip analytics — personal travel stats: total spent this year, average cost per day by destination, most frequent travel companions, most visited places

---

## Phase 12 — B2B & Platform 🚀
*If this becomes a startup*

- 🚀 **12A** — Accommodation discovery *(can ship early as a simple curated list)* — when the treasurer sets the destination during trip setup, display a curated list of Safiri-verified properties that fit the exact group size (villas, Airbnbs, campsites); property owners pay a commission on direct bookings made through the app; starts as a static vetted list with WhatsApp booking links before becoming a full marketplace
- 🚀 **12B** — Tour operator portal — operators create a trip template (itinerary, budget, member slots, document checklist) and share it with their clients; clients join, operator manages everything from one dashboard; primary B2B revenue stream
- 🚀 **12C** — Marketplace — tour operators list packages, groups browse and book directly through Safiri; platform takes a 3% commission per booking
- 🚀 **12D** — Corporate / business trips — per diem tracking, expense reports, VAT receipt collection, reimbursement workflow; separate mode targeted at companies sending staff on work travel; highest willingness to pay
- 🚀 **12E** — White label — tour agencies and travel companies brand Safiri as their own app; monthly licensing fee; low marginal cost, high value for operators
- 🚀 **12F** — Vendor integrations — hotels and restaurants send itemised invoices directly into a trip via a simple link; group sees the bill, approves, it logs automatically
- 🚀 **12G** — Country expansion — Uganda (UGX), Tanzania (TZS), Ethiopia (ETB), Rwanda (RWF); country-specific activity libraries, local transport options, and mobile money integrations per market

---

## Monetization Model

**Do not charge users to create a trip.** A gate fee kills early adoption in Kenya before trust is established.

| Revenue Stream | Phase | Mechanism |
|---|---|---|
| Accommodation commissions | 12A | Property owners pay per booking made through the app |
| Marketplace commission | 12C | 3% on operator package bookings |
| Lipa-Pole-Pole yield | 10E | Small percentage on pooled pre-trip savings |
| Corporate licensing | 12D | Monthly fee per company account |
| White label licensing | 12E | Monthly fee per operator brand |
| Lead generation | 12A | Flat fee per qualified booking referral |

---

## The Startup Case

Safiri is the only group travel finance app built for the African market:

- **M-Pesa native** — not bolted on after the fact
- **KES-first** — not a USD app with a currency converter
- **Offline-capable** — works at 60% signal on the Kilifi ferry or deep in Tsavo
- **Treasurer model** — matches how Kenyan groups actually handle money: one person holds the kitty, everyone else follows
- **Kitty vs Out-of-Pocket** — models the two real money flows in Kenyan group travel, which no Western app does
- **Tour operator B2B layer** — turns a consumer tool into a platform business

That combination does not exist anywhere today.

**Expansion path:** Own Kenya → Uganda, Tanzania, Ghana, Nigeria with local payment rails → position as the group travel platform built for how the Global South actually travels.

---

*Last updated: May 2026*
