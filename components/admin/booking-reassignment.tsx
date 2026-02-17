"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Search, CheckCircle2, XCircle } from "lucide-react";
import { getBarbers } from "@/lib/supabase/queries";
import type { Barber } from "@/lib/supabase/queries";
import { formatDate, formatTime } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface Booking {
  id: string;
  booking_date: string;
  customer_name: string;
  customer_phone: string;
  barber: { id: string; name: string };
  service: { name_en: string; duration_minutes: number };
}

export function BookingReassignment() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [searchBarberId, setSearchBarberId] = useState<string>("");
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [newBarberId, setNewBarberId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [notifyCustomers, setNotifyCustomers] = useState(true);
  const [reassigning, setReassigning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Only load if authenticated
    const isAuthenticated = sessionStorage.getItem("admin_authenticated") === "true";
    if (isAuthenticated) {
      loadBarbers();
      loadBookings();
    }
  }, []);

  useEffect(() => {
    // Only load if authenticated
    const isAuthenticated = sessionStorage.getItem("admin_authenticated") === "true";
    if (isAuthenticated) {
      loadBookings();
    }
  }, [searchBarberId]);

  const loadBarbers = async () => {
    try {
      const data = await getBarbers();
      setBarbers(data.filter((b) => b.is_active));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // Next 30 days

      const params = new URLSearchParams({
        view: "weekly",
        start_date: startDate.toISOString().split("T")[0],
      });

      if (searchBarberId) {
        params.append("barber_id", searchBarberId);
      }

      const response = await fetch(`/api/admin/bookings/calendar?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to load bookings");

      const data = await response.json();
      setBookings(data.bookings || []);
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

  const handleReassign = async () => {
    if (selectedBookings.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one booking",
        variant: "destructive",
      });
      return;
    }

    if (!newBarberId) {
      toast({
        title: "Error",
        description: "Please select a barber to reassign to",
        variant: "destructive",
      });
      return;
    }

    setReassigning(true);
    try {
      const response = await fetch("/api/admin/bookings/reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_ids: Array.from(selectedBookings),
          new_barber_id: newBarberId,
          reason,
          notify_customers: notifyCustomers,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reassign bookings");
      }

      const data = await response.json();

      toast({
        title: "Success",
        description: `${data.reassigned} bookings reassigned successfully. ${data.failed} failed.`,
      });

      setIsReassignDialogOpen(false);
      setSelectedBookings(new Set());
      setNewBarberId("");
      setReason("");
      loadBookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setReassigning(false);
    }
  };

  const toggleBookingSelection = (bookingId: string) => {
    const newSelection = new Set(selectedBookings);
    if (newSelection.has(bookingId)) {
      newSelection.delete(bookingId);
    } else {
      newSelection.add(bookingId);
    }
    setSelectedBookings(newSelection);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-heading font-bold text-white">
          Booking Reassignment
        </h2>
        <div className="flex gap-4 items-center">
              <Select value={searchBarberId || "all"} onValueChange={(value) => setSearchBarberId(value === "all" ? "" : value)}>
                <SelectTrigger className="w-[200px] min-h-[44px]">
                  <SelectValue placeholder="Filter by barber" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Barbers</SelectItem>
                  {barbers.map((barber) => (
                    <SelectItem key={barber.id} value={barber.id}>
                      {barber.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          <Button
            onClick={() => setIsReassignDialogOpen(true)}
            disabled={selectedBookings.size === 0}
            className="min-h-[44px]"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Reassign Selected ({selectedBookings.size})
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-white/80">
                No bookings found
              </CardContent>
            </Card>
          ) : (
            bookings.map((booking) => {
              const bookingDate = new Date(booking.booking_date);
              const isSelected = selectedBookings.has(booking.id);

              return (
                <Card
                  key={booking.id}
                  className={isSelected ? "border-gold border-2" : ""}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() =>
                          toggleBookingSelection(booking.id)
                        }
                        className="mt-1 min-w-[20px] min-h-[20px]"
                      />
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-white/60 mb-1">Customer</p>
                          <p className="font-semibold text-white">
                            {booking.customer_name}
                          </p>
                          <p className="text-sm text-white/80">
                            {booking.customer_phone}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-white/60 mb-1">Date & Time</p>
                          <p className="font-semibold text-white">
                            {formatDate(bookingDate)}
                          </p>
                          <p className="text-sm text-white/80">
                            {formatTime(bookingDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-white/60 mb-1">Service</p>
                          <p className="font-semibold text-white">
                            {booking.service.name_en}
                          </p>
                          <p className="text-sm text-white/80">
                            {booking.service.duration_minutes} min
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-white/60 mb-1">Current Barber</p>
                          <p className="font-semibold text-white">
                            {booking.barber.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Reassign Dialog */}
      <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Bookings</DialogTitle>
            <DialogDescription>
              Reassign {selectedBookings.size} booking(s) to another barber. The
              system will check availability automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>New Barber *</Label>
              <Select value={newBarberId} onValueChange={setNewBarberId}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select barber" />
                </SelectTrigger>
                <SelectContent>
                  {barbers.map((barber) => (
                    <SelectItem key={barber.id} value={barber.id}>
                      {barber.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Reason (optional)</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Barber unavailable"
                className="min-h-[44px]"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyCustomers}
                onChange={(e) => setNotifyCustomers(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-white">
                Notify customers automatically
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReassignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReassign}
              disabled={!newBarberId || reassigning}
              className="min-h-[44px]"
            >
              {reassigning ? "Reassigning..." : "Reassign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
