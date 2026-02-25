import { createClient } from "./client";
import { toLocalDateString } from "@/lib/utils";

// Input sanitization helpers
function sanitizeString(input: string, maxLength: number = 255): string {
  if (typeof input !== 'string') {
    throw new Error('INVALID_INPUT: Expected string');
  }
  // Remove control characters and trim whitespace
  return input.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, maxLength);
}

function sanitizePhone(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 8 || !/^[9245]/.test(cleaned)) {
    throw new Error('INVALID_PHONE: Phone must be 8 digits starting with 9, 2, 4, or 5');
  }
  return cleaned;
}

function sanitizeEmail(email?: string): string | undefined {
  if (!email) return undefined;
  const sanitized = sanitizeString(email, 255);
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error('INVALID_EMAIL: Invalid email format');
  }
  return sanitized.toLowerCase();
}

function validateUUID(id: string, fieldName: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new Error(`INVALID_${fieldName.toUpperCase()}: Invalid UUID format`);
  }
}

export type BookingType = "in_shop" | "home_service";

export interface Barber {
  id: string;
  name: string;
  name_ar: string;
  is_active?: boolean;
  home_service_enabled?: boolean;
  home_travel_minutes?: number | null;
  home_buffer_minutes?: number | null;
  max_home_visits_per_day?: number | null;
  home_travel_radius_km?: number | null;
}

export interface Service {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  duration_minutes: number;
  price_tnd: number;
  available_for_home?: boolean;
  home_surcharge_tnd?: number;
}

export interface Booking {
  id: string;
  service_id: string;
  barber_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  booking_date: string;
  status: "confirmed" | "cancelled" | "completed";
  created_at: string;
  booking_type?: BookingType;
  customer_address_line?: string | null;
  customer_city_zone?: string | null;
  customer_location_pin?: string | null;
  total_price_tnd?: number | null;
  effective_start_at?: string | null;
  effective_end_at?: string | null;
  service?: Service;
  barber?: Barber;
}

export interface DisabledDate {
  id: string;
  date: string; // YYYY-MM-DD
  reason?: string;
  created_at: string;
}

export async function getDisabledDates(fromDate?: Date, toDate?: Date): Promise<DisabledDate[]> {
  const supabase = createClient();
  let query = supabase.from("disabled_dates").select("*").order("date", { ascending: true });

  if (fromDate) {
    query = query.gte("date", toLocalDateString(fromDate));
  }
  if (toDate) {
    query = query.lte("date", toLocalDateString(toDate));
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching disabled dates:", error);
    return [];
  }
  return (data || []).map((row) => ({ ...row, date: row.date.slice(0, 10) }));
}

export async function addDisabledDate(date: string, reason?: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("disabled_dates").insert({ date, reason });
  if (error) {
    console.error("Error adding disabled date:", error);
    return false;
  }
  return true;
}

export async function removeDisabledDate(date: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("disabled_dates").delete().eq("date", date);
  if (error) {
    console.error("Error removing disabled date:", error);
    return false;
  }
  return true;
}

export async function isDateDisabled(date: Date): Promise<boolean> {
  const dateStr = date.toISOString().slice(0, 10);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("disabled_dates")
    .select("id")
    .eq("date", dateStr)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export async function getBarbers(includeInactive: boolean = false, homeServiceOnly: boolean = false): Promise<Barber[]> {
  const supabase = createClient();
  let query = supabase
    .from("barbers")
    .select("*")
    .order("name");

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }
  if (homeServiceOnly) {
    query = query.eq("home_service_enabled", true);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching barbers:", error);
    return [];
  }
  return data || [];
}

export async function getSalonConfig(): Promise<{ home_service_enabled: boolean; home_service_base_fee_tnd: number }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("salon_config")
    .select("key, value_bool, value_number")
    .in("key", ["home_service_enabled", "home_service_base_fee_tnd"]);
  if (error) {
    console.error("Error fetching salon config:", error);
    return { home_service_enabled: true, home_service_base_fee_tnd: 10 };
  }
  const rows = data || [];
  const homeEnabled = rows.find((r: any) => r.key === "home_service_enabled");
  const baseFee = rows.find((r: any) => r.key === "home_service_base_fee_tnd");
  return {
    home_service_enabled: homeEnabled?.value_bool ?? true,
    home_service_base_fee_tnd: Number(baseFee?.value_number ?? 10),
  };
}

export async function getServices(): Promise<Service[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("price_tnd");

  if (error) {
    console.error("Error fetching services:", error);
    return [];
  }

  return data || [];
}

export async function getBookings(
  barberId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<Booking[]> {
  const supabase = createClient();
  let query = supabase
    .from("bookings")
    .select("*, service:services(*), barber:barbers(*)")
    .eq("status", "confirmed");

  if (barberId) {
    query = query.eq("barber_id", barberId);
  }

  if (startDate) {
    query = query.gte("booking_date", startDate.toISOString());
  }

  if (endDate) {
    query = query.lte("booking_date", endDate.toISOString());
  }

  const { data, error } = await query.order("booking_date");

  if (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }

  return data || [];
}

function sanitizeAddress(value: string, maxLen: number): string {
  const s = sanitizeString(value, maxLen);
  if (!s || s.length < 3) throw new Error("INVALID_ADDRESS: Address must be at least 3 characters");
  return s;
}

export async function createBooking(booking: {
  service_id: string;
  barber_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  booking_date: string;
  booking_type?: BookingType;
  customer_address_line?: string;
  customer_city_zone?: string;
  customer_location_pin?: string;
}): Promise<Booking | null> {
  const supabase = createClient();
  const bookingType: BookingType = booking.booking_type ?? "in_shop";

  validateUUID(booking.service_id, "service_id");
  validateUUID(booking.barber_id, "barber_id");
  const sanitizedName = sanitizeString(booking.customer_name, 100);
  const sanitizedPhone = sanitizePhone(booking.customer_phone);
  const sanitizedEmail = sanitizeEmail(booking.customer_email);

  const bookingDate = new Date(booking.booking_date);
  if (isNaN(bookingDate.getTime())) throw new Error("INVALID_BOOKING_DATE: Invalid date format");
  if (bookingDate < new Date()) throw new Error("INVALID_BOOKING_DATE: Cannot book in the past");

  const bookingDateStr = bookingDate.toISOString().slice(0, 10);
  const { data: disabled } = await supabase.from("disabled_dates").select("id").eq("date", bookingDateStr).maybeSingle();
  if (disabled) throw new Error("DATE_DISABLED");

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("duration_minutes, price_tnd, available_for_home, home_surcharge_tnd")
    .eq("id", booking.service_id)
    .single();
  if (serviceError || !service) throw new Error("SERVICE_NOT_FOUND");
  const durationMinutes = service.duration_minutes;

  let effectiveStart: Date;
  let effectiveEnd: Date;
  let totalPriceTnd: number | null = null;
  let addressLine: string | null = null;
  let cityZone: string | null = null;
  let locationPin: string | null = null;

  if (bookingType === "home_service") {
    if (!booking.customer_address_line?.trim() || !booking.customer_city_zone?.trim()) {
      throw new Error("INVALID_ADDRESS: Address and city/zone are required for home service");
    }
    addressLine = sanitizeAddress(booking.customer_address_line, 500);
    cityZone = sanitizeAddress(booking.customer_city_zone, 120);
    locationPin = booking.customer_location_pin ? sanitizeString(booking.customer_location_pin, 50) : null;

    const { data: barber } = await supabase
      .from("barbers")
      .select("home_service_enabled, home_travel_minutes, home_buffer_minutes, max_home_visits_per_day")
      .eq("id", booking.barber_id)
      .single();
    if (!barber?.home_service_enabled) throw new Error("BARBER_HOME_SERVICE_DISABLED");
    if (service.available_for_home !== true) throw new Error("SERVICE_NOT_AVAILABLE_FOR_HOME");

    const travelMin = barber.home_travel_minutes ?? 30;
    const bufferMin = barber.home_buffer_minutes ?? 15;
    effectiveStart = new Date(bookingDate.getTime() - travelMin * 60000);
    effectiveEnd = new Date(bookingDate.getTime() + durationMinutes * 60000 + bufferMin * 60000);

    const config = await getSalonConfig();
    const surcharge = Number(service.home_surcharge_tnd ?? config.home_service_base_fee_tnd);
    totalPriceTnd = Number(service.price_tnd) + surcharge;

    const maxPerDay = barber.max_home_visits_per_day ?? 10;
    const dayStart = new Date(bookingDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(bookingDate);
    dayEnd.setHours(23, 59, 59, 999);
    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("barber_id", booking.barber_id)
      .eq("booking_type", "home_service")
      .eq("status", "confirmed")
      .gte("booking_date", dayStart.toISOString())
      .lte("booking_date", dayEnd.toISOString());
    if ((count ?? 0) >= maxPerDay) throw new Error("BARBER_MAX_HOME_VISITS_REACHED");

    const available = await checkAvailabilityWindow(booking.barber_id, effectiveStart, effectiveEnd);
    if (!available) throw new Error("BARBER_UNAVAILABLE");
  } else {
    effectiveStart = bookingDate;
    effectiveEnd = new Date(bookingDate.getTime() + durationMinutes * 60000);
    const available = await checkAvailabilityWindow(booking.barber_id, effectiveStart, effectiveEnd);
    if (!available) throw new Error("BARBER_UNAVAILABLE");
  }

  const basePayload = {
    service_id: booking.service_id,
    barber_id: booking.barber_id,
    customer_name: sanitizedName,
    customer_phone: sanitizedPhone,
    customer_email: sanitizedEmail ?? null,
    booking_date: bookingDate.toISOString(),
    booking_type: bookingType,
    effective_start_at: effectiveStart.toISOString(),
    effective_end_at: effectiveEnd.toISOString(),
    total_price_tnd: totalPriceTnd ?? null,
    customer_address_line: addressLine ?? null,
    customer_city_zone: cityZone ?? null,
    customer_location_pin: locationPin ?? null,
  };

  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("barber_id", booking.barber_id)
    .eq("booking_date", bookingDate.toISOString())
    .eq("status", "cancelled")
    .maybeSingle();

  if (existingBooking && bookingType === "in_shop") {
    const { data, error } = await supabase
      .from("bookings")
      .update({
        ...basePayload,
        status: "confirmed",
      })
      .eq("id", existingBooking.id)
      .select("*, service:services(*), barber:barbers(*)")
      .single();
    if (error) throw new Error(`FAILED_TO_UPDATE_BOOKING: ${error.message}`);
    if (!data) throw new Error("FAILED_TO_UPDATE_BOOKING: No data returned");
    return data;
  }

  // Pre-insert overlap check using same window we're inserting (avoids trigger/DB error and timezone mismatch)
  const { data: overlapping } = await supabase
    .from("bookings")
    .select("id")
    .eq("barber_id", booking.barber_id)
    .eq("status", "confirmed")
    .lt("effective_start_at", effectiveEnd.toISOString())
    .gt("effective_end_at", effectiveStart.toISOString())
    .limit(1);
  if (overlapping && overlapping.length > 0) throw new Error("DUPLICATE_BOOKING");

  const { data, error } = await supabase
    .from("bookings")
    .insert({ ...basePayload, status: "confirmed" })
    .select("*, service:services(*), barber:barbers(*)")
    .single();

  if (error) {
    const err = error as { message?: string; code?: string; status?: number };
    const msg = err?.message || "";
    const code = err?.code;
    const status = err?.status;
    if (code === "23505" || status === 409 || msg.toLowerCase().includes("overlap") || msg.toLowerCase().includes("conflict")) {
      throw new Error("DUPLICATE_BOOKING");
    }
    throw new Error(`FAILED_TO_CREATE_BOOKING: ${msg || "Unknown error"}`);
  }
  if (!data) throw new Error("FAILED_TO_CREATE_BOOKING: No data returned");
  return data;
}

export async function cancelBooking(bookingId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (error) {
    console.error("Error cancelling booking:", error);
    throw new Error(`FAILED_TO_CANCEL_BOOKING: ${error.message}`);
  }

  return true;
}

export async function getBookingsByPhone(
  phone: string
): Promise<Booking[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, service:services(*), barber:barbers(*)")
    .eq("customer_phone", phone)
    .eq("status", "confirmed")
    .order("booking_date", { ascending: false });

  if (error) {
    console.error("Error fetching bookings by phone:", error);
    return [];
  }

  return data || [];
}

export interface BarberSchedule {
  weekly: Array<{
    day_of_week: number;
    is_available: boolean;
    start_time: string; // HH:MM:SS format
    end_time: string; // HH:MM:SS format
    breaks: Array<{ start_time: string; end_time: string }>;
  }>;
  dateOverrides: Array<{
    date: string; // YYYY-MM-DD format
    is_available: boolean;
    start_time?: string; // HH:MM:SS format
    end_time?: string; // HH:MM:SS format
    breaks: Array<{ start_time: string; end_time: string }>;
  }>;
}

export async function getBarberSchedule(
  barberId: string,
  fromDate?: Date,
  toDate?: Date
): Promise<BarberSchedule> {
  const supabase = createClient();

  // Fetch weekly schedule with times
  const { data: weekly, error: weeklyError } = await supabase
    .from("barber_weekly_schedule")
    .select("id, day_of_week, is_available, start_time, end_time")
    .eq("barber_id", barberId)
    .order("day_of_week");

  if (weeklyError) {
    console.error("Error fetching barber weekly schedule:", weeklyError);
    return { weekly: [], dateOverrides: [] };
  }

  // Fetch breaks for weekly schedules
  const weeklyScheduleIds = (weekly || []).map((w) => w.id);
  let weeklyBreaks: Array<{ schedule_id: string; start_time: string; end_time: string }> = [];
  
  if (weeklyScheduleIds.length > 0) {
    const { data: breaks, error: breaksError } = await supabase
      .from("barber_weekly_breaks")
      .select("schedule_id, start_time, end_time")
      .in("schedule_id", weeklyScheduleIds);

    if (!breaksError && breaks) {
      weeklyBreaks = breaks;
    }
  }

  // Map weekly schedules with their breaks
  const weeklyWithBreaks = (weekly || []).map((w) => {
    const breaks = weeklyBreaks
      .filter((b) => b.schedule_id === w.id)
      .map((b) => ({
        start_time: b.start_time,
        end_time: b.end_time,
      }));

    return {
      day_of_week: w.day_of_week,
      is_available: w.is_available !== false,
      start_time: w.start_time,
      end_time: w.end_time,
      breaks,
    };
  });

  // Fetch date overrides with times
  let dateOverrides: Array<{
    date: string;
    is_available: boolean;
    start_time?: string;
    end_time?: string;
    breaks: Array<{ start_time: string; end_time: string }>;
  }> = [];

  if (fromDate && toDate) {
    const { data: overrides, error: overridesError } = await supabase
      .from("barber_date_overrides")
      .select("id, date, is_available, start_time, end_time")
      .eq("barber_id", barberId)
      .gte("date", toLocalDateString(fromDate))
      .lte("date", toLocalDateString(toDate));

    if (!overridesError && overrides && overrides.length > 0) {
      const overrideIds = overrides.map((o) => o.id);
      
      // Fetch breaks for date overrides
      const { data: dateBreaks, error: dateBreaksError } = await supabase
        .from("barber_date_breaks")
        .select("override_id, start_time, end_time")
        .in("override_id", overrideIds);

      const breaksByOverrideId = new Map<string, Array<{ start_time: string; end_time: string }>>();
      if (!dateBreaksError && dateBreaks) {
        dateBreaks.forEach((b) => {
          if (!breaksByOverrideId.has(b.override_id)) {
            breaksByOverrideId.set(b.override_id, []);
          }
          breaksByOverrideId.get(b.override_id)!.push({
            start_time: b.start_time,
            end_time: b.end_time,
          });
        });
      }

      dateOverrides = overrides.map((o) => ({
        date: o.date.slice(0, 10),
        is_available: o.is_available !== false,
        start_time: o.start_time || undefined,
        end_time: o.end_time || undefined,
        breaks: breaksByOverrideId.get(o.id) || [],
      }));
    }
  }

  return {
    weekly: weeklyWithBreaks,
    dateOverrides,
  };
}

export function isBarberAvailableOnDate(
  schedule: BarberSchedule,
  date: Date
): boolean {
  const dateStr = toLocalDateString(date);
  const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.

  const override = schedule.dateOverrides.find((o) => o.date === dateStr);
  if (override) {
    return override.is_available;
  }

  const weekly = schedule.weekly.find((w) => w.day_of_week === dayOfWeek);
  return !!weekly && weekly.is_available;
}

/** Check if barber is available for a full window (schedule + blocked + no booking overlap). Used for both in_shop and home_service. */
function toLocalTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${h}:${min}:${s}`;
}

export async function checkAvailabilityWindow(
  barberId: string,
  windowStart: Date,
  windowEnd: Date
): Promise<boolean> {
  const supabase = createClient();
  // Use local date/time so RPC schedule comparison (09:00-21:00) matches user's selected slot (e.g. 9:30).
  // Sending UTC caused 9:30 Tunis to become 08:30 and fail "before opening" in the RPC.
  const dateStr = toLocalDateString(windowStart);
  const startTimeStr = toLocalTimeString(windowStart);
  const endTimeStr = toLocalTimeString(windowEnd);

  const { data: available, error: rpcError } = await supabase.rpc("get_barber_availability", {
    p_barber_id: barberId,
    p_date: dateStr,
    p_start_time: startTimeStr,
    p_end_time: endTimeStr,
  });

  if (rpcError) {
    console.error("Error checking barber availability RPC:", rpcError);
    return false;
  }
  return available === true;
}

export async function checkAvailability(
  barberId: string,
  date: Date,
  durationMinutes: number
): Promise<boolean> {
  const endTime = new Date(date.getTime() + durationMinutes * 60000);
  return checkAvailabilityWindow(barberId, date, endTime);
}

/** Returns time windows when the barber is busy (for both in_shop and home_service). Used to block slots in the client. */
export async function getBookingsForDate(
  barberId: string,
  date: Date
): Promise<Array<{ start: Date; end: Date }>> {
  // Use calendar day in local time so in-shop and home see the same "day"
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  // Widen query by 12h each side so we never miss a booking due to timezone (e.g. home at 23:30)
  const queryStart = new Date(startOfDay.getTime() - 12 * 60 * 60 * 1000);
  const queryEnd = new Date(endOfDay.getTime() + 12 * 60 * 60 * 1000);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, booking_date, booking_type, effective_start_at, effective_end_at, service:services(duration_minutes)")
    .eq("barber_id", barberId)
    .eq("status", "confirmed")
    .gte("booking_date", queryStart.toISOString())
    .lte("booking_date", queryEnd.toISOString());

  if (error) {
    console.error("Error fetching bookings for date:", error);
    return [];
  }

  const result: Array<{ start: Date; end: Date }> = [];
  for (const booking of data || []) {
    let start: Date;
    let end: Date;
    if (booking.effective_start_at != null && booking.effective_end_at != null) {
      start = new Date(booking.effective_start_at);
      end = new Date(booking.effective_end_at);
    } else {
      const arrival = new Date(booking.booking_date);
      const duration = (booking.service as { duration_minutes?: number } | null)?.duration_minutes ?? 30;
      if (booking.booking_type === "home_service") {
        const travelMin = 30;
        const bufferMin = 15;
        start = new Date(arrival.getTime() - travelMin * 60000);
        end = new Date(arrival.getTime() + duration * 60000 + bufferMin * 60000);
      } else {
        start = arrival;
        end = new Date(arrival.getTime() + duration * 60000);
      }
    }
    // Only include windows that overlap the selected calendar day (so in-shop slots are blocked correctly)
    if (start < endOfDay && end > startOfDay) {
      result.push({ start, end });
    }
  }
  return result;
}

export async function getBlockedSlotsForDate(
  barberId: string,
  date: Date
): Promise<Array<{ start: Date; end: Date }>> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from("barber_blocked_slots")
    .select("start_time, end_time")
    .eq("barber_id", barberId)
    .gte("end_time", startOfDay.toISOString())
    .lte("start_time", endOfDay.toISOString());

  if (error) {
    console.error("Error fetching blocked slots for date:", error);
    return [];
  }

  // Return array of blocked slot time ranges (start and end)
  return (data || []).map((blockedSlot: any) => {
    const start = new Date(blockedSlot.start_time);
    const end = new Date(blockedSlot.end_time);
    return { start, end };
  });
}
