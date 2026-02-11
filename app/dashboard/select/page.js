"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
    Search,
    Heart,
    HeartOff,
    User,
    Loader2,
    Info,
    CheckCircle2,
    Building2,
    GraduationCap,
} from "lucide-react";

const MAX_SELECTIONS = 5;

export default function SelectPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [selections, setSelections] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [message, setMessage] = useState({ type: "", text: "" });

    const fetchData = useCallback(async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;
            setCurrentUser(user);

            // Get all users except current
            const { data: allUsers, error: usersError } = await supabase
                .from("users")
                .select("*")
                .neq("id", user.id)
                .order("full_name");

            if (usersError) throw usersError;
            setUsers(allUsers || []);

            // Get current user's CHOSEN people (from likes + matches) via RPC
            const { data: mySelections, error: selectionError } = await supabase
                .rpc("get_my_selections");

            if (selectionError) throw selectionError;

            // RPC returns array of objects { selected_user_id: UUID }
            const selectedIds = (mySelections || []).map((s) => s.selected_user_id);
            setSelections(selectedIds);

        } catch (err) {
            console.error("Error fetching data:", err);
            setMessage({ type: "error", text: "Failed to load data" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSelect = async (userId) => {
        if (selections.length >= MAX_SELECTIONS) {
            setMessage({
                type: "error",
                text: `You can only select up to ${MAX_SELECTIONS} people 💔`,
            });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
            return;
        }

        setActionLoading(userId);
        try {
            // Call RPC to select user (handles matches/likes/hints atomically)
            const { error } = await supabase.rpc("select_user", { target_id: userId });

            if (error) throw error;

            setSelections((prev) => [...prev, userId]);
            setMessage({ type: "success", text: "Added to your valentines! 💗" });
        } catch (err) {
            console.error("Error selecting user:", err);
            setMessage({ type: "error", text: err.message || "Failed to select. Try again." });
        } finally {
            setActionLoading(null);
            setTimeout(() => setMessage({ type: "", text: "" }), 2000);
        }
    };

    const handleDeselect = async (userId) => {
        setActionLoading(userId);
        try {
            // Call RPC to deselect user (handles unmatching/unliking atomically)
            const { error } = await supabase.rpc("deselect_user", { target_id: userId });

            if (error) throw error;

            setSelections((prev) => prev.filter((id) => id !== userId));
            setMessage({ type: "info", text: "Removed from your list" });
        } catch (err) {
            console.error("Error deselecting user:", err);
            setMessage({ type: "error", text: "Failed to remove. Try again." });
        } finally {
            setActionLoading(null);
            setTimeout(() => setMessage({ type: "", text: "" }), 2000);
        }
    };

    const filteredUsers = users.filter(
        (u) =>
            u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.department?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            <div className="mb-6">
                <h1 className="text-3xl font-bold gradient-text mb-2">Choose Your Valentines</h1>
                <p className="text-[var(--color-text-secondary)] text-sm">
                    Select up to {MAX_SELECTIONS} people you like. It&apos;s completely anonymous! 🤫
                </p>
            </div>

            {/* Selection counter */}
            <div className="glass-card p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                        {Array.from({ length: MAX_SELECTIONS }).map((_, i) => (
                            <Heart
                                key={i}
                                className={`w-5 h-5 transition-all duration-300 ${i < selections.length
                                    ? "text-pink-400 fill-pink-400 scale-110"
                                    : "text-[var(--color-text-secondary)] opacity-20"
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-sm text-[var(--color-text-secondary)]">
                        {selections.length}/{MAX_SELECTIONS} selected
                    </span>
                </div>
            </div>

            {/* Messages */}
            {message.text && (
                <div
                    className={`mb-4 p-3 rounded-xl text-sm text-center animate-[slide-up_0.3s_ease-out] ${message.type === "error"
                        ? "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                        : message.type === "success"
                            ? "bg-green-500/10 border border-green-500/20 text-green-300"
                            : "bg-blue-500/10 border border-blue-500/20 text-blue-300"
                        }`}
                >
                    {message.text}
                </div>
            )}

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] opacity-50" />
                <input
                    id="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or department..."
                    className="input-field !pl-14"
                />
            </div>

            {/* User list */}
            <div className="space-y-3">
                {filteredUsers.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <Info className="w-10 h-10 text-[var(--color-text-secondary)] mx-auto mb-3 opacity-40" />
                        <p className="text-[var(--color-text-secondary)]">
                            {searchQuery ? "No people found matching your search" : "No other users have signed up yet"}
                        </p>
                    </div>
                ) : (
                    filteredUsers.map((person) => {
                        const isSelected = selections.includes(person.id);
                        const isLoading = actionLoading === person.id;

                        return (
                            <div
                                key={person.id}
                                className={`glass-card p-5 flex items-center justify-between transition-all duration-300 hover:bg-[var(--color-bg-card-hover)] ${isSelected ? "border-pink-500/30 shadow-lg shadow-pink-500/5" : ""
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all font-bold text-lg
                    ${isSelected
                                                ? "border-pink-400 bg-pink-500/10 text-pink-400"
                                                : "border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)]"
                                            }`}
                                    >
                                        {person.full_name ? person.full_name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                                    </div>

                                    {/* Info */}
                                    <div>
                                        <h3 className="font-semibold text-[var(--color-text-primary)]">
                                            {person.full_name}
                                            {isSelected && (
                                                <CheckCircle2 className="w-4 h-4 text-pink-400 inline ml-2" />
                                            )}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)] mt-1">
                                            {person.department && (
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="w-3 h-3" />
                                                    {person.department}
                                                </span>
                                            )}
                                            {person.year && (
                                                <span className="flex items-center gap-1">
                                                    <GraduationCap className="w-3 h-3" />
                                                    {person.year}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action button */}
                                <button
                                    onClick={() => (isSelected ? handleDeselect(person.id) : handleSelect(person.id))}
                                    disabled={isLoading || (!isSelected && selections.length >= MAX_SELECTIONS)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${isSelected
                                            ? "bg-pink-500/15 text-pink-400 hover:bg-rose-500/20 hover:text-rose-400"
                                            : "bg-pink-500/5 text-[var(--color-text-secondary)] hover:bg-pink-500/15 hover:text-pink-400"
                                        }
                    disabled:opacity-30 disabled:cursor-not-allowed`}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : isSelected ? (
                                        <>
                                            <HeartOff className="w-4 h-4" />
                                            <span className="hidden sm:inline">Remove</span>
                                        </>
                                    ) : (
                                        <>
                                            <Heart className="w-4 h-4" />
                                            <span className="hidden sm:inline">Select</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
