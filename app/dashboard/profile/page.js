"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { isProfileComplete } from "@/lib/profile";
import { User, Building2, GraduationCap, Instagram, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ProfilePage() {
    const [profile, setProfile] = useState({
        full_name: "",
        department: "",
        year: "",
        instagram_url: "",
        gender: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [profileIncomplete, setProfileIncomplete] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            const { data, error: fetchError } = await supabase
                .from("users")
                .select("*")
                .eq("id", user.id)
                .single();

            if (fetchError && fetchError.code !== "PGRST116") {
                throw fetchError;
            }

            if (data) {
                setProfile({
                    full_name: data.full_name || "",
                    department: data.department || "",
                    year: data.year || "",
                    instagram_url: data.instagram_url || "",
                    gender: data.gender || "",
                });

                // Check if profile is incomplete
                setProfileIncomplete(!isProfileComplete(data));
            }
        } catch (err) {
            setError("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSaved(false);

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) throw new Error("Not authenticated");

            // Validate all required fields
            if (!profile.full_name.trim()) {
                throw new Error("Full name is required");
            }
            if (!profile.department) {
                throw new Error("Department is required");
            }
            if (!profile.year) {
                throw new Error("Year is required");
            }
            if (!profile.gender) {
                throw new Error("Gender is required");
            }
            if (!profile.instagram_url.trim()) {
                throw new Error("Instagram URL is required");
            }

            // Basic validation/formatting for Instagram URL
            let insta = profile.instagram_url.trim();
            if (insta && !insta.startsWith("http") && !insta.includes("instagram.com")) {
                insta = `https://instagram.com/${insta.replace("@", "")}`;
            }

            const { error: upsertError } = await supabase.from("users").upsert({
                id: user.id,
                email: user.email,
                full_name: profile.full_name.trim(),
                department: profile.department,
                year: profile.year,
                instagram_url: insta,
                gender: profile.gender,
            });

            if (upsertError) throw upsertError;

            setProfile((prev) => ({ ...prev, instagram_url: insta }));
            setSaved(true);
            setProfileIncomplete(false);
            setTimeout(() => setSaved(false), 3000);

            // Refresh page to update layout state
            window.location.reload();
        } catch (err) {
            setError(err.message || "Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto animate-[fade-in_0.6s_ease-out]">
            {/* Header */}
            <div className="mb-6 text-center">
                <div className="mb-4 inline-block">
                    <User className="w-12 h-12 text-pink-400" />
                </div>
                <h1 className="text-3xl font-bold gradient-text mb-2">Your Profile</h1>
                <p className="text-[var(--color-text-secondary)] text-sm">
                    {profileIncomplete
                        ? "Complete your profile to access the dashboard"
                        : "Manage your profile information"}
                </p>
            </div>

            {/* Incomplete Profile Warning */}
            {profileIncomplete && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-rose-300 mb-1">Profile Incomplete</h3>
                        <p className="text-sm text-rose-300/80">
                            Please fill in all required fields to access the dashboard features.
                        </p>
                    </div>
                </div>
            )}

            {/* Messages */}
            {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm text-center">
                    {error}
                </div>
            )}

            {saved && (
                <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-sm text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Profile saved successfully!
                </div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleSave} className="glass-card p-6 space-y-6">
                {/* Full Name */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Full Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] opacity-50" />
                        <input
                            type="text"
                            value={profile.full_name}
                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                            placeholder="Enter your full name"
                            className="input-field !pl-14 border-pink-500/30 focus:border-pink-500"
                            required
                        />
                    </div>
                </div>

                {/* Department */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Department <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] opacity-50 pointer-events-none z-10" />
                        <select
                            value={profile.department}
                            onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                            className="input-field !pl-14 border-pink-500/30 focus:border-pink-500"
                            required
                        >
                            <option value="">Select Department</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Artificial Intelligence">Artificial Intelligence</option>
                            <option value="Cyber Security">Cyber Security</option>
                            <option value="BBA">BBA</option>
                            <option value="Mechanical Engineering">Mechanical Engineering</option>
                            <option value="Electronics & Communication">Electronics & Communication</option>
                            <option value="Electrical Engineering">Electrical Engineering</option>
                            <option value="Civil Engineering">Civil Engineering</option>
                            <option value="MBA">MBA</option>
                        </select>
                    </div>
                </div>

                {/* Year */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Year <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] opacity-50 pointer-events-none z-10" />
                        <select
                            value={profile.year}
                            onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                            className="input-field !pl-14 border-pink-500/30 focus:border-pink-500"
                            required
                        >
                            <option value="">Select Year</option>
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                        </select>
                    </div>
                </div>

                {/* Gender */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Gender <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex gap-4">
                        <label className="flex-1 cursor-pointer" htmlFor="gender-male">
                            <input
                                type="radio"
                                id="gender-male"
                                name="gender"
                                value="Male"
                                checked={profile.gender === "Male"}
                                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                className="sr-only peer"
                                required
                            />
                            <div className="glass-card p-4 text-center border-2 border-[var(--color-border-subtle)] peer-checked:border-pink-500 peer-checked:bg-pink-500/10 transition-all duration-200 hover:border-pink-500/50">
                                <span className="font-medium">Male</span>
                            </div>
                        </label>
                        <label className="flex-1 cursor-pointer" htmlFor="gender-female">
                            <input
                                type="radio"
                                id="gender-female"
                                name="gender"
                                value="Female"
                                checked={profile.gender === "Female"}
                                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                className="sr-only peer"
                                required
                            />
                            <div className="glass-card p-4 text-center border-2 border-[var(--color-border-subtle)] peer-checked:border-pink-500 peer-checked:bg-pink-500/10 transition-all duration-200 hover:border-pink-500/50">
                                <span className="font-medium">Female</span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Instagram URL */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Instagram URL <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                        <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] opacity-50" />
                        <input
                            type="text"
                            value={profile.instagram_url}
                            onChange={(e) => setProfile({ ...profile, instagram_url: e.target.value })}
                            placeholder="@username or full URL"
                            className="input-field !pl-14 border-pink-500/30 focus:border-pink-500"
                            required
                        />
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                        Enter your Instagram username or profile URL
                    </p>
                </div>

                {/* Save Button */}
                <button
                    type="submit"
                    disabled={saving}
                    className="btn-gradient w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Save Profile
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
