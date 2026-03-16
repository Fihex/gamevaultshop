import React, { useState, useEffect } from 'react';
import { User, CartItem, FilterState } from '../../types';
import {
    Menu, Gamepad2, Search, ShoppingCart,
    User as UserIcon, Settings, ShoppingBag,
    LayoutDashboard, LogOut, ChevronDown,
    Languages, Check
} from 'lucide-react';

import { useLanguage, SUPPORTED_LANGUAGES } from '../../config/language';

const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : '??';
};

export const Navbar = ({
    view, setView, setIsSidebarOpen, isSidebarOpen, setIsCartOpen, cart, user, setFilters, logout, filters
}: {
    view: string, setView: (v: any) => void, setIsSidebarOpen: (v: boolean) => void, isSidebarOpen: boolean,
    setIsCartOpen: (v: boolean) => void, cart: CartItem[], user: User | null,
    setFilters: React.Dispatch<React.SetStateAction<any>>, logout: () => void,
    filters?: FilterState
}) => {
    const [mounted, setMounted] = useState(false);
    const [localSearch, setLocalSearch] = useState(filters?.search || '');

    // 1. Add state for the Language Menu
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

    const { language, setLanguage, t } = useLanguage();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        setLocalSearch(filters?.search || '');
    }, [filters?.search]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (localSearch !== filters?.search) {
                setFilters((prev: any) => ({ ...prev, search: localSearch }));
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [localSearch, setFilters, filters?.search]);

    const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

    return (
        <header className="h-16 bg-vault-900 border-b border-vault-700 px-6 flex items-center justify-between shadow-lg w-full relative z-50">
          <div className="flex items-center gap-4 flex-1">
            {view === 'STORE' && (
              <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                <Menu />
              </button>
            )}
            <div className="flex items-center gap-3 mr-8 cursor-pointer" onClick={() => setView('STORE')}>
              <div className="w-10 h-10 bg-gradient-to-br from-vault-accent to-vault-secondary rounded-lg flex items-center justify-center shadow-lg shadow-vault-accent/20">
                <Gamepad2 className="text-white" size={24} />
              </div>
              <h1 className="hidden md:block text-2xl font-black text-white tracking-tighter">
                GAME<span className="text-vault-accent">VAULT</span>
              </h1>
            </div>
            {view === 'STORE' && mounted && (
              <div className="relative w-full max-w-2xl hidden sm:block animate-fadeIn">
                <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    size={18}
                    style={{ position: 'absolute', top: '50%', left: '0.75rem', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  placeholder={t('search_placeholder')}
                  value={localSearch}
                  className="w-full bg-vault-800 border border-vault-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-vault-accent focus:ring-1 focus:ring-vault-accent transition-all placeholder-gray-500"
                  style={{ backgroundColor: '#1e293b', borderColor: '#334155', color: 'white' }}
                  onChange={(e) => setLocalSearch(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 pl-4">

            {/* --- LANGUAGE SWITCHER FIXED --- */}
            <div className="relative h-16 flex items-center">

                {/* 2. Toggle Button */}
                <button
                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                    className={`flex items-center gap-2 transition p-2 rounded-lg ${isLangMenuOpen ? 'bg-vault-800 text-white' : 'text-gray-300 hover:text-white hover:bg-vault-800/50'}`}
                >
                    <Languages size={20} />
                    <span className="text-xs font-bold uppercase hidden xl:block">{currentLangObj.code}</span>
                </button>

                {/* 3. Invisible Backdrop (Closes menu when clicking outside) */}
                {isLangMenuOpen && (
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsLangMenuOpen(false)}
                    />
                )}

                {/* 4. The Menu */}
                {isLangMenuOpen && (
                    <div className="absolute top-14 right-0 pt-2 w-48 z-50 animate-fadeIn">
                        <div className="bg-vault-800 border border-vault-700 rounded-xl shadow-2xl overflow-hidden">
                            <div className="p-3 border-b border-vault-700 bg-vault-800/50">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('select_language')}</span>
                            </div>
                            <div className="py-1">
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            setLanguage(lang.code);
                                            setIsLangMenuOpen(false); // Close immediately on select
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition
                                            ${language === lang.code
                                                ? 'bg-vault-accent/10 text-vault-accent font-bold'
                                                : 'text-gray-300 hover:bg-vault-700 hover:text-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{lang.flag}</span>
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
            {/* --- END LANGUAGE SWITCHER --- */}

            <button
              className="relative group p-2"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="text-gray-300 group-hover:text-white transition" />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-vault-secondary text-vault-900 font-bold text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-vault-900 shadow-md">
                  {cart.reduce((acc, i) => acc + i.cartQuantity, 0)}
                </span>
              )}
            </button>

            {user ? (
              <div className="relative group h-16 flex items-center cursor-pointer">
                {/* User Dropdown remains as hover for now, or repeat logic above if desired */}
                <div className="flex items-center gap-3 hover:bg-vault-800/50 px-3 py-2 rounded-lg transition border border-transparent hover:border-vault-700">
                  <div className="text-right hidden md:block min-w-0 max-w-[120px]">
                    <p className="text-sm font-bold text-white leading-none mb-1 truncate">{user.username}</p>
                    <p className="text-[10px] font-bold text-vault-accent uppercase tracking-wider">{user.role}</p>
                  </div>
                   <div className="w-9 h-9 rounded-full bg-vault-800 border-2 border-vault-700 group-hover:border-vault-accent flex items-center justify-center text-xs font-black text-gray-300 transition overflow-hidden">
                      {getInitials(user.username)}
                   </div>
                   <ChevronDown size={16} className="text-gray-500" />
                </div>

                <div className="absolute top-full right-0 pt-2 w-60 hidden group-hover:block z-50">
                   <div className="bg-vault-800 border border-vault-700 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
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
                        <button onClick={() => setView('PROFILE')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-vault-700 flex items-center gap-3 text-gray-300 hover:text-white transition">
                            <Settings size={16}/> {t('profile_settings')}
                        </button>

                        {user.role !== 'ADMIN' && (
                          <button onClick={() => setView('ORDERS')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-vault-700 flex items-center gap-3 text-gray-300 hover:text-white transition">
                              <ShoppingBag size={16}/> {t('my_orders')}
                          </button>
                        )}

                        {user.role === 'ADMIN' && (
                          <button onClick={() => setView('ADMIN')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-vault-700 flex items-center gap-3 text-vault-accent font-medium bg-vault-accent/5">
                              <LayoutDashboard size={16}/> {t('admin_dashboard')}
                          </button>
                        )}
                        <button onClick={() => setView('STORE')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-vault-700 flex items-center gap-3 text-gray-300 hover:text-white transition">
                            <Gamepad2 size={16}/> {t('browse_store')}
                        </button>
                      </div>
                      <div className="border-t border-vault-700 py-2 bg-vault-900/30">
                        <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-3 transition">
                            <LogOut size={16}/> {t('sign_out')}
                        </button>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setView('LOGIN')} className="bg-vault-accent hover:bg-vault-accentHover text-white px-6 py-2.5 rounded-lg font-bold text-sm transition shadow-lg shadow-vault-accent/20 transform hover:-translate-y-0.5">
                {t('sign_in')}
              </button>
            )}
          </div>
        </header>
      );
};
