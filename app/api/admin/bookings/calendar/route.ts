import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { cookies } from "next/headers";

// GET - Get calendar view (daily/weekly)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_session")?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(sessionToken);
    const supabase = createAdminClient();

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "daily"; // "daily" or "weekly"
    const startDate = searchParams.get("start_date") || new Date().toISOString().split("T")[0];
    const barberId = searchParams.get("barber_id");
    const serviceId = searchParams.get("service_id");

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + (view === "weekly" ? 7 : 1));

    // Build query
    let query = supabase
      .from("bookings")
      .select(`
        *,
        service:services(*),
        barber:barbers(*)
      `)
      .eq("status", "confirmed")
      .gte("booking_date", start.toISOString())
      .lt("booking_date", end.toISOString())
      .order("booking_date");

    if (barberId) {
      query = query.eq("barber_id", barberId);
    }

    if (serviceId) {
      query = query.eq("service_id", serviceId);
    }

    const { data: bookings, error } = await query;

    if (error) throw error;

    // Get all barbers if no filter
    const barbersToCheck = barberId ? [barberId] : 
      (await supabase.from("barbers").select("id").eq("is_active", true)).data?.map(b => b.id) || [];

    // Get blocked slots for all barbers
    let blockedSlots: any[] = [];
    if (barbersToCheck.length > 0) {
      const { data: blocked } = await supabase
        .from("barber_blocked_slots")
        .select("*")
        .in("barber_id", barbersToCheck)
        .gte("start_time", start.toISOString())
        .lt("end_time", end.toISOString());

      blockedSlots = blocked || [];
    }

    // Get working schedules for availability checking
    const schedules: Record<string, any> = {};
    if (barbersToCheck.length > 0) {
      const { data: weeklySchedules } = await supabase
        .from("barber_weekly_schedule")
        .select("*, barber_weekly_breaks(*)")
        .in("barber_id", barbersToCheck);

      const { data: dateOverrides } = await supabase
        .from("barber_date_overrides")
        .select("*, barber_date_breaks(*)")
        .in("barber_id", barbersToCheck)
        .gte("date", startDate)
        .lt("date", end.toISOString().split("T")[0]);

      // Organize schedules by barber
      weeklySchedules?.forEach((schedule) => {
        if (!schedules[schedule.barber_id]) {
          schedules[schedule.barber_id] = { weekly: [], overrides: [] };
        }
        schedules[schedule.barber_id].weekly.push(schedule);
      });

      dateOverrides?.forEach((override) => {
        if (!schedules[override.barber_id]) {
          schedules[override.barber_id] = { weekly: [], overrides: [] };
        }
        schedules[override.barber_id].overrides.push(override);
      });
    }

    return NextResponse.json({
      bookings: bookings || [],
      blocked_slots: blockedSlots,
      schedules,
      start_date: startDate,
      view,
    });
  } catch (error: any) {
    console.error("Error fetching calendar:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch calendar" },
      { status: 500 }
    );
  }
}
