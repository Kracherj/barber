"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarOff, Plus, Trash2, AlertCircle } from "lucide-react";
import { getBarbers } from "@/lib/supabase/queries";
import type { Barber } from "@/lib/supabase/queries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BlockedSlot {
  id: string;
  start_time: string;
  end_time: string;
  reason?: string;
  auto_notify_customers: boolean;
}

export function BlockedSlotsManagement() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>("");
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    start_time: "",
    end_time: "",
    reason: "",
    auto_notify_customers: true,
    action_on_conflicts: "cancel" as "cancel" | "reassign",
    reassign_to_barber_id: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    // Only load if authenticated
    const isAuthenticated = sessionStorage.getItem("admin_authenticated") === "true";
    if (isAuthenticated) {
      loadBarbers();
    }
  }, []);

  useEffect(() => {
    // Only load if authenticated
    const isAuthenticated = sessionStorage.getItem("admin_authenticated") === "true";
    if (isAuthenticated && selectedBarberId) {
      loadBlockedSlots();
    }
  }, [selectedBarberId]);

  const loadBarbers = async () => {
    try {
      const data = await getBarbers();
      setBarbers(data);
      if (data.length > 0 && !selectedBarberId) {
        setSelectedBarberId(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadBlockedSlots = async () => {
    if (!selectedBarberId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/barbers/${selectedBarberId}/schedule`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to load blocked slots");

      const data = await response.json();
      setBlockedSlots(data.blocked_slots || []);
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

  const handleCreateBlockedSlot = async () => {
    if (!selectedBarberId || !formData.start_time || !formData.end_time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/barbers/${selectedBarberId}/blocked-slots`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create blocked slot");
      }

      const data = await response.json();

      toast({
        title: "Success",
        description: `Blocked slot created. ${data.affected_bookings || 0} bookings affected.`,
      });

      setIsDialogOpen(false);
      setFormData({
        start_time: "",
        end_time: "",
        reason: "",
        auto_notify_customers: true,
        action_on_conflicts: "cancel",
        reassign_to_barber_id: "",
      });
      loadBlockedSlots();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!selectedBarberId) return;

    if (
      !confirm(
        "Are you sure you want to delete this blocked time slot? This will make the time slot available for booking again."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/barbers/${selectedBarberId}/blocked-slots?slot_id=${slotId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete blocked slot");
      }

      toast({
        title: "Success",
        description: "Blocked slot deleted successfully",
      });

      loadBlockedSlots();
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
          Blocked Time Slots
        </h2>
        <div className="flex gap-4 items-center">
          <Select value={selectedBarberId} onValueChange={setSelectedBarberId}>
            <SelectTrigger className="w-[200px] min-h-[44px]">
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
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Block Time Slot
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {blockedSlots.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-white/80">
                No blocked slots for this barber
              </CardContent>
            </Card>
          ) : (
            blockedSlots.map((slot) => (
              <Card key={slot.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CalendarOff className="h-5 w-5 text-red-400" />
                        <span className="font-semibold text-white">
                          {new Date(slot.start_time).toLocaleString("fr-FR", {
                            dateStyle: "full",
                            timeStyle: "short",
                          })}
                        </span>
                        <span className="text-white/60">-</span>
                        <span className="text-white">
                          {new Date(slot.end_time).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {slot.reason && (
                        <p className="text-sm text-white/80">{slot.reason}</p>
                      )}
                      {slot.auto_notify_customers && (
                        <div className="flex items-center gap-2 text-sm text-green-400">
                          <AlertCircle className="h-4 w-4" />
                          Customers will be notified automatically
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(slot.id)}
                      className="min-h-[44px] min-w-[44px] p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create Blocked Slot Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Block Time Slot</DialogTitle>
            <DialogDescription>
              Block a specific time period. Existing bookings will be cancelled or
              reassigned.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Date & Time *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                  className="min-h-[44px]"
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Date & Time *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, end_time: e.target.value })
                  }
                  className="min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Emergency, Day off, etc."
                className="min-h-[44px]"
              />
            </div>

            <div>
              <Label>Action on Conflicting Bookings</Label>
              <Select
                value={formData.action_on_conflicts}
                onValueChange={(value: "cancel" | "reassign") =>
                  setFormData({ ...formData, action_on_conflicts: value })
                }
              >
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cancel">Cancel Bookings</SelectItem>
                  <SelectItem value="reassign">Reassign to Another Barber</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.action_on_conflicts === "reassign" && (
              <div>
                <Label>Reassign To Barber</Label>
                <Select
                  value={formData.reassign_to_barber_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, reassign_to_barber_id: value })
                  }
                >
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Select barber" />
                  </SelectTrigger>
                  <SelectContent>
                    {barbers
                      .filter((b) => b.id !== selectedBarberId)
                      .map((barber) => (
                        <SelectItem key={barber.id} value={barber.id}>
                          {barber.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.auto_notify_customers}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    auto_notify_customers: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-white">
                Automatically notify affected customers
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBlockedSlot} className="min-h-[44px]">
              Block Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
