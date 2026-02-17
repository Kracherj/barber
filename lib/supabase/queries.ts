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

export interface Barber {
  id: string;
  name: string;
  name_ar: string;
  is_active?: boolean;
}

export interface Service {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  duration_minutes: number;
  price_tnd: number;
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

export async function getBarbers(includeInactive: boolean = false): Promise<Barber[]> {
  const supabase = createClient();
  let query = supabase
    .from("barbers")
    .select("*")
    .order("name");

  // By default, only return active barbers (for client-side use)
  // Admin can pass includeInactive=true to see all barbers
  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching barbers:", error);
    return [];
  }

  return data || [];
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

export async function createBooking(booking: {
  service_id: string;
  barber_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  booking_date: string;
}): Promise<Booking | null> {
  const supabase = createClient();

  // Validate and sanitize inputs
  validateUUID(booking.service_id, 'service_id');
  validateUUID(booking.barber_id, 'barber_id');
  const sanitizedName = sanitizeString(booking.customer_name, 100);
  const sanitizedPhone = sanitizePhone(booking.customer_phone);
  const sanitizedEmail = sanitizeEmail(booking.customer_email);
  
  // Validate booking_date is a valid ISO string
  const bookingDate = new Date(booking.booking_date);
  if (isNaN(bookingDate.getTime())) {
    throw new Error('INVALID_BOOKING_DATE: Invalid date format');
  }
  
  // Ensure booking_date is in the future
  if (bookingDate < new Date()) {
    throw new Error('INVALID_BOOKING_DATE: Cannot book in the past');
  }

  // Block booking on disabled (closed) dates
  const bookingDateStr = bookingDate.toISOString().slice(0, 10);
  const { data: disabled } = await supabase
    .from("disabled_dates")
    .select("id")
    .eq("date", bookingDateStr)
    .maybeSingle();
  if (disabled) {
    throw new Error("DATE_DISABLED");
  }

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", booking.service_id)
    .single();
  
  if (serviceError || !service) {
    throw new Error("SERVICE_NOT_FOUND");
  }
  
  const durationMinutes = service.duration_minutes;

  const isAvailable = await checkAvailability(
    booking.barber_id,
    bookingDate,
    durationMinutes
  );
  if (!isAvailable) {
    throw new Error("BARBER_UNAVAILABLE");
  }

  // Prepare sanitized booking data
  const sanitizedBooking = {
    service_id: booking.service_id,
    barber_id: booking.barber_id,
    customer_name: sanitizedName,
    customer_phone: sanitizedPhone,
    customer_email: sanitizedEmail,
    booking_date: bookingDate.toISOString(),
  };

  // First, check if there's a cancelled booking at this exact time slot
  // If so, update it instead of creating a new one (workaround for UNIQUE constraint)
  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("barber_id", booking.barber_id)
    .eq("booking_date", sanitizedBooking.booking_date)
    .eq("status", "cancelled")
    .maybeSingle();

  if (existingBooking) {
    // Update the cancelled booking to confirmed with new customer details
    const { data, error } = await supabase
      .from("bookings")
      .update({
        service_id: sanitizedBooking.service_id,
        customer_name: sanitizedBooking.customer_name,
        customer_phone: sanitizedBooking.customer_phone,
        customer_email: sanitizedBooking.customer_email,
        status: "confirmed",
      })
      .eq("id", existingBooking.id)
      .select("*, service:services(*), barber:barbers(*)")
      .single();

    if (error) {
      console.error("Error updating cancelled booking:", error);
      throw new Error(`FAILED_TO_UPDATE_BOOKING: ${error.message}`);
    }

    if (!data) {
      throw new Error("FAILED_TO_UPDATE_BOOKING: No data returned");
    }

    return data;
  }

  // No cancelled booking exists, create a new one
  const { data, error } = await supabase
    .from("bookings")
    .insert(sanitizedBooking)
    .select("*, service:services(*), barber:barbers(*)")
    .single();

  if (error) {
    // Check for UNIQUE constraint violation (PostgreSQL error code 23505)
    const errorCode = (error as any)?.code;
    const errorMessage = (error as any)?.message || '';
    
    // If it's a duplicate booking error, throw a specific error that can be caught
    if (errorCode === '23505' || errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
      throw new Error('DUPLICATE_BOOKING');
    }
    
    // Log other errors for debugging
    console.error("Error creating booking:", {
      code: errorCode,
      message: errorMessage,
      fullError: error
    });
    
    throw new Error(`FAILED_TO_CREATE_BOOKING: ${errorMessage || 'Unknown error'}`);
  }

  if (!data) {
    throw new Error("FAILED_TO_CREATE_BOOKING: No data returned");
  }

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

export async function checkAvailability(
  barberId: string,
  date: Date,
  durationMinutes: number
): Promise<boolean> {
  const endTime = new Date(date.getTime() + durationMinutes * 60000);

  const supabase = createClient();

  const dateStr = toLocalDateString(date);
  const startTimeStr = date.toTimeString().slice(0, 8);
  const endTimeStr = endTime.toTimeString().slice(0, 8);

  const { data: available, error: rpcError } = await supabase.rpc(
    "get_barber_availability",
    {
      p_barber_id: barberId,
      p_date: dateStr,
      p_start_time: startTimeStr,
      p_end_time: endTimeStr,
    }
  );

  if (!rpcError && available === false) {
    return false;
  }

  if (rpcError) {
    console.error("Error checking barber availability RPC:", rpcError);
    return false;
  }

  const { data: conflicting } = await supabase
    .from("bookings")
    .select("id")
    .eq("barber_id", barberId)
    .eq("status", "confirmed")
    .gte("booking_date", date.toISOString())
    .lt("booking_date", endTime.toISOString());

  return (conflicting || []).length === 0;
}

export async function getBookingsForDate(
  barberId: string,
  date: Date
): Promise<Array<{ start: Date; end: Date }>> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("booking_date, service:services(duration_minutes)")
    .eq("barber_id", barberId)
    .eq("status", "confirmed")
    .gte("booking_date", startOfDay.toISOString())
    .lte("booking_date", endOfDay.toISOString());

  if (error) {
    console.error("Error fetching bookings for date:", error);
    return [];
  }

  // Return array of booking time ranges (start and end)
  return (data || []).map((booking: any) => {
    const start = new Date(booking.booking_date);
    const duration = booking.service?.duration_minutes || 30;
    const end = new Date(start.getTime() + duration * 60000);
    return { start, end };
  });
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
