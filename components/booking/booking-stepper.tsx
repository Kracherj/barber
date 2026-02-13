"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { createBooking, checkAvailability } from "@/lib/supabase/queries";
import type { Barber, Service } from "@/lib/supabase/queries";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { CheckCircle2, Loader2 } from "lucide-react";
import { addDays, setHours, setMinutes, isBefore, isAfter, startOfDay } from "date-fns";

interface BookingStepperProps {
  barbers: Barber[];
  services: Service[];
}

type Step = "service" | "barber" | "datetime" | "details" | "confirm";

const WORKING_HOURS = {
  start: 9,
  end: 21,
  fridayStart: 14,
};

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => i)
  .filter((hour) => hour >= WORKING_HOURS.start && hour < WORKING_HOURS.end)
  .flatMap((hour) => [
    `${hour.toString().padStart(2, "0")}:00`,
    `${hour.toString().padStart(2, "0")}:30`,
  ]);

export function BookingStepper({ barbers, services }: BookingStepperProps) {
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();

  const isFriday = (date: Date) => date.getDay() === 5;

  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    const dateStart = startOfDay(date);
    
    if (isBefore(dateStart, today)) return true;
    if (date.getDay() === 0) return true; // Sunday
    
    return false;
  };

  const getAvailableTimeSlots = () => {
    if (!selectedDate || !selectedService || !selectedBarber) return [];

    const isFri = isFriday(selectedDate);
    const startHour = isFri ? WORKING_HOURS.fridayStart : WORKING_HOURS.start;

    return TIME_SLOTS.filter((slot) => {
      const [hours] = slot.split(":").map(Number);
      if (hours < startHour) return false;

      const slotDate = new Date(selectedDate);
      slotDate.setHours(hours, 0, 0, 0);

      return true;
    });
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep("barber");
  };

  const handleBarberSelect = (barber: Barber) => {
    setSelectedBarber(barber);
    setStep("datetime");
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setSelectedTime("");
  };

  const handleTimeSelect = async (time: string) => {
    if (!selectedDate || !selectedService || !selectedBarber) return;

    const [hours, minutes] = time.split(":").map(Number);
    const bookingDateTime = new Date(selectedDate);
    bookingDateTime.setHours(hours, minutes, 0, 0);

    // Check availability
    const isAvailable = await checkAvailability(
      selectedBarber.id,
      bookingDateTime,
      selectedService.duration_minutes
    );

    if (!isAvailable) {
      toast({
        title: "Slot Unavailable",
        description: "This time slot is already booked. Please select another time.",
        variant: "destructive",
      });
      return;
    }

    setSelectedTime(time);
  };

  const handleDetailsSubmit = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setStep("confirm");
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      return;
    }

    setIsSubmitting(true);

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const bookingDateTime = new Date(selectedDate);
    bookingDateTime.setHours(hours, minutes, 0, 0);

    const booking = await createBooking({
      service_id: selectedService.id,
      barber_id: selectedBarber.id,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || undefined,
      booking_date: bookingDateTime.toISOString(),
    });

    setIsSubmitting(false);

    if (booking) {
      toast({
        title: "Booking Confirmed!",
        description: `Your appointment is confirmed for ${formatDate(bookingDateTime)} at ${formatTime(bookingDateTime)}.`,
      });
      
      // Reset form
      setStep("service");
      setSelectedService(null);
      setSelectedBarber(null);
      setSelectedDate(undefined);
      setSelectedTime("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
    } else {
      toast({
        title: "Booking Failed",
        description: "There was an error creating your booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const steps = [
    { id: "service", label: "Service" },
    { id: "barber", label: "Barber" },
    { id: "datetime", label: "Date & Time" },
    { id: "details", label: "Details" },
    { id: "confirm", label: "Confirm" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((s, index) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  index <= currentStepIndex
                    ? "bg-gold text-navy"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {index < currentStepIndex ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="text-xs mt-2 text-center hidden sm:block">
                {s.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-1 flex-1 mx-2 ${
                  index < currentStepIndex ? "bg-gold" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === "service" && (
          <motion.div
            key="service"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Select a Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleServiceSelect(service)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedService?.id === service.id
                          ? "border-gold bg-gold/10"
                          : "border-gray-200 hover:border-gold"
                      }`}
                    >
                      <h3 className="font-semibold text-lg mb-2">
                        {language === "ar" ? service.name_ar : service.name_en}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {language === "ar"
                          ? service.description_ar
                          : service.description_en}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {service.duration_minutes} min
                        </span>
                        <span className="text-lg font-bold text-gold">
                          {formatCurrency(service.price_tnd)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "barber" && (
          <motion.div
            key="barber"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Barber</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setStep("service")}
                  className="mt-2"
                >
                  ← Back
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {barbers.map((barber) => (
                    <button
                      key={barber.id}
                      onClick={() => handleBarberSelect(barber)}
                      className={`p-6 rounded-lg border-2 text-center transition-all ${
                        selectedBarber?.id === barber.id
                          ? "border-gold bg-gold/10"
                          : "border-gray-200 hover:border-gold"
                      }`}
                    >
                      <div className="w-20 h-20 rounded-full bg-navy/10 mx-auto mb-4 flex items-center justify-center">
                        <span className="text-2xl font-bold text-navy">
                          {barber.name.charAt(0)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg">
                        {language === "ar" ? barber.name_ar : barber.name}
                      </h3>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "datetime" && (
          <motion.div
            key="datetime"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Select Date & Time</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setStep("barber")}
                  className="mt-2"
                >
                  ← Back
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="mb-2 block">Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={isDateDisabled}
                    className="rounded-md border"
                  />
                </div>

                {selectedDate && (
                  <div>
                    <Label className="mb-2 block">Time</Label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {getAvailableTimeSlots().map((slot) => (
                        <button
                          key={slot}
                          onClick={() => handleTimeSelect(slot)}
                          className={`p-3 rounded-lg border-2 text-sm transition-all ${
                            selectedTime === slot
                              ? "border-gold bg-gold text-navy font-semibold"
                              : "border-gray-200 hover:border-gold"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setStep("datetime")}
                  className="mt-2"
                >
                  ← Back
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+216 XX XXX XXX"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>
                <Button
                  onClick={handleDetailsSubmit}
                  className="w-full"
                  size="lg"
                >
                  Continue
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Confirm Your Booking</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setStep("details")}
                  className="mt-2"
                >
                  ← Back
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedService && selectedBarber && selectedDate && selectedTime && (
                  <>
                    <div className="space-y-2 p-4 bg-beige rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-semibold">Service:</span>
                        <span>
                          {language === "ar"
                            ? selectedService.name_ar
                            : selectedService.name_en}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Barber:</span>
                        <span>
                          {language === "ar"
                            ? selectedBarber.name_ar
                            : selectedBarber.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Date:</span>
                        <span>{formatDate(selectedDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Time:</span>
                        <span>{selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Duration:</span>
                        <span>{selectedService.duration_minutes} minutes</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                        <span>Total:</span>
                        <span className="text-gold">
                          {formatCurrency(selectedService.price_tnd)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-semibold">Name:</span>
                        <span>{customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Phone:</span>
                        <span>{customerPhone}</span>
                      </div>
                      {customerEmail && (
                        <div className="flex justify-between">
                          <span className="font-semibold">Email:</span>
                          <span>{customerEmail}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleConfirmBooking}
                      className="w-full"
                      size="lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        "Confirm Booking"
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
