import React, { useState, useEffect, useMemo, memo } from 'react';
import { CartItem, User, Game } from '../../types';
import { resolveImageUrl } from '../../constants';
import {
    ShoppingCart, X, Search, Trash2, Minus, Plus,
    User as UserIcon, ArrowLeft, PackageOpen
} from 'lucide-react';
import { useLanguage } from '../../config/language';
import { cn } from '../../lib/utils';
import { Link } from '@tanstack/react-router'; // <--- IMPORT THIS

// --- Shadcn UI Imports ---
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// -------------------------------------------------------------------------
// COMPONENT: Cart Skeleton (Shown during slide animation)
// -------------------------------------------------------------------------
const CartSkeleton = () => (
    <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-3 rounded-xl border border-vault-800/50 bg-vault-900/20">
                <div className="w-20 h-24 bg-vault-800 rounded-lg shrink-0" />
                <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="space-y-2">
                        <div className="h-4 bg-vault-800 rounded w-3/4" />
                        <div className="h-3 bg-vault-800 rounded w-1/4" />
                    </div>
                    <div className="flex justify-between items-end">
                        <div className="h-8 w-24 bg-vault-800 rounded" />
                        <div className="h-4 w-16 bg-vault-800 rounded" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

// -------------------------------------------------------------------------
// COMPONENT: CartItemRow (Memoized)
// -------------------------------------------------------------------------
const PLACEHOLDER_IMG = 'https://placehold.co/150x200/1e293b/475569?text=No+Image';

interface CartItemRowProps {
    item: CartItem;
    gameRef: Game | undefined;
    updateCartQuantity: (id: number, d: number) => void;
    handleCartInputChange: (id: number, v: string) => void;
    removeFromCart: (id: number) => void;
    t: any;
}

const CartItemRow = memo(({
    item, gameRef, updateCartQuantity, handleCartInputChange, removeFromCart, t
}: CartItemRowProps) => {
    const maxStock = gameRef ? gameRef.quantity : item.quantity;
    const isMax = item.cartQuantity >= maxStock;

    const displayImage = useMemo(() => {
        const images = Array.isArray(item.images) ? item.images : [];
        return resolveImageUrl(images.length > 0 ? images[0] : undefined) || PLACEHOLDER_IMG;
    }, [item.images]);

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) val = 1;
        if (val > maxStock) val = maxStock;
        handleCartInputChange(item.id, String(val));
    };

    return (
        <div className="group flex gap-4 bg-vault-900/40 p-3 rounded-xl border border-vault-800 hover:border-vault-700 hover:bg-vault-900 transition-colors duration-200">
            <div className="w-20 h-24 bg-black rounded-lg shrink-0 overflow-hidden border border-vault-800 relative bg-vault-900">
                <img
                    src={displayImage}
                    referrerPolicy="no-referrer"
                    alt={item.title}
                    decoding="async"
                    loading="lazy"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10">
                        x{item.cartQuantity}
                    </div>
                </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div className="flex justify-between items-start gap-2">
                    <div>
                        <h4 className="text-sm font-bold text-gray-200 line-clamp-1 leading-tight mb-1" title={item.title}>
                            {item.title}
                        </h4>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-vault-700 text-gray-500 font-mono">
                                #{item.id}
                            </Badge>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} className="h-6 w-6 text-gray-600 hover:text-red-400 hover:bg-red-950/20 -mr-1 -mt-1 transition-colors">
                        <Trash2 size={14} />
                    </Button>
                </div>

                <div className="flex items-end justify-between mt-2">
                    <div className="flex items-center bg-vault-950 rounded-md border border-vault-800 h-8">
                        <Button variant="ghost" size="icon" onClick={() => updateCartQuantity(item.id, -1)} disabled={item.cartQuantity <= 1} className={cn("h-full w-8 rounded-none rounded-l-md hover:bg-vault-800 hover:text-white text-gray-500", item.cartQuantity <= 1 && "opacity-30 cursor-not-allowed hover:bg-transparent")}>
                            <Minus size={12} strokeWidth={3} />
                        </Button>
                        <input
                            type="number"
                            className="w-10 text-center bg-transparent text-xs font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={item.cartQuantity}
                            onChange={(e) => handleCartInputChange(item.id, e.target.value)}
                            onBlur={handleBlur}
                            min={1} max={maxStock}
                        />
                        <Button variant="ghost" size="icon" onClick={() => updateCartQuantity(item.id, 1)} disabled={isMax} className={cn("h-full w-8 rounded-none rounded-r-md hover:bg-vault-800 hover:text-white text-gray-500", isMax && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-gray-500")}>
                            <Plus size={12} strokeWidth={3} />
                        </Button>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 mb-0.5">{t('currencySign')} {item.price}/ea</p>
                        <p className="font-mono text-sm font-black text-vault-accent leading-none">
                            {t('currencySign')} {(item.price * item.cartQuantity).toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}, (prev, next) => {
    return (
        prev.item.id === next.item.id &&
        prev.item.cartQuantity === next.item.cartQuantity &&
        prev.item.title === next.item.title &&
        prev.gameRef?.quantity === next.gameRef?.quantity
    );
});
CartItemRow.displayName = "CartItemRow";

// -------------------------------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------------------------------

export const CartDrawer = ({
    cart, setCart, isCartOpen, setIsCartOpen, user, setView, updateCartQuantity, handleCartInputChange, removeFromCart, games
}: {
    cart: CartItem[], setCart: (c: CartItem[]) => void, isCartOpen: boolean, setIsCartOpen: (v: boolean) => void,
    user: User | null, setView: (v: any) => void, updateCartQuantity: (id: number, d: number) => void,
    handleCartInputChange: (id: number, v: string) => void, removeFromCart: (id: number) => void,
    games: Game[]
}) => {
    const { t } = useLanguage();
    const [cartSearch, setCartSearch] = useState("");

    // NEW: State to control when to show heavy content
    const [isReady, setIsReady] = useState(false);

    // EFFECT: When drawer opens, wait for animation to finish before rendering items
    useEffect(() => {
        if (isCartOpen) {
            setIsReady(false); // Reset to skeleton mode
            // 350ms usually matches the Sheet slide-in duration
            const timer = setTimeout(() => {
                setIsReady(true);
            }, 350);
            return () => clearTimeout(timer);
        } else {
            // When closing, reset immediately so next open starts fresh
            setIsReady(false);
        }
    }, [isCartOpen]);

    const filteredCart = useMemo(() => {
        if (!cartSearch) return cart;
        return cart.filter(item => item.title.toLowerCase().includes(cartSearch.toLowerCase()));
    }, [cart, cartSearch]);

    const cartTotal = useMemo(() => cart.reduce((acc, i) => acc + (i.price * i.cartQuantity), 0), [cart]);
    const cartCount = useMemo(() => cart.reduce((a,c)=>a+c.cartQuantity,0), [cart]);

    const clearCart = () => {
        if (window.confirm(t('cart_clear_confirm') || "Are you sure you want to clear your cart?")) {
            setCart([]);
        }
    };

    return (
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-md p-0 bg-vault-950 border-l border-vault-800 outline-none shadow-2xl text-white flex flex-col h-[100dvh] z-[150] [&>button]:hidden"
            >
                {/* --- HEADER --- */}
                <SheetHeader className="px-6 py-4 border-b border-vault-800 bg-vault-950 shrink-0 flex flex-row items-center justify-between space-y-0">
                    <SheetTitle className="flex items-center gap-3 text-white font-black text-xl tracking-tight">
                        <ShoppingCart className="text-vault-accent" size={22} />
                        {t('cart_title')}
                        <Badge variant="secondary" className="bg-vault-800 text-gray-300 hover:bg-vault-700 ml-1">
                            {cartCount}
                        </Badge>
                    </SheetTitle>

                    <div className="flex items-center gap-2">
                        {cart.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearCart}
                                className="text-gray-500 hover:text-red-400 hover:bg-red-950/20 text-xs uppercase font-bold tracking-wider h-8"
                            >
                                <Trash2 size={14} className="mr-1" /> {t('cart_clear_all')}
                            </Button>
                        )}
                        <SheetClose asChild>
                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-white transition h-8 w-8">
                                <X size={24}/>
                            </Button>
                        </SheetClose>
                    </div>
                </SheetHeader>

                {/* --- SEARCH BAR --- */}
                <div className="px-6 py-4 bg-vault-900/50 border-b border-vault-800 shrink-0">
                    <div className={cn(
                        "relative flex h-10 w-full items-center rounded-md border border-vault-700 bg-vault-800 px-3 text-sm transition-colors duration-200",
                        "focus-within:border-vault-accent/50 focus-within:bg-vault-900",
                        "hover:bg-vault-800/80 hover:border-vault-600"
                    )}>
                        <Search className="mr-2 h-4 w-4 text-gray-500 shrink-0" />
                        <input
                            type="text"
                            placeholder={t('cart_search_placeholder')}
                            value={cartSearch}
                            onChange={(e) => setCartSearch(e.target.value)}
                            className="flex-1 bg-transparent border-none p-0 text-white placeholder:text-gray-500 focus:outline-none focus:ring-0 h-full w-full"
                        />
                        {cartSearch && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setCartSearch('')}
                                className="ml-1 h-6 w-6 text-gray-500 hover:text-white hover:bg-white/10 rounded-full shrink-0"
                            >
                                <X size={14} />
                            </Button>
                        )}
                    </div>
                </div>

                {/* --- LIST (With Deferred Loading Logic) --- */}
                <div className="flex-1 overflow-y-auto w-full px-6 py-4 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60 space-y-4 min-h-[50vh]">
                            <div className="w-20 h-20 bg-vault-900 rounded-full flex items-center justify-center border border-dashed border-vault-700">
                                <ShoppingCart size={32} className="opacity-50"/>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-white">{t('cart_empty_title')}</p>
                                <Link
                                    to="/"
                                    onClick={() => setIsCartOpen(false)}
                                    className="text-vault-accent font-bold mt-2 hover:underline inline-block"
                                >
                                    {t('cart_browse_btn')}
                                </Link>
                            </div>
                        </div>
                    ) : (
                        // LOGIC: If not ready (animation running), show skeleton. Else show items.
                        !isReady ? (
                            <CartSkeleton />
                        ) : filteredCart.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center text-gray-500 space-y-2">
                                 <PackageOpen size={32} />
                                 <p>{t('cart_no_match')}</p>
                            </div>
                        ) : (
                            <div className="space-y-4 pb-4 animate-in fade-in duration-300">
                                {filteredCart.map(item => (
                                    <CartItemRow
                                        key={item.id}
                                        item={item}
                                        gameRef={games.find(g => g.id === item.id)}
                                        updateCartQuantity={updateCartQuantity}
                                        handleCartInputChange={handleCartInputChange}
                                        removeFromCart={removeFromCart}
                                        t={t}
                                    />
                                ))}
                            </div>
                        )
                    )}
                </div>

                {/* --- FOOTER --- */}
                <div className="bg-vault-950 p-6 border-t border-vault-800 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.5)] shrink-0 z-20">
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{t('cart_subtotal')}</span>
                            <span className="text-3xl font-black text-white font-mono tracking-tighter leading-none">
                                {t('currencySign')} {cartTotal.toFixed(2)} <span className="text-sm text-gray-500 font-bold">{t('currency')}</span>
                            </span>
                        </div>
                        <Separator className="bg-vault-800" />

                        {user ? (
                             <Link
                                to="/checkout"
                                onClick={() => setIsCartOpen(false)}
                                className="w-full bg-vault-accent text-white font-bold h-12 text-base rounded-xl hover:bg-vault-accentHover shadow-lg shadow-vault-accent/20 flex items-center justify-center gap-2 group transition-all"
                             >
                                 {t('cart_checkout')}
                                 <ArrowLeft className="rotate-180 group-hover:translate-x-1 transition-transform" size={18}/>
                             </Link>
                        ) : (
                             <div className="grid gap-3">
                                 <Link
                                    to="/checkout"
                                    onClick={() => setIsCartOpen(false)}
                                    className="w-full bg-white text-vault-950 font-bold h-11 hover:bg-gray-200 shadow-lg flex items-center justify-center gap-2 group rounded-lg transition-all"
                                 >
                                     {t('cart_guest_checkout') || "Proceed to Checkout"}
                                     <ArrowLeft className="rotate-180 group-hover:translate-x-1 transition-transform" size={18}/>
                                 </Link>
                                 <Link
                                    to="/login"
                                    onClick={() => setIsCartOpen(false)}
                                    className="w-full border border-vault-700 bg-vault-900/50 text-gray-300 h-10 hover:bg-vault-800 hover:text-white flex items-center justify-center rounded-lg transition-all"
                                 >
                                     <UserIcon size={14} className="mr-2"/> {t('cart_signin_faster')}
                                 </Link>
                             </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
