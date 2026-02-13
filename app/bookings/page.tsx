"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBookingsByPhone, cancelBooking } from "@/lib/supabase/queries";
import type { Booking } from "@/lib/supabase/queries";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Scissors, X } from "lucide-react";
import { Footer } from "@/components/footer";

export default function BookingsPage() {
  const [phone, setPhone] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!phone.trim()) {
      toast({
        title: "Phone Required",
        description: "Please enter your phone number to view bookings.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const data = await getBookingsByPhone(phone);
    setBookings(data);
    setLoading(false);

    if (data.length === 0) {
      toast({
        title: "No Bookings Found",
        description: "We couldn't find any bookings for this phone number.",
      });
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (
      !confirm(
        language === "ar"
          ? "هل أنت متأكد من إلغاء هذا الحجز؟"
          : "Are you sure you want to cancel this booking?"
      )
    ) {
      return;
    }

    const success = await cancelBooking(bookingId);
    if (success) {
      toast({
        title: "Booking Cancelled",
        description:
          language === "ar"
            ? "تم إلغاء الحجز بنجاح"
            : "Your booking has been cancelled successfully.",
      });
      handleSearch(); // Refresh bookings
    } else {
      toast({
        title: "Cancellation Failed",
        description:
          language === "ar"
            ? "حدث خطأ أثناء إلغاء الحجز"
            : "There was an error cancelling your booking.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-beige py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-navy text-center mb-8">
            {language === "ar" ? "حجوزاتي" : "My Bookings"}
          </h1>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {language === "ar"
                  ? "ابحث عن حجوزاتك"
                  : "Search for Your Bookings"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="phone">
                    {language === "ar" ? "رقم الهاتف" : "Phone Number"}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+216 XX XXX XXX"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch} disabled={loading}>
                    {loading
                      ? language === "ar"
                        ? "جاري البحث..."
                        : "Searching..."
                      : language === "ar"
                      ? "بحث"
                      : "Search"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {bookings.length > 0 && (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Scissors className="h-5 w-5 text-gold" />
                          <h3 className="text-xl font-semibold text-navy">
                            {language === "ar"
                              ? booking.service?.name_ar
                              : booking.service?.name_en}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-navy/70">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(new Date(booking.booking_date))}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-navy/70">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatTime(new Date(booking.booking_date))}
                          </span>
                        </div>
                        <div className="text-navy/70">
                          {language === "ar"
                            ? `الحلاق: ${booking.barber?.name_ar}`
                            : `Barber: ${booking.barber?.name}`}
                        </div>
                        <div className="text-lg font-semibold text-gold">
                          {booking.service &&
                            formatCurrency(booking.service.price_tnd)}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={() => handleCancel(booking.id)}
                        className="md:ml-auto"
                      >
                        <X className="h-4 w-4 mr-2" />
                        {language === "ar" ? "إلغاء" : "Cancel"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
