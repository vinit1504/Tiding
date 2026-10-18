"use client";

import React, { useState } from "react";
import { SITE_CONFIG } from "@/lib/constants/site-config";
import { Phone, Mail, MapPin, Headphones, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { toast } from "sonner";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please describe your query or issue");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setMessage("");
      toast.success("Message received! Our team will connect with you shortly.");
    }, 600);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f4f6fb] py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-6 items-start">
        {/* Left Sidebar */}
        <AccountSidebar activeTab="support" />

        {/* Right Main Content */}
        <main className="flex-1 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 space-y-2 shadow-xs">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Headphones className="h-5 w-5 text-[#0c831f]" />
              <span>24x7 Help & Customer Support</span>
            </h1>
            <p className="text-xs text-gray-500">
              Need assistance with an ongoing delivery, order refund, or product quality? We&apos;re here to help anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Details */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-2 shadow-xs">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#0c831f]" />
                  <span>Customer Helpline</span>
                </h2>
                <p className="text-xs font-semibold text-gray-800">{SITE_CONFIG.supportPhone}</p>
                <p className="text-[11px] text-gray-400">Available daily from 6:00 AM to 11:30 PM</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-2 shadow-xs">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#0c831f]" />
                  <span>Email Support</span>
                </h2>
                <p className="text-xs font-semibold text-gray-800">{SITE_CONFIG.supportEmail}</p>
                <p className="text-[11px] text-gray-400">Typically responds within 15 minutes</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-2 shadow-xs">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#0c831f]" />
                  <span>Headquarters & Dark Stores</span>
                </h2>
                <p className="text-xs text-gray-600">
                  Tiding Technologies Pvt. Ltd., Sector 1, HSR Layout, Bengaluru, Karnataka 560102
                </p>
              </div>
            </div>

            {/* Message Form */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 space-y-4 shadow-xs">
              <h2 className="text-sm font-bold text-gray-900">
                Send Us a Quick Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-gray-700">Your Name</label>
                  <Input
                    placeholder="e.g. Vinit"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Phone or Email</label>
                  <Input
                    placeholder="+91 75673 37686"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">How can we help?</label>
                  <textarea
                    rows={4}
                    placeholder="Describe your issue or order inquiry..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full mt-1 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0c831f]"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#0c831f] hover:bg-[#0a6e1a] text-white font-bold text-xs cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  <span>{isSubmitting ? "Sending..." : "Submit Inquiry"}</span>
                </Button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
