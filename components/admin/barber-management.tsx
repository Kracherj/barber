"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, X, Check, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getServices } from "@/lib/supabase/queries";
import type { Service } from "@/lib/supabase/queries";

interface Barber {
  id: string;
  name: string;
  name_ar: string;
  photo_url?: string;
  is_active: boolean;
  time_slot_duration_minutes: number;
  barber_services?: Array<{ service_id: string }>;
  home_service_enabled?: boolean;
  home_travel_minutes?: number | null;
  home_buffer_minutes?: number | null;
  max_home_visits_per_day?: number | null;
  home_travel_radius_km?: number | null;
}

export function BarberManagement() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    photo_url: "",
    time_slot_duration_minutes: 30,
    service_ids: [] as string[],
    home_service_enabled: false,
    home_travel_minutes: 30,
    home_buffer_minutes: 15,
    max_home_visits_per_day: 5,
    home_travel_radius_km: null as number | null,
  });
  const { toast } = useToast();

  useEffect(() => {
    // Only load if authenticated
    const isAuthenticated = sessionStorage.getItem("admin_authenticated") === "true";
    if (isAuthenticated) {
      loadBarbers();
      loadServices();
    }
  }, []);

  const loadBarbers = async () => {
    // Check authentication first
    const isAuthenticated = sessionStorage.getItem("admin_authenticated") === "true";
    if (!isAuthenticated) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/barbers", {
        credentials: "include",
      });
      
      if (response.status === 401) {
        sessionStorage.removeItem("admin_authenticated");
        window.location.href = "/admin";
        return;
      }
      
      if (!response.ok) throw new Error("Failed to load barbers");
      const data = await response.json();
      setBarbers(data.barbers || []);
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

  const loadServices = async () => {
    try {
      const data = await getServices();
      setServices(data);
    } catch (error: any) {
      console.error("Error loading services:", error);
    }
  };

  const handleOpenDialog = (barber?: Barber) => {
    if (barber) {
      setEditingBarber(barber);
      setFormData({
        name: barber.name,
        name_ar: barber.name_ar,
        photo_url: barber.photo_url || "",
        time_slot_duration_minutes: barber.time_slot_duration_minutes || 30,
        service_ids: barber.barber_services?.map((bs) => bs.service_id) || [],
        home_service_enabled: barber.home_service_enabled ?? false,
        home_travel_minutes: barber.home_travel_minutes ?? 30,
        home_buffer_minutes: barber.home_buffer_minutes ?? 15,
        max_home_visits_per_day: barber.max_home_visits_per_day ?? 5,
        home_travel_radius_km: barber.home_travel_radius_km ?? null,
      });
    } else {
      setEditingBarber(null);
      setFormData({
        name: "",
        name_ar: "",
        photo_url: "",
        time_slot_duration_minutes: 30,
        service_ids: [],
        home_service_enabled: false,
        home_travel_minutes: 30,
        home_buffer_minutes: 15,
        max_home_visits_per_day: 5,
        home_travel_radius_km: null,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.name_ar) {
      toast({
        title: "Error",
        description: "Name and name_ar are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = editingBarber
        ? `/api/admin/barbers/${editingBarber.id}`
        : "/api/admin/barbers";
      const method = editingBarber ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save barber");
      }

      toast({
        title: "Success",
        description: editingBarber
          ? "Barber updated successfully"
          : "Barber created successfully",
      });

      setIsDialogOpen(false);
      loadBarbers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (barberId: string) => {
    try {
      const response = await fetch(`/api/admin/barbers/${barberId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.future_bookings) {
          toast({
            title: "Cannot Delete",
            description: `Barber has ${error.count} future bookings. Please reassign or cancel them first.`,
            variant: "destructive",
          });
          return;
        }
        throw new Error(error.error || "Failed to delete barber");
      }

      toast({
        title: "Success",
        description: "Barber deleted successfully",
      });

      setDeleteConfirm(null);
      loadBarbers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (barber: Barber) => {
    try {
      const response = await fetch(`/api/admin/barbers/${barber.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !barber.is_active }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.future_bookings_count) {
          toast({
            title: "Cannot Deactivate",
            description: `Barber has ${error.future_bookings_count} future bookings. Please reassign or cancel them first.`,
            variant: "destructive",
          });
          return;
        }
        throw new Error(error.error || "Failed to update barber");
      }

      toast({
        title: "Success",
        description: `Barber ${!barber.is_active ? "activated" : "deactivated"} successfully`,
      });

      loadBarbers();
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
          Barber Management
        </h2>
        <Button onClick={() => handleOpenDialog()} className="min-h-[44px]">
          <Plus className="h-4 w-4 mr-2" />
          Add Barber
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {barbers.map((barber) => (
            <Card key={barber.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {barber.name}
                    </h3>
                    <p className="text-sm text-white/60">{barber.name_ar}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      barber.is_active
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {barber.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-white/80">
                    Slot Duration: {barber.time_slot_duration_minutes} min
                  </p>
                  <p className="text-sm text-white/80">
                    Services: {barber.barber_services?.length || 0}
                  </p>
                  {barber.home_service_enabled && (
                    <p className="text-sm text-green-400">Home service • Travel: {barber.home_travel_minutes ?? 30} min</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(barber)}
                    className="flex-1 min-h-[44px]"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(barber)}
                    className={`flex-1 min-h-[44px] ${
                      barber.is_active
                        ? "text-red-400 hover:text-red-500"
                        : "text-green-400 hover:text-green-500"
                    }`}
                  >
                    {barber.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteConfirm(barber.id)}
                    className="min-h-[44px] min-w-[44px] p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Home service – Service availability */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Home service – Service availability</CardTitle>
          <p className="text-sm text-white/70">Which services can be booked at home and the surcharge (TND).</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex flex-wrap items-center gap-4 p-3 rounded-lg bg-white/5"
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!service.available_for_home}
                    onChange={async (e) => {
                      try {
                        const res = await fetch(`/api/admin/services/${service.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ available_for_home: e.target.checked }),
                          credentials: "include",
                        });
                        if (!res.ok) throw new Error("Failed to update");
                        loadServices();
                        toast({ title: "Saved", description: "Service updated." });
                      } catch (err: any) {
                        toast({ title: "Error", description: err.message, variant: "destructive" });
                      }
                    }}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-white">{service.name_en}</span>
                </label>
                <div className="flex items-center gap-2">
                  <Label className="text-white/80 text-sm">Home surcharge (TND)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-24"
                    defaultValue={service.home_surcharge_tnd ?? 0}
                    onBlur={async (e) => {
                      const v = parseFloat(e.target.value) || 0;
                      try {
                        const res = await fetch(`/api/admin/services/${service.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ home_surcharge_tnd: v }),
                          credentials: "include",
                        });
                        if (res.ok) {
                          loadServices();
                          toast({ title: "Saved", description: "Surcharge updated." });
                        }
                      } catch (err: any) {
                        toast({ title: "Error", description: err.message, variant: "destructive" });
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBarber ? "Edit Barber" : "Add New Barber"}
            </DialogTitle>
            <DialogDescription>
              {editingBarber
                ? "Update barber information"
                : "Create a new barber profile"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name (English) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ahmed"
                />
              </div>
              <div>
                <Label htmlFor="name_ar">Name (Arabic) *</Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={(e) =>
                    setFormData({ ...formData, name_ar: e.target.value })
                  }
                  placeholder="أحمد"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="photo_url">Photo URL</Label>
              <Input
                id="photo_url"
                value={formData.photo_url}
                onChange={(e) =>
                  setFormData({ ...formData, photo_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="time_slot_duration">
                Time Slot Duration (minutes)
              </Label>
              <Input
                id="time_slot_duration"
                type="number"
                min="15"
                step="15"
                value={formData.time_slot_duration_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    time_slot_duration_minutes: parseInt(e.target.value) || 30,
                  })
                }
              />
            </div>

            <div className="border-t pt-4">
              <Label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.home_service_enabled}
                  onChange={(e) =>
                    setFormData({ ...formData, home_service_enabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded"
                />
                Home service enabled
              </Label>
              {formData.home_service_enabled && (
                <div className="grid grid-cols-2 gap-4 mt-3 ml-6">
                  <div>
                    <Label>Travel (min)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={180}
                      value={formData.home_travel_minutes}
                      onChange={(e) =>
                        setFormData({ ...formData, home_travel_minutes: parseInt(e.target.value) || 30 })
                      }
                    />
                  </div>
                  <div>
                    <Label>Buffer (min)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={60}
                      value={formData.home_buffer_minutes}
                      onChange={(e) =>
                        setFormData({ ...formData, home_buffer_minutes: parseInt(e.target.value) || 15 })
                      }
                    />
                  </div>
                  <div>
                    <Label>Max home visits/day</Label>
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      value={formData.max_home_visits_per_day}
                      onChange={(e) =>
                        setFormData({ ...formData, max_home_visits_per_day: parseInt(e.target.value) || 5 })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label>Services Offered</Label>
              <div className="space-y-2 mt-2">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.service_ids.includes(service.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            service_ids: [...formData.service_ids, service.id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            service_ids: formData.service_ids.filter(
                              (id) => id !== service.id
                            ),
                          });
                        }
                      }}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-white">
                      {service.name_en} ({service.duration_minutes} min)
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="min-h-[44px]">
              {editingBarber ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this barber? This action cannot be
              undone. The barber must have no future bookings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
