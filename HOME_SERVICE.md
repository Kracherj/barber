# Home Service Feature – Architecture & Validation

## 1. Service type architecture (unified)

- **Booking type** is stored on the same `bookings` table: `booking_type` ∈ `('in_shop', 'home_service')`.
- **Effective window** is used for all conflict checks:
  - **In-shop:** `effective_start_at = booking_date`, `effective_end_at = booking_date + service duration`.
  - **Home:** `effective_start_at = booking_date - travel_minutes`, `effective_end_at = booking_date + duration + buffer_minutes`.
- One availability path: `get_barber_availability(p_date, p_start_time, p_end_time)` checks schedule, breaks, blocked slots, and **overlap of confirmed bookings’ effective windows**. No duplicated logic.

## 2. Database (migration 003_home_service.sql)

- **bookings:** `booking_type`, `customer_address_line`, `customer_city_zone`, `customer_location_pin`, `total_price_tnd`, `effective_start_at`, `effective_end_at`.
- **barbers:** `home_service_enabled`, `home_travel_minutes`, `home_buffer_minutes`, `max_home_visits_per_day`, `home_travel_radius_km`.
- **services:** `available_for_home`, `home_surcharge_tnd`.
- **salon_config:** key/value for `home_service_base_fee_tnd`, `home_service_enabled`.
- **Constraint:** Partial unique index on `(barber_id, booking_date)` removed. Overlap is enforced by trigger `check_booking_effective_window_overlap` so no two confirmed bookings for the same barber have overlapping `(effective_start_at, effective_end_at)`.

## 3. Travel time and availability

- Home booking blocks: `[arrival - travel, arrival + duration + buffer]`.
- `checkAvailabilityWindow(barberId, windowStart, windowEnd)` is the single entry point; `checkAvailability(date, duration)` uses it for in-shop.
- RPC `get_barber_availability` includes overlap check on `bookings.effective_start_at` / `effective_end_at`. No extra app-side overlap logic.

## 4. Client flow

- **Step 1 – Location:** In-shop vs Home (Home only if `salon_config.home_service_enabled`).
- **Step 2 – Service:** Filter by `available_for_home` when Home.
- **Step 3 – Barber:** Filter by `home_service_enabled` when Home.
- **Step 4 – Date/time:** Slots respect effective window (bookings + blocked slots already use effective ranges).
- **Step 5 – Details:** For Home, required: address line, city/zone; optional: pin. Phone required in all cases.
- **Step 6 – Confirm:** Total = service price + home surcharge (service or salon base); shown before confirm.

## 5. Admin

- **Barbers:** Edit home service on/off, travel minutes, buffer minutes, max home visits per day.
- **Services:** Section “Home service – Service availability”: per service, “available for home” and home surcharge (TND).
- **Calendar & list:** Booking type shown (e.g. “Home” badge); for home, address/city shown.

## 6. Run migration

In Supabase SQL editor run:

`supabase/migrations/003_home_service.sql`

Then confirm:

- Existing confirmed bookings have `effective_start_at` / `effective_end_at` backfilled.
- Trigger prevents new overlapping confirmed bookings.
- RPC `get_barber_availability` exists and is used by the app.

## 7. Regression checklist

- [ ] **In-shop only:** Choose “In-shop” → service → barber → date/time → details → confirm. Same behaviour as before (no address, same price).
- [ ] **Home disabled:** If `home_service_enabled` is false in `salon_config`, “Home service” is disabled in the location step.
- [ ] **Home flow:** Choose “Home” → only home-enabled services/barbers → pick slot → fill address + city → confirm; total = price + surcharge.
- [ ] **Slot locking:** Create in-shop booking at 10:00 (e.g. 30 min). Try another booking at 10:15 same barber → blocked. Create home booking (e.g. 30 min + 30 travel + 15 buffer); try in-shop or home overlapping that window → blocked.
- [ ] **Admin:** Barbers tab: toggle “Home service enabled” and set travel/buffer/max visits; save. Services section: toggle “available for home” and set surcharge; save. Calendar and list show “Home” and address for home bookings.

## 8. Edge cases covered

- **Two home bookings far apart:** Different effective windows → no overlap → both allowed.
- **Home then in-shop:** Effective window of home includes travel; in-shop slot inside that window is unavailable (overlap).
- **Admin changes travel buffer:** Only new bookings use new buffer; existing bookings keep stored `effective_start_at` / `effective_end_at`.
- **Barber day off / blocked slot:** Handled by existing schedule and `barber_blocked_slots` in `get_barber_availability`; no change.
- **Cancel:** Status set to cancelled; trigger only considers `status = 'confirmed'`, so no overlap issue.

## 9. Performance

- One RPC per availability check; overlap uses indexed `(barber_id, effective_start_at, effective_end_at)` for confirmed bookings.
- No brute-force recalculation; effective window stored at insert.

## 10. Stability score

- **In-shop:** Logic unchanged; only new columns and one shared availability path. **10/10** if migration and trigger are correct.
- **Home:** New branch in createBooking and UI; availability reuses same RPC and effective-window idea. **9/10**; monitor for any timezone/edge cases on window boundaries.
