"use client";

import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import {
  User,
  Mail,
  Phone,
  Shield,
  Save,
  CheckCircle2,
  Edit3,
  BellRing,
} from "lucide-react";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { userProfileAtom, authSessionAtom } from "@/stores";
import { getUserDisplayInitials } from "@/lib/utils";
import { toast } from "sonner";

export default function ProfilePage() {
  const [user, setUser] = useAtom(userProfileAtom);
  const [session, setSession] = useAtom(authSessionAtom);

  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("Not Specified");
  const [dob, setDob] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [notifWhatsapp, setNotifWhatsapp] = useState(true);
  const [notifPromos, setNotifPromos] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || user.name?.split(" ")[0] || "");
      setLastName(user.lastName || user.name?.split(" ").slice(1).join(" ") || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setGender(user.profile?.gender || "Not Specified");
      setDob(user.profile?.dateOfBirth || "");
    }
  }, [user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || user.name;
    const updatedUser = {
      ...user,
      name: fullName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || user.email,
      phone: phone.trim() || user.phone,
      profile: {
        ...(user.profile || {}),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        dateOfBirth: dob,
      },
    };

    setTimeout(() => {
      setUser(updatedUser);
      setSession((prev) => ({ ...prev, user: updatedUser }));
      try {
        localStorage.setItem("tiding_user", JSON.stringify(updatedUser));
      } catch {}
      setIsSaving(false);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    }, 400);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f4f6fb] py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-6 items-start">
        {/* Left Sidebar */}
        <AccountSidebar activeTab="profile" />

        {/* Right Content */}
        <main className="flex-1 w-full bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                My profile
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage your personal details and account preferences
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="h-9 px-4 text-xs font-bold rounded-lg border-gray-300 cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5 mr-1" />
              <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
            </Button>
          </div>

          {/* Clean User Profile Header Row */}
          <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-5">
            <div className="flex items-center gap-4">
              {/* Single Email First Character Avatar */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0c831f] text-white font-black text-2xl shadow-sm tracking-wider">
                {user?.email ? user.email.trim().charAt(0).toUpperCase() : getUserDisplayInitials(user)}
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  {user?.name || "Customer"}
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {user?.email || "No email linked"}
                </p>
                {user?.phone && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {user.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information Form / View */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-gray-900">
              Personal Information
            </h3>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">
                      First Name
                    </label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-9 text-xs rounded-lg border-gray-300"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">
                      Last Name
                    </label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-9 text-xs rounded-lg border-gray-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-9 text-xs rounded-lg border-gray-300"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">
                      Mobile Number
                    </label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-9 text-xs rounded-lg border-gray-300"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    isLoading={isSaving}
                    className="h-9 bg-[#0c831f] hover:bg-[#0a6f1a] text-white text-xs font-bold px-4 rounded-lg cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    <span>Save Changes</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="h-9 text-xs rounded-lg"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-gray-100 rounded-xl p-3.5 space-y-0.5">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">
                    Full Name
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.name || "Customer"}
                  </p>
                </div>
                <div className="border border-gray-100 rounded-xl p-3.5 space-y-0.5">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">
                    Email ID
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.email || "No email linked"}
                  </p>
                </div>
                <div className="border border-gray-100 rounded-xl p-3.5 space-y-0.5">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">
                    Phone Number
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.phone || "+91 75673 37686"}
                  </p>
                </div>
                <div className="border border-gray-100 rounded-xl p-3.5 space-y-0.5">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">
                    Account Status
                  </p>
                  <p className="text-sm font-bold text-[#0c831f] flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Active Member</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
