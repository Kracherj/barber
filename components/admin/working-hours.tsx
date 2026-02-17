"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Clock, Plus, Trash2, Save } from "lucide-react";
import { getBarbers } from "@/lib/supabase/queries";
import type { Barber } from "@/lib/supabase/queries";

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

interface WeeklySchedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  breaks: Array<{ start_time: string; end_time: string; reason?: string }>;
}

export function WorkingHoursManagement() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>("");
  const [schedule, setSchedule] = useState<WeeklySchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
      loadSchedule();
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

  const loadSchedule = async () => {
    if (!selectedBarberId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/barbers/${selectedBarberId}/schedule`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to load schedule");

      const data = await response.json();
      const weeklySchedule = data.weekly_schedule || [];

      // Initialize schedule for all days
      const fullSchedule: WeeklySchedule[] = DAYS.map((day) => {
        const existing = weeklySchedule.find(
          (s: any) => s.day_of_week === day.value
        );
        return existing
          ? {
              day_of_week: day.value,
              start_time: existing.start_time || "09:00",
              end_time: existing.end_time || "21:00",
              is_available: existing.is_available !== false,
              breaks: existing.barber_weekly_breaks || [],
            }
          : {
              day_of_week: day.value,
              start_time: day.value === 5 ? "14:00" : "09:00", // Friday starts at 14:00
              end_time: "21:00",
              is_available: day.value !== 0, // Sunday closed by default
              breaks: [],
            };
      });

      setSchedule(fullSchedule);
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

  const handleSave = async () => {
    if (!selectedBarberId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/barbers/${selectedBarberId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekly_schedule: schedule }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save schedule");
      }

      toast({
        title: "Success",
        description: "Working hours updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateDaySchedule = (dayIndex: number, updates: Partial<WeeklySchedule>) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex] = { ...newSchedule[dayIndex], ...updates };
    setSchedule(newSchedule);
  };

  const addBreak = (dayIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].breaks.push({
      start_time: "13:00",
      end_time: "14:00",
      reason: "Lunch",
    });
    setSchedule(newSchedule);
  };

  const removeBreak = (dayIndex: number, breakIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].breaks.splice(breakIndex, 1);
    setSchedule(newSchedule);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-heading font-bold text-white">
          Working Hours Management
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
          <Button onClick={handleSave} disabled={saving || !selectedBarberId} className="min-h-[44px]">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Schedule"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {schedule.map((daySchedule, dayIndex) => {
            const day = DAYS.find((d) => d.value === daySchedule.day_of_week);
            return (
              <Card key={daySchedule.day_of_week}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {day?.label}
                    </CardTitle>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={daySchedule.is_available}
                        onChange={(e) =>
                          updateDaySchedule(dayIndex, {
                            is_available: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-white">Available</span>
                    </label>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {daySchedule.is_available && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Start Time</Label>
                          <Input
                            type="time"
                            value={daySchedule.start_time}
                            onChange={(e) =>
                              updateDaySchedule(dayIndex, {
                                start_time: e.target.value,
                              })
                            }
                            className="min-h-[44px]"
                          />
                        </div>
                        <div>
                          <Label>End Time</Label>
                          <Input
                            type="time"
                            value={daySchedule.end_time}
                            onChange={(e) =>
                              updateDaySchedule(dayIndex, {
                                end_time: e.target.value,
                              })
                            }
                            className="min-h-[44px]"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <Label>Break Times</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addBreak(dayIndex)}
                            className="min-h-[36px]"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Break
                          </Button>
                        </div>
                        {daySchedule.breaks.map((breakItem, breakIndex) => (
                          <div
                            key={breakIndex}
                            className="flex gap-2 items-end mb-2"
                          >
                            <div className="flex-1">
                              <Input
                                type="time"
                                value={breakItem.start_time}
                                onChange={(e) => {
                                  const newBreaks = [...daySchedule.breaks];
                                  newBreaks[breakIndex].start_time =
                                    e.target.value;
                                  updateDaySchedule(dayIndex, { breaks: newBreaks });
                                }}
                                className="min-h-[44px]"
                              />
                            </div>
                            <span className="text-white py-2">-</span>
                            <div className="flex-1">
                              <Input
                                type="time"
                                value={breakItem.end_time}
                                onChange={(e) => {
                                  const newBreaks = [...daySchedule.breaks];
                                  newBreaks[breakIndex].end_time = e.target.value;
                                  updateDaySchedule(dayIndex, { breaks: newBreaks });
                                }}
                                className="min-h-[44px]"
                              />
                            </div>
                            <Input
                              placeholder="Reason (optional)"
                              value={breakItem.reason || ""}
                              onChange={(e) => {
                                const newBreaks = [...daySchedule.breaks];
                                newBreaks[breakIndex].reason = e.target.value;
                                updateDaySchedule(dayIndex, { breaks: newBreaks });
                              }}
                              className="flex-1 min-h-[44px]"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBreak(dayIndex, breakIndex)}
                              className="min-h-[44px] min-w-[44px] p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
