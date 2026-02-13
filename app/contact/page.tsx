"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/language-context";
import { motion } from "framer-motion";
import { MapPin, Phone, Clock, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Footer } from "@/components/footer";

export default function ContactPage() {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission (replace with actual API call)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    toast({
      title: language === "ar" ? "تم الإرسال" : "Message Sent",
      description:
        language === "ar"
          ? "شكراً لتواصلك معنا. سنرد عليك قريباً."
          : "Thank you for contacting us. We'll get back to you soon.",
    });

    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] py-32">
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 tracking-tight">
            {t("nav.contact")}
          </h1>
          <div className="w-24 h-[1px] bg-gold mb-6" />
          <p className="text-lg text-white/60 max-w-2xl font-body tracking-wide">
            {language === "ar"
              ? "نحن هنا لمساعدتك. تواصل معنا بأي طريقة تفضلها."
              : "We're here to help. Get in touch with us in any way you prefer."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="bg-[#1c1c1c] border border-white/5 rounded-sm">
              <CardHeader>
                <CardTitle className="text-white font-heading tracking-tight">
                  {language === "ar" ? "معلومات الاتصال" : "Contact Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 text-gold mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-2 font-body tracking-wide">
                      {language === "ar" ? "العنوان" : "Address"}
                    </h3>
                    <p className="text-white/60 font-body">{t("footer.address")}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 text-gold mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-2 font-body tracking-wide">
                      {language === "ar" ? "الهاتف" : "Phone"}
                    </h3>
                    <a
                      href="tel:+21698765432"
                      className="text-white/60 hover:text-gold transition-colors font-body"
                    >
                      {t("footer.phone")}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <MessageCircle className="h-6 w-6 text-gold mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-2 font-body tracking-wide">WhatsApp</h3>
                    <a
                      href="https://wa.me/21698765432"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/60 hover:text-gold transition-colors font-body"
                    >
                      {t("footer.phone")}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Clock className="h-6 w-6 text-gold mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-2 font-body tracking-wide">
                      {language === "ar" ? "ساعات العمل" : "Opening Hours"}
                    </h3>
                    <p className="text-white/60 font-body">{t("footer.hours")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="bg-[#1c1c1c] border border-white/5 rounded-sm">
            <CardHeader>
              <CardTitle className="text-white font-heading tracking-tight">
                {language === "ar" ? "أرسل لنا رسالة" : "Send us a Message"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-white/80 font-body">
                    {language === "ar" ? "الاسم" : "Name"} *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="bg-[#0E0E0E] border-white/10 text-white rounded-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-white/80 font-body">
                    {language === "ar" ? "البريد الإلكتروني" : "Email"} *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    className="bg-[#0E0E0E] border-white/10 text-white rounded-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-white/80 font-body">
                    {language === "ar" ? "الهاتف" : "Phone"}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="bg-[#0E0E0E] border-white/10 text-white rounded-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="message" className="text-white/80 font-body">
                    {language === "ar" ? "الرسالة" : "Message"} *
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    required
                    rows={5}
                    className="bg-[#0E0E0E] border-white/10 text-white rounded-sm"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-sm"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? language === "ar"
                      ? "جاري الإرسال..."
                      : "Sending..."
                    : language === "ar"
                    ? "إرسال"
                    : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
