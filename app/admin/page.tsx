"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBookings, getDisabledDates, addDisabledDate, removeDisabledDate } from "@/lib/supabase/queries";
import type { Booking, DisabledDate } from "@/lib/supabase/queries";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Scissors, User, Phone, Mail, Search, CalendarOff, Trash2 } from "lucide-react";
import { cancelBooking } from "@/lib/supabase/queries";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchDate, setSearchDate] = useState<string>("");
  const [disabledDates, setDisabledDates] = useState<DisabledDate[]>([]);
  const [newDisabledDate, setNewDisabledDate] = useState<string>("");
  const [disablingDate, setDisablingDate] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const auth = sessionStorage.getItem("admin_authenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
      loadBookings();
      loadDisabledDates();
    }
  }, []);

  const handleLogin = () => {
    if (password === "hajadmin2026") {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_authenticated", "true");
      loadBookings();
      loadDisabledDates();
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur l'administration.",
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

  const loadDisabledDates = async () => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 365);
    const data = await getDisabledDates(from, to);
    setDisabledDates(data);
  };

  const handleAddDisabledDate = async () => {
    if (!newDisabledDate.trim()) {
      toast({ title: "Choisissez une date", variant: "destructive" });
      return;
    }
    setDisablingDate(true);
    const ok = await addDisabledDate(newDisabledDate.trim());
    setDisablingDate(false);
    if (ok) {
      toast({ title: "Jour désactivé", description: "Les clients ne pourront pas réserver ce jour." });
      setNewDisabledDate("");
      loadDisabledDates();
    } else {
      toast({ title: "Erreur", description: "Impossible d'ajouter cette date (peut-être déjà désactivée).", variant: "destructive" });
    }
  };

  const handleRemoveDisabledDate = async (date: string) => {
    const ok = await removeDisabledDate(date);
    if (ok) {
      toast({ title: "Jour réactivé", description: "Les clients peuvent à nouveau réserver ce jour." });
      loadDisabledDates();
    } else {
      toast({ title: "Erreur", description: "Impossible de réactiver cette date.", variant: "destructive" });
    }
  };

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
              <CardTitle className="text-white">Admin Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Enter admin password"
                  className="text-white placeholder:text-white/50"
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
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <h1 className="text-4xl font-heading font-bold text-white">
              Admin Dashboard
            </h1>
            <Button
              variant="outline"
              onClick={() => {
                setIsAuthenticated(false);
                sessionStorage.removeItem("admin_authenticated");
                router.push("/");
              }}
              className="min-h-[44px] px-6 py-2.5 font-semibold hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
            >
              Logout
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-white">Filtrer les réservations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="date" className="text-white">Date de début</Label>
                  <Input
                    id="date"
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="text-white placeholder:text-white/50"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={loadBookings} disabled={loading}>
                    <Search className="h-4 w-4 mr-2" />
                    {loading ? "Chargement..." : "Rechercher"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CalendarOff className="h-5 w-5 text-gold" />
                Jours fermés (congés / indisponibilité)
              </CardTitle>
              <p className="text-sm text-white/80 mt-1">
                Les jours ajoutés ici seront désactivés dans le calendrier de réservation : les clients ne pourront pas choisir ces dates.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <Label htmlFor="disabled-date" className="text-white">Ajouter un jour fermé</Label>
                  <Input
                    id="disabled-date"
                    type="date"
                    value={newDisabledDate}
                    onChange={(e) => setNewDisabledDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="min-w-[180px] text-white placeholder:text-white/50"
                  />
                </div>
                <Button onClick={handleAddDisabledDate} disabled={disablingDate}>
                  {disablingDate ? "Ajout..." : "Désactiver ce jour"}
                </Button>
              </div>
              {disabledDates.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-white/90">Jours actuellement désactivés</Label>
                  <ul className="mt-2 space-y-2">
                    {disabledDates.map((d) => (
                      <li
                        key={d.id}
                        className="flex items-center justify-between gap-4 py-2 px-3 rounded-md bg-navy/5 border border-navy/10"
                      >
                        <span className="font-medium text-white">{formatDate(new Date(d.date + "T12:00:00"))}</span>
                        {d.reason && <span className="text-white/70 text-sm">{d.reason}</span>}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveDisabledDate(d.date)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Réactiver
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {disabledDates.length === 0 && (
                <p className="text-sm text-white/70">Aucun jour fermé pour l’instant.</p>
              )}
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
                        <div className="flex items-center gap-2">
                          <Scissors className="h-5 w-5 text-gold" />
                          <h3 className="text-lg font-semibold text-white">
                            {booking.service?.name_en}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-white/80">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(new Date(booking.booking_date))}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatTime(new Date(booking.booking_date))}
                          </span>
                        </div>
                        <div className="text-white/80">
                          Barber: {booking.barber?.name}
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
