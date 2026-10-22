"use client";

import React from "react";
import { ShieldCheck, Lock, Eye, FileText } from "lucide-react";
import { AccountSidebar } from "@/components/account/account-sidebar";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f4f6fb] py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-6 items-start">
        {/* Left Sidebar */}
        <AccountSidebar activeTab="privacy" />

        {/* Right Main Content */}
        <main className="flex-1 bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-gray-100 pb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-[#0c831f]" />
              <span>Account Privacy & Security</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Last updated: October 2026 • Your data protection and privacy guarantees.
            </p>
          </div>

          <div className="space-y-6 text-xs text-gray-600 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-[#0c831f]" />
                <span>1. Information We Collect</span>
              </h2>
              <p>
                We collect information you provide directly to us when placing an order, including your name, contact phone number, saved delivery addresses, and geolocation coordinates used to route your order to the nearest neighborhood dark store.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-[#0c831f]" />
                <span>2. How We Use Your Information</span>
              </h2>
              <p>
                Your information is used strictly to fulfill your grocery order, process secure payments, communicate delivery arrival, and improve fresh product catalog availability. We never sell your personal information to third parties.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-[#0c831f]" />
                <span>3. Data Security & Encryption</span>
              </h2>
              <p>
                We employ industry-standard 256-bit SSL encryption to protect your data during transmission and maintain strict security safeguards across our infrastructure.
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
