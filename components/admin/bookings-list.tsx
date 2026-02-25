"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Scissors, User, Phone, Mail, Search, Trash2 } from "lucide-react";
import { getBookings, cancelBooking } from "@/lib/supabase/queries";
import type { Booking } from "@/lib/supabase/queries";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";

export function BookingsList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchDate, setSearchDate] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("admin_authenticated") === "true";
    if (isAuthenticated) {
      loadBookings();
    }
  }, []);

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("admin_authenticated") === "true";
    if (isAuthenticated) {
      loadBookings();
    }
  }, [searchDate]);

  const loadBookings = async () => {
    const isAuthenticated = sessionStorage.getItem("admin_authenticated") === "true";
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const startDate = searchDate
        ? new Date(searchDate)
        : new Date(new Date().setHours(0, 0, 0, 0));
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 90); // Next 90 days (match barber delete check so no "ghost" bookings)

      const data = await getBookings(undefined, startDate, endDate);
      setBookings(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      const success = await cancelBooking(bookingId);
      if (success) {
        toast({
          title: "Booking Cancelled",
          description: "The booking has been cancelled successfully.",
        });
        loadBookings();
      } else {
        toast({
          title: "Cancellation Failed",
          description: "There was an error cancelling the booking.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-heading font-bold text-white">
          Bookings Management
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Filter Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="date" className="text-white">Start Date</Label>
              <Input
                id="date"
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="text-white placeholder:text-white/50 min-h-[44px]"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadBookings} disabled={loading} className="min-h-[44px]">
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Loading..." : "Search"}
              </Button>
            </div>
          </div>
          <p className="text-sm text-white/60 mt-2">
            Shows 90 days from start date. Leave empty for today. (All future bookings in this range can be cancelled before deleting a barber.)
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
          </div>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-white/80">
              No bookings found for the selected period.
            </CardContent>
          </Card>
        ) : (
          bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Scissors className="h-5 w-5 text-gold" />
                      <h3 className="text-lg font-semibold text-white">
                        {booking.service?.name_en}
                      </h3>
                      {booking.booking_type === "home_service" && (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-500/30 text-amber-200">Home</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(new Date(booking.booking_date))}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(new Date(booking.booking_date))}</span>
                    </div>
                    <div className="text-white/80">
                      Barber: {booking.barber?.name}
                    </div>
                    <div className={`px-2 py-1 text-xs rounded inline-block ${
                      booking.status === "confirmed" 
                        ? "bg-green-500/20 text-green-400" 
                        : booking.status === "cancelled"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}>
                      {booking.status}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white/80">
                      <User className="h-4 w-4" />
                      <span>{booking.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Phone className="h-4 w-4" />
                      <span>{booking.customer_phone}</span>
                    </div>
                    {booking.customer_email && (
                      <div className="flex items-center gap-2 text-white/80">
                        <Mail className="h-4 w-4" />
                        <span>{booking.customer_email}</span>
                      </div>
                    )}
                    {booking.booking_type === "home_service" && (booking.customer_address_line || booking.customer_city_zone) && (
                      <div className="text-sm text-white/70">
                        📍 {[booking.customer_address_line, booking.customer_city_zone].filter(Boolean).join(", ")}
                      </div>
                    )}
                    <div className="text-lg font-semibold text-gold">
                      {booking.total_price_tnd != null
                        ? formatCurrency(booking.total_price_tnd)
                        : booking.service && formatCurrency(booking.service.price_tnd)}
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    {booking.status === "confirmed" && (
                      <Button
                        variant="destructive"
                        onClick={() => handleCancel(booking.id)}
                        className="min-h-[44px]"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cancel Booking
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
