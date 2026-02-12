"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isProfileComplete } from "@/lib/profile";
import { Heart, User, Search, Sparkles, LogOut, Home as HomeIcon } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [revealStatus, setRevealStatus] = useState(null);
    const [profileComplete, setProfileComplete] = useState(false);
    const [loading, setLoading] = useState(true);


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

            // Check profile completion
            const { data: profileData } = await supabase
                .from("users")
                .select("*")
                .eq("id", session.user.id)
                .single();

            const complete = isProfileComplete(profileData);
            setProfileComplete(complete);

            // Redirect to profile page if incomplete (unless already there)
            if (!complete && pathname !== '/dashboard/profile') {
                router.push('/dashboard/profile');
                return;
            }

            // Sync reveal status
            const { data: status } = await supabase.rpc('get_reveal_status');
            setRevealStatus(status);

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
    }, [router, pathname]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const navItems = [
        { href: "/dashboard/home", icon: HomeIcon, label: "Home" },
        ...(!revealStatus?.is_revealed ? [{ href: "/dashboard/select", icon: Search, label: "Choose Valentine" }] : []),
        { href: "/dashboard/profile", icon: User, label: "Profile" },
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
            <nav className="hidden sm:block sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 px-6 py-2">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Link href="/dashboard/select" className="flex items-center gap-2 group">
                        <Heart className="w-5 h-5 text-pink-400 fill-pink-400 group-hover:scale-110 transition-transform" />
                        <span className="gradient-text font-bold text-base">Between Us</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const isDisabled = !profileComplete && item.href !== '/dashboard/profile';
                            return (
                                <Link key={item.href} href={item.href} className={isDisabled ? 'pointer-events-none' : ''}>
                                    <button
                                        disabled={isDisabled}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200
                                            ${isActive
                                                ? "bg-pink-500/15 text-pink-400 shadow-lg shadow-pink-500/10"
                                                : isDisabled
                                                    ? "text-[var(--color-text-secondary)] opacity-30 cursor-not-allowed"
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
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-[var(--color-text-secondary)] hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-200"
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
            <nav className="sm:hidden fixed bottom-4 left-4 right-4 z-50 px-2 py-2 bg-[var(--color-bg-card)] backdrop-blur-xl border-2 border-pink-500/50"
                style={{
                    borderRadius: '1.25rem',
                    boxShadow: '0 -4px 30px rgba(0,0,0,0.5), 0 0 40px rgba(244, 114, 182, 0.12), 0 0 20px rgba(236, 72, 153, 0.6), 0 0 40px rgba(236, 72, 153, 0.4)',
                    animation: 'glow-pulse 2s ease-in-out infinite'
                }}>
                <div className="flex items-center justify-around">

                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const isDisabled = !profileComplete && item.href !== '/dashboard/profile';
                        return (
                            <Link key={item.href} href={item.href} className={`flex-1 ${isDisabled ? 'pointer-events-none' : ''}`}>
                                <button
                                    disabled={isDisabled}
                                    className={`flex items-center justify-center w-full py-2 rounded-xl transition-all duration-200
                                        ${isActive
                                            ? "text-pink-400"
                                            : isDisabled
                                                ? "text-[var(--color-text-secondary)] opacity-30"
                                                : "text-[var(--color-text-secondary)]"
                                        }`}
                                >
                                    <div className={`p-2 rounded-xl transition-all duration-200 ${isActive ? "bg-pink-500/15 shadow-lg shadow-pink-500/10" : ""}`}>
                                        <item.icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                                    </div>
                                </button>
                            </Link>
                        );
                    })}

                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center flex-1 py-2 rounded-xl text-[var(--color-text-secondary)] transition-all duration-200"
                    >
                        <div className="p-2 rounded-xl">
                            <LogOut className="w-5 h-5" />
                        </div>
                    </button>
                </div>
            </nav>


        </div>
    );
}
