"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User, Building2, GraduationCap, Instagram, Save, Loader2, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
    const [profile, setProfile] = useState({
        full_name: "",
        department: "",
        year: "",
        instagram_url: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

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
                });
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

            // Basic validation/formatting for Instagram URL
            let insta = profile.instagram_url.trim();
            if (insta && !insta.startsWith("http") && !insta.includes("instagram.com")) {
                // Assume it's a username, prepend URL
                insta = `https://instagram.com/${insta.replace("@", "")}`;
            }

            const { error: upsertError } = await supabase.from("users").upsert({
                id: user.id,
                email: user.email,
                full_name: profile.full_name,
                department: profile.department,
                year: profile.year,
                instagram_url: insta,
            });

            if (upsertError) throw upsertError;

            // Update state with formatted URL
            setProfile((prev) => ({ ...prev, instagram_url: insta }));

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
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
        <div className="animate-[fade-in_0.6s_ease-out]">
            <div className="mb-8">
                <h1 className="text-3xl font-bold gradient-text mb-2">Your Profile</h1>
                <p className="text-[var(--color-text-secondary)] text-sm">
                    Set up your profile so others can find you 💫
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
                    {error}
                </div>
            )}

            {saved && (
                <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Profile saved successfully! ✨
                </div>
            )}

            <form onSubmit={handleSave} className="glass-card p-8 space-y-6">
                {/* Avatar Display - generated from name */}
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500/20 to-violet-500/20 border-2 border-[var(--color-border-subtle)] flex items-center justify-center text-3xl font-bold text-pink-400">
                        {profile.full_name ? (
                            profile.full_name.charAt(0).toUpperCase()
                        ) : (
                            <User className="w-10 h-10" />
                        )}
                    </div>
                </div>

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Full Name
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] opacity-50" />
                        <input
                            id="name-input"
                            type="text"
                            value={profile.full_name}
                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                            placeholder="Your full name"
                            className="input-field !pl-14"
                            required
                        />
                    </div>
                </div>

                {/* Department */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Department / Course
                    </label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] opacity-50" />
                        <input
                            id="department-input"
                            type="text"
                            value={profile.department}
                            onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                            placeholder="e.g. Computer Science"
                            className="input-field !pl-14"
                            required
                        />
                    </div>
                </div>

                {/* Year */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Year
                    </label>
                    <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] opacity-50" />
                        <select
                            id="year-select"
                            value={profile.year}
                            onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                            className="input-field !pl-14 appearance-none cursor-pointer bg-[var(--color-bg-card)] text-[var(--color-text-primary)]"
                            required
                        >
                            <option value="" disabled className="bg-[var(--color-bg-card)]">Select your year</option>
                            <option value="1st Year" className="bg-[var(--color-bg-card)] py-2">1st Year</option>
                            <option value="2nd Year" className="bg-[var(--color-bg-card)] py-2">2nd Year</option>
                            <option value="3rd Year" className="bg-[var(--color-bg-card)] py-2">3rd Year</option>
                            <option value="4th Year" className="bg-[var(--color-bg-card)] py-2">4th Year</option>
                        </select>
                    </div>
                </div>

                {/* Instagram URL */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Instagram Username or URL <span className="opacity-50">(optional)</span>
                    </label>
                    <div className="relative">
                        <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] opacity-50" />
                        <input
                            id="insta-input"
                            type="text"
                            value={profile.instagram_url}
                            onChange={(e) => setProfile({ ...profile, instagram_url: e.target.value })}
                            placeholder="@username or https://instagram.com/..."
                            className="input-field !pl-14"
                        />
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={saving}
                    className="btn-gradient w-full flex items-center justify-center gap-2 py-3"
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
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
