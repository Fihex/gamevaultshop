
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, PageResult } from '../../types';
import { BackendService } from '../../services/backendService';
import { resolveImageUrl } from '../../constants';
import { TopToolbar, BottomPagination } from './AdminShared';
import { Filter, Users, Phone, ShoppingBag, ChevronDown } from 'lucide-react';

export const OrdersManager = () => {
    const [data, setData] = useState<PageResult<Order>>({ content: [], totalElements: 0, totalPages: 0, last: true });
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');

    useEffect(() => { 
        let active = true;
        const load = async () => {
            const res = await BackendService.getOrders(page, size, undefined, search, statusFilter);
            if (active) setData(res);
        };
        load();
        return () => { active = false; };
    }, [page, size, search, statusFilter]);

    const reload = async () => {
        const res = await BackendService.getOrders(page, size, undefined, search, statusFilter);
        setData(res);
    }

    const updateStatus = async (id: number, status: OrderStatus) => {
        await BackendService.updateOrderStatus(id, status);
        reload();
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-white mb-6">Order Management</h3>

            <TopToolbar 
                search={search} setSearch={setSearch} placeholder="Search orders (ID, Email, Name)..."
                size={size} setSize={setSize} totalElements={data.totalElements}
                start={page * size + 1} end={Math.min(data.totalElements, (page + 1) * size)}
                extraFilter={
                    <div className="flex items-center gap-2 bg-vault-800 px-3 py-2.5 rounded-lg border border-vault-700">
                        <Filter size={14} className="text-gray-400"/>
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
                            className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
                        >
                            <option value="ALL" className="bg-vault-800">All Status</option>
                            <option value="ORDERED" className="bg-vault-800 text-blue-400">Ordered</option>
                            <option value="PROCESSING" className="bg-vault-800 text-orange-400">Processing</option>
                            <option value="RECEIVED" className="bg-vault-800 text-green-400">Received</option>
                        </select>
                    </div>
                }
            />

            <div className="space-y-6">
                {(data?.content || []).map(order => {
                    // Logic to find phone number from either guest data OR registered user data
                    const phoneNumber = order.guestPhone || order.userDetails?.phone;

                    return (
                    <div key={order.id} className="bg-vault-900 border border-vault-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:border-vault-600">
                        {/* Header */}
                        <div className="bg-vault-950/50 p-4 flex flex-wrap gap-4 justify-between items-center border-b border-vault-800">
                            <div className="flex items-center gap-4">
                                    <span className="font-mono text-lg font-bold text-white">#{order.id}</span>
                                    <span className="text-xs text-gray-500">{new Date(order.date).toLocaleString()}</span>
                                    {/* User Badge */}
                                    {order.userId ? (
                                        <span className="bg-vault-800 text-vault-accent text-[10px] font-bold px-2 py-1 rounded border border-vault-700 uppercase">Registered User</span>
                                    ) : (
                                        <span className="bg-vault-800 text-gray-400 text-[10px] font-bold px-2 py-1 rounded border border-vault-700 uppercase">Guest</span>
                                    )}
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Total</p>
                                    <p className="text-xl font-black text-vault-secondary font-mono">${order.totalAmount.toFixed(2)}</p>
                                </div>
                                {/* Status Dropdown */}
                                <div className="relative group">
                                    <select 
                                        value={order.status}
                                        onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                                        className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-vault-900 transition-colors ${
                                            order.status === OrderStatus.ORDERED ? 'bg-blue-900/20 text-blue-400 border-blue-900/50 focus:ring-blue-500' :
                                            order.status === OrderStatus.PROCESSING ? 'bg-orange-900/20 text-orange-400 border-orange-900/50 focus:ring-orange-500' :
                                            'bg-green-900/20 text-green-400 border-green-900/50 focus:ring-green-500'
                                        }`}
                                    >
                                        {Object.values(OrderStatus).map(s => <option key={s} value={s} className="bg-vault-900 text-gray-300">{s}</option>)}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"/>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Customer Info - Col 4 */}
                            <div className="lg:col-span-4 space-y-3 border-b lg:border-b-0 lg:border-r border-vault-800 pb-4 lg:pb-0 lg:pr-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-vault-800 flex items-center justify-center text-gray-500 border border-vault-700 shrink-0">
                                        <Users size={20}/>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-white truncate">
                                            {order.guestName || order.userDetails?.username || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">
                                            {order.guestEmail || order.userDetails?.email || 'No email'}
                                        </p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">Phone:</span>
                                            {phoneNumber ? (
                                                <span className="text-xs font-mono text-white flex items-center gap-1">
                                                    <Phone size={10} className="text-vault-secondary"/> {phoneNumber}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-600 italic">Not provided</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {order.note && (
                                    <div className="bg-vault-950 p-3 rounded-lg border border-vault-800/50">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Note</p>
                                        <p className="text-xs text-gray-300 italic leading-relaxed">"{order.note}"</p>
                                    </div>
                                )}
                            </div>

                            {/* Items - Col 8 */}
                            <div className="lg:col-span-8">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Items ({order.items.length})</p>
                                </div>
                                <div className="space-y-2">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-vault-950/30 p-2 rounded-lg border border-vault-800 hover:border-vault-700 transition">
                                            <img 
                                                src={resolveImageUrl(item.imageUrl)} 
                                                referrerPolicy="no-referrer"
                                                className="w-16 h-16 rounded-lg object-cover bg-black border border-vault-800" 
                                                alt=""
                                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100?text=No+Img'; }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-200 truncate">{item.gameTitle}</p>
                                                <p className="text-xs text-gray-500">ID: {item.gameId}</p>
                                            </div>
                                            <div className="text-right whitespace-nowrap">
                                                <p className="text-xs font-bold text-gray-400">{item.quantity} x ${item.priceAtPurchase}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    )
                })}
                {(!data?.content || data.content.length === 0) && (
                        <div className="text-center py-12 text-gray-500">
                            <ShoppingBag size={48} className="mx-auto mb-4 opacity-20"/>
                            <p>No orders found.</p>
                        </div>
                )}
            </div>

            <BottomPagination page={page} totalPages={data.totalPages} setPage={setPage} />
        </div>
    );
};