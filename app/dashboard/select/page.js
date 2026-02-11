"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  X,
  Send,
  Instagram,
} from "lucide-react";

const MAX_SELECTIONS = 5;

export default function SelectPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selections, setSelections] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [hintText, setHintText] = useState("");
  const [sendingHint, setSendingHint] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      setCurrentUser(user);

      // Get current user's profile to know their gender
      const { data: profile } = await supabase
        .from("users")
        .select("gender")
        .eq("id", user.id)
        .single();

      const userGender = profile?.gender;
      const targetGender =
        userGender === "Male"
          ? "Female"
          : userGender === "Female"
            ? "Male"
            : null;

      // Get users of the opposite gender
      let query = supabase
        .from("users")
        .select("*")
        .neq("id", user.id)
        .order("full_name");

      if (targetGender) {
        query = query.eq("gender", targetGender);
      }

      const { data: allUsers, error: usersError } = await query;

      if (usersError) throw usersError;
      setUsers(allUsers || []);

      // Check reveal status
      const { data: status } = await supabase.rpc("get_reveal_status");
      if (status?.is_revealed) {
        router.replace("/dashboard/home");
        return;
      }

      // Get current user's CHOSEN people (from likes + matches) via RPC
      const { data: mySelections, error: selectionError } =
        await supabase.rpc("get_my_selections");

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
      const { error } = await supabase.rpc("select_user", {
        target_id: userId,
      });

      if (error) throw error;

      setSelections((prev) => [...prev, userId]);
      setMessage({ type: "success", text: "Added to your valentines! 💗" });
    } catch (err) {
      console.error("Error selecting user:", err);
      setMessage({
        type: "error",
        text: err.message || "Failed to select. Try again.",
      });
    } finally {
      setActionLoading(null);
      setTimeout(() => setMessage({ type: "", text: "" }), 2000);
    }
  };

  const handleDeselect = async (userId) => {
    setActionLoading(userId);
    try {
      // Call RPC to deselect user (handles unmatching/unliking atomically)
      const { error } = await supabase.rpc("deselect_user", {
        target_id: userId,
      });

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

  const handleSendHint = async () => {
    if (!hintText.trim() || !selectedProfile) return;

    setSendingHint(true);
    try {
      const { error } = await supabase.rpc("send_anonymous_hint", {
        target_id: selectedProfile.id,
        hint_message: hintText.trim(),
      });

      if (error) throw error;

      setMessage({ type: "success", text: "Hint sent! 💌" });
      setHintText("");
      setSelectedProfile(null);
    } catch (err) {
      console.error("Error sending hint:", err);
      setMessage({ type: "error", text: err.message || "Failed to send hint" });
    } finally {
      setSendingHint(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const closeModal = () => {
    setSelectedProfile(null);
    setHintText("");
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchQuery.toLowerCase()),
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
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Choose Your Valentines
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm">
          Select up to {MAX_SELECTIONS} people you like. It&apos;s completely
          anonymous! 🤫
        </p>
      </div>

      {/* Selection counter */}
      <div className="glass-card p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {Array.from({ length: MAX_SELECTIONS }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 transition-all duration-300 ${
                  i < selections.length
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
          className={`mb-4 p-3 rounded-xl text-sm text-center animate-[slide-up_0.3s_ease-out] ${
            message.type === "error"
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
              {searchQuery
                ? "No people found matching your search"
                : "No other users have signed up yet"}
            </p>
          </div>
        ) : (
          filteredUsers.map((person) => {
            const isSelected = selections.includes(person.id);
            const isLoading = actionLoading === person.id;

            return (
              <div
                key={person.id}
                className={`glass-card p-5 flex items-center justify-between transition-all duration-300 hover:bg-[var(--color-bg-card-hover)] cursor-pointer ${
                  isSelected
                    ? "border-pink-500/30 shadow-lg shadow-pink-500/5"
                    : ""
                }`}
                onClick={() => setSelectedProfile(person)}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all font-bold text-lg
                    ${
                      isSelected
                        ? "border-pink-400 bg-pink-500/10 text-pink-400"
                        : "border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {person.full_name ? (
                      person.full_name.charAt(0).toUpperCase()
                    ) : (
                      <User className="w-5 h-5" />
                    )}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    isSelected
                      ? handleDeselect(person.id)
                      : handleSelect(person.id);
                  }}
                  disabled={
                    isLoading ||
                    (!isSelected && selections.length >= MAX_SELECTIONS)
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${
                      isSelected
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

      {/* Profile Modal */}
      {selectedProfile && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]"
          onClick={closeModal}
        >
          <div
            className="glass-card max-w-md w-full p-6 relative animate-[scale-up_0.3s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--color-bg-card-hover)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
            </button>

            {/* Profile Header */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/20 to-violet-500/20 border-2 border-pink-400/30 flex items-center justify-center mx-auto mb-4 font-bold text-3xl text-pink-400">
                {selectedProfile.full_name ? (
                  selectedProfile.full_name.charAt(0).toUpperCase()
                ) : (
                  <User className="w-10 h-10" />
                )}
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {selectedProfile.full_name}
              </h2>
              <div className="flex items-center justify-center gap-4 text-sm text-[var(--color-text-secondary)]">
                {selectedProfile.department && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {selectedProfile.department}
                  </span>
                )}
                {selectedProfile.year && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-4 h-4" />
                    {selectedProfile.year}
                  </span>
                )}
                {selectedProfile.gender && (
                  <span className="flex items-center gap-1 text-pink-400">
                    <User className="w-4 h-4" />
                    {selectedProfile.gender}
                  </span>
                )}
              </div>
              {selectedProfile.instagram_url && (
                <a
                  href={selectedProfile.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 btn-gradient w-full py-2.5 text-sm flex items-center justify-center gap-2"
                >
                  <Instagram className="w-4 h-4" />
                  Visit Instagram Profile
                </a>
              )}
            </div>

            {/* Send Anonymous Hint Section */}
            {selections.includes(selectedProfile.id) && (
              <div className="border-t border-[var(--color-border-subtle)] pt-6">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Send className="w-4 h-4 text-violet-400" />
                  Send Anonymous Hint (Optional)
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                  Send a sweet message! They&apos;ll see it but won&apos;t know
                  it&apos;s from you. 💌
                </p>
                <textarea
                  value={hintText}
                  onChange={(e) => setHintText(e.target.value)}
                  placeholder="e.g., I love your smile..."
                  maxLength={200}
                  rows={3}
                  className="input-field w-full resize-none mb-2"
                />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {hintText.length}/200
                  </span>
                </div>
                <button
                  onClick={handleSendHint}
                  disabled={!hintText.trim() || sendingHint}
                  className="btn-gradient w-full py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sendingHint ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Hint
                    </>
                  )}
                </button>
              </div>
            )}

            {!selections.includes(selectedProfile.id) && (
              <div className="border-t border-[var(--color-border-subtle)] pt-6">
                <p className="text-sm text-[var(--color-text-secondary)] text-center mb-4">
                  Select this person to send them an anonymous hint! 💘
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(selectedProfile.id);
                  }}
                  disabled={selections.length >= MAX_SELECTIONS}
                  className="btn-gradient w-full py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Heart className="w-4 h-4" />
                  Select as Valentine
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
