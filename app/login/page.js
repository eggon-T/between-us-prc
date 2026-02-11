"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ALLOWED_DOMAIN = "@student.providence.edu.in";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true); // Default to true to prevent flash
    const [error, setError] = useState("");

    useEffect(() => {
        // Initial check for existing session
        const checkInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const userEmail = session.user.email;
                if (userEmail?.endsWith(ALLOWED_DOMAIN)) {
                    router.replace("/dashboard/home");
                    return;
                }
            }
            setLoading(false);
        };

        checkInitialSession();

        // Listen for auth state changes (handles OAuth redirect result)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_IN" && session?.user) {
                const userEmail = session.user.email;

                // Validate email domain
                if (!userEmail?.endsWith(ALLOWED_DOMAIN)) {
                    setError(`Only ${ALLOWED_DOMAIN} emails are allowed`);
                    await supabase.auth.signOut();
                    setLoading(false);
                } else {
                    router.replace("/dashboard/home");
                }
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
            // Get the origin for redirect, ensuring we don't have trailing slashes
            const origin = typeof window !== 'undefined' ? window.location.origin : '';

            const { error: authError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${origin}/dashboard/home`,
                    queryParams: {
                        access_type: "offline",
                        prompt: "consent",
                    },
                },
            });

            if (authError) throw authError;

            // Loading state will be cleared by onAuthStateChange
        } catch (err) {
            setError(err.message || "Failed to sign in with Google. Try again.");
            setLoading(false);
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
                        Sign in with your college Google account
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Google Sign In Button */}
                <button
                    onClick={handleGoogleSignIn}
                    className="btn-gradient w-full flex items-center justify-center gap-3 py-3 text-base"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Sign in with Google
                </button>

                {/* Info text */}
                <p className="text-xs text-[var(--color-text-secondary)] text-center mt-6 opacity-60">
                    Only {ALLOWED_DOMAIN} accounts are allowed
                </p>
            </div>
        </main>
    );
}
}
