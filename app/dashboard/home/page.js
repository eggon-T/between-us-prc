"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
    Heart,
    Clock,
    Sparkles,
    MessageCircleHeart,
    ArrowRight,
    Shield,
    Users,
    Eye,
    Info,
} from "lucide-react";
import Link from "next/link";

export default function DashboardHome() {
    const [user, setUser] = useState(null);
    const [userName, setUserName] = useState("");
    const [selectionCount, setSelectionCount] = useState(0);
    const [hints, setHints] = useState([]);
    const [revealStatus, setRevealStatus] = useState(null);
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;

            setUser(authUser);

            // Fetch user profile
            const { data: profile } = await supabase
                .from("users")
                .select("full_name")
                .eq("id", authUser.id)
                .single();

            setUserName(profile?.full_name || "Friend");

            // Fetch reveal status
            const { data: status } = await supabase.rpc('get_reveal_status');
            setRevealStatus(status);

            // Fetch selection count
            const { data: selections } = await supabase.rpc('get_my_selections');
            setSelectionCount(selections?.length || 0);

            // Fetch anonymous hints
            const { data: myHints } = await supabase.rpc('get_my_hints');
            setHints(myHints || []);

        } catch (err) {
            console.error("Error loading data:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Countdown timer
    useEffect(() => {
        if (!revealStatus) return;

        const updateCountdown = () => {
            const now = new Date(); // Use current time, not server_time from initial fetch
            const deadline = new Date(revealStatus.deadline);
            const diff = deadline - now;

            if (diff <= 0) {
                setCountdown({ days: 0, hours: 0, mins: 0, secs: 0 });
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown({ days, hours, mins, secs });
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [revealStatus]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Heart className="w-12 h-12 text-pink-400 fill-pink-400 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-[fade-in_0.6s_ease-out]">
            {/* Welcome Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                    Welcome, <span className="gradient-text">{userName}</span>
                </h1>
                <p className="text-[var(--color-text-secondary)] text-sm">
                    Only when both choose, love appears ✨
                </p>
            </div>

            {/* Countdown Card */}
            {!revealStatus?.is_revealed && (
                <div className="glass-card p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-4 justify-center">
                        <Clock className="w-5 h-5 text-pink-400" />
                        <h2 className="font-bold text-lg">💘 Valentine&apos;s Day Reveal</h2>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-4">
                        {[
                            { value: countdown.days, label: "Days" },
                            { value: countdown.hours, label: "Hours" },
                            { value: countdown.mins, label: "Mins" },
                            { value: countdown.secs, label: "Secs" },
                        ].map((item, i) => (
                            <div key={i} className="text-center">
                                <div className="glass-card bg-pink-500/5 border border-pink-500/20 rounded-2xl p-4 mb-2">
                                    <div className="text-2xl sm:text-3xl font-bold gradient-text">
                                        {String(item.value).padStart(2, '0')}
                                    </div>
                                </div>
                                <div className="text-xs text-[var(--color-text-secondary)]">
                                    {item.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-sm text-[var(--color-text-secondary)] italic">
                        The heart wants what it wants... 💖
                    </p>
                </div>
            )}

            {/* Valentine Status Card */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
                    <h2 className="font-bold text-lg">Valentine Status</h2>
                </div>

                <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                    {selectionCount === 0
                        ? "You haven't chosen your Valentines yet. Don't miss your chance!"
                        : selectionCount === 5
                            ? "You've selected all 5 people! Good luck! 🍀"
                            : `You've selected ${selectionCount} out of 5 people. Keep going!`}
                </p>

                <Link href="/dashboard/select">
                    <button className="btn-gradient w-full py-3 flex items-center justify-center gap-2">
                        Choose Your Valentines
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </Link>
            </div>

            {/* Anonymous Hints Section */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    <h2 className="font-bold text-lg">Anonymous Hint</h2>
                </div>

                {hints.length === 0 ? (
                    <div className="text-center py-8">
                        <MessageCircleHeart className="w-12 h-12 text-[var(--color-text-secondary)] opacity-20 mx-auto mb-3" />
                        <p className="text-[var(--color-text-secondary)] text-sm mb-2">
                            No hints yet...
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)] opacity-60">
                            When someone chooses you as their Valentine, you&apos;ll see a hint here
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {hints.slice(0, 3).map((hint, i) => (
                            <div
                                key={i}
                                className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20"
                            >
                                <p className="text-sm text-[var(--color-text-primary)]">
                                    &quot;{hint.hint_text}&quot;
                                </p>
                                <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                                    {new Date(hint.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                <p className="text-xs text-[var(--color-text-secondary)] text-center mt-4 opacity-60">
                    Hints only appear when there&apos;s a mutual match. Your identity is never revealed.
                </p>
            </div>

            {/* How It Works Section */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-pink-400" />
                    <h2 className="font-bold text-lg">How It Works</h2>
                </div>

                <div className="space-y-4">
                    {[
                        {
                            icon: <Heart className="w-6 h-6 text-pink-400" />,
                            title: "Select up to 5",
                            desc: "Choose up to 5 people you like. It&apos;s completely anonymous unless you match!",
                        },
                        {
                            icon: <Clock className="w-6 h-6 text-violet-400" />,
                            title: "Deadline",
                            desc: "You can change your choices until Feb 14, 1:00 AM.",
                        },
                        {
                            icon: <Shield className="w-6 h-6 text-rose-400" />,
                            title: "Privacy First",
                            desc: "Your selections are secret. Matches are revealed only if they like you back!",
                        },
                    ].map((item, i) => (
                        <div key={i} className="flex gap-4">
                            <div className="p-2 h-fit rounded-full bg-pink-500/10">
                                {item.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                                <p className="text-xs text-[var(--color-text-secondary)]">
                                    {item.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
