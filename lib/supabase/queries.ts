import { createClient } from "./client";
import { toLocalDateString } from "@/lib/utils";

export interface Barber {
  id: string;
  name: string;
  name_ar: string;
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

export async function getBarbers(): Promise<Barber[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("barbers")
    .select("*")
    .order("name");

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

  // Block booking on disabled (closed) dates
  const bookingDateStr = booking.booking_date.slice(0, 10);
  const { data: disabled } = await supabase
    .from("disabled_dates")
    .select("id")
    .eq("date", bookingDateStr)
    .maybeSingle();
  if (disabled) {
    throw new Error("DATE_DISABLED");
  }

  // First, check if there's a cancelled booking at this exact time slot
  // If so, update it instead of creating a new one (workaround for UNIQUE constraint)
  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("barber_id", booking.barber_id)
    .eq("booking_date", booking.booking_date)
    .eq("status", "cancelled")
    .maybeSingle();

  if (existingBooking) {
    // Update the cancelled booking to confirmed with new customer details
    const { data, error } = await supabase
      .from("bookings")
      .update({
        service_id: booking.service_id,
        customer_name: booking.customer_name,
        customer_phone: booking.customer_phone,
        customer_email: booking.customer_email,
        status: "confirmed",
      })
      .eq("id", existingBooking.id)
      .select("*, service:services(*), barber:barbers(*)")
      .single();

    if (error) {
      console.error("Error updating cancelled booking:", error);
      return null;
    }

    return data;
  }

  // No cancelled booking exists, create a new one
  const { data, error } = await supabase
    .from("bookings")
    .insert(booking)
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
    
    return null;
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
    return false;
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

export async function checkAvailability(
  barberId: string,
  date: Date,
  durationMinutes: number
): Promise<boolean> {
  const endTime = new Date(date.getTime() + durationMinutes * 60000);
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, booking_date")
    .eq("barber_id", barberId)
    .eq("status", "confirmed")
    .gte("booking_date", date.toISOString())
    .lt("booking_date", endTime.toISOString());

  if (error) {
    console.error("Error checking availability:", error);
    return false;
  }

  return (data || []).length === 0;
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
