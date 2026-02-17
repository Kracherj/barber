"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarberManagement } from "./barber-management";
import { WorkingHoursManagement } from "./working-hours";
import { BlockedSlotsManagement } from "./blocked-slots";
import { BookingReassignment } from "./booking-reassignment";
import { CalendarView } from "./calendar-view";
import { BookingsList } from "./bookings-list";
import { Users, Clock, CalendarOff, UserCheck, Calendar, List } from "lucide-react";

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    const auth = sessionStorage.getItem("admin_authenticated") === "true";
    setIsAuthenticated(auth);
  }, []);

  if (!isAuthenticated) {
    return null; // Don't render until authenticated
  }

  return (
    <Tabs defaultValue="bookings" className="w-full">
      <TabsList className="grid w-full grid-cols-6 mb-6">
        <TabsTrigger value="bookings" className="min-h-[44px]">
          <List className="h-4 w-4 mr-2" />
          Bookings
        </TabsTrigger>
        <TabsTrigger value="calendar" className="min-h-[44px]">
          <Calendar className="h-4 w-4 mr-2" />
          Calendar
        </TabsTrigger>
        <TabsTrigger value="barbers" className="min-h-[44px]">
          <Users className="h-4 w-4 mr-2" />
          Barbers
        </TabsTrigger>
        <TabsTrigger value="schedule" className="min-h-[44px]">
          <Clock className="h-4 w-4 mr-2" />
          Schedule
        </TabsTrigger>
        <TabsTrigger value="blocked" className="min-h-[44px]">
          <CalendarOff className="h-4 w-4 mr-2" />
          Blocked
        </TabsTrigger>
        <TabsTrigger value="reassign" className="min-h-[44px]">
          <UserCheck className="h-4 w-4 mr-2" />
          Reassign
        </TabsTrigger>
      </TabsList>

      <TabsContent value="bookings">
        <BookingsList />
      </TabsContent>

      <TabsContent value="calendar">
        <CalendarView />
      </TabsContent>

      <TabsContent value="barbers">
        <BarberManagement />
      </TabsContent>

      <TabsContent value="schedule">
        <WorkingHoursManagement />
      </TabsContent>

      <TabsContent value="blocked">
        <BlockedSlotsManagement />
      </TabsContent>

      <TabsContent value="reassign">
        <BookingReassignment />
      </TabsContent>
    </Tabs>
  );
}
