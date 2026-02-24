"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Calendar, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { getBarbers, getServices } from "@/lib/supabase/queries";
import type { Barber, Service } from "@/lib/supabase/queries";
import { formatDate, formatTime, formatCurrency, toLocalDateString } from "@/lib/utils";

interface CalendarBooking {
  id: string;
  booking_date: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  booking_type?: "in_shop" | "home_service";
  customer_address_line?: string | null;
  customer_city_zone?: string | null;
  barber: { id: string; name: string };
  service: { name_en: string; duration_minutes: number; price_tnd: number };
}

interface BarberSchedule {
  weekly: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
    barber_weekly_breaks?: Array<{ start_time: string; end_time: string }>;
  }>;
  overrides: Array<{
    date: string;
    start_time: string | null;
    end_time: string | null;
    is_available: boolean;
    barber_date_breaks?: Array<{ start_time: string; end_time: string }>;
  }>;
}

export function CalendarView() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<Record<string, BarberSchedule>>({});
  const [view, setView] = useState<"daily" | "weekly">("daily");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterBarberId, setFilterBarberId] = useState<string>("");
  const [filterServiceId, setFilterServiceId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Only load if authenticated
    const isAuthenticated = sessionStorage.getItem("admin_authenticated") === "true";
    if (isAuthenticated) {
      loadBarbers();
      loadServices();
    }
  }, []);

  useEffect(() => {
    // Only load calendar if authenticated
    const isAuthenticated = sessionStorage.getItem("admin_authenticated") === "true";
    if (isAuthenticated) {
      loadCalendar();
    }
  }, [currentDate, view, filterBarberId, filterServiceId]);

  const loadBarbers = async () => {
    try {
      const data = await getBarbers();
      setBarbers(data);
    } catch (error: any) {
      console.error("Error loading barbers:", error);
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

  const loadCalendar = async () => {
    // Check authentication first
    const isAuthenticated = sessionStorage.getItem("admin_authenticated") === "true";
    if (!isAuthenticated) {
      return;
    }

    setLoading(true);
    try {
      const startDate = new Date(currentDate);
      startDate.setHours(0, 0, 0, 0);

      const params = new URLSearchParams({
        view,
        start_date: startDate.toISOString().split("T")[0],
      });

      if (filterBarberId) {
        params.append("barber_id", filterBarberId);
      }

      if (filterServiceId) {
        params.append("service_id", filterServiceId);
      }

      const response = await fetch(`/api/admin/bookings/calendar?${params}`, {
        credentials: "include",
      });
      
      if (response.status === 401) {
        // Session expired, redirect to login
        sessionStorage.removeItem("admin_authenticated");
        window.location.href = "/admin";
        return;
      }
      
      if (!response.ok) throw new Error("Failed to load calendar");

      const data = await response.json();
      setBookings(data.bookings || []);
      setBlockedSlots(data.blocked_slots || []);
      setSchedules(data.schedules || {});
      
      // Debug: log bookings for troubleshooting
      if (data.bookings && data.bookings.length > 0) {
        console.log(`[Calendar] Loaded ${data.bookings.length} bookings:`, data.bookings.map((b: any) => ({
          id: b.id,
          date: b.booking_date,
          customer: b.customer_name,
          barber: b.barber?.name,
          dateStr: toLocalDateString(new Date(b.booking_date))
        })));
      }
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

  const navigateDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const getDateRange = () => {
    if (view === "daily") {
      return [currentDate];
    }
    const dates = [];
    const start = new Date(currentDate);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = toLocalDateString(date);
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.booking_date);
      const bookingDateStr = toLocalDateString(bookingDate);
      return bookingDateStr === dateStr;
    });
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 21; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    return slots;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-heading font-bold text-white">
          Calendar View
        </h2>
        <div className="flex gap-4 items-center">
          <Button
            variant={view === "daily" ? "default" : "outline"}
            onClick={() => setView("daily")}
            className="min-h-[44px]"
          >
            Daily
          </Button>
          <Button
            variant={view === "weekly" ? "default" : "outline"}
            onClick={() => setView("weekly")}
            className="min-h-[44px]"
          >
            Weekly
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate(-1)}
                className="min-h-[44px] min-w-[44px] p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Input
                type="date"
                value={currentDate.toISOString().split("T")[0]}
                onChange={(e) => setCurrentDate(new Date(e.target.value))}
                className="w-[180px] min-h-[44px]"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate(1)}
                className="min-h-[44px] min-w-[44px] p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="min-h-[44px]"
              >
                Today
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <Select value={filterBarberId || "all"} onValueChange={(value) => setFilterBarberId(value === "all" ? "" : value)}>
                <SelectTrigger className="w-[150px] min-h-[44px]">
                  <SelectValue placeholder="All Barbers" />
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
              <Select value={filterServiceId || "all"} onValueChange={(value) => setFilterServiceId(value === "all" ? "" : value)}>
                <SelectTrigger className="w-[150px] min-h-[44px]">
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {view === "daily" ? (
                <DailyView
                  date={currentDate}
                  bookings={getBookingsForDate(currentDate)}
                  blockedSlots={blockedSlots}
                  schedules={schedules}
                  barbers={barbers}
                />
              ) : (
                <WeeklyView
                  dates={getDateRange()}
                  bookings={bookings}
                  blockedSlots={blockedSlots}
                  schedules={schedules}
                  barbers={barbers}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DailyView({
  date,
  bookings,
  blockedSlots,
  schedules,
  barbers,
}: {
  date: Date;
  bookings: CalendarBooking[];
  blockedSlots: any[];
  schedules: Record<string, BarberSchedule>;
  barbers: Barber[];
}) {
  const timeSlots = Array.from({ length: 24 }, (_, i) => i)
    .filter((hour) => hour >= 9 && hour < 21)
    .flatMap((hour) => [
      `${hour.toString().padStart(2, "0")}:00`,
      `${hour.toString().padStart(2, "0")}:30`,
    ]);

  const getBookingsAtTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const dateStr = toLocalDateString(date);
    
    // First filter bookings for this specific date
    const dateBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.booking_date);
      const bookingDateStr = toLocalDateString(bookingDate);
      return bookingDateStr === dateStr;
    });

    // Create slot time range in local time
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + 30 * 60000); // 30-minute slot

    // Find all bookings that overlap with this time slot
    return dateBookings.filter((booking) => {
      const bookingStart = new Date(booking.booking_date);
      const bookingDuration = booking.service?.duration_minutes || 30;
      const bookingEnd = new Date(bookingStart.getTime() + bookingDuration * 60000);
      
      // Check if booking overlaps with slot (overlap if: bookingStart < slotEnd && bookingEnd > slotStart)
      return bookingStart < slotEnd && bookingEnd > slotStart;
    });
  };

  const isSlotAvailable = (time: string): boolean => {
    const [hours, minutes] = time.split(":").map(Number);
    // Convert to TIME format (HH:MM:SS)
    const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
    const dayOfWeek = date.getDay();
    const dateStr = toLocalDateString(date);

    // If no barbers, not available
    if (barbers.length === 0) return false;

    // Check if any barber is available at this time
    for (const barber of barbers) {
      if (!barber.is_active) continue;

      const schedule = schedules[barber.id];
      if (!schedule || (!schedule.weekly.length && !schedule.overrides.length)) {
        // No schedule set, assume not available
        continue;
      }

      let isAvailable = false;

      // Check date override first
      const override = schedule.overrides.find((o) => o.date === dateStr);
      if (override) {
        if (!override.is_available) continue;
        if (override.start_time && override.end_time) {
          if (timeStr < override.start_time || timeStr >= override.end_time) continue;
        }
        // Check breaks in override
        if (override.barber_date_breaks?.some(
          (b) => timeStr >= b.start_time && timeStr < b.end_time
        )) continue;
        isAvailable = true;
      } else {
        // Check weekly schedule
        const weekly = schedule.weekly.find((w) => w.day_of_week === dayOfWeek);
        if (!weekly || !weekly.is_available) continue;
        if (timeStr < weekly.start_time || timeStr >= weekly.end_time) continue;
        // Check breaks
        if (weekly.barber_weekly_breaks?.some(
          (b) => timeStr >= b.start_time && timeStr < b.end_time
        )) continue;
        isAvailable = true;
      }

      if (!isAvailable) continue;

      // Check blocked slots
      const slotDateTime = new Date(date);
      slotDateTime.setHours(hours, minutes, 0, 0);
      const isBlocked = blockedSlots.some((blocked) => {
        const blockedStart = new Date(blocked.start_time);
        const blockedEnd = new Date(blocked.end_time);
        return (
          blocked.barber_id === barber.id &&
          slotDateTime >= blockedStart &&
          slotDateTime < blockedEnd
        );
      });
      if (isBlocked) continue;

      // Check if this barber has a booking at this time
      const slotStart = new Date(date);
      slotStart.setHours(hours, minutes, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + 30 * 60000); // 30-minute slot
      const hasBooking = bookings.some((booking) => {
        if (booking.barber.id !== barber.id) return false;
        
        // First check if booking is on the same date
        const bookingDate = new Date(booking.booking_date);
        const bookingDateStr = toLocalDateString(bookingDate);
        if (bookingDateStr !== dateStr) return false;
        
        const bookingStart = new Date(booking.booking_date);
        const bookingDuration = booking.service?.duration_minutes || 30;
        const bookingEnd = new Date(bookingStart.getTime() + bookingDuration * 60000);
        // Check if booking overlaps with slot
        return bookingStart < slotEnd && bookingEnd > slotStart;
      });
      if (hasBooking) continue; // Barber is booked, not available

      // If we get here, this barber is available at this time
      return true;
    }

    return false;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">
        {formatDate(date)}
      </h3>
      <div className="grid grid-cols-1 gap-2 max-h-[600px] overflow-y-auto">
        {timeSlots.map((time) => {
          const bookingsAtTime = getBookingsAtTime(time);
          const isAvailable = isSlotAvailable(time);
          
          // Debug logging for specific date
          if (toLocalDateString(date) === "2026-02-23" && bookingsAtTime.length > 0) {
            console.log(`[Calendar Daily] Found ${bookingsAtTime.length} booking(s) at ${time} on ${toLocalDateString(date)}:`, bookingsAtTime);
          }
          
          return (
            <div
              key={time}
              className={`p-4 rounded-lg border ${
                bookingsAtTime.length > 0
                  ? "bg-gold/10 border-gold"
                  : isAvailable
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{time}</span>
                {bookingsAtTime.length > 0 ? (
                  <div className="flex-1 ml-4 space-y-1">
                    {bookingsAtTime.map((booking) => (
                      <div key={booking.id}>
                        <p className="text-sm font-semibold text-white flex items-center gap-2">
                          {booking.customer_name}
                          {booking.booking_type === "home_service" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-200">Home</span>
                          )}
                        </p>
                        <p className="text-xs text-white/80">
                          {booking.service.name_en} - {booking.barber.name}
                        </p>
                        {booking.booking_type === "home_service" && (booking.customer_address_line || booking.customer_city_zone) && (
                          <p className="text-xs text-white/70 truncate" title={`${booking.customer_address_line || ""}, ${booking.customer_city_zone || ""}`}>
                            📍 {[booking.customer_address_line, booking.customer_city_zone].filter(Boolean).join(", ")}
                          </p>
                        )}
                        <p className="text-xs text-gold">
                          {formatCurrency(booking.service.price_tnd)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className={`text-sm ml-4 ${
                    isAvailable ? "text-green-400" : "text-red-400"
                  }`}>
                    {isAvailable ? "Available" : "Unavailable"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeeklyView({
  dates,
  bookings,
  blockedSlots,
  schedules,
  barbers,
}: {
  dates: Date[];
  bookings: CalendarBooking[];
  blockedSlots: any[];
  schedules: Record<string, BarberSchedule>;
  barbers: Barber[];
}) {
  const getBookingsForDate = (date: Date) => {
    const dateStr = toLocalDateString(date);
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.booking_date);
      const bookingDateStr = toLocalDateString(bookingDate);
      return bookingDateStr === dateStr;
    });
  };

  const isDateAvailable = (date: Date): boolean => {
    const dayOfWeek = date.getDay();
    const dateStr = toLocalDateString(date);

    // Check if any barber is available on this day
    for (const barber of barbers) {
      if (!barber.is_active) continue;

      const schedule = schedules[barber.id];
      if (!schedule || (!schedule.weekly.length && !schedule.overrides.length)) {
        continue;
      }

      // Check date override first
      const override = schedule.overrides.find((o) => o.date === dateStr);
      if (override) {
        if (override.is_available) return true;
      } else {
        // Check weekly schedule
        const weekly = schedule.weekly.find((w) => w.day_of_week === dayOfWeek);
        if (weekly && weekly.is_available) return true;
      }
    }

    return false;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      {dates.map((date) => {
        const dayBookings = getBookingsForDate(date);
        const isAvailable = isDateAvailable(date);
        
        // Debug logging for specific date
        if (toLocalDateString(date) === "2026-02-23") {
          console.log(`[Calendar Weekly] Date ${toLocalDateString(date)}:`, {
            totalBookings: bookings.length,
            dayBookings: dayBookings.length,
            bookings: dayBookings.map(b => ({
              id: b.id,
              customer: b.customer_name,
              barber: b.barber.name,
              date: b.booking_date
            }))
          });
        }
        
        return (
          <div key={date.toISOString()} className="space-y-2">
            <div className="text-center">
              <h4 className="font-semibold text-white">
                {date.toLocaleDateString("en-US", { weekday: "short" })}
              </h4>
              <p className="text-sm text-white/60">
                {date.getDate()}/{date.getMonth() + 1}
              </p>
              <div className={`mt-2 px-2 py-1 rounded text-xs ${
                isAvailable 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-red-500/20 text-red-400"
              }`}>
                {isAvailable ? "Available" : "Unavailable"}
              </div>
            </div>
            <div className="space-y-2">
              {dayBookings.length === 0 ? (
                <p className="text-xs text-white/40 text-center py-4">
                  No bookings
                </p>
              ) : (
                dayBookings.map((booking) => {
                  const bookingTime = new Date(booking.booking_date);
                  return (
                    <div
                      key={booking.id}
                      className="p-2 rounded bg-gold/10 border border-gold/20"
                    >
                      <p className="text-xs font-semibold text-white flex items-center gap-1">
                        {formatTime(bookingTime)}
                        {booking.booking_type === "home_service" && (
                          <span className="text-[10px] px-1 rounded bg-amber-500/30 text-amber-200">Home</span>
                        )}
                      </p>
                      <p className="text-xs text-white/80 truncate">{booking.customer_name}</p>
                      <p className="text-xs text-white/60">{booking.barber.name}</p>
                      {booking.booking_type === "home_service" && booking.customer_city_zone && (
                        <p className="text-xs text-white/50 truncate">📍 {booking.customer_city_zone}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
