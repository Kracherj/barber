import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { cookies } from "next/headers";

// POST - Create blocked slot
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

    const {
      start_time,
      end_time,
      reason,
      auto_notify_customers = true,
      action_on_conflicts = "cancel", // "cancel" or "reassign"
      reassign_to_barber_id,
    } = body;

    if (!start_time || !end_time) {
      return NextResponse.json(
        { error: "start_time and end_time are required" },
        { status: 400 }
      );
    }

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: "start_time must be before end_time" },
        { status: 400 }
      );
    }

    // Check for conflicting bookings
    const { data: conflictingBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, booking_date, customer_name, customer_phone, customer_email, service:services(duration_minutes)")
      .eq("barber_id", id)
      .eq("status", "confirmed")
      .gte("booking_date", startDate.toISOString())
      .lt("booking_date", endDate.toISOString());

    if (bookingsError) throw bookingsError;

    // Handle conflicts
    if (conflictingBookings && conflictingBookings.length > 0) {
      if (action_on_conflicts === "reassign" && reassign_to_barber_id) {
        // Reassign bookings
        for (const booking of conflictingBookings) {
          const bookingDate = new Date(booking.booking_date);
          const serviceDuration = (booking.service as any)?.duration_minutes || 30;
          const bookingEnd = new Date(bookingDate.getTime() + serviceDuration * 60000);

          // Check if reassignment is possible - check for existing bookings first
          const { data: existingBooking } = await supabase
            .from("bookings")
            .select("id")
            .eq("barber_id", reassign_to_barber_id)
            .eq("status", "confirmed")
            .eq("booking_date", booking.booking_date)
            .maybeSingle();

          const available = !existingBooking;

          if (available) {
            // Reassign
            await supabase
              .from("bookings")
              .update({ barber_id: reassign_to_barber_id })
              .eq("id", booking.id);

            // Log reassignment
            await supabase.from("booking_reassignments").insert({
              booking_id: booking.id,
              old_barber_id: id,
              new_barber_id: reassign_to_barber_id,
              reason: reason || "Barber unavailable - auto-reassigned",
              created_by: admin.id,
            });

            // Create notification
            if (auto_notify_customers) {
              await supabase.from("notifications").insert({
                booking_id: booking.id,
                customer_phone: booking.customer_phone,
                customer_email: booking.customer_email,
                notification_type: "booking_reassigned",
                channel: "sms",
                status: "pending",
                message: `Votre rendez-vous a été réassigné à un autre coiffeur. Date: ${bookingDate.toLocaleDateString("fr-FR")} ${bookingDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
              });
            }
          } else {
            // Cannot reassign - cancel instead
            await supabase
              .from("bookings")
              .update({ status: "cancelled" })
              .eq("id", booking.id);

            if (auto_notify_customers) {
              await supabase.from("notifications").insert({
                booking_id: booking.id,
                customer_phone: booking.customer_phone,
                customer_email: booking.customer_email,
                notification_type: "booking_cancelled",
                channel: "sms",
                status: "pending",
                message: `Votre rendez-vous du ${bookingDate.toLocaleDateString("fr-FR")} à ${bookingDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} a été annulé. Veuillez réserver un nouveau créneau.`,
              });
            }
          }
        }
      } else {
        // Cancel all conflicting bookings
        const bookingIds = conflictingBookings.map((b) => b.id);
        await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .in("id", bookingIds);

        // Create notifications
        if (auto_notify_customers) {
          const notifications = conflictingBookings.map((booking) => {
            const bookingDate = new Date(booking.booking_date);
            return {
              booking_id: booking.id,
              customer_phone: booking.customer_phone,
              customer_email: booking.customer_email,
              notification_type: "booking_cancelled" as const,
              channel: "sms" as const,
              status: "pending" as const,
              message: `Votre rendez-vous du ${bookingDate.toLocaleDateString("fr-FR")} à ${bookingDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} a été annulé. Raison: ${reason || "Indisponibilité"}. Veuillez réserver un nouveau créneau.`,
            };
          });

          await supabase.from("notifications").insert(notifications);
        }
      }
    }

    // Create blocked slot
    const { data: blockedSlot, error: insertError } = await supabase
      .from("barber_blocked_slots")
      .insert({
        barber_id: id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        reason,
        auto_notify_customers,
        created_by: admin.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      blocked_slot: blockedSlot,
      affected_bookings: conflictingBookings?.length || 0,
    });
  } catch (error: any) {
    console.error("Error creating blocked slot:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create blocked slot" },
      { status: 500 }
    );
  }
}

// DELETE - Delete blocked slot
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
    
    // Get slot_id from query parameters
    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get("slot_id");

    if (!slotId) {
      return NextResponse.json(
        { error: "slot_id query parameter is required" },
        { status: 400 }
      );
    }

    // Verify the blocked slot belongs to this barber
    const { data: blockedSlot, error: fetchError } = await supabase
      .from("barber_blocked_slots")
      .select("barber_id")
      .eq("id", slotId)
      .single();

    if (fetchError || !blockedSlot) {
      return NextResponse.json(
        { error: "Blocked slot not found" },
        { status: 404 }
      );
    }

    if (blockedSlot.barber_id !== id) {
      return NextResponse.json(
        { error: "Blocked slot does not belong to this barber" },
        { status: 403 }
      );
    }

    // Delete the blocked slot
    const { error: deleteError } = await supabase
      .from("barber_blocked_slots")
      .delete()
      .eq("id", slotId);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      message: "Blocked slot deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting blocked slot:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete blocked slot" },
      { status: 500 }
    );
  }
}
