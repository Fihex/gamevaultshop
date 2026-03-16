import React, { useState, useEffect, useMemo, useRef } from "react";
import { Game, CartItem, FilterState } from "../../types";
import { resolveImageUrl } from "../../constants";
import { Link } from '@tanstack/react-router';
import {
  Loader,
  ShoppingCart,
  Minus,
  Plus,
  ArrowRight,
  PackageOpen,
  ChevronDown,
  Search,
  LayoutGrid,
  List,
  X,
  ArrowUpDown
} from "lucide-react";
import { useLanguage } from '../../config/language';
import { cn } from '../../lib/utils';
import { Button } from "@/components/ui/button";
import bannerImg from '../../assets/bg.jpg';
import { useGameVault } from "../../context/GameVaultContext";
import { useVirtualGrid } from "../../hooks/useVirtualGrid";

// --- 1. News Banner Component ---
const NewsBanner = React.memo(({ t }: { t: (k: string) => string }) => {
    const BANNER_BG = bannerImg;

    return (
        <div className="mb-6 relative rounded-xl overflow-hidden border border-zinc-800 shadow-2xl group h-auto min-h-[18rem] md:h-64 ring-1 ring-white/5 bg-zinc-900">
            {/* Background */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-zinc-950">
                <img
                    src={BANNER_BG}
                    alt="Banner"
                    className="w-full h-full object-cover opacity-60"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/20 to-transparent" />
            </div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.03)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] pointer-events-none z-0" />

            {/* Marquee */}
            <div className="absolute top-0 left-0 right-0 z-30 bg-yellow-400 border-b-2 border-black h-10 flex items-center overflow-hidden select-none shadow-lg">
                <style>
                {`
                    @keyframes marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                    .animate-marquee-varied { animation: marquee-scroll 25s linear infinite; }
                    .glitch-text { display: inline-block; }
                `}
                </style>
                <div className="flex w-max animate-marquee-varied h-full items-center hover:[animation-play-state:paused] whitespace-nowrap">
                {[0, 1].map((key) => (
                    <div key={key} className="flex items-center h-full">
                    <span className="pl-6 text-sm font-mono font-black uppercase tracking-widest text-black flex items-center leading-none">
                        <span className="glitch-text mr-2">SYSTEM_ALERT:</span> CYBER WEEK ACTIVE
                    </span>
                    <span className="mx-6 text-[10px] font-bold tracking-tighter opacity-60">//</span>
                    <span className="text-sm font-mono font-black uppercase tracking-widest text-black leading-none">UNAUTHORIZED PRICE DROP DETECTED</span>
                    <div className="w-[10vw]"></div>
                    <span className="text-sm font-mono font-black uppercase tracking-widest text-black leading-none">RPG TITLES <span className="glitch-text mx-1">50% OFF</span></span>
                    <span className="mx-6 text-[10px] font-bold text-black tracking-tighter opacity-60">/</span>
                    <span className="text-sm font-mono font-black uppercase tracking-widest text-black leading-none">STOCK LEVELS <span className="ml-2 bg-red-600 text-white px-2 py-0.5 glitch-text">CRITICAL</span></span>
                    <div className="w-[30vw]"></div>
                    </div>
                ))}
                </div>
            </div>

            {/* Tag */}
            <div className="absolute top-14 right-6 z-20">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-md shadow-xl uppercase tracking-wider ring-1 ring-white/10">
                    {t('news_tag')}
                </span>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 p-5 md:p-8 z-10 w-full md:w-2/3">
                <div className="space-y-3 md:space-y-4">
                    <h1 className="text-2xl md:text-5xl font-black text-white tracking-tighter leading-tight md:leading-[0.9] drop-shadow-2xl">
                        {t('banner_title')} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{t('banner_subtitle')}</span>
                    </h1>

                    <div className="flex flex-col items-start gap-3 pt-1 md:flex-row md:items-center md:gap-4 md:pt-2">
                        <p className="text-zinc-300 text-xs md:text-sm font-medium leading-relaxed border-l-2 border-emerald-500 pl-3 md:pl-4 max-w-xs md:max-w-sm">
                            {t('banner_desc')}
                        </p>
                        <button className="group relative inline-flex items-center justify-center rounded-lg bg-white text-black px-5 py-2 md:px-6 md:py-2.5 font-bold text-[10px] md:text-xs uppercase tracking-wide transition-colors duration-300 hover:bg-emerald-400 shadow-lg hover:shadow-emerald-400/50 mt-1 md:mt-0 whitespace-nowrap">
                            <span className="mr-2">{t('btn_explore')}</span>
                            <ArrowRight className="h-3 w-3 md:h-3.5 md:w-3.5 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

// --- 2. Game Card Component ---
const MemoizedGameCard = React.memo(
  ({
    game,
    cartQuantity,
    mainCategoryGroup,
    addToCart,
    updateCartQuantity,
    PLACEHOLDER_IMG,
    viewMode,
    onSaveScroll,
    style
  }: {
    game: Game;
    cartQuantity: number;
    mainCategoryGroup: string;
    addToCart: (game: Game) => void;
    updateCartQuantity: (id: number, delta: number) => void;
    PLACEHOLDER_IMG: string;
    viewMode: 'grid' | 'list';
    onSaveScroll?: () => void;
    style: React.CSSProperties;
  }) => {
    const { t } = useLanguage();
    const qtyInCart = cartQuantity;
    const isSoldOut = game.quantity === 0;
    const isMaxReached = qtyInCart >= game.quantity;
    const imageUrl = resolveImageUrl(game.images?.[0]);
    const mainBadgeText = game.categories.find(c => c.type === mainCategoryGroup)?.name;

    const isGrid = viewMode === 'grid';

    // Container Classes
    const containerClasses = isGrid
        ? `flex-col h-full`
        : `flex-col sm:flex-row h-full`;

    // Image Container Classes
    const imageContainerClasses = isGrid
        ? `aspect-[3/4] w-full border-b border-white/5`
        : `w-full sm:w-auto sm:aspect-[3/4] sm:h-full shrink-0 border-b sm:border-b-0 sm:border-r border-white/5 bg-black ${!isGrid ? 'aspect-[4/3] sm:aspect-[3/4]' : ''}`;

    // Content Container Classes - Compact padding
    const contentContainerClasses = isGrid
          ? `flex-1 flex flex-col p-2 min-w-0`
          : `flex-1 flex flex-col p-4 sm:p-5 min-w-0`;

    const visibleCategories = game.categories.slice(0, 3);

    return (
      <div style={style} className="p-1 sm:p-2">
        <div
            className={cn(
                "group relative rounded-lg border border-white/10 bg-zinc-900 text-zinc-50 shadow-sm overflow-hidden w-full",
                "transition-[transform,shadow,border-color] duration-300 ease-out flex",
                "hover:border-zinc-600 hover:shadow-2xl hover:shadow-black/50 hover:z-10",
                isSoldOut && "opacity-60 grayscale-[0.5]",
                containerClasses
            )}
        >
            {/* Link Overlay */}
            {!isSoldOut && (
                <Link
                    to="/product/$productId"
                    params={{ productId: String(game.id) }}
                    className="absolute inset-0 z-20 cursor-pointer"
                    aria-label={`View ${game.title}`}
                    onClick={onSaveScroll}
                />
            )}

            {/* Image Section */}
            <div className={`relative overflow-hidden ${imageContainerClasses}`}>
                {isSoldOut && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-[10px] sm:text-xs font-medium bg-red-600 text-white h-7 px-3 uppercase tracking-widest border border-red-500 shadow-xl rotate-12">
                            {t('card_sold_out')}
                        </span>
                    </div>
                )}

                {/* Background Blur */}
                <img
                    src={imageUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40"
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                />

                {/* Main Image */}
                <img
                    src={imageUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    alt={game.title}
                    className="relative z-10 w-full h-full object-contain"
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                />

                {mainBadgeText && (
                    <div className="absolute top-2 right-2 z-20">
                        <span className="inline-flex items-center rounded border border-white/10 bg-black/80 backdrop-blur-md px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-white shadow-sm uppercase tracking-tighter">
                            {mainBadgeText}
                        </span>
                    </div>
                )}

                <div className="absolute bottom-2 left-2 z-20">
                    <span className={cn(
                        "inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold shadow-sm backdrop-blur-md",
                        game.quantity > 0
                            ? "border-emerald-500/30 bg-black/60 text-emerald-400"
                            : "border-red-500/30 bg-black/60 text-red-400"
                    )}>
                        {game.quantity > 0 ? `${t('card_stock')}: ${game.quantity}` : "0 left"}
                    </span>
                </div>
            </div>

            {/* Content Section */}
            <div className={contentContainerClasses}>
                {/* 1. COMPACT SPACING: space-y-1 keeps elements close */}
                <div className="space-y-1 pointer-events-none relative z-10 min-h-0">

                    {/* 2. TITLE FIX: Removed fixed height (h-9/h-10).
                       This allows the title to be only as tall as needed (1 line = 20px).
                       This removes the empty space below 1-line titles. */}
                    <h3 className={cn(
                        "font-bold text-white group-hover:text-emerald-400 transition-colors",
                        "text-sm sm:text-base line-clamp-2 leading-tight"
                    )} title={game.title}>
                        {game.title}
                    </h3>

                    {/* Tags */}
                    <div className="flex flex-nowrap gap-1.5 h-5 items-center overflow-hidden w-full [mask-image:linear-gradient(to_right,black_85%,transparent_100%)]">
                        {visibleCategories.map(c => (
                            <span key={c.id} className="inline-flex items-center rounded border border-white/10 bg-zinc-800/50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 leading-none whitespace-nowrap shrink-0">
                                {c.name}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div
                    className="relative z-30 pointer-events-auto cursor-default mt-auto pt-1 shrink-0"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                    {/* Price: Minimal margin to pull button up */}
                    <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                            "font-black tracking-tight text-white",
                            "text-lg sm:text-xl",
                            isSoldOut && "text-zinc-500 line-through"
                        )}>
                            {t('currencySign')} {game.price}
                        </span>
                    </div>

                    {/* Buttons */}
                    <div className="relative z-30 w-full pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                        {qtyInCart > 0 && !isSoldOut ? (
                            <div className="flex items-center w-full h-9 rounded-md border border-emerald-500/30 bg-zinc-950 overflow-hidden ring-1 ring-emerald-500/20 shadow-md">
                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateCartQuantity(game.id, -1); }}
                                    className="h-full w-10 sm:w-12 hover:bg-zinc-800 text-white transition-colors flex items-center justify-center border-r border-zinc-800 active:bg-zinc-700"
                                >
                                    <Minus size={14} />
                                </button>

                                <div className="flex-1 flex flex-col items-center justify-center h-full leading-none">
                                    <span className={cn("font-bold text-emerald-400", "text-sm")}>{qtyInCart}</span>
                                    {isMaxReached && (
                                        <span className="text-[7px] text-red-400 font-bold uppercase tracking-wider mt-0.5 animate-pulse">
                                            MAX
                                        </span>
                                    )}
                                </div>

                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateCartQuantity(game.id, 1); }}
                                    disabled={isMaxReached}
                                    className={cn(
                                        "h-full w-10 sm:w-12 text-white transition-colors flex items-center justify-center border-l border-zinc-800 active:bg-zinc-700",
                                        isMaxReached ? "opacity-50 cursor-not-allowed bg-zinc-900" : "hover:bg-zinc-800"
                                    )}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                disabled={isSoldOut}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(game); }}
                                className={cn(
                                    "inline-flex items-center justify-center whitespace-nowrap rounded text-xs font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 w-full shadow-md active:scale-[0.98]",
                                    isSoldOut
                                        ? "bg-zinc-800 text-zinc-500 border border-white/5"
                                        : "bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-900/20"
                                )}
                            >
                                {isSoldOut ? (
                                    t('card_out_of_stock')
                                ) : (
                                    <>
                                        <ShoppingCart size={14} className="mr-2" />
                                        {t('card_add')}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
});

// --- 3. Main StoreView Component ---
export const StoreView = React.memo(
  ({
    games,
    totalGames,
    loading,
    hasMore,
    lastGameRef,
    cart,
    addToCart,
    updateCartQuantity,
    viewProduct,
    mainCategoryGroup,
    filters,
    setFilters,
    onSaveScroll
  }: {
    games: Game[];
    totalGames: number;
    loading: boolean;
    hasMore: boolean;
    lastGameRef: (node: HTMLDivElement) => void;
    cart: CartItem[];
    addToCart: (game: Game) => void;
    updateCartQuantity: (id: number, delta: number) => void;
    viewProduct: (id: number) => void;
    mainCategoryGroup: string;
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    onSaveScroll?: () => void;
  }) => {
    const { t } = useLanguage();
    const { storeState } = useGameVault();

    // Track window width AND container width
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ResizeObserver to get EXACT container width for correct aspect ratio calculations
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const isDesktop = windowWidth >= 1024;
    const [mobileSearch, setMobileSearch] = useState(filters.search);

    // --- VIEW MODE ---
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('store_view_mode');
            return saved === 'list' ? 'list' : 'grid';
        }
        return 'grid';
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('store_view_mode', viewMode);
        }
    }, [viewMode]);

    // --- VIRTUALIZATION CONSTANTS ---
    const dynamicItemHeight = useMemo(() => {
        const effectiveWidth = containerWidth || (windowWidth - 32);

        // --- LIST VIEW LOGIC ---
        if (viewMode === 'list') {
            // Mobile List (Stacked)
            if (effectiveWidth < 640) {
                const imageHeight = effectiveWidth * (3/4);
                // 3. HEIGHT FIX: Reduced from 174 to 148.
                // This removes the "empty space" between categories and price by shortening the container.
                // It is still tall enough to fit the button (148px > content needs ~135-140px).
                const contentHeight = 148;
                return imageHeight + contentHeight;
            } else {
                // Desktop List (Horizontal Row)
                const heightPercentage = 0.5;
                return effectiveWidth * heightPercentage;
            }
        }

        // --- GRID VIEW LOGIC ---
        const columns = isDesktop ? 3 : 2;
        const cardWidth = effectiveWidth / columns;
        const imageHeight = cardWidth * (4/3);
        // 3. HEIGHT FIX: Reduced from 174 to 148.
        const contentHeight = 148;

        return imageHeight + contentHeight;
    }, [viewMode, isDesktop, windowWidth, containerWidth]);

    const GAP = 0;

    // --- USING THE HOOK ---
    const { virtualItems, totalHeight } = useVirtualGrid({
        totalItems: games.length,
        itemHeight: dynamicItemHeight, // Pass the calculated dynamic height
        gridGap: GAP,
        viewMode,
        savedScrollPos: storeState.scrollPos
    });

    const cartLookup = useMemo(() => {
      const lookup = new Map<number, number>();
      for (const item of cart) lookup.set(item.id, item.cartQuantity);
      return lookup;
    }, [cart]);

    useEffect(() => { setMobileSearch(filters.search); }, [filters.search]);

    useEffect(() => {
      const handler = setTimeout(() => {
        if (mobileSearch !== filters.search) setFilters((prev) => ({ ...prev, search: mobileSearch }));
      }, 300);
      return () => clearTimeout(handler);
    }, [mobileSearch, filters.search, setFilters]);

    const getCurrentSortLabel = () => {
        const key = `${filters.sortBy || "id"}-${filters.sortDir || "desc"}`;
        switch(key) {
            case 'price-asc': return t('sort_price_low');
            case 'price-desc': return t('sort_price_high');
            case 'title-asc': return t('sort_az');
            case 'title-desc': return t('sort_za');
            default: return t('sort_newest');
        }
    };

    const PLACEHOLDER_IMG = "https://placehold.co/600x800/1e293b/475569?text=No+Image";

    return (
      <div className="animate-fadeIn pb-24 text-zinc-50 bg-zinc-950 min-h-screen rounded-3xl overflow-hidden">

        {/* --- Header / Controls --- */}
        <div className="max-w-full mx-auto px-1 sm:px-4 pt-4">

            {/* --- MOBILE SEARCH --- */}
            <div className="mb-6 md:hidden">
                <div className="relative group w-full">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition duration-500 -z-10" />
                    <div className={cn(
                        "relative flex h-12 w-full items-center rounded-md border border-zinc-800 bg-zinc-900/90 px-3 text-sm transition-all duration-300 z-10",
                        "focus-within:border-emerald-500/50 focus-within:bg-zinc-900",
                        "hover:bg-zinc-900/80 hover:border-zinc-700"
                    )}>
                        <Search className="mr-3 h-4 w-4 text-zinc-500 shrink-0 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                            className="flex-1 bg-transparent border-none p-0 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-0 h-full w-full"
                            placeholder={t('search_placeholder')}
                            value={mobileSearch}
                            onChange={(e) => setMobileSearch(e.target.value)}
                        />
                        {mobileSearch && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setMobileSearch('')}
                                className="ml-1 h-9 w-9 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full shrink-0"
                            >
                                <X size={16} />
                                <span className="sr-only">Clear</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <NewsBanner t={t} />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 mt-4">
                <div className="space-y-0.5">
                    <h2 className="text-2xl font-black tracking-tight text-white">{t('header_all_products')}</h2>
                    <p className="text-xs text-zinc-400">
                        {t('header_showing')} <span className="font-medium text-white">{games.length}</span> {t('header_of')} <span className="font-medium text-white">{totalGames}</span> {t('header_showing_end')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* View Toggle */}
                    <div className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 p-1 text-muted-foreground border border-white/10 shadow-sm">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-full",
                                viewMode === 'grid' ? "bg-zinc-800 text-white shadow-sm" : "hover:bg-zinc-800/50 hover:text-white"
                            )}
                            title="Grid View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-full",
                                viewMode === 'list' ? "bg-zinc-800 text-white shadow-sm" : "hover:bg-zinc-800/50 hover:text-white"
                            )}
                            title="List View"
                        >
                            <List size={16} />
                        </button>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative w-full md:w-[200px] h-10 group">
                        <select
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 bg-zinc-900 text-white"
                            value={`${filters.sortBy || "id"}-${filters.sortDir || "desc"}`}
                            onChange={(e) => { const [by, dir] = e.target.value.split("-"); setFilters((prev) => ({ ...prev, sortBy: by as any, sortDir: dir as any })); }}
                        >
                            <option value="id-desc">{t('sort_newest')}</option>
                            <option value="price-asc">{t('sort_price_low')}</option>
                            <option value="price-desc">{t('sort_price_high')}</option>
                            <option value="title-asc">{t('sort_az')}</option>
                            <option value="title-desc">{t('sort_za')}</option>
                        </select>
                        <div className="absolute inset-0 flex items-center justify-between px-3 rounded-md border border-white/10 bg-zinc-900 text-white text-sm shadow-sm transition-colors group-hover:border-zinc-700 pointer-events-none z-10">
                            <span className="flex items-center gap-2 truncate min-w-0">
                                <ArrowUpDown className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                                <span className="font-medium truncate">{getCurrentSortLabel()}</span>
                            </span>
                            <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0 ml-2" />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- VIRTUALIZED LAYOUT CONTAINER --- */}
            <div ref={containerRef} className="relative w-full" style={{ height: `${totalHeight}px` }}>

                {games.length === 0 && !loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 opacity-60 rounded-xl border border-dashed border-white/10 bg-zinc-900/20 p-12 h-[400px]">
                        <PackageOpen size={64} className="mb-4 stroke-1 text-zinc-600" />
                        <p className="text-xl font-bold text-white mb-2">{t('state_no_products')}</p>
                        <p className="text-sm">{t('state_try_adjusting')}</p>
                    </div>
                )}

                {/* 1. Render Virtual Items */}
                {virtualItems.map(({ index, style }) => {
                    const game = games[index];
                    if (!game) return null;
                    return (
                        <MemoizedGameCard
                            key={game.id}
                            game={game}
                            style={style}
                            cartQuantity={cartLookup.get(game.id) || 0}
                            mainCategoryGroup={mainCategoryGroup}
                            addToCart={addToCart}
                            updateCartQuantity={updateCartQuantity}
                            PLACEHOLDER_IMG={PLACEHOLDER_IMG}
                            viewMode={viewMode}
                            onSaveScroll={onSaveScroll}
                        />
                    );
                })}

                {/* 2. Infinite Scroll Sentinel */}
                {hasMore && (
                    <div
                        ref={lastGameRef}
                        style={{
                            position: 'absolute',
                            top: `${Math.max(0, totalHeight - 400)}px`,
                            left: 0,
                            width: '100%',
                            height: '50px',
                            pointerEvents: 'none'
                        }}
                    />
                )}
            </div>

            {/* Loading / End States */}
            {loading && hasMore && (
                <div className="flex justify-center py-8">
                    <Loader className="animate-spin text-white" />
                </div>
            )}

            {!loading && !hasMore && games.length > 0 && (
                <div className="py-12 flex items-center justify-center">
                     <span className="inline-flex items-center rounded-full border border-white/10 bg-zinc-900 px-4 py-1 text-xs font-medium text-zinc-500">
                         {t('state_end')}
                     </span>
                </div>
            )}
        </div>
      </div>
    );
});
