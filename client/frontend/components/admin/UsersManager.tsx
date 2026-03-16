import React, { useState, useEffect } from 'react';
import { User, UserRole, PageResult } from '../../types';
import { BackendService } from '../../services/backendService';
import { TopToolbar, BottomPagination } from './AdminShared';
import { Shield, Loader } from 'lucide-react';
import { useLanguage } from '../../config/language';


export const UsersManager = () => {
    const { t } = useLanguage();
    const [data, setData] = useState<PageResult<User>>({ content: [], totalElements: 0, totalPages: 0, last: true });
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let active = true;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const res = await BackendService.getUsers(page, size, search);
                if (active) setData(res);
            } finally {
                if (active) setIsLoading(false);
            }
        };
        fetchData();
        return () => { active = false; };
    }, [page, size, search]);

    const refresh = async () => {
        setIsLoading(true);
        try {
            const res = await BackendService.getUsers(page, size, search);
            setData(res);
        } finally {
            setIsLoading(false);
        }
    }

    const toggleAdmin = async (u: User) => {
      const confirmMsg = u.role === UserRole.ADMIN
          ? `${t('confirm_revoke_admin')} ${u.username}?`
          : `${t('confirm_grant_admin')} ${u.username}?`;

      if (!window.confirm(confirmMsg)) return;

        // Optimistic UI update or wait for refresh?
        // For security actions, better to wait for server confirmation via refresh
        const newRole = u.role === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN;
        await BackendService.updateUserStatus(u.id, { role: newRole });
        refresh();
    };

    const toggleEnabled = async (u: User) => {
        const confirmMsg = u.enabled
            ? `${t('confirm_disable_user')} ${u.username}?`
            : `${t('confirm_enable_user')} ${u.username}?`;

        if (!window.confirm(confirmMsg)) return;

        await BackendService.updateUserStatus(u.id, { enabled: !u.enabled });
        refresh();
    };

    return (
        <div>
        <h3 className="text-xl font-bold text-white mb-6">{t('admin_users_title')}</h3>

        <TopToolbar
            search={search} setSearch={setSearch} placeholder={t('admin_users_search_ph')}
            size={size} setSize={setSize} totalElements={data.totalElements}
            start={page * size + 1} end={Math.min(data.totalElements, (page + 1) * size)}
        />

        <div className="rounded-xl border border-vault-700 bg-vault-900 overflow-hidden relative min-h-[300px]">
            {isLoading && (
                <div className="absolute inset-0 z-20 bg-vault-900/50 backdrop-blur-sm flex items-center justify-center">
                    <Loader className="animate-spin text-vault-accent" size={48} />
                </div>
            )}

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm text-gray-300 min-w-[800px]">
                <thead className="bg-vault-950 uppercase text-xs font-bold tracking-wider text-gray-400">
                    <tr>
                      <th className="px-6 py-4">{t('admin_th_user')}</th>
                      <th className="px-6 py-4">{t('admin_th_role')}</th>
                      <th className="px-6 py-4">{t('admin_th_status')}</th>
                      <th className="px-6 py-4 text-right">{t('admin_th_actions')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-vault-800">
                    {(data?.content || []).map(u => (
                    <tr key={u.id} className="hover:bg-vault-800 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">
                            <div>
                                <p className="force-wrap">{u.username}</p>
                                <p className="text-xs text-gray-500 force-wrap">{u.email}</p>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            {u.role === UserRole.ADMIN ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-vault-accent bg-vault-accent/10 px-2 py-1 rounded">
                                    <Shield size={12} /> {t('role_admin')}
                                </span>
                            ) : (
                                <span className="text-xs font-bold text-gray-500 bg-gray-800 px-2 py-1 rounded">{t('role_user')}</span>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${u.enabled ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'}`}>
                                {u.enabled ? t('status_active') : t('status_disabled')}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => toggleAdmin(u)}
                                disabled={isLoading}
                                className={`px-3 py-1.5 rounded text-xs font-bold transition border uppercase tracking-wide disabled:opacity-50 ${u.role === UserRole.ADMIN ? 'border-red-900/50 text-red-400 hover:bg-red-900/20' : 'border-vault-accent/50 text-vault-accent hover:bg-vault-accent/10'}`}
                            >
                                {u.role === UserRole.ADMIN ? t('btn_revoke_admin') : t('btn_make_admin')}
                            </button>
                            <button
                                onClick={() => toggleEnabled(u)}
                                disabled={isLoading}
                                className={`px-3 py-1.5 rounded text-xs font-bold transition border uppercase tracking-wide disabled:opacity-50 ${u.enabled ? 'border-red-900/50 text-red-400 hover:bg-red-900/20' : 'border-green-900/50 text-green-400 hover:bg-green-900/20'}`}
                            >
                                {u.enabled ? t('btn_disable') : t('btn_enable')}
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
                {(!data?.content || data.content.length === 0) && !isLoading && (
                        <div className="p-8 text-center text-gray-500 italic">{t('admin_no_users')}</div>
                )}
            </div>
        </div>

        <BottomPagination page={page} totalPages={data.totalPages} setPage={setPage} />
        </div>
    );
};
