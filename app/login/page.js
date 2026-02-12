"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    Heart,
    Loader2,
    User,
    Building2,
    GraduationCap,
    Instagram,
    CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ALLOWED_DOMAINS = [
  "@student.providence.edu.in",
  "@psb.providence.edu.in",
];
const parseStudentEmail = (email) => {
    console.log("Parsing email:", email);
    try {
        const localPart = email.split("@")[0];
        const [namePart, studentInfo] = localPart.split(".");

        if (!namePart || !studentInfo) {
            console.error("Invalid email format for parsing");
            return null;
        }

        const name = namePart
            .trim() // Remove leading/trailing whitespace
            .split(/\s+/) // Split by one OR more spaces
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
            .join(" ");
        //if starts with num
        let yearCode;
        let deptCode;
        //prc22cs03 -> 22cs03
        if (
            studentInfo.substring(0, 3) == "prc" ||
            studentInfo.substring(0, 3) == "PRC"
        ) {
            yearCode = studentInfo.substring(3, 5);
            const deptMatch = studentInfo.substring(5).match(/^[a-zA-Z]+/);
            deptCode = deptMatch ? deptMatch[0].toLowerCase() : "";
        }
        //newone cs2203
        //new
        else {
            yearCode = studentInfo.substring(2, 4);
            const deptMatch = studentInfo.substring(0, 2);
            deptCode = deptMatch ? deptMatch.toLowerCase() : "";
        }
        const depts = {
            cs: "Computer Science",
            ca: "Artificial Intelligence",
            ai: "Artificial Intelligence",
            csot: "Cyber Security",
            cy: "Cyber Security",
            bb: "BBA",
            bba: "BBA",
            ba: "BBA",
            me: "Mechanical Engineering",
            ec: "Electronics & Communication",
            ee: "Electrical Engineering",
            ce: "Civil Engineering",
            mba: "MBA",
            mb: "MBA",
        };

        const years = {
            22: "4th Year",
            23: "3rd Year",
            24: "2nd Year",
            25: "1st Year",
        };

        let yearText = "";
        yearText = years[yearCode];

        return {
            full_name: name,
            department: depts[deptCode] || deptCode.toUpperCase(),
            year: yearText,
        };
    } catch (e) {
        console.error("Parse error:", e);
        return null;
    }
};

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true); // Prevent flash
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [step, setStep] = useState("auth"); // "auth" | "profile"
    const [tempProfile, setTempProfile] = useState({
        id: "",
        email: "",
        full_name: "",
        department: "",
        year: "",
        instagram_url: "",
        gender: "",
    });

    useEffect(() => {
        // Handle existing session and auth updates
        const handleAuth = async (session) => {
            if (!session?.user) {
                setLoading(false);
                return;
            }

            const userEmail = session.user.email;

            if (
  !ALLOWED_DOMAINS.some((domain) =>
    userEmail?.toLowerCase().endsWith(domain)
  )
) {
  setError(
    `Only ${ALLOWED_DOMAINS.join(" or ")} emails are allowed`
  );
  await supabase.auth.signOut();
  setLoading(false);
  return;
}

            try {
                const { data: existingUser } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", session.user.id)
                    .single();

                if (existingUser?.instagram_url && existingUser?.gender) {
                    // All good, go home
                    router.replace("/dashboard/home");
                } else {
                    // Profile incomplete, show the step
                    const parsed = parseStudentEmail(userEmail);
                    setTempProfile({
                        id: session.user.id,
                        email: userEmail,
                        full_name: existingUser?.full_name || parsed?.full_name || "",
                        department: existingUser?.department || parsed?.department || "",
                        year: existingUser?.year || parsed?.year || "",
                        instagram_url: existingUser?.instagram_url || "",
                        gender: existingUser?.gender || "",
                    });
                    setStep("profile");
                    setLoading(false);
                }
            } catch (err) {
                console.error("Profile check error:", err);
                setLoading(false);
            }
        };

        // Initial check
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleAuth(session);
        });

        // Auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN") {
                handleAuth(session);
            } else if (event === "SIGNED_OUT") {
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const handleGoogleSignIn = async () => {
        setError("");
        setLoading(true);
        try {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const { error: authError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${origin}/login`,
                    queryParams: {
                        access_type: "offline",
                        prompt: "consent",
                    },
                },
            });
            if (authError) throw authError;
        } catch (err) {
            console.error("Auth error:", err);
            setError(`Error: ${err.message}. Origin: ${window.location.origin}`);
            setLoading(false);
        }
    };

    const handleCompleteProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            let insta = tempProfile.instagram_url.trim();
            if (insta && !insta.startsWith("http") && !insta.includes("instagram.com")) {
                insta = `https://instagram.com/${insta.replace("@", "")}`;
            }

            const { error: upsertError } = await supabase.from("users").upsert({
                id: tempProfile.id,
                email: tempProfile.email,
                full_name: tempProfile.full_name,
                department: tempProfile.department,
                year: tempProfile.year,
                instagram_url: insta,
                gender: tempProfile.gender,
            });

            if (upsertError) {
                // Handle stale session (User deleted in Auth but session persists)
                if (upsertError.code === "23503") { // foreign_key_violation
                    await supabase.auth.signOut();
                    window.location.reload();
                    return;
                }
                throw upsertError;
            }
            router.push("/dashboard/home");
        } catch (err) {
            setError(err.message || "Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading && !error) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div style={{ animation: "heart-beat 1.2s ease-in-out infinite" }}>
                    <Heart className="w-12 h-12 text-pink-400 fill-pink-400" />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            <div className="absolute top-1/3 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/3 -right-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />

            <div className="glass-card p-10 sm:p-12 w-full max-md animate-[slide-up_0.5s_ease-out]">
                {step === "auth" ? (
                    <>
                        <div className="text-center mb-8">
                            <Link href="/" className="inline-block">
                                <div style={{ animation: "heart-beat 1.2s ease-in-out infinite" }} className="mb-3">
                                    <Heart className="w-10 h-10 text-pink-400 fill-pink-400 mx-auto" />
                                </div>
                            </Link>
                            <h1 className="text-3xl font-bold gradient-text">Welcome Back</h1>
                            <p className="text-[var(--color-text-secondary)] text-sm mt-2">
                                Sign in with your college Google account
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleGoogleSignIn}
                            className="btn-gradient w-full flex items-center justify-center gap-3 py-3 text-base"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign in with Google
                        </button>

                        <p className="text-xs text-[var(--color-text-secondary)] text-center mt-6 opacity-60">
                            Only {ALLOWED_DOMAINS.join(" or ")} accounts are allowed
                        </p>
                    </>
                ) : (
                    <form onSubmit={handleCompleteProfile} className="space-y-6">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold gradient-text">Complete Profile</h2>
                            <p className="text-[var(--color-text-secondary)] text-sm mt-1">
                                Enter your Instagram to join the fun!
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] opacity-50" />
                                <input
                                    type="text"
                                    value={tempProfile.full_name}
                                    readOnly
                                    className="input-field !pl-12 cursor-not-allowed bg-transparent"
                                />
                            </div>

                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] opacity-50" />
                                <input
                                    type="text"
                                    value={tempProfile.department}
                                    readOnly
                                    required
                                    className="input-field !pl-12 cursor-not-allowed bg-transparent"
                                />
                            </div>

                            <div className="relative">
                                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] opacity-50" />
                                <input
                                    type="text"
                                    value={tempProfile.year}
                                    readOnly
                                    required
                                    className="input-field !pl-12 cursor-not-allowed bg-transparent"
                                />
                            </div>

                            <div className="relative">
                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-400" />
                                <input
                                    type="text"
                                    value={tempProfile.instagram_url}
                                    onChange={(e) => setTempProfile({ ...tempProfile, instagram_url: e.target.value })}
                                    placeholder="Instagram Username (@...)"
                                    className="input-field !pl-12 border-pink-500/30 focus:border-pink-500"
                                    required
                                />
                            </div>

                            {/* Gender Selection */}
                            <div className="flex gap-4">
                                <label className="flex-1 cursor-pointer" htmlFor="gender-male">
                                    <input
                                        type="radio"
                                        id="gender-male"
                                        name="gender"
                                        value="Male"
                                        checked={tempProfile.gender === "Male"}
                                        onChange={(e) => setTempProfile({ ...tempProfile, gender: e.target.value })}
                                        className="hidden"
                                        required
                                    />
                                    <div className={`flex items-center justify-center p-3 rounded-xl border transition-all ${tempProfile.gender === "Male"
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
                                        checked={tempProfile.gender === "Female"}
                                        onChange={(e) => setTempProfile({ ...tempProfile, gender: e.target.value })}
                                        className="hidden"
                                        required
                                    />
                                    <div className={`flex items-center justify-center p-3 rounded-xl border transition-all ${tempProfile.gender === "Female"
                                        ? "border-pink-500 bg-pink-500/10 text-pink-400"
                                        : "border-[var(--color-border-subtle)] bg-pink-500/5 text-[var(--color-text-secondary)]"
                                        }`}>
                                        Female
                                    </div>
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-gradient w-full flex items-center justify-center gap-2 py-3"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    Complete Registration
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}
