"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { createBooking, checkAvailability, getBookingsForDate, getDisabledDates } from "@/lib/supabase/queries";
import type { Barber, Service } from "@/lib/supabase/queries";
import { formatCurrency, formatDate, formatTime, toLocalDateString } from "@/lib/utils";
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

// French labels for services (DB has name_ar in Arabic; we show FR)
const SERVICE_NAME_FR: Record<string, string> = {
  "Classic Cut": "Coupe classique",
  "Premium Cut + Shave": "Coupe premium + rasage",
  "Beard Trim": "Taille de barbe",
  "Full Service": "Service complet",
};
const SERVICE_DESC_FR: Record<string, string> = {
  "Classic Cut": "Coupe professionnelle avec coiffage",
  "Premium Cut + Shave": "Coupe premium avec rasage à la serviette chaude",
  "Beard Trim": "Taille et mise en forme précise de la barbe",
  "Full Service": "Expérience complète : coupe, rasage et coiffage",
};

function getServiceName(service: Service, lang: string): string {
  if (lang === "fr") return SERVICE_NAME_FR[service.name_en] ?? service.name_en;
  return service.name_en;
}
function getServiceDesc(service: Service, lang: string): string {
  if (lang === "fr") return SERVICE_DESC_FR[service.name_en] ?? service.description_en;
  return service.description_en;
}

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
  const [checkingAvailability, setCheckingAvailability] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Array<{ start: Date; end: Date }>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [disabledDatesSet, setDisabledDatesSet] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { language } = useLanguage();

  const isFriday = (date: Date) => date.getDay() === 5;

  // Fetch disabled (closed) dates so clients can't book those days
  useEffect(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 90);
    getDisabledDates(from, to).then((list) => {
      setDisabledDatesSet(new Set(list.map((d) => d.date)));
    });
  }, []);

  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    const dateStart = startOfDay(date);

    if (isBefore(dateStart, today)) return true;
    if (date.getDay() === 0) return true; // Sunday
    const dateStr = toLocalDateString(date);
    if (disabledDatesSet.has(dateStr)) return true; // Salon closed

    return false;
  };

  // Fetch booked slots when date or barber changes
  useEffect(() => {
    if (!selectedDate || !selectedBarber) {
      setBookedSlots([]);
      return;
    }

    const fetchBookedSlots = async () => {
      setLoadingSlots(true);
      try {
        const bookings = await getBookingsForDate(selectedBarber.id, selectedDate);
        setBookedSlots(bookings);
      } catch (error) {
        console.error("Error fetching booked slots:", error);
        setBookedSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchBookedSlots();
  }, [selectedDate, selectedBarber]);

  const isSlotBooked = (slotTime: string): boolean => {
    if (!selectedDate || !selectedService || bookedSlots.length === 0) return false;

    const [hours, minutes] = slotTime.split(":").map(Number);
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + selectedService.duration_minutes * 60000);

    // Check if any booked slot overlaps with this time slot
    return bookedSlots.some((bookedSlot) => {
      // Check if the slot overlaps with the booked time range
      // Overlap occurs if: slotStart < bookedSlot.end && slotEnd > bookedSlot.start
      return slotStart < bookedSlot.end && slotEnd > bookedSlot.start;
    });
  };

  const getAvailableTimeSlots = () => {
    if (!selectedDate || !selectedService || !selectedBarber) return [];

    const isFri = isFriday(selectedDate);
    const startHour = isFri ? WORKING_HOURS.fridayStart : WORKING_HOURS.start;

    return TIME_SLOTS.filter((slot) => {
      const [hours] = slot.split(":").map(Number);
      if (hours < startHour) return false;

      // Filter out booked slots
      if (isSlotBooked(slot)) return false;

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

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setSelectedTime("");
    
    // Refresh booked slots when date changes
    if (selectedBarber) {
      setLoadingSlots(true);
      try {
        const bookings = await getBookingsForDate(selectedBarber.id, date);
        setBookedSlots(bookings);
      } catch (error) {
        console.error("Error fetching booked slots:", error);
      } finally {
        setLoadingSlots(false);
      }
    }
  };

  const handleTimeSelect = async (time: string) => {
    if (!selectedDate || !selectedService || !selectedBarber) return;

    // Double-check availability right before proceeding (race condition protection)
    setCheckingAvailability(time);
    const [hours, minutes] = time.split(":").map(Number);
    const bookingDateTime = new Date(selectedDate);
    bookingDateTime.setHours(hours, minutes, 0, 0);

    try {
      // Final availability check
      const isAvailable = await checkAvailability(
        selectedBarber.id,
        bookingDateTime,
        selectedService.duration_minutes
      );

      if (!isAvailable) {
        // Refresh booked slots to update the UI
        const bookings = await getBookingsForDate(selectedBarber.id, selectedDate);
        setBookedSlots(bookings);
        toast({
          title: language === "fr" ? "Créneau indisponible" : "Slot No Longer Available",
          description: language === "fr" ? "Ce créneau vient d'être réservé. Choisissez un autre horaire." : "This time slot was just booked. Please select another time.",
          variant: "destructive",
        });
        setCheckingAvailability(null);
        return;
      }

      setSelectedTime(time);
      // Automatically advance to details step after selecting a time
      setStep("details");
    } catch (error) {
      console.error("Error checking availability:", error);
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description: language === "fr" ? "Impossible de vérifier la disponibilité. Réessayez." : "Failed to check availability. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckingAvailability(null);
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove any spaces, dashes, or plus signs
    const cleaned = phone.replace(/[\s\-+]/g, '');
    
    // Must be exactly 8 digits
    if (cleaned.length !== 8) return false;
    
    // Must be all digits
    if (!/^\d+$/.test(cleaned)) return false;
    
    // First digit must be 9, 2, 4, or 5
    const firstDigit = cleaned[0];
    if (!['9', '2', '4', '5'].includes(firstDigit)) return false;
    
    return true;
  };

  const handlePhoneChange = (value: string) => {
    // Remove any non-digit characters except spaces and dashes for display
    const cleaned = value.replace(/[^\d\s\-+]/g, '');
    setCustomerPhone(cleaned);
  };

  const handleDetailsSubmit = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast({
        title: language === "fr" ? "Informations manquantes" : "Missing Information",
        description: language === "fr" ? "Veuillez remplir tous les champs obligatoires." : "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number
    if (!validatePhoneNumber(customerPhone)) {
      toast({
        title: language === "fr" ? "Numéro invalide" : "Invalid Phone Number",
        description: language === "fr" ? "Le numéro doit faire 8 chiffres et commencer par 9, 2, 4 ou 5 (ex. 91234567)." : "Phone number must be 8 digits starting with 9, 2, 4, or 5 (e.g., 91234567).",
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

    try {
      // Re-check availability right before booking to prevent race conditions
      const isStillAvailable = await checkAvailability(
        selectedBarber.id,
        bookingDateTime,
        selectedService.duration_minutes
      );

      if (!isStillAvailable) {
        // Refresh booked slots to update the UI
        if (selectedBarber && selectedDate) {
          const bookings = await getBookingsForDate(selectedBarber.id, selectedDate);
          setBookedSlots(bookings);
        }
        toast({
          title: language === "fr" ? "Créneau indisponible" : "Slot No Longer Available",
          description: language === "fr" ? "Ce créneau vient d'être réservé. Choisissez un autre horaire." : "This time slot was just booked by someone else. Please select another time.",
          variant: "destructive",
        });
        setSelectedTime("");
        // Refresh booked slots before going back
        if (selectedBarber && selectedDate) {
          const bookings = await getBookingsForDate(selectedBarber.id, selectedDate);
          setBookedSlots(bookings);
        }
        setStep("datetime");
        setIsSubmitting(false);
        return;
      }

      // Clean phone number before sending (remove spaces, dashes, etc.)
      const cleanedPhone = customerPhone.replace(/[\s\-+]/g, '');

      const booking = await createBooking({
        service_id: selectedService.id,
        barber_id: selectedBarber.id,
        customer_name: customerName,
        customer_phone: cleanedPhone,
        customer_email: customerEmail || undefined,
        booking_date: bookingDateTime.toISOString(),
      });

      if (booking) {
        // Refresh booked slots to update the UI
        if (selectedBarber && selectedDate) {
          const bookings = await getBookingsForDate(selectedBarber.id, selectedDate);
          setBookedSlots(bookings);
        }
        
        toast({
          title: language === "fr" ? "Réservation confirmée !" : "Booking Confirmed!",
          description: language === "fr"
            ? `Votre rendez-vous est confirmé pour le ${formatDate(bookingDateTime)} à ${formatTime(bookingDateTime)}.`
            : `Your appointment is confirmed for ${formatDate(bookingDateTime)} at ${formatTime(bookingDateTime)}.`,
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
          title: language === "fr" ? "Échec de la réservation" : "Booking Failed",
          description: language === "fr" ? "Une erreur s'est produite. Veuillez réessayer." : "There was an error creating your booking. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in handleConfirmBooking:", error);
      
      // Handle duplicate booking error specifically
      if (error instanceof Error && error.message === "DUPLICATE_BOOKING") {
        if (selectedBarber && selectedDate) {
          try {
            const bookings = await getBookingsForDate(selectedBarber.id, selectedDate);
            setBookedSlots(bookings);
          } catch (refreshError) {
            console.error("Error refreshing slots:", refreshError);
          }
        }
        toast({
          title: language === "fr" ? "Créneau déjà réservé" : "Time Slot Already Booked",
          description: language === "fr" ? "Ce créneau vient d'être réservé. Les horaires ont été mis à jour. Choisissez un autre créneau." : "This time slot was just booked by someone else. The available times have been updated. Please select another time.",
          variant: "destructive",
        });
        setSelectedTime("");
        setStep("datetime");
      } else if (error instanceof Error && error.message === "DATE_DISABLED") {
        toast({
          title: language === "fr" ? "Jour fermé" : "Date unavailable",
          description: language === "fr" ? "Ce jour est fermé. Veuillez choisir une autre date." : "This day is closed for bookings. Please choose another date.",
          variant: "destructive",
        });
        setSelectedDate(undefined);
        setSelectedTime("");
        setStep("datetime");
      } else {
        toast({
          title: language === "fr" ? "Échec de la réservation" : "Booking Failed",
          description: error instanceof Error ? error.message : (language === "fr" ? "Une erreur s'est produite. Veuillez réessayer." : "There was an error creating your booking. Please try again."),
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = language === "fr"
    ? [
        { id: "service", label: "Service" },
        { id: "barber", label: "Coiffeur" },
        { id: "datetime", label: "Date et heure" },
        { id: "details", label: "Coordonnées" },
        { id: "confirm", label: "Confirmer" },
      ]
    : [
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
                <CardTitle>{language === "fr" ? "Choisir un service" : "Select a Service"}</CardTitle>
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
                        {getServiceName(service, language)}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {getServiceDesc(service, language)}
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
                <CardTitle>{language === "fr" ? "Choisir votre coiffeur" : "Choose Your Barber"}</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setStep("service")}
                  className="mt-2"
                >
                  ← {language === "fr" ? "Retour" : "Back"}
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
                        {barber.name}
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
                <CardTitle>{language === "fr" ? "Choisir la date et l'heure" : "Select Date & Time"}</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setStep("barber")}
                  className="mt-2"
                >
                  ← {language === "fr" ? "Retour" : "Back"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="mb-2 block">{language === "fr" ? "Date" : "Date"}</Label>
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
                    <Label className="mb-2 block">{language === "fr" ? "Heure" : "Time"}</Label>
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gold" />
                        <span className="ml-2 text-gray-600">{language === "fr" ? "Chargement des créneaux..." : "Loading available times..."}</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {getAvailableTimeSlots().length === 0 ? (
                          <div className="col-span-full text-center py-4 text-gray-500">
                            {language === "fr" ? "Aucun créneau disponible ce jour. Choisissez une autre date." : "No available time slots for this date. Please select another date."}
                          </div>
                        ) : (
                          getAvailableTimeSlots().map((slot) => (
                            <button
                              key={slot}
                              onClick={() => handleTimeSelect(slot)}
                              disabled={checkingAvailability !== null}
                              className={`p-3 rounded-lg border-2 text-sm transition-all ${
                                selectedTime === slot
                                  ? "border-gold bg-gold text-navy font-semibold"
                                  : checkingAvailability === slot
                                  ? "border-gold bg-gold/20"
                                  : "border-gray-200 hover:border-gold"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {checkingAvailability === slot ? (
                                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                              ) : (
                                slot
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
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
                <CardTitle>{language === "fr" ? "Vos coordonnées" : "Your Information"}</CardTitle>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    setStep("datetime");
                    if (selectedBarber && selectedDate) {
                      setLoadingSlots(true);
                      try {
                        const bookings = await getBookingsForDate(selectedBarber.id, selectedDate);
                        setBookedSlots(bookings);
                      } catch (error) {
                        console.error("Error refreshing booked slots:", error);
                      } finally {
                        setLoadingSlots(false);
                      }
                    }
                  }}
                  className="mt-2"
                >
                  ← {language === "fr" ? "Retour" : "Back"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">{language === "fr" ? "Nom complet *" : "Full Name *"}</Label>
                  <Input
                    id="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={language === "fr" ? "Votre nom complet" : "Enter your full name"}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">{language === "fr" ? "Téléphone *" : "Phone Number *"}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="91234567"
                    maxLength={8}
                    pattern="[9245][0-9]{7}"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {language === "fr" ? "8 chiffres commençant par 9, 2, 4 ou 5" : "8 digits starting with 9, 2, 4, or 5"}
                  </p>
                </div>
                <div>
                  <Label htmlFor="email">{language === "fr" ? "E-mail (optionnel)" : "Email (Optional)"}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="votre@email.com"
                  />
                </div>
                <Button
                  onClick={handleDetailsSubmit}
                  className="w-full"
                  size="lg"
                >
                  {language === "fr" ? "Continuer" : "Continue"}
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
                <CardTitle>{language === "fr" ? "Confirmer votre réservation" : "Confirm Your Booking"}</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setStep("details")}
                  className="mt-2"
                >
                  ← {language === "fr" ? "Retour" : "Back"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedService && selectedBarber && selectedDate && selectedTime && (
                  <>
                    <div className="space-y-2 p-4 bg-beige rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-semibold">{language === "fr" ? "Service :" : "Service:"}</span>
                        <span>
                          {getServiceName(selectedService, language)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">{language === "fr" ? "Coiffeur :" : "Barber:"}</span>
                        <span>
                          {selectedBarber.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">{language === "fr" ? "Date :" : "Date:"}</span>
                        <span>{formatDate(selectedDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">{language === "fr" ? "Heure :" : "Time:"}</span>
                        <span>{selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">{language === "fr" ? "Durée :" : "Duration:"}</span>
                        <span>{selectedService.duration_minutes} {language === "fr" ? "min" : "minutes"}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                        <span>{language === "fr" ? "Total :" : "Total:"}</span>
                        <span className="text-gold">
                          {formatCurrency(selectedService.price_tnd)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-semibold">{language === "fr" ? "Nom :" : "Name:"}</span>
                        <span>{customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">{language === "fr" ? "Téléphone :" : "Phone:"}</span>
                        <span>{customerPhone}</span>
                      </div>
                      {customerEmail && (
                        <div className="flex justify-between">
                          <span className="font-semibold">{language === "fr" ? "E-mail :" : "Email:"}</span>
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
                          {language === "fr" ? "Confirmation..." : "Confirming..."}
                        </>
                      ) : (
                        language === "fr" ? "Confirmer la réservation" : "Confirm Booking"
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
