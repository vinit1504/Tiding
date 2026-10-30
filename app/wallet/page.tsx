"use client";

import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import {
  Wallet,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { AccountLayout } from "@/components/account/account-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { userProfileAtom, authSessionAtom } from "@/stores";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: "credit" | "debit";
  title: string;
  category: string;
  amount: number;
  date: string;
  orderId?: string;
  status: "completed" | "pending";
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-101",
    type: "credit",
    title: "Welcome Bonus Credited",
    category: "Bonus",
    amount: 100,
    date: "Today, 10:00 AM",
    status: "completed",
  },
  {
    id: "tx-102",
    type: "credit",
    title: "Cashback on Farm Fresh Groceries",
    category: "Cashback",
    amount: 35,
    date: "14 Oct 2026, 4:20 PM",
    orderId: "TD-629104",
    status: "completed",
  },
  {
    id: "tx-103",
    type: "debit",
    title: "Paid for Order #TD-518290",
    category: "Grocery Order",
    amount: 219,
    date: "10 Oct 2026, 8:46 PM",
    orderId: "TD-518290",
    status: "completed",
  },
  {
    id: "tx-104",
    type: "credit",
    title: "Instant Refund - Out of stock item",
    category: "Refund",
    amount: 55,
    date: "05 Oct 2026, 2:10 PM",
    status: "completed",
  },
];

export default function WalletPage() {
  const [user, setUser] = useAtom(userProfileAtom);
  const [session] = useAtom(authSessionAtom);

  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isRecharging, setIsRecharging] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "credit" | "debit">("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  const balance = user?.walletBalance ?? 100;

  const handleAddMoney = (amountToAdd: number) => {
    if (!amountToAdd || amountToAdd <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsRecharging(true);
    setTimeout(() => {
      const newBalance = balance + amountToAdd;
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        type: "credit",
        title: `Money Added to Wallet via UPI`,
        category: "Top-up",
        amount: amountToAdd,
        date: "Just now",
        status: "completed",
      };

      setTransactions((prev) => [newTx, ...prev]);

      if (user) {
        const updatedUser = {
          ...user,
          walletBalance: newBalance,
        };
        setUser(updatedUser);
        try {
          localStorage.setItem("tiding_user", JSON.stringify(updatedUser));
        } catch {}
      }

      setIsRecharging(false);
      setCustomAmount("");
      toast.success(`Successfully added ${formatCurrency(amountToAdd)} to Tiding Cash!`);
    }, 500);
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === "all") return true;
    return tx.type === filterType;
  });

  if (!mounted) return null;

  return (
    <AccountLayout activeTab="wallet">
      <div className="w-full bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Tiding Wallet
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Instant 1-tap checkout balance & automatic refund credits
              </p>
            </div>
            <div className="rounded-xl border border-gray-200/80 bg-gray-50 px-3 py-1.5 text-xs flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#0c831f]" />
              <span className="font-bold text-gray-800">100% Secure</span>
            </div>
          </div>

          {/* Clean White Wallet Balance Card (No heavy color gradients) */}
          <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Available Balance
                </span>
                <p className="text-3xl font-black text-gray-900 mt-1">
                  {formatCurrency(balance)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Usable instantly on all grocery orders with zero transaction fees.
                </p>
              </div>
            </div>

            {/* Quick Add Presets */}
            <div className="pt-2 border-t border-gray-200/60 space-y-3">
              <p className="text-xs font-bold text-gray-700">
                Quick Top-up:
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {[100, 200, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleAddMoney(amt)}
                    disabled={isRecharging}
                    className="rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-800 hover:border-[#0c831f] hover:text-[#0c831f] cursor-pointer transition-colors disabled:opacity-50"
                  >
                    +{formatCurrency(amt)}
                  </button>
                ))}
              </div>

              {/* Custom Topup */}
              <div className="flex items-center gap-2 max-w-sm pt-1">
                <Input
                  type="number"
                  placeholder="Enter custom amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="h-9 text-xs rounded-lg border-gray-300 bg-white"
                />
                <Button
                  onClick={() => handleAddMoney(Number(customAmount))}
                  disabled={!customAmount || Number(customAmount) <= 0 || isRecharging}
                  className="h-9 bg-[#0c831f] hover:bg-[#0a6f1a] text-white text-xs font-bold px-4 rounded-lg cursor-pointer"
                >
                  Add Money
                </Button>
              </div>
            </div>
          </div>

          {/* Clean Transactions Ledger */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">
                Transaction History
              </h2>

              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={`px-2.5 py-1 rounded-md ${
                    filterType === "all" ? "bg-gray-100 text-gray-900 font-bold" : ""
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("credit")}
                  className={`px-2.5 py-1 rounded-md ${
                    filterType === "credit" ? "bg-emerald-50 text-[#0c831f] font-bold" : ""
                  }`}
                >
                  Credits
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("debit")}
                  className={`px-2.5 py-1 rounded-md ${
                    filterType === "debit" ? "bg-rose-50 text-rose-600 font-bold" : ""
                  }`}
                >
                  Debits
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      {tx.title}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {tx.date} • {tx.category}
                    </p>
                  </div>
                  <p
                    className={`text-xs sm:text-sm font-bold ${
                      tx.type === "credit" ? "text-[#0c831f]" : "text-gray-900"
                    }`}
                  >
                    {tx.type === "credit" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
      </div>
    </AccountLayout>
  );
}
