import React from 'react';
import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { LayoutDashboard, LogOut, Package, Users, ShoppingBag, Tags, Activity } from 'lucide-react';
import { useLanguage } from '../../config/language';
import { useGameVault } from '../../context/GameVaultContext';

export const AdminLayout = () => {
    const { t } = useLanguage();
    const { setFilters } = useGameVault();
    const navigate = useNavigate();

    const tabs = [
        { to: '/admin/inventory', icon: Package, label: t('admin_tab_inventory') },
        { to: '/admin/users', icon: Users, label: t('admin_tab_users') },
        { to: '/admin/orders', icon: ShoppingBag, label: t('admin_tab_orders') },
        { to: '/admin/filters', icon: Tags, label: t('admin_tab_filters') },
        { to: '/admin/audit', icon: Activity, label: t('admin_tab_logs') }
    ];

    return (
        <div className="flex flex-col min-h-full">
            <nav className="bg-vault-900 border-b border-vault-700 px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 z-40 relative rounded-xl shadow-lg mb-6">
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                    <div className="flex items-center gap-3">
                        <div className="bg-vault-accent/10 p-2 rounded-lg">
                            <LayoutDashboard className="text-vault-accent" size={20} />
                        </div>
                        <span className="font-black text-xl tracking-tight text-white">
                            ADMIN <span className="text-vault-accent">{t('admin_panel_title')}</span>
                        </span>
                    </div>

                    {/* Mobile Exit */}
                    <button
                        onClick={() => { setFilters(prev => ({ ...prev, archived: false })); navigate({ to: '/' }); }}
                        className="md:hidden text-gray-400 hover:text-white p-2 bg-vault-800 rounded-lg border border-vault-700"
                    >
                        <LogOut size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-1 bg-vault-950/50 p-1 rounded-lg border border-vault-800 overflow-x-auto max-w-full custom-scrollbar-light w-full md:w-auto justify-start md:justify-center">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.to}
                            to={tab.to}
                            className="px-3 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition whitespace-nowrap text-gray-400 hover:text-white hover:bg-vault-800/50"
                            activeProps={{ className: 'bg-vault-800 text-white shadow-md' }}
                        >
                            <tab.icon size={16}/> {tab.label}
                        </Link>
                    ))}
                </div>

                <button
                    onClick={() => { setFilters(prev => ({ ...prev, archived: false })); navigate({ to: '/' }); }}
                    className="hidden md:flex items-center gap-2 text-gray-400 hover:text-white font-bold text-sm bg-vault-800 hover:bg-vault-700 px-4 py-2.5 rounded-lg border border-vault-700 transition whitespace-nowrap shadow-sm"
                >
                    <LogOut size={16} /> {t('admin_back_store')}
                </button>
            </nav>

            <div className="flex-1">
                {/* This is where InventoryManager, UsersManager etc will appear */}
                <Outlet />
            </div>
        </div>
    );
};
