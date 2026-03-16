import React, { useState, useEffect } from 'react';
import { User, CartItem, FilterState } from '../../types';
import {
    Menu, Gamepad2, Search, ShoppingCart,
    User as UserIcon, Settings, ShoppingBag,
    LayoutDashboard, LogOut, ChevronDown,
    Check, Loader2, X, Info
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '@/components/ui/button';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../config/language';
import { Link } from '@tanstack/react-router';

const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : '??';
};

export const Navbar = React.memo(({
    view, setView, setIsSidebarOpen, isSidebarOpen, setIsCartOpen, cart, user, setFilters, logout, filters
}: {
    view: string, setView: (v: any) => void, setIsSidebarOpen: (v: boolean) => void, isSidebarOpen: boolean,
    setIsCartOpen: (v: boolean) => void, cart: CartItem[], user: User | null,
    setFilters: React.Dispatch<React.SetStateAction<any>>, logout: () => void,
    filters?: FilterState
}) => {
    const [mounted, setMounted] = useState(false);
    const [localSearch, setLocalSearch] = useState(filters?.search || '');

    // State for menus
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    // Loading state for mobile menu feedback
    const [isSidebarLoading, setIsSidebarLoading] = useState(false);

    const { language, setLanguage, t } = useLanguage();

    useEffect(() => { setMounted(true); }, []);

    // Reset loading state when sidebar state actually changes
    useEffect(() => {
        if (isSidebarOpen) setIsSidebarLoading(false);
    }, [isSidebarOpen]);

    // Sync local search with props
    useEffect(() => { setLocalSearch(filters?.search || ''); }, [filters?.search]);

    // Debounce search updates
    useEffect(() => {
        const handler = setTimeout(() => {
            if (localSearch !== filters?.search) {
                setFilters((prev: any) => ({ ...prev, search: localSearch }));
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [localSearch, setFilters, filters?.search]);

    const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

    const handleMobileMenuClick = () => {
        if (!isSidebarOpen) {
            setIsSidebarLoading(true);
            setTimeout(() => setIsSidebarOpen(true), 10);
        } else {
            setIsSidebarOpen(false);
        }
    };

    return (
        <header className="h-16 bg-vault-900 border-b border-vault-700 px-4 sm:px-6 flex items-center justify-between shadow-lg w-full sticky top-0 z-50">

          {/* --- LEFT SIDE: Logo & Toggle --- */}
          <div className="flex items-center gap-4 shrink-0">
            {/* SIDEBAR TOGGLE (Mobile Only) - Only show on Store/Home route ideally, keeping generic for now */}
            <button
                className="lg:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-vault-800 transition-colors"
                onClick={handleMobileMenuClick}
                aria-label="Open Filters"
                disabled={isSidebarLoading}
            >
                {isSidebarLoading ? (
                    <Loader2 size={24} className="animate-spin text-vault-accent" />
                ) : (
                    <Menu size={24} />
                )}
            </button>

            {/* LOGO */}
            <Link to="/" className="flex items-center gap-3 cursor-pointer select-none">
              <div className="w-10 h-10 bg-gradient-to-br from-vault-accent to-vault-secondary rounded-lg flex items-center justify-center shadow-lg shadow-vault-accent/20 flex-shrink-0">
                <Gamepad2 className="text-white w-6 h-6" />
              </div>
              <h1 className="hidden md:block text-2xl font-black text-white tracking-tighter">
                Discount<span className="text-vault-accent"> Games</span>
              </h1>
            </Link>
          </div>

          {/* --- CENTER: SEARCH BAR --- */}
          <div className="flex-1 max-w-2xl px-6 hidden md:block">
            {mounted && (
                <div className="relative group w-full">
                    {/* Glow Effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-vault-accent/40 to-cyan-500/40 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition duration-500 -z-10" />

                    {/* Flex Container acting as the "Input" */}
                    <div className={cn(
                        "relative flex h-10 w-full items-center rounded-md border border-vault-700 bg-vault-800 px-3 text-sm transition-all duration-300 z-10",
                        "focus-within:ring-1 focus-within:ring-vault-accent focus-within:border-vault-accent",
                        "hover:bg-vault-800/80 hover:border-vault-600"
                    )}>
                        <Search
                            className="h-4 w-4 text-gray-500 mr-2 shrink-0 group-focus-within:text-vault-accent transition-colors"
                        />
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="flex-1 bg-transparent border-none p-0 text-white placeholder:text-gray-500 focus:outline-none focus:ring-0 h-full w-full"
                        />
                        {localSearch && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setLocalSearch('')}
                                className="ml-2 h-6 w-6 text-gray-500 hover:text-white hover:bg-white/10 rounded-full shrink-0"
                            >
                                <X size={14} />
                                <span className="sr-only">Clear search</span>
                            </Button>
                        )}
                    </div>
                </div>
            )}
          </div>

          {/* --- RIGHT SIDE: Actions --- */}
          <div className="flex items-center gap-3 shrink-0">

            {/* Language Switcher */}
            <div className="relative">
                <button
                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                    className={cn(
                        "flex items-center gap-2 transition p-2 rounded-lg border",
                        isLangMenuOpen ? 'bg-vault-800 text-white border-vault-700' : 'border-transparent text-gray-400 hover:text-white hover:bg-vault-800'
                    )}
                >
                    <div className="w-6 h-4 flex items-center justify-center rounded-sm overflow-hidden shadow-sm">
                        {currentLangObj.flag}
                    </div>
                    <span className="text-xs font-bold uppercase hidden xl:block">{currentLangObj.code}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isLangMenuOpen ? 'rotate-180' : ''}`}/>
                </button>

                {isLangMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setIsLangMenuOpen(false)} />}
                {isLangMenuOpen && (
                    <div className="absolute top-12 right-0 pt-2 w-48 z-50 animate-fadeIn">
                        <div className="bg-vault-800 border border-vault-700 rounded-xl shadow-2xl overflow-hidden">
                            <div className="py-1">
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => { setLanguage(lang.code); setIsLangMenuOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition group ${language === lang.code ? 'bg-vault-accent/10 text-vault-accent font-bold' : 'text-gray-300 hover:bg-vault-700 hover:text-white'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-4 rounded-sm overflow-hidden shadow-sm">{lang.flag}</div>
                                            <span>{lang.name}</span>
                                        </div>
                                        {language === lang.code && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Cart */}
            <button
                className="relative p-2 text-gray-400 hover:text-white hover:bg-vault-800 rounded-lg transition-all border border-transparent hover:border-vault-700/50"
                onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart size={22} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-vault-secondary text-vault-900 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center border-2 border-vault-900 shadow-md">
                  {cart.reduce((acc, i) => acc + i.cartQuantity, 0)}
                </span>
              )}
            </button>

            {/* User Menu OR Sign In Button */}
            {user ? (
              <div className="relative">
                <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={cn(
                        "flex items-center gap-3 px-2 py-1.5 rounded-lg transition border",
                        isUserMenuOpen ? 'bg-vault-800 border-vault-700' : 'border-transparent hover:bg-vault-800'
                    )}
                >
                   <div className="hidden text-right md:block">
                     <p className="text-sm font-bold text-white leading-none mb-0.5 max-w-[100px] truncate">{user.username}</p>
                     <p className="text-[10px] font-bold text-vault-accent uppercase tracking-wider">{user.role}</p>
                   </div>
                   <div className="w-9 h-9 rounded-full bg-vault-900 border border-vault-700 flex items-center justify-center text-xs font-black text-gray-300 overflow-hidden">
                      {getInitials(user.username)}
                   </div>
                   <ChevronDown size={14} className={`text-gray-500 transition-transform duration-200 hidden sm:block ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />}
                {isUserMenuOpen && (
                    <div className="absolute top-14 right-0 pt-2 w-60 z-50 animate-fadeIn">
                       <div className="bg-vault-800 border border-vault-700 rounded-xl shadow-2xl overflow-hidden">
                          <div className="p-4 border-b border-vault-700 bg-vault-800/50 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-vault-900 flex items-center justify-center overflow-hidden border border-vault-700 shrink-0">
                                <UserIcon size={20} className="text-gray-500"/>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-white truncate">{user.username}</p>
                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            </div>
                          </div>

                          <div className="py-2">
                            <Link
                                to="/profile"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-vault-700 flex items-center gap-3 text-gray-300 hover:text-white transition"
                            >
                                <Settings size={16}/> {t('profile_settings')}
                            </Link>

                            {user.role !== 'ADMIN' && (
                                <Link
                                    to="/orders"
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-vault-700 flex items-center gap-3 text-gray-300 hover:text-white transition"
                                >
                                    <ShoppingBag size={16}/> {t('my_orders')}
                                </Link>
                            )}

                            {user.role === 'ADMIN' && (
                                <Link
                                    to="/admin"
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-vault-700 flex items-center gap-3 text-vault-accent font-medium bg-vault-accent/5"
                                >
                                    <LayoutDashboard size={16}/> {t('admin_dashboard')}
                                </Link>
                            )}

                            <Link
                                to="/"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-vault-700 flex items-center gap-3 text-gray-300 hover:text-white transition"
                            >
                                <Gamepad2 size={16}/> {t('browse_store')}
                            </Link>
                          </div>

                          <div className="border-t border-vault-700 py-2 bg-vault-900/30">
                            <button
                                onClick={() => { logout(); setIsUserMenuOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-3 transition"
                            >
                                <LogOut size={16}/> {t('sign_out')}
                            </button>
                          </div>
                       </div>
                    </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-vault-accent hover:bg-vault-accentHover text-white px-6 py-2 rounded-lg font-bold text-sm transition shadow-lg shadow-vault-accent/20 transform hover:-translate-y-0.5 whitespace-nowrap"
              >
                {t('sign_in')}
              </Link>
            )}

            {/* About Us Button */}
            <Link
                to="/about"
                className="flex p-2 rounded-lg transition-all border border-transparent hover:text-white hover:bg-vault-800"
                activeProps={{ className: 'bg-vault-800 text-vault-accent' }}
                inactiveProps={{ className: 'text-gray-400' }}
                title={t('about_us') || "About Us"}
            >
                <Info size={22} />
            </Link>

          </div>
        </header>
      );
});
