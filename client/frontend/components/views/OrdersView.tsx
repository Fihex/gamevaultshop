import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, User } from '../../types';
import { BackendService } from '../../services/backendService';
import { resolveImageUrl } from '../../constants';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../../config/language';
import { Link } from '@tanstack/react-router'; // <--- IMPORT THIS

export const OrdersView = ({ user, setView }: { user: User | null, setView: (view: any) => void }) => {
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchOrders = async () => {
            if(user) {
                const res = await BackendService.getOrders(0, 50, user.id);
                setMyOrders(res.content);
            }
        };
        fetchOrders();
    }, [user]);

    return (
        <div className="max-w-4xl mx-auto animate-fadeIn pb-20">
            {/* Back Button -> Link */}
            <Link
                to="/"
                className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition w-fit"
            >
                <ArrowLeft size={20}/> {t('orders_back')}
            </Link>

            <h2 className="text-3xl font-black text-white mb-8 border-b border-vault-700 pb-4">{t('orders_title')}</h2>

            {myOrders.length === 0 ? (
                <div className="text-center text-gray-500 py-20">
                    <ShoppingBag size={64} className="mx-auto mb-4 opacity-20"/>
                    <p>{t('orders_empty')}</p>
                    <Link
                        to="/"
                        className="text-vault-accent font-bold hover:underline mt-2 inline-block"
                    >
                        {t('orders_start_shopping')}
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {myOrders.map(order => {
                        const subtotal = order.items.reduce((acc, i) => acc + (i.priceAtPurchase * i.quantity), 0);
                        const tax = order.totalAmount - subtotal;

                        return (
                        <div key={order.id} className="bg-vault-800 rounded-xl border border-vault-700 overflow-hidden shadow-lg">
                            <div className="bg-vault-900/50 p-6 flex flex-wrap items-center justify-between gap-6 border-b border-vault-700">
                                <div>
                                    <div className="flex items-center gap-4 mb-1">
                                        <span className="font-black text-xl text-white">{t('orders_number')}{order.id}</span>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            order.status === OrderStatus.ORDERED ? 'bg-blue-900/30 text-blue-400' :
                                            order.status === OrderStatus.PROCESSING ? 'bg-orange-900/30 text-orange-400' :
                                            'bg-green-900/30 text-green-400'
                                        }`}>{t(`status_${order.status}` as any)}</span>
                                    </div>
                                    <p className="text-sm text-gray-500">{new Date(order.date).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">{t('orders_total_amount')}</p>
                                    <span className="font-black text-2xl text-white font-mono">${order.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-4">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orders_items')}</h4>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 bg-vault-900/50 p-3 rounded-lg border border-vault-800">
                                            <img
                                                src={resolveImageUrl(item.imageUrl)}
                                                referrerPolicy="no-referrer"
                                                className="w-16 h-16 rounded-lg object-cover bg-vault-900 flex-shrink-0"
                                                alt=""
                                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100?text=No+Img'; }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-white force-wrap">{item.gameTitle}</p>
                                                <p className="text-xs text-gray-500 mt-1">{t('orders_id')}: {item.gameId}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="font-bold text-white">{item.quantity} x ${item.priceAtPurchase}</p>
                                                <p className="font-mono text-sm text-vault-secondary">${(item.quantity * item.priceAtPurchase).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-vault-900 p-5 rounded-xl h-fit space-y-4">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('orders_summary')}</h4>
                                    <div className="space-y-2 border-b border-vault-800 pb-4 text-sm">
                                        <div className="flex justify-between text-gray-400">
                                            <span>{t('orders_subtotal')}</span>
                                            <span>${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400">
                                            <span>{t('orders_tax')}</span>
                                            <span>${tax.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-white font-bold text-lg pt-2">
                                            <span>{t('orders_total')}</span>
                                            <span>${order.totalAmount.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('orders_note_label')}</h4>
                                        <p className="text-sm text-gray-300 italic bg-vault-800 p-3 rounded border border-vault-700 force-wrap">
                                          "{order.note || t('orders_no_note')}"
                                        </p>
                                    </div>

                                    {order.guestPhone && (
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('orders_phone')}</h4>
                                            <p className="text-sm text-white font-mono">{order.guestPhone}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            )}
        </div>
    );
};
