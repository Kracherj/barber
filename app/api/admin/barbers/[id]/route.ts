import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { cookies } from "next/headers";

// GET - Get single barber with full details
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

    const { data, error } = await supabase
      .from("barbers")
      .select(`
        *,
        barber_services(service_id, service:services(*)),
        barber_weekly_schedule(*, barber_weekly_breaks(*)),
        barber_date_overrides(*, barber_date_breaks(*))
      `)
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ barber: data });
  } catch (error: any) {
    console.error("Error fetching barber:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch barber" },
      { status: 500 }
    );
  }
}

// PATCH - Update barber
export async function PATCH(
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
    const body = await request.json();

    const {
      name,
      name_ar,
      photo_url,
      time_slot_duration_minutes,
      is_active,
      service_ids,
      home_service_enabled,
      home_travel_minutes,
      home_buffer_minutes,
      max_home_visits_per_day,
      home_travel_radius_km,
    } = body;

    // Check for future bookings if deactivating
    if (is_active === false) {
      const { count } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("barber_id", id)
        .eq("status", "confirmed")
        .gt("booking_date", new Date().toISOString());

      if (count && count > 0) {
        return NextResponse.json(
          {
            error: `Cannot deactivate barber with ${count} future bookings. Please reassign or cancel bookings first.`,
            future_bookings_count: count,
          },
          { status: 400 }
        );
      }
    }

    // Update barber
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (name_ar !== undefined) updateData.name_ar = name_ar;
    if (photo_url !== undefined) updateData.photo_url = photo_url;
    if (time_slot_duration_minutes !== undefined)
      updateData.time_slot_duration_minutes = time_slot_duration_minutes;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (home_service_enabled !== undefined) updateData.home_service_enabled = home_service_enabled;
    if (home_travel_minutes !== undefined) updateData.home_travel_minutes = home_travel_minutes;
    if (home_buffer_minutes !== undefined) updateData.home_buffer_minutes = home_buffer_minutes;
    if (max_home_visits_per_day !== undefined) updateData.max_home_visits_per_day = max_home_visits_per_day;
    if (home_travel_radius_km !== undefined) updateData.home_travel_radius_km = home_travel_radius_km;

    const { data: barber, error: updateError } = await supabase
      .from("barbers")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Update services if provided
    if (service_ids !== undefined) {
      // Delete existing links
      await supabase
        .from("barber_services")
        .delete()
        .eq("barber_id", id);

      // Insert new links
      if (service_ids.length > 0) {
        const barberServices = service_ids.map((serviceId: string) => ({
          barber_id: id,
          service_id: serviceId,
        }));

        await supabase.from("barber_services").insert(barberServices);
      }
    }

    return NextResponse.json({ barber });
  } catch (error: any) {
    console.error("Error updating barber:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update barber" },
      { status: 500 }
    );
  }
}

// DELETE - Delete barber (only if no future bookings)
export async function DELETE(
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

    // Check for future bookings
    const { data: futureBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, booking_date, customer_name, customer_phone")
      .eq("barber_id", id)
      .eq("status", "confirmed")
      .gt("booking_date", new Date().toISOString());

    if (bookingsError) {
      throw bookingsError;
    }

    if (futureBookings && futureBookings.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete barber with future bookings",
          future_bookings: futureBookings,
          count: futureBookings.length,
        },
        { status: 400 }
      );
    }

    // Delete barber (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from("barbers")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting barber:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete barber" },
      { status: 500 }
    );
  }
}
