import { createClient } from "./client";

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
  
  // Log the booking data being sent for debugging
  console.log("Creating booking with data:", JSON.stringify(booking, null, 2));
  
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
