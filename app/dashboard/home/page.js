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
    PartyPopper,
    Instagram,
} from "lucide-react";
import Link from "next/link";

export default function DashboardHome() {
    const [user, setUser] = useState(null);
    const [userName, setUserName] = useState("");
    const [selectionCount, setSelectionCount] = useState(0);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [hints, setHints] = useState([]);
    const [revealStatus, setRevealStatus] = useState(null);
    const [matches, setMatches] = useState([]);
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
    const [loading, setLoading] = useState(true);
    const [trollStep, setTrollStep] = useState(0); // 0: none, 1: morattu single, 2: JK

    const fetchData = useCallback(async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;

            setUser(authUser);

            // Fetch all data in parallel or sequence before updating state
            const [
                { data: profile },
                { data: status },
                { data: selections },
                { data: myHints }
            ] = await Promise.all([
                supabase.from("users").select("full_name").eq("id", authUser.id).single(),
                supabase.rpc('get_reveal_status'),
                supabase.rpc('get_my_selections'),
                supabase.rpc('get_my_hints')
            ]);

            let revealedMatches = [];
            // If revealed, fetch mutual matches BEFORE updating state
            if (status?.is_revealed) {
                const { data: myMatches } = await supabase
                    .from("matches")
                    .select("user1, user2")
                    .or(`user1.eq.${authUser.id},user2.eq.${authUser.id}`);

                const partnerIds = (myMatches || []).map((m) =>
                    m.user1 === authUser.id ? m.user2 : m.user1
                );

                if (partnerIds.length > 0) {
                    const { data: matchProfiles } = await supabase
                        .from("users")
                        .select("*")
                        .in("id", partnerIds);
                    revealedMatches = matchProfiles || [];
                }
            }

            // ATOMIC UPDATE: Set all states together to avoid flicker
            setUserName(profile?.full_name || "Friend");
            setSelectionCount(selections?.length || 0);
            setHints(myHints || []);
            setMatches(revealedMatches);
            setRevealStatus(status); // This triggers the UI flip

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
        if (!revealStatus || revealStatus.is_revealed) return;

        const interval = setInterval(() => {
            const now = new Date();
            const deadline = new Date(revealStatus.deadline);
            const diff = deadline - now;

            if (diff <= 0) {
                clearInterval(interval);
                setCountdown({ days: 0, hours: 0, mins: 0, secs: 0 });

                // Humorous reveal sequence
                const triggerReveal = async () => {
                    setTrollStep(1); // "morattu single"

                    // Fetch data in background immediately
                    const dataPromise = fetchData();

                    await new Promise(r => setTimeout(r, 1200));
                    setTrollStep(2); // "JK"

                    await Promise.all([
                        new Promise(r => setTimeout(r, 800)),
                        dataPromise
                    ]);

                    setTrollStep(0); // Show results
                };

                triggerReveal();
            } else {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);
                setCountdown({ days, hours, mins, secs });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [revealStatus, fetchData, trollStep]);

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

            {/* Countdown or Matches or Troll Card */}
            {trollStep > 0 ? (
                <div className="glass-card p-12 text-center animate-[fade-in_0.3s_ease-out]">
                    <div className="mb-6 h-16 flex items-center justify-center">
                        <span className="text-4xl animate-bounce">
                            {trollStep === 1 ? "😜" : "🎯"}
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold gradient-text min-h-[4rem] flex items-center justify-center">
                        {trollStep === 1 ? "born to be morattu single" : "JUST KIDDING... 🫣"}
                    </h2>
                    <p className="text-[var(--color-text-secondary)] text-sm mt-4 opacity-50">
                        {trollStep === 1 ? "Checking your luck..." : "Fetching the real ones! ✨"}
                    </p>
                </div>
            ) : revealStatus?.is_revealed ? (
                <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-6 justify-center">
                        {matches.length > 0 ? (
                            <>
                                <PartyPopper className="w-6 h-6 text-pink-400" />
                                <h2 className="font-bold text-xl gradient-text">It&apos;s a Match! 🎉</h2>
                            </>
                        ) : (
                            <>
                                <Heart className="w-6 h-6 text-pink-400" />
                                <h2 className="font-bold text-xl gradient-text">Reveal Results</h2>
                            </>
                        )}
                    </div>

                    {matches.length === 0 ? (
                        <div className="text-center py-6">
                            <Heart className="w-12 h-12 text-[var(--color-text-secondary)] opacity-20 mx-auto mb-3" />
                            <p className="text-[var(--color-text-secondary)]">No matches this time, but love is always around! ✨</p>
                        </div>
                    ) : (
                        <div className="space-y-4 mb-2">
                            {matches.map((match, i) => (
                                <div
                                    key={match.id}
                                    onClick={() => setSelectedMatch(match)}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-pink-500/5 border border-pink-500/10 cursor-pointer hover:bg-pink-500/10 transition-all hover:scale-[1.02]"
                                    style={{ animation: `slide-up 0.5s ease-out ${0.1 * i}s both` }}
                                >
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/20 to-violet-500/20 border-2 border-pink-400/30 flex items-center justify-center font-bold text-lg text-pink-400">
                                        {match.full_name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-sm truncate">{match.full_name}</h3>
                                        <p className="text-xs text-[var(--color-text-secondary)] truncate">{match.department}</p>
                                    </div>
                                    {match.instagram_url && (
                                        <a
                                            href={match.instagram_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-pink-500/20 transition-colors"
                                        >
                                            <Instagram className="w-4 h-4 text-pink-400" />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
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

            {/* Valentine Status Card - Hidden after reveal */}
            {!revealStatus?.is_revealed && (
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
            )}

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

            {/* Match Detail Modal */}
            {selectedMatch && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-[fade-in_0.2s_ease-out]">
                    <div
                        className="absolute inset-0 bg-[var(--color-bg-dark)]/80 backdrop-blur-sm"
                        onClick={() => setSelectedMatch(null)}
                    />
                    <div className="relative w-full max-w-sm glass-card p-8 animate-[slide-up_0.3s_ease-out] border-pink-500/30">
                        <button
                            onClick={() => setSelectedMatch(null)}
                            className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-pink-400 transition-colors"
                        >
                            <span className="text-2xl">&times;</span>
                        </button>

                        <div className="text-center">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500/20 to-violet-500/20 border-2 border-pink-400/30 flex items-center justify-center mx-auto mb-4 font-bold text-4xl text-pink-400 shadow-lg shadow-pink-500/10">
                                {selectedMatch.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-2xl font-bold mb-2">{selectedMatch.full_name}</h2>
                            <div className="flex flex-col gap-2 mb-6">
                                <div className="flex items-center justify-center gap-2 text-[var(--color-text-secondary)]">
                                    <Sparkles className="w-4 h-4 text-violet-400" />
                                    <span>{selectedMatch.department}</span>
                                </div>
                                <div className="text-xs text-pink-400 font-medium">
                                    {selectedMatch.year}
                                </div>
                            </div>

                            {selectedMatch.instagram_url && (
                                <a
                                    href={selectedMatch.instagram_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-gradient w-full py-3 text-sm flex items-center justify-center gap-2"
                                >
                                    <Instagram className="w-4 h-4" />
                                    Visit Instagram Profile
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
