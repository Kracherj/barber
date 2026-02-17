import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { cookies } from "next/headers";

// GET - Get barber schedule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_session")?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(sessionToken);
    const supabase = createAdminClient();

    const { data: weeklySchedule, error: weeklyError } = await supabase
      .from("barber_weekly_schedule")
      .select("*, barber_weekly_breaks(*)")
      .eq("barber_id", id)
      .order("day_of_week");

    if (weeklyError) throw weeklyError;

    const { data: dateOverrides, error: overridesError } = await supabase
      .from("barber_date_overrides")
      .select("*, barber_date_breaks(*)")
      .eq("barber_id", id)
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date");

    if (overridesError) throw overridesError;

    const { data: blockedSlots, error: blockedError } = await supabase
      .from("barber_blocked_slots")
      .select("*")
      .eq("barber_id", id)
      .gte("end_time", new Date().toISOString())
      .order("start_time");

    if (blockedError) throw blockedError;

    return NextResponse.json({
      weekly_schedule: weeklySchedule || [],
      date_overrides: dateOverrides || [],
      blocked_slots: blockedSlots || [],
    });
  } catch (error: any) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

// POST - Update weekly schedule
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_session")?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await requireAdmin(sessionToken);
    const supabase = createAdminClient();
    const body = await request.json();

    const { weekly_schedule } = body;

    if (!Array.isArray(weekly_schedule)) {
      return NextResponse.json(
        { error: "weekly_schedule must be an array" },
        { status: 400 }
      );
    }

    // Delete existing schedule
    await supabase
      .from("barber_weekly_schedule")
      .delete()
      .eq("barber_id", id);

    // Insert new schedule
    const scheduleData = weekly_schedule.map((schedule: any) => ({
      barber_id: id,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      is_available: schedule.is_available !== false,
    }));

    const { data: schedules, error: insertError } = await supabase
      .from("barber_weekly_schedule")
      .insert(scheduleData)
      .select();

    if (insertError) throw insertError;

    // Handle breaks if provided
    for (let i = 0; i < weekly_schedule.length; i++) {
      const schedule = weekly_schedule[i];
      if (schedule.breaks && Array.isArray(schedule.breaks)) {
        const scheduleId = schedules[i].id;
        
        // Delete existing breaks
        await supabase
          .from("barber_weekly_breaks")
          .delete()
          .eq("schedule_id", scheduleId);

        // Insert new breaks
        if (schedule.breaks.length > 0) {
          const breaksData = schedule.breaks.map((breakItem: any) => ({
            schedule_id: scheduleId,
            start_time: breakItem.start_time,
            end_time: breakItem.end_time,
            reason: breakItem.reason,
          }));

          await supabase.from("barber_weekly_breaks").insert(breaksData);
        }
      }
    }

    return NextResponse.json({ success: true, schedules });
  } catch (error: any) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update schedule" },
      { status: 500 }
    );
  }
}
