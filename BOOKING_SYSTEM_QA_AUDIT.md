# Booking System QA Audit — Logical Bugs, Edge Cases, Race Conditions

**Scope:** Time overlap logic, double booking, durations (20/45/75 min), simultaneous attempts, midnight/end-of-day, timezones, off-by-one, UI vs backend validation.

---

## Executive Summary

| Category | Status | Critical? |
|----------|--------|-----------|
| Double booking (concurrent) | **Protected by DB trigger** | No — second insert fails |
| Back-to-back slot boundary | **BUG: OVERLAPS rejects valid back-to-back** | **Yes** |
| Timezone (RPC vs schedule) | **Risk: UTC vs local schedule** | Yes |
| Past booking (client “now”) | **Weak: client clock, no server check** | Medium |
| Reassign timezone / overlap check | **BUG: date/time mix, weak duplicate check** | Yes |
| UI vs backend | Backend re-validates; UI can be bypassed | OK |
| Last slot / closing time | UI and RPC respect schedule end | OK |
| Atomicity | Check-then-insert race; trigger is safety net | Medium |

---

## 1. Time Overlap Logic

### 1.1 Back-to-back bookings incorrectly rejected (BUG)

**Scenario:** Booking at 14:00 for 45 min (ends 14:45). Another at 14:45 for 60 min (14:45–15:30). These should **not** overlap.

**What happens:**  
PostgreSQL `(a,b) OVERLAPS (c,d)` is true when the two intervals share **any** point. So `(14:00, 14:45)` and `(14:45, 15:30)` share 14:45 → OVERLAPS = true. The trigger and RPC both use OVERLAPS, so the second booking is rejected.

**Why it happens:**  
OVERLAPS uses inclusive bounds. Semantically, “end” is the first free moment (exclusive end), so we want: overlap ⇔ `start_A < end_B AND end_A > start_B` (strict), not OVERLAPS.

**Where:**  
- `supabase/migrations/003_home_service.sql`: trigger `check_booking_effective_window_overlap` and RPC `get_barber_availability` (booking overlap check).

**Fix:**  
Use strict comparison instead of OVERLAPS:

- Overlap when: `effective_start_at < other.effective_end_at AND effective_end_at > other.effective_start_at`.

So:

- Trigger: replace  
  `(effective_start_at, effective_end_at) OVERLAPS (NEW.effective_start_at, NEW.effective_end_at)`  
  with  
  `effective_start_at < NEW.effective_end_at AND effective_end_at > NEW.effective_start_at`  
  (and same for the new row vs existing).

- RPC: replace  
  `(v_ts_start, v_ts_end) OVERLAPS (effective_start_at, effective_end_at)`  
  with  
  `v_ts_start < effective_end_at AND v_ts_end > effective_start_at`.

**Suggested fix:** New migration (see below) that replaces OVERLAPS with the above in both trigger and RPC.

---

### 1.2 App-level overlap check (queries.ts)

**Code:**  
`createBooking` runs:

```ts
.lt("effective_start_at", effectiveEnd.toISOString())
.gt("effective_end_at", effectiveStart.toISOString())
```

That is: existing.start < ourEnd AND existing.end > ourStart → correct (strict) overlap. So **app logic allows back-to-back**; only the DB trigger/RPC use OVERLAPS and break it. Fixing the DB fixes the behavior.

---

## 2. Double Booking & Simultaneous Attempts

### 2.1 Two users book same slot at same time

**Scenario:** User A and B both see 14:00 free; both submit; both pass availability check.

**What happens:**  
1. A: RPC available → overlap SELECT (none) → INSERT → success.  
2. B: RPC available (or not, if after A’s insert) → overlap SELECT (might see A) → INSERT or skip.  
If B runs overlap check before A’s INSERT commits, B also sees “none” and both INSERT. The **trigger** then runs on B’s INSERT and raises “overlap” → B’s insert fails. Result: one booking (A), one error (B). No double booking.

**Conclusion:** No double booking thanks to trigger. No need for SELECT FOR UPDATE or serializable transaction for correctness; adding them would only reduce “slot taken” errors for the second user.

---

### 2.2 Reassign “double-check” is wrong (BUG)

**Code (reassign route):**

```ts
.eq("booking_date", booking.booking_date)
```

This only finds another booking with the **exact same** `booking_date`. It does **not** detect overlapping windows (e.g. 14:00–14:45 vs 14:30–15:30). So “Time slot already booked” is incomplete; real overlap is caught only by the trigger on UPDATE. If the trigger fires, the API gets a DB error instead of a clean “already booked” message.

**Fix:**  
- Either remove this “double-check” and rely on the trigger + handle trigger error in the API, or  
- Replace it with a proper overlap check using `effective_start_at` / `effective_end_at` (same condition as in createBooking: `existing.effective_start_at < ourEnd AND existing.effective_end_at > ourStart`).

---

## 3. Duration Edge Cases (20, 45, 75 min)

- **20 min (Beard Trim):** Computed as `booking_date + 20*60000`; no special case; OK.  
- **45 min (Premium):** Same; OK.  
- **75 min (Full Service):** Same; OK.  
- Home service: `effectiveEnd = booking_date + duration + buffer`; in_shop: `effectiveEnd = booking_date + duration`. Both consistent with DB and UI.  
- **Conclusion:** No duration-specific bugs found; backend uses service duration from DB.

---

## 4. Midnight / End-of-Day

### 4.1 Booking ending exactly at closing

**Scenario:** Salon closes 21:00. Booking 20:00 for 60 min → 20:00–21:00.

**RPC (003):**  
`p_end_time > weekly_schedule.end_time` → false. So 21:00 is not “after” 21:00 → slot allowed. OK.

### 4.2 Last available slot

**UI:**  
`getAvailableTimeSlots` loops `slotMinutes < scheduleEndMinutes` and uses `slotEndMinutes = slotStartMinutes + duration`. So a slot is only added if the service **fits** within the schedule. Example: close 21:00, 30 min → last slot 20:30. OK.

### 4.3 Midnight

- `getBookingsForDate` uses local calendar day with ±12h padding; no midnight bug identified.  
- Disabled dates are by calendar date (YYYY-MM-DD); no DST edge analyzed; acceptable for typical use.

---

## 5. Timezone Inconsistencies

### 5.1 checkAvailabilityWindow (queries.ts) → RPC

**Client sends:**  
- `dateStr` from `windowStart` **UTC** (getUTCFullYear, getUTCMonth, getUTCDate).  
- `startTimeStr` / `endTimeStr` from `windowStart.toISOString().slice(11,19)` → **UTC** time of day.

**RPC (003):**  
- Builds `v_ts_start := (p_date::timestamp + p_start_time)::timestamptz`.  
- In PostgreSQL, `date + time` is interpreted in the **session timezone** (often server TZ). So if server is UTC, the window is in UTC; if server is Tunis, the same numeric time is Tunis.  
- Schedule/breaks/overrides store `start_time`/`end_time` typically as **local** (e.g. 09:00–21:00 Tunis). So we mix: **UTC window** (from client) with **local schedule** (in DB). If server TZ is not Tunis, 09:00 in DB might be compared to wrong UTC moment → wrong availability.

**Why it happens:**  
Client normalizes to UTC; DB schedule is stored as “wall clock” without timezone. One source of truth (e.g. “all times in Tunis”) is missing.

**Fix (conceptual):**  
- Either: store schedule in UTC and have client send UTC (current send path is already UTC; then ensure server TZ is UTC or schedule is stored in UTC).  
- Or: define “salon timezone” (e.g. Africa/Tunis), have RPC interpret `p_date` and `p_start_time` as **in that zone**, build `v_ts_start`/`v_ts_end` with `AT TIME ZONE 'Africa/Tunis'`, and compare to schedule times also in that zone. Then client should send **local** date and time (or server converts UTC → local before RPC).  
- Minimal change: document that server (and Supabase) timezone must be set to salon timezone so that `(p_date + p_start_time)::timestamptz` matches “salon local”.

### 5.2 Reassign route timezone bug (BUG)

**Code:**  
- `dateStr = bookingDate.toISOString().slice(0, 10)` → **UTC date**.  
- `startTimeStr = bookingDate.toTimeString().slice(0, 8)` → **local time** of the server (or runtime).

So we pass **UTC date + local time** to the RPC. That is inconsistent and can shift the window by a day near midnight (e.g. 23:00 UTC = next day in Tunis).

**Fix:**  
Use one consistent timezone for the reassign check. For example: use UTC for both date and time (e.g. from `bookingDate.toISOString()`) and ensure the RPC is defined to accept UTC (and that schedule comparison in RPC is aligned). Or convert `bookingDate` to salon timezone and pass local date + time; then RPC must treat them as salon local (see above).

---

## 6. Off-by-One Minute / Boundary

- **Back-to-back:** Covered in §1.1 (OVERLAPS → strict comparison).  
- **Slot generation:** UI uses strict overlap for breaks (`slotStartMinutes < breakEndMinutes && slotEndMinutes > breakStartMinutes`), so boundaries are correct.  
- **createBooking** overlap: strict inequalities; correct.

---

## 7. UI vs Backend Validation

- **Availability:** UI calls `checkAvailability` / `checkAvailabilityWindow` and `getBookingsForDate`; user can bypass UI and call Supabase from DevTools. **Backend:** `createBooking` (used from client) runs the same checks and overlap SELECT; **DB trigger** is the final guard. So logic is not “only in frontend”; backend + DB enforce.  
- **Past booking:** Only in app: `bookingDate < new Date()`. This uses **client** time; no server-side “booking_date > now()” check. So a user with a wrong clock or direct API could attempt a past time; overlap and schedule checks might still block, but the error would be generic.  
- **Recommendation:** Add server-side “booking_date must be in the future” (e.g. in an API route that wraps createBooking, or in a DB constraint / trigger) and return a clear error.

---

## 8. Simulated Scenarios Summary

| Scenario | Expected | Actual | Note |
|----------|----------|--------|------|
| 14:00 for 45 min | OK | OK | 14:00–14:45 |
| 14:30 for 60 min (same barber) | Overlap with above | Rejected by trigger | Correct |
| 14:45 for 60 min (after 14:00–14:45) | OK (back-to-back) | **Rejected** | OVERLAPS bug (§1.1) |
| Two users, same slot, same time | One wins, one fails | One wins, one fails | Trigger prevents double book |
| Booking ending at 21:00 (close 21:00) | Allowed | Allowed | RPC uses ≤ end |
| Last slot (e.g. 20:30 for 30 min, close 21:00) | Shown and allowed | OK | UI and RPC |
| Reassign to barber with overlapping booking | Reject | Reject (trigger) | Reassign “double-check” is weak (§2.2) |
| Reassign with UTC date + local time | Correct window | **Wrong** near midnight | §5.2 |

---

## 9. Where the Real Protection Is

- **Overlap:** DB trigger `check_booking_effective_window_overlap` (plus app overlap SELECT). Fix OVERLAPS → strict so back-to-back is allowed.  
- **Double booking:** Trigger prevents two confirmed overlapping windows; no double booking.  
- **Schedule / breaks / blocked:** RPC `get_barber_availability`; app uses it before suggesting slots and createBooking uses it via `checkAvailabilityWindow`.  
- **Weak spots:**  
  - Back-to-back rejected (DB OVERLAPS).  
  - Timezone: RPC/schedule and reassign date+time mix.  
  - Past booking only enforced in app (client time).  
  - Reassign overlap check is by exact `booking_date` only.

---

## 10. Recommended Fixes (Priority)

1. **Critical — DB overlap (back-to-back):**  
   New migration: in trigger and in `get_barber_availability`, replace OVERLAPS with strict comparison:  
   `effective_start_at < NEW.effective_end_at AND effective_end_at > NEW.effective_start_at` (and equivalent for RPC).

2. **High — Reassign:**  
   - Pass consistent date+time to RPC (e.g. UTC for both, or salon-local for both).  
   - Replace “same booking_date” duplicate check with an overlap check on effective window, or remove it and handle trigger error cleanly.

3. **Medium — Past booking:**  
   Server-side check (or trigger): reject `booking_date` (or `effective_start_at`) ≤ now() with a clear error.

4. **Medium — Timezone:**  
   Document and/or enforce salon timezone (e.g. set Supabase/server TZ to Africa/Tunis, or store and compare all times in one zone in RPC).

5. **Low — Atomicity:**  
   Optional: wrap overlap check + insert in a transaction with serializable isolation or advisory lock to reduce “slot just taken” for the second user; not required for correctness.

---

## 11. What Cursor Did / Did Not Do

- **Done:** Code and schema review; overlap logic; race analysis; timezone and reassign logic; UI slot generation; trigger/RPC behavior.  
- **Not done:** Real concurrent load testing (would need script or load tool); full DST/midnight tests in production; live verification of Supabase timezone.

The real protection is in **backend validation** (queries.ts createBooking), **database trigger** (overlap), and **RPC** (schedule/breaks/blocked/bookings). Frontend can be bypassed; backend and DB cannot.
