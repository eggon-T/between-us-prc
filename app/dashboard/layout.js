"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Heart, User, Search, Sparkles, LogOut, Info, X, Clock, ShieldCheck, HeartHandshake } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showRules, setShowRules] = useState(false);

    useEffect(() => {
        const getUser = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
                router.push("/login");
                return;
            }

            setUser(session.user);
            setLoading(false);
        };

        getUser();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                router.push("/login");
            } else {
                setUser(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const navItems = [
        { href: "/dashboard/profile", icon: User, label: "Profile" },
        { href: "/dashboard/select", icon: Search, label: "Select" },
        { href: "/dashboard/matches", icon: Sparkles, label: "Matches" },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div style={{ animation: "heart-beat 1.2s ease-in-out infinite" }}>
                    <Heart className="w-12 h-12 text-pink-400 fill-pink-400" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Desktop Top Nav — hidden on mobile */}
            <nav className="hidden sm:block sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 px-8 py-3">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Link href="/dashboard/select" className="flex items-center gap-2 group">
                        <Heart className="w-6 h-6 text-pink-400 fill-pink-400 group-hover:scale-110 transition-transform" />
                        <span className="gradient-text font-bold text-lg">Between Us</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link key={item.href} href={item.href}>
                                    <button
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                                            ${isActive
                                                ? "bg-pink-500/15 text-pink-400 shadow-lg shadow-pink-500/10"
                                                : "text-[var(--color-text-secondary)] hover:text-pink-400 hover:bg-pink-500/5"
                                            }`}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </button>
                                </Link>
                            );
                        })}

                        <div className="h-6 w-px bg-[var(--color-border-subtle)] mx-2" />

                        <button
                            onClick={() => setShowRules(true)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[var(--color-text-secondary)] hover:text-violet-400 hover:bg-violet-500/5 transition-all duration-200"
                        >
                            <Info className="w-4 h-4" />
                            <span>Rules</span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[var(--color-text-secondary)] hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-200"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="flex-1 px-4 sm:px-8 py-6 pb-28 sm:pb-8">
                <div className="max-w-4xl mx-auto">{children}</div>
            </main>

            {/* Mobile Bottom Nav — visible only on mobile */}
            <nav className="sm:hidden fixed bottom-4 left-4 right-4 z-50 glass-card px-2 py-2"
                style={{ borderRadius: '1.25rem', boxShadow: '0 -4px 30px rgba(0,0,0,0.4), 0 0 40px rgba(244, 114, 182, 0.08)' }}>
                <div className="flex items-center justify-around">
                    <button
                        onClick={() => setShowRules(true)}
                        className="flex flex-col items-center gap-1 flex-1 py-2 rounded-xl text-xs font-medium text-[var(--color-text-secondary)] transition-all duration-200"
                    >
                        <div className="p-2 rounded-xl">
                            <Info className="w-5 h-5" />
                        </div>
                        <span>Rules</span>
                    </button>

                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href} className="flex-1">
                                <button
                                    className={`flex flex-col items-center gap-1 w-full py-2 rounded-xl text-xs font-medium transition-all duration-200
                                        ${isActive
                                            ? "text-pink-400"
                                            : "text-[var(--color-text-secondary)]"
                                        }`}
                                >
                                    <div className={`p-2 rounded-xl transition-all duration-200 ${isActive ? "bg-pink-500/15 shadow-lg shadow-pink-500/10" : ""}`}>
                                        <item.icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                                    </div>
                                    <span>{item.label}</span>
                                </button>
                            </Link>
                        );
                    })}

                    <button
                        onClick={handleLogout}
                        className="flex flex-col items-center gap-1 flex-1 py-2 rounded-xl text-xs font-medium text-[var(--color-text-secondary)] transition-all duration-200"
                    >
                        <div className="p-2 rounded-xl">
                            <LogOut className="w-5 h-5" />
                        </div>
                        <span>Logout</span>
                    </button>
                </div>
            </nav>

            {/* Rules Modal */}
            {showRules && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
                    <div className="glass-card max-w-md w-full p-6 relative animate-[scale-up_0.3s_ease-out]">
                        <button
                            onClick={() => setShowRules(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--color-bg-card-hover)] transition-colors"
                        >
                            <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
                        </button>

                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold gradient-text">How It Works</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-4 p-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)]">
                                <div className="p-2 h-fit rounded-full bg-pink-500/10 text-pink-400">
                                    <HeartHandshake className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[var(--color-text-primary)]">Select up to 5</h3>
                                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                        Choose up to 5 people you like. It&apos;s completely anonymous unless you match!
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)]">
                                <div className="p-2 h-fit rounded-full bg-violet-500/10 text-violet-400">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[var(--color-text-primary)]">Deadline</h3>
                                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                        You can change your choices until <span className="font-bold text-[var(--color-text-primary)]">Feb 14, 1:00 AM</span>.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)]">
                                <div className="p-2 h-fit rounded-full bg-rose-500/10 text-rose-400">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[var(--color-text-primary)]">Privacy First</h3>
                                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                        Your selections are secret. Matches are revealed only if they like you back!
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowRules(false)}
                            className="w-full mt-6 btn-gradient py-3 font-medium"
                        >
                            Got it! 💘
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
