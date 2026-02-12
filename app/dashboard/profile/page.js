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
        gender: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    // Check if specific field is null or undefined (for individual field editing)
    const isFieldNull = (fieldName) => {
        return profile[fieldName] === null || profile[fieldName] === undefined;
    };

    // Check if any editable field is null or undefined
    const hasNullEditableFields = () => {
        return isFieldNull('year') ||
            isFieldNull('department') ||
            isFieldNull('gender');
    };

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
                    department: data.department,
                    year: data.year,
                    instagram_url: data.instagram_url || "",
                    gender: data.gender,
                });

                // Enable editing mode if any editable field is null
                const hasNullFields = data.department === null || data.department === undefined ||
                    data.year === null || data.year === undefined ||
                    data.gender === null || data.gender === undefined;
                setIsEditing(hasNullFields);
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
                insta = `https://instagram.com/${insta.replace("@", "")}`;
            }

            const { error: upsertError } = await supabase.from("users").upsert({
                id: user.id,
                email: user.email,
                full_name: profile.full_name,
                department: profile.department,
                year: profile.year,
                instagram_url: insta,
                gender: profile.gender,
            });

            if (upsertError) throw upsertError;

            setProfile((prev) => ({ ...prev, instagram_url: insta }));
            setSaved(true);
            setIsEditing(false); // Exit editing mode after successful save
            setTimeout(() => setSaved(false), 3000);
            // Refresh to update read-only state
            await fetchProfile();
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

            <form onSubmit={handleSave} className="glass-card p-8 space-y-6 opacity-80">
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500/20 to-violet-500/20 border-2 border-[var(--color-border-subtle)] flex items-center justify-center text-3xl font-bold text-pink-400">
                        {profile.full_name ? (
                            profile.full_name.charAt(0).toUpperCase()
                        ) : (
                            <User className="w-10 h-10" />
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Full Name
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] opacity-50" />
                        <input
                            type="text"
                            value={profile.full_name}
                            readOnly
                            className="input-field !pl-14 cursor-not-allowed bg-transparent"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Department / Course
                    </label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] opacity-50" />
                        {isFieldNull('department') ? (
                            <select
                                value={profile.department || ""}
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
                        ) : (
                            <input
                                type="text"
                                value={profile.department}
                                readOnly
                                className="input-field !pl-14 cursor-not-allowed bg-transparent"
                                required
                            />
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Year
                    </label>
                    <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] opacity-50" />
                        {isFieldNull('year') ? (
                            <select
                                value={profile.year || ""}
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
                        ) : (
                            <input
                                type="text"
                                value={profile.year}
                                readOnly
                                className="input-field !pl-14 cursor-not-allowed bg-transparent"
                                required
                            />
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Instagram
                    </label>
                    <div className="relative">
                        <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-400 opacity-50" />
                        <input
                            type="text"
                            value={profile.instagram_url}
                            readOnly
                            placeholder="Instagram Username (@...)"
                            className="input-field !pl-14 cursor-not-allowed bg-transparent"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Gender
                    </label>
                    {isFieldNull('gender') ? (
                        <div className="flex gap-4">
                            <label className="flex-1 cursor-pointer" htmlFor="gender-male">
                                <input
                                    type="radio"
                                    id="gender-male"
                                    name="gender"
                                    value="Male"
                                    checked={profile.gender === "Male"}
                                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                    className="hidden"
                                    required
                                />
                                <div className={`flex items-center justify-center p-3 rounded-xl border transition-all ${profile.gender === "Male"
                                    ? "border-pink-500 bg-pink-500/10 text-pink-400"
                                    : "border-[var(--color-border-subtle)] bg-pink-500/5 text-[var(--color-text-secondary)]"
                                    }`}>
                                    Male
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
                                    className="hidden"
                                    required
                                />
                                <div className={`flex items-center justify-center p-3 rounded-xl border transition-all ${profile.gender === "Female"
                                    ? "border-pink-500 bg-pink-500/10 text-pink-400"
                                    : "border-[var(--color-border-subtle)] bg-pink-500/5 text-[var(--color-text-secondary)]"
                                    }`}>
                                    Female
                                </div>
                            </label>
                        </div>
                    ) : (
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] opacity-50" />
                            <input
                                type="text"
                                value={profile.gender || "Not specified"}
                                readOnly
                                className="input-field !pl-14 cursor-not-allowed bg-transparent"
                            />
                        </div>
                    )}
                </div>

                {isEditing ? (
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-gradient w-full flex items-center justify-center gap-2 py-3"
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
                ) : (
                    <div className="pt-4 border-t border-[var(--color-border-subtle)]">
                        <div className="flex items-center justify-center gap-2 text-green-400 font-medium">
                            <CheckCircle2 className="w-5 h-5" />
                            Profile Complete
                        </div>
                        <p className="text-center text-[var(--color-text-secondary)] text-xs mt-2">
                            Your profile is complete and verified. All fields are locked.
                        </p>
                    </div>
                )}
            </form>
        </div>
    );
}
