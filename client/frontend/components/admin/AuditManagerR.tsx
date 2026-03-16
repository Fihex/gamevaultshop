import React, { useState, useEffect } from 'react';
import { AuditLog, PageResult } from '../../types';
import { BackendService } from '../../services/backendService';
import { Activity, Loader } from 'lucide-react';
import { TopToolbar, BottomPagination } from './AdminShared';
import { useLanguage } from '../../config/language';

export const AuditManager = () => {
    const { t } = useLanguage();
    const [data, setData] = useState<PageResult<AuditLog>>({ content: [], totalElements: 0, totalPages: 0, last: true });
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setIsLoading(true);
            try {
                const res = await BackendService.getAuditLogs(page, size, search);
                if (active) setData(res);
            } finally {
                if (active) setIsLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, [page, size, search]);

    return (
        <div>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="text-vault-accent"/> {t('audit_title')}
            </h3>

            <TopToolbar
                search={search} setSearch={setSearch} placeholder={t('audit_search_placeholder')}
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
                                <th className="px-6 py-4 whitespace-nowrap">{t('audit_col_timestamp')}</th>
                                <th className="px-6 py-4 whitespace-nowrap">{t('audit_col_user')}</th>
                                <th className="px-6 py-4 whitespace-nowrap">{t('audit_col_action')}</th>
                                <th className="px-6 py-4">{t('audit_col_details')}</th>
                                <th className="px-6 py-4 whitespace-nowrap">{t('audit_col_entity_id')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-vault-800">
                            {(data?.content || []).map(log => (
                                <tr key={log.id} className="hover:bg-vault-800 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-white">
                                        {log.username}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="bg-vault-700 px-2 py-1 rounded text-[10px] font-bold text-vault-accent border border-vault-600">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300 force-wrap min-w-[200px]">
                                        {log.details}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                                        {log.entityId || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {(!data?.content || data.content.length === 0) && !isLoading && (
                         <div className="p-8 text-center text-gray-500 italic">{t('audit_empty')}</div>
                    )}
                </div>
            </div>
            <BottomPagination page={page} totalPages={data.totalPages} setPage={setPage} />
        </div>
    );
};
