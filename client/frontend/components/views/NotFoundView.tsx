import React from 'react';
import { Link } from '@tanstack/react-router';
import { Ghost, Home, ArrowLeft } from 'lucide-react';

export const NotFoundView = () => {
    return (
        <div className="flex-1 w-full h-full flex flex-col items-center justify-center relative overflow-hidden p-4 min-h-[70vh]">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 select-none">
                <span className="text-[20rem] font-black text-vault-900">404</span>
            </div>

            <div className="relative z-10 text-center max-w-lg mx-auto bg-vault-900/80 backdrop-blur-sm p-8 rounded-3xl border border-vault-800 shadow-2xl animate-fadeIn">
                <div className="w-20 h-20 bg-vault-950 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-vault-800 shadow-inner">
                    <Ghost size={40} className="text-vault-accent animate-bounce-short" />
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
                    Game Over
                </h1>

                <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                    The level you are looking for does not exist or has been moved to another server.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-vault-accent hover:bg-vault-accentHover text-white px-8 py-3 rounded-xl font-bold transition shadow-lg shadow-vault-accent/20 transform hover:-translate-y-0.5"
                    >
                        <Home size={18} /> Return Base
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-vault-950 hover:bg-vault-800 text-gray-300 border border-vault-700 px-8 py-3 rounded-xl font-bold transition"
                    >
                        <ArrowLeft size={18} /> Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};
