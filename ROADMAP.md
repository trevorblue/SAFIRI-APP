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

## Phase 2 — Expense Tracking ✅
*Logging what the group actually spends*

- ✅ Manual expense entry — amount, category, date, payer, split between specific members
- ✅ Pre-trip vs trip expenses — tagged separately, tracked independently
- ✅ Payment method tagging — M-Pesa, cash, card
- ✅ Edit and delete expenses
- ✅ Expense log grouped by date
- ✅ Per-member spend tracking — who has spent how much of their share

---

## Phase 3 — Group Coordination ✅
*Keeping everyone on the same page*

- ✅ Member management — add members, set Confirmed/Maybe/Dropped status
- ✅ Budget pool analysis — total committed vs trip plan, who's under target
- ✅ Per-member budget allocation — custom budget per member
- ✅ Cash contribution tracking — money physically handed over, "still owed" gap
- ✅ Settle-up screen — who pays who, greedy debt minimisation, itemised breakdown
- ✅ Read-only share view — group link with itinerary, budget, and settle-up, no edit access
- ✅ Checklist — pre-trip bookings, confirmations, and packing items
- ✅ Document vault — store tickets, bookings, and IDs in one place

---

## Phase 4 — Itinerary & Experience ✅
*Planning the actual trip*

- ✅ Day-by-day itinerary — time slots, locations, activity types, cost estimates
- ✅ Activity status tracking — scheduled / in-progress / done / cancelled
- ✅ Activity library — Mombasa-specific activities with time-of-day flags and area colour coding
- ✅ Gap analysis — cancelled activity triggers filtered local suggestions
- ✅ Tutorial overlay — 13-step guided tour on first launch, replayable from More menu

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
- ⬜ **5D** — Invite tokens + `/join` route — shareable member invite link, join via URL
- ⬜ **5E** — Email auto-invite — Vercel Edge Function + Resend, invite sent on member add
- ⬜ **5F** — Member role UI + Treasurer inbox — role badges on member cards, pending submissions view, read-only mode for non-treasurer members

---

## Phase 6 — Trip Lifecycle
*Controlling when a trip starts, pauses, extends, and ends*

- ⬜ **6A** — Trip completion flow — treasurer taps "End trip"; auto-prompt when end date passes; prompt also fires when all members have settled up; trip moves to history
- ⬜ **6B** — Trip extension — treasurer pushes the end date forward from inside the trip; daily budget and days remaining recalculate automatically
- ⬜ **6C** — Member departure — any member marks themselves "Departed" mid-trip; expenses after their cutoff date exclude them from splits; settle-up reflects their final balance
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
- ⬜ **8B** — Complete role transfer — old treasurer loses all admin rights the moment the new one is confirmed; audit trail records who held the role and when; treasurer nominates a successor before departing if available

---

## Phase 9 — Social & Group Coordination
*Lightweight awareness without becoming a chat app*

- ⬜ **9A** — Member status — each member posts a short manual status ("At the beach", "Heading to lunch", "On the ferry"); visible to the whole group inside the trip; no GPS, no background tracking, no battery drain
- ⬜ **9B** — Trip activity feed — a chronological timeline inside the trip showing: expenses logged, members joined or departed, status updates, settle-up events; gives the group a shared record of what happened and when
- ⬜ **9C** — Group polls — lightweight in-trip voting ("Where should we eat tonight?"); three options, tap to vote, auto-closes; no WhatsApp thread needed

---

## Phase 10 — Smart Money
*Making the financial layer intelligent and integrated*

- ⬜ **10A** — Receipt scanning — snap a photo of any receipt; OCR reads the amount and category and pre-fills the expense form; eliminates manual entry at point of sale
- ⬜ **10B** — Spending predictions — "At your current pace you'll exhaust the budget in 3 days, 1 day before the trip ends"; rule-based engine, no AI dependency
- ⬜ **10C** — Multi-currency support — enter expenses in USD, EUR, or any currency; auto-converts to KES at live exchange rates; essential for international trips
- ⬜ **10D** — M-Pesa integration — import M-Pesa statement transactions directly into a trip; app matches amounts to dates and suggests categories; makes Safiri the default for Kenyan travellers
- ⬜ **10E** — Pre-trip savings goals — per-member savings tracker before the trip; "We need KES 25K each by March 15 — you've saved KES 8K so far"; treasurer sees who's ready and who isn't
- ⬜ **10F** — Export — PDF trip report and M-Pesa-formatted expense summary for reimbursement

---

## Phase 11 — Trip Experience
*The parts that make people want to use it again*

- ⬜ **11A** — Photo memories — attach a photo to any expense or itinerary item; end of trip, the app generates a visual timeline of the journey
- ⬜ **11B** — Smart packing list — based on destination, trip duration, and transport mode the app suggests a starter checklist; Mombasa beach trip looks different from a Maasai Mara safari
- ⬜ **11C** — Cross-trip analytics — personal travel stats: total spent this year, average cost per day by destination, most frequent travel companions, most visited places

---

## Phase 12 — B2B & Platform 🚀
*If this becomes a startup*

- 🚀 **12A** — Tour operator portal — operators create a trip template (itinerary, budget, member slots, document checklist) and share it with their clients; clients join, operator manages everything from one dashboard; primary B2B revenue stream
- 🚀 **12B** — Marketplace — tour operators list packages, groups browse and book directly through Safiri; platform takes a small commission per booking
- 🚀 **12C** — Corporate / business trips — per diem tracking, expense reports, VAT receipt collection, reimbursement workflow; separate mode targeted at companies sending staff on work travel; highest willingness to pay
- 🚀 **12D** — White label — tour agencies and travel companies brand Safiri as their own app; monthly licensing fee; low marginal cost, high value
- 🚀 **12E** — Vendor integrations — hotels and restaurants send itemised invoices directly into a trip via a simple link; group sees the bill, approves, it logs automatically; no manual entry
- 🚀 **12F** — Country expansion — Uganda (UGX), Tanzania (TZS), Ethiopia (ETB), Rwanda (RWF); country-specific activity libraries and transport options

---

## The Startup Case

Safiri is the only group travel finance app built for the African market:

- **M-Pesa native** — not bolted on
- **KES-first** — not a USD app with a currency converter
- **Offline-capable** — works at 60% signal in the Tsavo
- **Treasurer model** — matches how Kenyan groups actually handle money
- **Tour operator B2B layer** — turns a consumer tool into a platform business

That combination does not exist anywhere today.

---

*Last updated: May 2026*
