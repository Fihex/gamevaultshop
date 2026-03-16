import React, { useLayoutEffect } from 'react';
import { Shield, Zap, Heart, Users, Globe, Trophy, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../config/language';
import { Link } from '@tanstack/react-router';

export const AboutView = ({ setView }: { setView: (v: any) => void }) => {
    const { t } = useLanguage();

    // Fix: Scroll to top immediately when this view mounts
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-12 animate-fadeIn relative">

            {/* Back Button */}
            <div className="pt-4">
                <Link
                    to="/"
                    className="mb-8 group flex items-center gap-3 text-gray-400 hover:text-white transition-colors w-fit"
                >
                    <div className="p-2.5 rounded-lg bg-vault-900 border border-vault-700 group-hover:border-vault-accent/50 group-hover:bg-vault-800 transition-all">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/>
                    </div>
                    <span className="font-bold text-sm tracking-wide uppercase">{t('checkout_back')}</span>
                </Link>
            </div>

            {/* Hero Section */}
            <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center p-3 bg-vault-800 rounded-2xl mb-4 shadow-lg shadow-vault-accent/10 border border-vault-700">
                    <Users className="text-vault-accent w-8 h-8" />
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                    We Are <span className="text-transparent bg-clip-text bg-gradient-to-r from-vault-accent to-cyan-400">GameVault</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    Connecting players with their next great adventure. We believe gaming should be accessible, affordable, and instant for everyone worldwide.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Active Gamers", value: "10K+", icon: Users },
                    { label: "Games Available", value: "500+", icon: Trophy },
                    { label: "Countries Served", value: "50+", icon: Globe },
                    { label: "Satisfaction", value: "99%", icon: Heart },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-vault-900/50 border border-vault-800 p-6 rounded-2xl text-center hover:bg-vault-800/50 transition duration-300">
                        <stat.icon className="w-6 h-6 text-vault-accent mx-auto mb-3 opacity-80" />
                        <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-wide">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Mission Section */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-white">Our Mission</h2>
                    <p className="text-gray-400 leading-relaxed">
                        Founded in 2024, GameVault started with a simple idea: digital keys shouldn't be complicated.
                        We've built a platform that puts the player first, ensuring that when you buy a game, you own it instantly.
                    </p>
                    <p className="text-gray-400 leading-relaxed">
                        We partner directly with publishers and verified distributors to guarantee that every key is 100% legitimate
                        and supports the developers who create the worlds we love to explore.
                    </p>

                    {/* Browse Button */}
                    <Link
                        to="/"
                        className="bg-vault-accent hover:bg-vault-accentHover text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-vault-accent/20 mt-4 inline-block"
                    >
                        Browse Our Collection
                    </Link>
                </div>
                <div className="grid gap-4">
                    {[
                        { title: "Instant Delivery", desc: "Get your code immediately after purchase.", icon: Zap },
                        { title: "Secure Payments", desc: "Bank-grade encryption for all transactions.", icon: Shield },
                        { title: "24/7 Support", desc: "Real humans ready to help you anytime.", icon: Heart }
                    ].map((feature, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-vault-900 border border-vault-800 hover:border-vault-700 transition">
                            <div className="p-3 rounded-lg bg-vault-950 border border-vault-800 shrink-0">
                                <feature.icon className="w-5 h-5 text-vault-accent" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                                <p className="text-sm text-gray-500">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer / Contact */}
            <div className="bg-gradient-to-br from-vault-900 to-vault-950 border border-vault-800 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-vault-accent to-transparent opacity-50" />
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Need help or have questions?</h2>
                <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                    Our support team is always just a click away. Reach out to us for business inquiries or customer support.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <button className="px-6 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 transition">
                        support@gamevault.com
                    </button>
                    <button className="px-6 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 transition">
                        Press Kit
                    </button>
                </div>
            </div>
        </div>
    );
};
