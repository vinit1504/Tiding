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
  Laptop,
  Smartphone,
  Globe,
  Trash2,
  LogOut,
  Clock,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { userProfileAtom, authSessionAtom } from "@/stores";
import { getUserDisplayInitials } from "@/lib/utils";
import {
  useUpdateProfileMutation,
  useDeviceSessionsQuery,
  useRevokeSessionMutation,
  useLogoutAllSessionsMutation,
} from "@/queries";
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

  // Queries and mutations
  const updateProfileMutation = useUpdateProfileMutation();
  const { data: deviceSessions = [], isLoading: isLoadingSessions } = useDeviceSessionsQuery();
  const revokeSessionMutation = useRevokeSessionMutation();
  const logoutAllMutation = useLogoutAllSessionsMutation();

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim() || user.name;

    try {
      const updatedUser = await updateProfileMutation.mutateAsync({
        first_name: trimmedFirst,
        last_name: trimmedLast,
        display_name: fullName,
        phone: phone.trim() || undefined,
        gender: gender !== "Not Specified" ? gender : undefined,
        date_of_birth: dob || undefined,
      });

      setUser(updatedUser);
      setSession((prev) => ({ ...prev, user: updatedUser }));
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      // Fallback update locally if network fails
      const fallbackUser = {
        ...user,
        name: fullName,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        phone: phone.trim() || user.phone,
        profile: {
          ...(user.profile || {}),
          firstName: trimmedFirst,
          lastName: trimmedLast,
          gender,
          dateOfBirth: dob,
        },
      };
      setUser(fallbackUser);
      setSession((prev) => ({ ...prev, user: fallbackUser }));
      setIsEditing(false);
      toast.success("Profile updated locally");
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSessionMutation.mutateAsync(sessionId);
      toast.success("Device session revoked successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke device session");
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm("Are you sure you want to log out all other devices?")) return;
    try {
      await logoutAllMutation.mutateAsync();
      toast.success("All other device sessions logged out");
    } catch (err: any) {
      toast.error(err.message || "Failed to logout sessions");
    }
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
                      disabled
                      className="h-9 text-xs rounded-lg border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-gray-400">Email cannot be modified directly</p>
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
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    isLoading={updateProfileMutation.isPending}
                    className="h-9 bg-[#0c831f] hover:bg-[#0a6f1a] text-white text-xs font-bold px-4 rounded-lg cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    <span>Save Changes</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="h-9 text-xs rounded-lg cursor-pointer"
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
                    {user?.phone || "Not provided"}
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

          {/* Active Device Sessions Section */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#0c831f]" />
                  <span>Active Device Sessions</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage devices and browsers logged into your account
                </p>
              </div>

              {deviceSessions.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogoutAll}
                  isLoading={logoutAllMutation.isPending}
                  className="h-8 px-3 text-[11px] font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 cursor-pointer"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  <span>Log out all other devices</span>
                </Button>
              )}
            </div>

            {isLoadingSessions ? (
              <div className="py-6 text-center text-xs text-gray-400">
                Loading active sessions...
              </div>
            ) : deviceSessions.length === 0 ? (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-500 flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-400" />
                <span>Current Web Session (Active)</span>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                {deviceSessions.map((s) => {
                  const isMobile =
                    s.deviceType?.toLowerCase().includes("mobile") ||
                    s.userAgent?.toLowerCase().includes("mobile");

                  return (
                    <div
                      key={s.id}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                          {isMobile ? (
                            <Smartphone className="h-4 w-4" />
                          ) : (
                            <Laptop className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">
                              {s.deviceName || (isMobile ? "Mobile Device" : "Desktop Computer")}
                            </span>
                            {s.isCurrentSession && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                                This device
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                            {s.ipAddress && <span>IP: {s.ipAddress}</span>}
                            {s.lastActiveAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(s.lastActiveAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {!s.isCurrentSession && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeSession(s.id)}
                          disabled={revokeSessionMutation.isPending}
                          className="h-8 px-2.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          <span>Revoke</span>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
