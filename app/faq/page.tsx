import React from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_CONFIG } from "@/lib/constants/site-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) - 10-Minute Grocery Delivery",
  description:
    "Find answers to frequently asked questions about Tiding 10-minute grocery delivery, return policy, payment methods, delivery areas, and produce freshness.",
};

const FAQS = [
  {
    question: "How does Tiding deliver groceries in 10-15 minutes?",
    answer:
      "We operate a hyper-local network of automated micro-fulfillment dark stores situated right in your neighborhood. When you place an order, our staff packs the items within 2 minutes and our delivery partner delivers them immediately via dedicated electric delivery routes.",
  },
  {
    question: "What are your delivery hours?",
    answer:
      "Tiding operates daily from 6:00 AM to 11:30 PM, ensuring you can get morning milk and bread as early as dawn, or late-night snacks and beverages.",
  },
  {
    question: "What is your return and refund policy for fresh vegetables?",
    answer:
      "We follow a strict 100% no-questions-asked freshness guarantee. If any produce or fruit does not meet your quality expectations, you can request an instant refund or replacement through the app within 24 hours.",
  },
  {
    question: "Is there a minimum order value for free delivery?",
    answer:
      "Yes! Orders above ₹199 enjoy zero delivery fees. For smaller orders, a nominal standard fee of ₹25 applies.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major payment methods including UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, and Cash on Delivery (COD).",
  },
];

export default function FaqPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-8">
      <JsonLd data={faqSchema} />

      <div className="border-b border-[var(--border)] pb-6 text-center space-y-2">
        <span className="rounded-full bg-[#18A818]/15 px-3 py-1 text-xs font-bold text-[#18A818]">
          Help & Support
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
          Frequently Asked Questions
        </h1>
        <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
          Everything you need to know about our lightning-fast 10-minute grocery service.
        </p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, index) => (
          <div
            key={index}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-2 shadow-xs"
          >
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-start gap-2">
              <span className="text-[#18A818] font-mono">Q.</span>
              <span>{faq.question}</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)] pl-5 leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
