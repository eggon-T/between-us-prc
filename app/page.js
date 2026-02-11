"use client";

import { useState, useEffect } from "react";
import { Heart, Sparkles, ArrowRight, Shield, Users, Eye } from "lucide-react";
import Link from "next/link";

function FloatingParticle({ delay, x, size }) {
    return (
        <div
            className="absolute pointer-events-none opacity-20"
            style={{
                left: `${x}%`,
                bottom: '-10%',
                animationDelay: `${delay}s`,
                fontSize: `${size}rem`,
                animation: `float ${6 + delay}s ease-in-out infinite`,
            }}
        >
            ✨
        </div>
    );
}

export default function HomePage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <main className="min-h-screen flex flex-col">
            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
                {/* Background gradient orbs */}
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Particles */}
                {mounted && (
                    <>
                        <FloatingParticle delay={0} x={10} size={1.5} />
                        <FloatingParticle delay={1.5} x={30} size={1} />
                        <FloatingParticle delay={3} x={55} size={1.8} />
                        <FloatingParticle delay={2} x={75} size={1.2} />
                        <FloatingParticle delay={4} x={90} size={1.4} />
                    </>
                )}

                <div
                    className={`text-center max-w-2xl mx-auto transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                        }`}
                >
                    {/* Animated heart */}
                    <div className="mb-6 inline-flex items-center justify-center">
                        <div style={{ animation: "heart-beat 1.2s ease-in-out infinite" }}>
                            <Heart className="w-16 h-16 text-pink-400 fill-pink-400 drop-shadow-lg" />
                        </div>
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-4">
                        <span className="gradient-text">Between Us</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] mb-2 font-light">
                        Your college&apos;s anonymous Valentine matchmaker
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)] opacity-60 mb-10">
                        Select up to 5 people you like. If they like you back — it&apos;s a match! 💘
                    </p>

                    <Link href="/login">
                        <button className="btn-gradient text-lg px-10 py-4 flex items-center gap-3 mx-auto group">
                            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            Get Started
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                </div>
            </section>

            {/* Features Section */}
            <section className="px-4 pb-20">
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            icon: <Shield className="w-8 h-8 text-pink-400" />,
                            title: "100% Anonymous",
                            desc: "Your selections are completely private. No one can see who you picked.",
                        },
                        {
                            icon: <Users className="w-8 h-8 text-violet-400" />,
                            title: "College Verified",
                            desc: "Only verified students can join. Sign in with your college email.",
                        },
                        {
                            icon: <Eye className="w-8 h-8 text-rose-400" />,
                            title: "Mutual Match Only",
                            desc: "Matches are revealed only when both people select each other.",
                        },
                    ].map((feature, i) => (
                        <div
                            key={i}
                            className="glass-card p-8 text-center hover:scale-105 transition-transform duration-300"
                            style={{
                                animation: mounted ? `slide-up 0.5s ease-out ${0.2 * i}s both` : "none",
                            }}
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pink-500/10 mb-5">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="text-center pb-8 text-sm text-[var(--color-text-secondary)] opacity-40">
                Made with 💗 for your campus
            </footer>
        </main>
    );
}
