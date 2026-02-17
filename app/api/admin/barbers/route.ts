import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { cookies } from "next/headers";

// GET - List all barbers
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_session")?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(sessionToken);
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("barbers")
      .select(`
        *,
        barber_services(service_id),
        barber_weekly_schedule(*)
      `)
      .order("name");

    if (error) {
      throw error;
    }

    return NextResponse.json({ barbers: data || [] });
  } catch (error: any) {
    console.error("Error fetching barbers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch barbers" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

// POST - Create new barber
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_session")?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await requireAdmin(sessionToken);
    const supabase = createAdminClient();
    const body = await request.json();

    const {
      name,
      name_ar,
      photo_url,
      time_slot_duration_minutes = 30,
      service_ids = [],
      weekly_schedule = [],
    } = body;

    if (!name || !name_ar) {
      return NextResponse.json(
        { error: "Name and name_ar are required" },
        { status: 400 }
      );
    }

    // Start transaction-like operation
    const { data: barber, error: barberError } = await supabase
      .from("barbers")
      .insert({
        name,
        name_ar,
        photo_url,
        time_slot_duration_minutes,
        is_active: true,
      })
      .select()
      .single();

    if (barberError) {
      throw barberError;
    }

    // Link services
    if (service_ids.length > 0) {
      const barberServices = service_ids.map((serviceId: string) => ({
        barber_id: barber.id,
        service_id: serviceId,
      }));

      const { error: servicesError } = await supabase
        .from("barber_services")
        .insert(barberServices);

      if (servicesError) {
        // Rollback barber creation
        await supabase.from("barbers").delete().eq("id", barber.id);
        throw servicesError;
      }
    }

    // Create weekly schedule
    if (weekly_schedule.length > 0) {
      const scheduleData = weekly_schedule.map((schedule: any) => ({
        barber_id: barber.id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        is_available: schedule.is_available !== false,
      }));

      const { error: scheduleError } = await supabase
        .from("barber_weekly_schedule")
        .insert(scheduleData);

      if (scheduleError) {
        console.error("Schedule creation error:", scheduleError);
        // Don't rollback - schedule can be added later
      }
    }

    return NextResponse.json({ barber });
  } catch (error: any) {
    console.error("Error creating barber:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create barber" },
      { status: 500 }
    );
  }
}
