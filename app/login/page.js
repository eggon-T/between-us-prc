"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, ArrowRight, Heart, Loader2, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ALLOWED_DOMAIN = "@student.providence.edu.in";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState("email"); // "email" | "otp"
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError("");

        if (!email.endsWith(ALLOWED_DOMAIN)) {
            setError("Only @student.providence.edu.in emails are allowed");
            return;
        }

        setLoading(true);

        try {
            const { error: authError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: true,
                },
            });

            if (authError) throw authError;

            setStep("otp");
            setCooldown(60);
            setMessage("Check your email for the verification code! 💌");
        } catch (err) {
            setError(err.message || "Failed to send OTP. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { error: authError } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: "email",
            });

            if (authError) throw authError;

            router.push("/dashboard/profile");
        } catch (err) {
            setError(err.message || "Invalid code. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background blurs */}
            <div className="absolute top-1/3 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/3 -right-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />

            <div className="glass-card p-10 sm:p-12 w-full max-w-md animate-[slide-up_0.5s_ease-out]">
                {/* Logo header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <div style={{ animation: "heart-beat 1.2s ease-in-out infinite" }} className="mb-3">
                            <Heart className="w-10 h-10 text-pink-400 fill-pink-400 mx-auto" />
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold gradient-text">Welcome Back</h1>
                    <p className="text-[var(--color-text-secondary)] text-sm mt-2">
                        {step === "email"
                            ? "Enter your college email to get started"
                            : "Enter the 6-digit code we sent you"}
                    </p>
                </div>

                {/* Error/success messages */}
                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm text-center">
                        {error}
                    </div>
                )}
                {message && !error && (
                    <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-sm text-center">
                        {message}
                    </div>
                )}

                {step === "email" ? (
                    <form onSubmit={handleSendOtp} className="space-y-5">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] opacity-50" />
                            <input
                                id="email-input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="College Emai"
                                className="input-field !pl-14"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="btn-gradient w-full flex items-center justify-center gap-2 py-3"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Send Code
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] opacity-50" />
                            <input
                                id="otp-input"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter 8-digit code"
                                className="input-field pl-12 text-center text-xl tracking-[0.3em] font-mono"
                                maxLength={8}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length < 8}
                            className="btn-gradient w-full flex items-center justify-center gap-2 py-3"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Verify & Continue
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={cooldown > 0 || loading}
                                className="w-full text-sm text-[var(--color-text-secondary)] hover:text-pink-400 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep("email");
                                    setOtp("");
                                    setError("");
                                    setMessage("");
                                }}
                                className="w-full text-sm text-[var(--color-text-secondary)] hover:text-pink-400 transition-colors text-center"
                            >
                                ← Use a different email
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </main>
    );
}
