import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Game, CartItem } from '../../types';
import { resolveImageUrl } from '../../constants';
import { ArrowLeft, Minus, Plus, ShoppingCart, Tag, Monitor, Gamepad2, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../../config/language';
import { Link } from '@tanstack/react-router';
import { cn } from '../../lib/utils';

export const ProductDetailsView = ({
    game,
    mainCategoryGroup,
    addToCart,
    cart,
    updateCartQuantity
}: {
    game: Game | null;
    mainCategoryGroup: string;
    addToCart: (g: Game) => void;
    cart: CartItem[];
    updateCartQuantity: (id: number, delta: number) => void;
}) => {
    const { t } = useLanguage();
    const PLACEHOLDER_IMG = 'https://placehold.co/600x800/1e293b/475569?text=No+Image';

    // --- 1. HOOKS (MUST BE AT THE TOP) ---

    // Initialize state with placeholder (safe even if game is null)
    const [currentImage, setCurrentImage] = useState(PLACEHOLDER_IMG);

    // Sync image state when game data actually arrives
    useEffect(() => {
        if (game) {
            const img = (game.images && game.images.length > 0)
                ? resolveImageUrl(game.images[0])
                : PLACEHOLDER_IMG;
            setCurrentImage(img);
        }
    }, [game]);

    // Scroll to top immediately on mount (for this view only)
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // --- 2. LOADING STATE (Early Return) ---
    if (!game) {
        return (
            <div className="animate-fadeIn pb-24 min-h-screen bg-zinc-950 text-zinc-50">
                <div className="max-w-full mx-auto px-2 sm:px-6 pt-4">
                    {/* Back Button Skeleton */}
                    <div className="mb-8 w-24 h-10 bg-zinc-900 rounded-lg animate-pulse border border-white/5"></div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-16">
                        {/* Image Skeleton */}
                        <div className="lg:col-span-6">
                            <div className="rounded-xl bg-zinc-900 h-[350px] sm:h-[500px] lg:h-[700px] animate-pulse border border-white/5 flex items-center justify-center">
                                <ImageIcon size={48} className="text-zinc-800" />
                            </div>
                            <div className="grid grid-cols-5 gap-3 mt-4">
                                {[1,2,3,4,5].map(i => <div key={i} className="aspect-square bg-zinc-900 rounded-lg animate-pulse border border-white/5"></div>)}
                            </div>
                        </div>
                        {/* Info Skeleton */}
                        <div className="lg:col-span-6 flex flex-col pt-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <div className="w-16 h-6 bg-zinc-900 rounded animate-pulse"></div>
                                    <div className="w-16 h-6 bg-zinc-900 rounded animate-pulse"></div>
                                </div>
                                <div className="w-3/4 h-12 bg-zinc-900 rounded animate-pulse"></div>
                            </div>
                            <div className="h-48 bg-zinc-900/50 rounded-xl animate-pulse border border-white/5"></div>
                            <div className="space-y-2">
                                <div className="w-full h-4 bg-zinc-900 rounded animate-pulse"></div>
                                <div className="w-full h-4 bg-zinc-900 rounded animate-pulse"></div>
                                <div className="w-2/3 h-4 bg-zinc-900 rounded animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- 3. DATA PREPARATION (Safe to access game.* now) ---
    const mainBadgeText = game.categories.find(c => c.type === mainCategoryGroup)?.name;
    const platformTags = game.categories.filter(c => c.type === 'PLATFORM');
    const genreTags = game.categories.filter(c => c.type === 'GENRE');

    const cartItem = cart.find(i => i.id === game.id);
    const qtyInCart = cartItem ? cartItem.cartQuantity : 0;
    const isSoldOut = game.quantity === 0;
    const isMaxReached = qtyInCart >= game.quantity;

    return (
        <div className="animate-fadeIn pb-24 min-h-screen bg-zinc-950 text-zinc-50">
            <div className="max-w-full mx-auto px-2 sm:px-6 pt-4">

                <Link
                    to="/"
                    className="mb-4 sm:mb-8 group flex items-center gap-3 text-zinc-400 hover:text-white transition-colors w-fit cursor-pointer"
                >
                    <div className="p-2 sm:p-2.5 rounded-lg bg-zinc-900 border border-white/10 group-hover:border-emerald-500/50 group-hover:bg-zinc-800 transition-all">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/>
                    </div>
                    <span className="font-bold text-sm tracking-wide uppercase">{t('details_back')}</span>
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-16">

                    {/* --- Left Column: Images --- */}
                    <div className="lg:col-span-6 space-y-4 sm:space-y-6">
                        {/* Main Image Container */}
                        <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black h-[350px] sm:h-[500px] lg:h-[700px] flex items-center justify-center relative group">
                            {/* Sold Out Overlay */}
                            {isSoldOut && (
                                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                    <span className="bg-red-600 text-white px-4 sm:px-8 py-2 sm:py-4 text-lg sm:text-2xl uppercase font-black tracking-widest border-4 border-red-500 shadow-2xl rotate-12">
                                        {t('details_out_of_stock')}
                                    </span>
                                </div>
                            )}

                            {/* Blurred Background */}
                            <img
                                src={currentImage}
                                referrerPolicy="no-referrer"
                                className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-110"
                                alt=""
                                onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                            />

                            {/* Main Image (Fit) */}
                            <img
                                src={currentImage}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-contain relative z-10 transition-all duration-500"
                                alt={game.title}
                                onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                            />

                            {/* Main Badge */}
                            {mainBadgeText && (
                                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-black/80 backdrop-blur-md text-xs sm:text-sm font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded border border-white/10 text-white uppercase tracking-wider z-20 shadow-lg">
                                    {mainBadgeText}
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {game.images && game.images.length > 1 && (
                            <div className="grid grid-cols-5 gap-2 sm:gap-3">
                                {game.images.map((img, i) => {
                                    const resolved = resolveImageUrl(img);
                                    const isSelected = currentImage === resolved;
                                    return (
                                        <div
                                            key={i}
                                            onClick={() => setCurrentImage(resolved)}
                                            className={cn(
                                                "rounded-lg overflow-hidden aspect-square cursor-pointer relative group transition-all duration-200",
                                                isSelected
                                                    ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-zinc-950 opacity-100 scale-105 z-10"
                                                    : "border border-white/10 opacity-60 hover:opacity-100 hover:border-zinc-500 hover:scale-105"
                                            )}
                                        >
                                            <img
                                                src={resolved}
                                                referrerPolicy="no-referrer"
                                                className="w-full h-full object-cover"
                                                alt=""
                                                onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* --- Right Column: Info --- */}
                    <div className="lg:col-span-6 flex flex-col h-full pt-0 lg:pt-2">

                        {/* 1. Title & Tags */}
                        <div className="order-1 mb-6">
                            <div className="flex flex-wrap gap-2 mb-3 sm:mb-5">
                                {game.categories.map(c => (
                                    <span key={c.id} className="px-2 sm:px-3 py-1 bg-zinc-900 rounded-md text-[10px] sm:text-[11px] font-bold uppercase text-zinc-400 tracking-wider border border-white/10 shadow-sm">
                                        {c.name}
                                    </span>
                                ))}
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1] tracking-tight mb-2">
                                {game.title}
                            </h1>
                        </div>

                        {/* 2. Action Card */}
                        <div className="order-2 lg:order-3 mt-auto bg-zinc-900/40 p-4 sm:p-8 rounded-xl border border-white/10 shadow-2xl mb-6 lg:mb-8 backdrop-blur-sm">
                            <div className="flex items-end justify-between mb-4 sm:mb-8 pb-4 sm:pb-8 border-b border-white/5">
                                <div>
                                    <p className="text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1 sm:mb-2">{t('details_price')}</p>
                                    <span className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                                        {t('currencySign')} {game.price}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1 sm:mb-2">{t('details_stock_status')}</p>
                                    <div className={`flex items-center justify-end gap-2 sm:gap-2.5 font-bold text-sm sm:text-lg ${game.quantity > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        <div className={`w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full ${game.quantity > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                        {game.quantity > 0 ? <span>{game.quantity} {t('details_units')}</span> : <span>{t('details_out_of_stock')}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Add to Cart / Controller */}
                            <div className="h-14 sm:h-16">
                                {qtyInCart > 0 && !isSoldOut ? (
                                    <div className="flex items-center w-full h-full rounded-xl border border-emerald-500/30 bg-zinc-950 overflow-hidden ring-1 ring-emerald-500/20 shadow-xl shadow-emerald-900/10">
                                        <button
                                            onClick={() => updateCartQuantity(game.id, -1)}
                                            className="w-16 sm:w-24 h-full flex items-center justify-center text-white hover:bg-zinc-800 transition-colors border-r border-zinc-800 active:bg-zinc-700"
                                        >
                                            <Minus size={24} className="w-5 h-5 sm:w-7 sm:h-7" />
                                        </button>

                                        <div className="flex-1 flex flex-col items-center justify-center text-white font-bold uppercase tracking-wider leading-none">
                                            <span className="text-xl sm:text-2xl text-emerald-400">{qtyInCart}</span>
                                            {isMaxReached ? (
                                                <span className="text-[9px] sm:text-[10px] text-red-400 font-bold mt-1 animate-pulse">MAX</span>
                                            ) : (
                                                <span className="text-[9px] sm:text-[10px] text-zinc-500 mt-1">{t('details_in_cart')}</span>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => updateCartQuantity(game.id, 1)}
                                            disabled={isMaxReached}
                                            className={cn(
                                                "w-16 sm:w-24 h-full flex items-center justify-center transition-colors border-l border-zinc-800 active:bg-zinc-700",
                                                isMaxReached ? "bg-zinc-900 text-zinc-600 cursor-not-allowed" : "text-white hover:bg-zinc-800"
                                            )}
                                        >
                                          <Plus size={24} className="w-5 h-5 sm:w-7 sm:h-7" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        disabled={isSoldOut}
                                        onClick={() => addToCart(game)}
                                        className={cn(
                                            "w-full h-full rounded-xl shadow-xl transition-all duration-200 flex items-center justify-center gap-3 sm:gap-4 text-lg sm:text-xl font-black uppercase tracking-wide",
                                            isSoldOut
                                                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
                                                : "bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/10 active:scale-[0.98]"
                                        )}
                                    >
                                        <ShoppingCart size={24} className={isSoldOut ? "w-5 h-5 sm:w-6 sm:h-6" : "w-5 h-5 sm:w-6 sm:h-6 stroke-black stroke-[2.5px]"}/>
                                        {t('details_add_to_cart')}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 3. Description */}
                        <div
                            className="order-3 lg:order-2 text-zinc-400 text-base sm:text-lg leading-relaxed mb-8 border-l-2 border-emerald-500/20 pl-4 sm:pl-6"
                            dangerouslySetInnerHTML={{ __html: game.description }}
                        />

                        {/* 4. Metadata Grid */}
                        <div className="order-4 grid grid-cols-2 gap-3 sm:gap-4 mt-auto">
                            <div className="bg-zinc-900 p-4 sm:p-5 rounded-xl border border-white/5 flex items-start gap-3 sm:gap-4 hover:border-white/10 transition-colors">
                                <div className="p-2 sm:p-2.5 rounded-lg bg-zinc-950 border border-white/10 text-zinc-400">
                                    <Monitor size={20} className="w-4 h-4 sm:w-5 sm:h-5"/>
                                </div>
                                <div>
                                    <span className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">{t('details_platform')}</span>
                                    <span className="text-xs sm:text-sm font-bold text-white block leading-tight">
                                        {platformTags.length > 0 ? platformTags.map(c => c.name).join(', ') : '-'}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-zinc-900 p-4 sm:p-5 rounded-xl border border-white/5 flex items-start gap-3 sm:gap-4 hover:border-white/10 transition-colors">
                                <div className="p-2 sm:p-2.5 rounded-lg bg-zinc-950 border border-white/10 text-zinc-400">
                                    <Gamepad2 size={20} className="w-4 h-4 sm:w-5 sm:h-5"/>
                                </div>
                                <div>
                                    <span className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">{t('details_genre')}</span>
                                    <span className="text-xs sm:text-sm font-bold text-white block leading-tight">
                                        {genreTags.length > 0 ? genreTags.map(c => c.name).join(', ') : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
