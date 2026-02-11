"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
    Heart,
    Sparkles,
    User,
    Loader2,
    Lock,
    PartyPopper,
    MessageCircleHeart,
    Building2,
    Instagram,
} from "lucide-react";

export default function MatchesPage() {
    const [matches, setMatches] = useState([]);
    const [hints, setHints] = useState({ count: 0, departments: [] });
    const [loading, setLoading] = useState(true);
    const [revealed, setRevealed] = useState(false);
    const [error, setError] = useState("");

    // Valentine's Day reveal date — adjust as needed
    const REVEAL_DATE = new Date("2026-02-14T00:00:00");
    const now = new Date();
    const isRevealed = now >= REVEAL_DATE;

    const fetchMatches = useCallback(async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            // Get people I chose
            const { data: myChoices, error: myErr } = await supabase
                .from("choices")
                .select("chosen_id")
                .eq("chooser_id", user.id);

            if (myErr) throw myErr;

            // Get people who chose me
            const { data: theirChoices, error: theirErr } = await supabase
                .from("choices")
                .select("chooser_id")
                .eq("chosen_id", user.id);

            if (theirErr) throw theirErr;

            const mySet = new Set((myChoices || []).map((c) => c.chosen_id));
            const theirSet = new Set((theirChoices || []).map((c) => c.chooser_id));

            // Mutual matches
            const mutualIds = [...mySet].filter((id) => theirSet.has(id));

            // Fetch match profiles
            if (mutualIds.length > 0) {
                const { data: matchProfiles, error: profileErr } = await supabase
                    .from("users")
                    .select("*")
                    .in("id", mutualIds);

                if (profileErr) throw profileErr;
                setMatches(matchProfiles || []);
            }

            // Hints: people who chose me (anonymous)
            const hintCount = theirChoices?.length || 0;

            // Gather departments of people who liked me (anonymous hint)
            if (hintCount > 0) {
                const likerIds = (theirChoices || []).map((c) => c.chooser_id);
                const { data: likerProfiles } = await supabase
                    .from("users")
                    .select("department")
                    .in("id", likerIds);

                const depts = [
                    ...new Set((likerProfiles || []).map((p) => p.department).filter(Boolean)),
                ];
                setHints({ count: hintCount, departments: depts });
            }
        } catch (err) {
            setError("Failed to load matches");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-[fade-in_0.6s_ease-out]">
            {/* Header */}
            <div className="mb-8 text-center">
                <div style={{ animation: "heart-beat 1.2s ease-in-out infinite" }} className="mb-4 inline-block">
                    <Sparkles className="w-12 h-12 text-pink-400" />
                </div>
                <h1 className="text-3xl font-bold gradient-text mb-2">Your Matches</h1>
                <p className="text-[var(--color-text-secondary)] text-sm">
                    {isRevealed
                        ? "Here are your mutual matches! 🎉"
                        : "Matches will be revealed on Valentine's Day 💘"}
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm text-center">
                    {error}
                </div>
            )}

            {/* Anonymous hints section */}
            {hints.count > 0 && (
                <div className="glass-card p-6 mb-8 animate-[slide-up_0.5s_ease-out]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                            <MessageCircleHeart className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">Anonymous Hints</h2>
                            <p className="text-xs text-[var(--color-text-secondary)]">
                                Your identity is never revealed
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-pink-500/5 border border-pink-500/10">
                            <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
                            <p className="text-sm">
                                You received{" "}
                                <span className="font-bold text-pink-400">{hints.count}</span> anonymous{" "}
                                {hints.count === 1 ? "like" : "likes"} 💕
                            </p>
                        </div>

                        {hints.departments.map((dept, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10"
                            >
                                <Building2 className="w-5 h-5 text-violet-400" />
                                <p className="text-sm">
                                    Someone from <span className="font-bold text-violet-400">{dept}</span> likes you
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Matches section */}
            {!isRevealed ? (
                /* Locked state */
                <div className="glass-card p-12 text-center">
                    <Lock className="w-16 h-16 text-[var(--color-text-secondary)] mx-auto mb-4 opacity-30" />
                    <h2 className="text-xl font-bold mb-2">Matches Locked 🔒</h2>
                    <p className="text-[var(--color-text-secondary)] text-sm mb-6">
                        Your mutual matches will be revealed on
                    </p>
                    <div className="inline-block glass-card px-8 py-4">
                        <p className="text-2xl font-bold gradient-text">
                            February 14, 2026
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">Valentine&apos;s Day 💘</p>
                    </div>

                    {/* Countdown teaser */}
                    <div className="mt-8 flex items-center justify-center gap-2 text-sm text-[var(--color-text-secondary)]">
                        <Sparkles className="w-4 h-4 text-pink-400" />
                        {matches.length > 0 ? (
                            <span>
                                You have <span className="text-pink-400 font-bold">{matches.length}</span> mutual{" "}
                                {matches.length === 1 ? "match" : "matches"} waiting!
                            </span>
                        ) : (
                            <span>Select people you like and hope for a match!</span>
                        )}
                    </div>
                </div>
            ) : matches.length === 0 ? (
                /* No matches */
                <div className="glass-card p-12 text-center">
                    <Heart className="w-16 h-16 text-[var(--color-text-secondary)] mx-auto mb-4 opacity-20" />
                    <h2 className="text-xl font-bold mb-2">No Mutual Matches</h2>
                    <p className="text-[var(--color-text-secondary)] text-sm">
                        Don&apos;t worry — love finds its way! 💗
                    </p>
                </div>
            ) : (
                /* Revealed matches */
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <PartyPopper className="w-5 h-5 text-pink-400" />
                        <h2 className="font-bold text-lg">
                            {matches.length} Mutual {matches.length === 1 ? "Match" : "Matches"}!
                        </h2>
                    </div>

                    {matches.map((match, i) => (
                        <div
                            key={match.id}
                            className="glass-card p-6 flex items-center gap-5 border-pink-500/20 hover:border-pink-500/40 transition-all duration-300"
                            style={{ animation: `slide-up 0.5s ease-out ${0.15 * i}s both` }}
                        >
                            {/* Avatar */}
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/20 to-violet-500/20 border-2 border-pink-400/30 flex items-center justify-center flex-shrink-0 font-bold text-2xl text-pink-400">
                                {match.full_name ? match.full_name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg">{match.full_name}</h3>
                                <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)] mt-1">
                                    {match.department && <span>{match.department}</span>}
                                    {match.year && <span>• {match.year}</span>}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex-shrink-0 flex flex-col gap-2">
                                <div className="w-10 h-10 rounded-full bg-pink-500/15 flex items-center justify-center mx-auto">
                                    <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
                                </div>
                                {match.instagram_url && (
                                    <a
                                        href={match.instagram_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 rounded-full bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] flex items-center justify-center hover:border-pink-500 hover:text-pink-500 transition-colors"
                                        title="View Instagram"
                                    >
                                        <Instagram className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
