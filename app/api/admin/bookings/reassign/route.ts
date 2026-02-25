import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { cookies } from "next/headers";

// POST - Reassign bookings
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
      booking_ids,
      new_barber_id,
      reason,
      notify_customers = true,
    } = body;

    if (!Array.isArray(booking_ids) || booking_ids.length === 0) {
      return NextResponse.json(
        { error: "booking_ids array is required" },
        { status: 400 }
      );
    }

    if (!new_barber_id) {
      return NextResponse.json(
        { error: "new_barber_id is required" },
        { status: 400 }
      );
    }

    // Fetch bookings to reassign
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("*, service:services(duration_minutes), barber:barbers(id, name)")
      .in("id", booking_ids)
      .eq("status", "confirmed");

    if (bookingsError) throw bookingsError;

    if (!bookings || bookings.length === 0) {
      return NextResponse.json(
        { error: "No confirmed bookings found" },
        { status: 404 }
      );
    }

    const reassignments = [];
    const failures = [];

    for (const booking of bookings) {
      const bookingDate = new Date(booking.booking_date);
      const serviceDuration = (booking.service as any)?.duration_minutes || 30;
      const bookingEnd = new Date(bookingDate.getTime() + serviceDuration * 60000);

      // Check if barber is active
      const { data: barber } = await supabase
        .from("barbers")
        .select("is_active")
        .eq("id", new_barber_id)
        .single();

      if (!barber || barber.is_active === false) {
        failures.push({
          booking_id: booking.id,
          reason: "Barber is not active",
        });
        continue;
      }

      // Check barber availability: RPC expects salon local (Africa/Tunis) date + time
      const tunisOpt = { timeZone: "Africa/Tunis" as const };
      const dateStr = bookingDate.toLocaleDateString("en-CA", tunisOpt);
      const startTimeStr = bookingDate.toLocaleTimeString("en-GB", { ...tunisOpt, hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const endTimeStr = bookingEnd.toLocaleTimeString("en-GB", { ...tunisOpt, hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

      const { data: available, error: availabilityError } = await supabase.rpc(
        "get_barber_availability",
        {
          p_barber_id: new_barber_id,
          p_date: dateStr,
          p_start_time: startTimeStr,
          p_end_time: endTimeStr,
        }
      );

      if (availabilityError) {
        failures.push({
          booking_id: booking.id,
          reason: `Availability check failed: ${availabilityError.message}`,
        });
        continue;
      }

      if (available === false) {
        failures.push({
          booking_id: booking.id,
          reason: "Barber is not available at this time (schedule, break, or already booked)",
        });
        continue;
      }

      // Overlap check: another confirmed booking for new barber with overlapping effective window
      const effectiveStart = booking.effective_start_at ?? booking.booking_date;
      const effectiveEnd = booking.effective_end_at ?? bookingEnd.toISOString();
      const { data: overlapping } = await supabase
        .from("bookings")
        .select("id")
        .eq("barber_id", new_barber_id)
        .eq("status", "confirmed")
        .lt("effective_start_at", effectiveEnd)
        .gt("effective_end_at", effectiveStart)
        .limit(1);

      if (overlapping && overlapping.length > 0) {
        failures.push({
          booking_id: booking.id,
          reason: "Time slot already booked (overlapping window)",
        });
        continue;
      }

      const oldBarberId = booking.barber_id;

      // Reassign booking
      const { data: updatedBooking, error: updateError } = await supabase
        .from("bookings")
        .update({ barber_id: new_barber_id })
        .eq("id", booking.id)
        .select()
        .single();

      if (updateError) {
        failures.push({
          booking_id: booking.id,
          reason: updateError.message,
        });
        continue;
      }

      // Verify the update was successful
      if (!updatedBooking || updatedBooking.barber_id !== new_barber_id) {
        failures.push({
          booking_id: booking.id,
          reason: "Failed to verify booking reassignment",
        });
        continue;
      }

      // Log reassignment
      await supabase.from("booking_reassignments").insert({
        booking_id: booking.id,
        old_barber_id: oldBarberId,
        new_barber_id: new_barber_id,
        reason: reason || "Admin reassignment",
        created_by: admin.id,
      });

      // Create notification
      if (notify_customers) {
        await supabase.from("notifications").insert({
          booking_id: booking.id,
          customer_phone: booking.customer_phone,
          customer_email: booking.customer_email,
          notification_type: "booking_reassigned",
          channel: "sms",
          status: "pending",
          message: `Votre rendez-vous a été réassigné. Nouvelle date: ${bookingDate.toLocaleDateString("fr-FR")} à ${bookingDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`,
        });
      }

      reassignments.push({
        booking_id: booking.id,
        success: true,
      });
    }

    return NextResponse.json({
      success: true,
      reassigned: reassignments.length,
      failed: failures.length,
      reassignments,
      failures,
    });
  } catch (error: any) {
    console.error("Error reassigning bookings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reassign bookings" },
      { status: 500 }
    );
  }
}
