"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBookings } from "@/lib/supabase/queries";
import type { Booking } from "@/lib/supabase/queries";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Scissors, User, Phone, Mail, Search } from "lucide-react";
import { cancelBooking } from "@/lib/supabase/queries";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchDate, setSearchDate] = useState<string>("");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated
    const auth = sessionStorage.getItem("admin_authenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
      loadBookings();
    }
  }, []);

  const handleLogin = () => {
    if (password === "hajadmin2026") {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_authenticated", "true");
      loadBookings();
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard.",
      });
    } else {
      toast({
        title: "Invalid Password",
        description: "Please enter the correct admin password.",
        variant: "destructive",
      });
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    const startDate = searchDate
      ? new Date(searchDate)
      : new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7); // Next 7 days

    const data = await getBookings(undefined, startDate, endDate);
    setBookings(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadBookings();
    }
  }, [searchDate, isAuthenticated]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

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
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Admin Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Enter admin password"
                />
              </div>
              <Button onClick={handleLogin} className="w-full" size="lg">
                Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-heading font-bold text-navy">
              Admin Dashboard
            </h1>
            <Button
              variant="outline"
              onClick={() => {
                setIsAuthenticated(false);
                sessionStorage.removeItem("admin_authenticated");
                router.push("/");
              }}
            >
              Logout
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="date">Start Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={loadBookings} disabled={loading}>
                    <Search className="h-4 w-4 mr-2" />
                    {loading ? "Loading..." : "Search"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
              </div>
            ) : bookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-navy/70">
                  No bookings found for the selected period.
                </CardContent>
              </Card>
            ) : (
              bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Scissors className="h-5 w-5 text-gold" />
                          <h3 className="text-lg font-semibold text-navy">
                            {booking.service?.name_en}
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
                          Barber: {booking.barber?.name}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-navy/70">
                          <User className="h-4 w-4" />
                          <span>{booking.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-navy/70">
                          <Phone className="h-4 w-4" />
                          <span>{booking.customer_phone}</span>
                        </div>
                        {booking.customer_email && (
                          <div className="flex items-center gap-2 text-navy/70">
                            <Mail className="h-4 w-4" />
                            <span>{booking.customer_email}</span>
                          </div>
                        )}
                        <div className="text-lg font-semibold text-gold">
                          {booking.service &&
                            formatCurrency(booking.service.price_tnd)}
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <Button
                          variant="destructive"
                          onClick={() => handleCancel(booking.id)}
                        >
                          Cancel Booking
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
