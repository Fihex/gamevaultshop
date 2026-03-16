
import React, { useState, useEffect } from 'react';
import { User, UserRole, PageResult } from '../../types';
import { BackendService } from '../../services/backendService';
import { TopToolbar, BottomPagination } from './AdminShared';
import { Shield } from 'lucide-react';

export const UsersManager = () => {
    const [data, setData] = useState<PageResult<User>>({ content: [], totalElements: 0, totalPages: 0, last: true });
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState('');

    const load = async () => {
        // Will be handled by useEffect
    };
    
    useEffect(() => { 
        let active = true;
        const fetchData = async () => {
            const res = await BackendService.getUsers(page, size, search);
            if (active) setData(res);
        };
        fetchData();
        return () => { active = false; };
    }, [page, size, search]);

    const refresh = async () => {
        const res = await BackendService.getUsers(page, size, search);
        setData(res);
    }

    const toggleAdmin = async (u: User) => {
        const action = u.role === UserRole.ADMIN ? "Revoke Admin rights" : "Grant Admin rights";
        if (!window.confirm(`Are you sure you want to ${action} for user ${u.username}?`)) return;
        
        const newRole = u.role === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN;
        await BackendService.updateUserStatus(u.id, { role: newRole });
        refresh();
    };

    const toggleEnabled = async (u: User) => {
        const action = u.enabled ? "Disable" : "Enable";
        if (!window.confirm(`Are you sure you want to ${action} user ${u.username}?`)) return;

        await BackendService.updateUserStatus(u.id, { enabled: !u.enabled });
        refresh();
    };

    return (
        <div>
        <h3 className="text-xl font-bold text-white mb-6">User Management</h3>
        
        <TopToolbar 
            search={search} setSearch={setSearch} placeholder="Search users..."
            size={size} setSize={setSize} totalElements={data.totalElements}
            start={page * size + 1} end={Math.min(data.totalElements, (page + 1) * size)}
        />
        
        <div className="rounded-xl border border-vault-700 bg-vault-900 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm text-gray-300 min-w-[800px]">
                <thead className="bg-vault-950 uppercase text-xs font-bold tracking-wider text-gray-400">
                    <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
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
                                    <Shield size={12} /> Admin
                                </span>
                            ) : (
                                <span className="text-xs font-bold text-gray-500 bg-gray-800 px-2 py-1 rounded">User</span>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${u.enabled ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'}`}>
                                {u.enabled ? 'Active' : 'Disabled'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => toggleAdmin(u)} 
                                className={`px-3 py-1.5 rounded text-xs font-bold transition border uppercase tracking-wide ${u.role === UserRole.ADMIN ? 'border-red-900/50 text-red-400 hover:bg-red-900/20' : 'border-vault-accent/50 text-vault-accent hover:bg-vault-accent/10'}`}
                            >
                                {u.role === UserRole.ADMIN ? 'Revoke Admin' : 'Make Admin'}
                            </button>
                            <button 
                                onClick={() => toggleEnabled(u)} 
                                className={`px-3 py-1.5 rounded text-xs font-bold transition border uppercase tracking-wide ${u.enabled ? 'border-red-900/50 text-red-400 hover:bg-red-900/20' : 'border-green-900/50 text-green-400 hover:bg-green-900/20'}`}
                            >
                                {u.enabled ? 'Disable' : 'Enable'}
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
                {(!data?.content || data.content.length === 0) && (
                        <div className="p-8 text-center text-gray-500 italic">No users found</div>
                )}
            </div>
        </div>
        
        <BottomPagination page={page} totalPages={data.totalPages} setPage={setPage} />
        </div>
    );
};
