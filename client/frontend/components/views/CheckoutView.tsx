import React, { useState, useEffect } from 'react';
import { CartItem, User, Order, UserRole } from '../../types';
import { BackendService } from '../../services/backendService';
import {
    ArrowLeft, CreditCard, User as UserIcon, Mail, Phone,
    FileText, Receipt, ShieldAlert, Lock, FileSpreadsheet,
    Loader2, LogIn
} from 'lucide-react';
import { useLanguage } from '../../config/language';
import writeXlsxFile from 'write-excel-file';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from '@tanstack/react-router'; // <--- IMPORT THIS

export const CheckoutView = ({
    user,
    cart,
    setCart,
    setView, // Kept for type compatibility, unused in favor of router
    mainCategoryGroup,
    enableGuestCheckout
}: {
    user: User | null,
    cart: CartItem[],
    setCart: (cart: CartItem[]) => void,
    setView: (view: any) => void,
    mainCategoryGroup: string,
    enableGuestCheckout: boolean
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate(); // <--- Hook for programmatic navigation
  const [isDownloading, setIsDownloading] = useState(false);

  const getSafeText = (key: string, fallback: string) => {
      const val = t(key as any);
      return (!val || val === key) ? fallback : val;
  };

  const [formData, setFormData] = useState({
        name: user?.username || '',
        email: user?.email || '',
        phone: user?.phone || '',
        note: ''
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.username || prev.name,
                email: user.email || prev.email,
                phone: user.phone || prev.phone
            }));
        }
    }, [user]);

    const isAdmin = user?.role === UserRole.ADMIN;
    const hasProfilePhone = user?.phone && user.phone.trim() !== '';

    // Total Calculation
    const total = cart.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0);

    const getBadge = (item: CartItem) => {
        if (!item.categories || item.categories.length === 0) return "";
        const mainBadge = item.categories.find(c => c.type === mainCategoryGroup);
        return mainBadge ? mainBadge.name : (item.categories[0]?.name || "");
    };

    // --- EXCEL GENERATION LOGIC ---
    const generateAndDownloadExcel = async (finalPhone: string) => {
        const randomOrderId = Math.floor(100000 + Math.random() * 900000);
        const rawName = (user ? user.username : formData.name) || 'Guest';
        const safeName = rawName.replace(/[\\/:*?"<>|]/g, '_');
        const safePhone = finalPhone.replace(/[^\d+]/g, '');

        const fileName = `${safeName}_${safePhone}_${randomOrderId}.xlsx`;

        const columns = [
            { width: 25 }, // A: Category
            { width: 40 }, // B: Title
            { width: 15 }, // C: Qty
            { width: 20 }, // D: Price
            { width: 20 }  // E: Total
        ];

        const HEADER_STYLE = {
            fontWeight: 'bold',
            align: 'center',
            backgroundColor: '#f3f4f6',
            borderColor: '#000000'
        };

        const BOLD_STYLE = { fontWeight: 'bold' };
        const NUMBER_FORMAT = '#,##0.00';

        const dynamicBadgeKey = `category_${mainCategoryGroup.toLowerCase()}`;
        let badgeHeader = t(dynamicBadgeKey as any);
        if (!badgeHeader || badgeHeader === dynamicBadgeKey) {
            badgeHeader = mainCategoryGroup.charAt(0).toUpperCase() + mainCategoryGroup.slice(1).toLowerCase();
        }

        const data = [
            [
                { value: getSafeText('excel_header', 'ORDER QUOTE'), fontWeight: 'bold', fontSize: 16, span: 5, align: 'center' },
                null, null, null, null
            ],
            [],
            [{ value: getSafeText('excel_customer', 'CUSTOMER DETAILS'), fontWeight: 'bold', color: '#6b7280' }],
            [{ value: getSafeText('excel_ref', 'Reference ID'), ...BOLD_STYLE }, { value: randomOrderId.toString() }],
            [{ value: t('checkout_label_name'), ...BOLD_STYLE }, { value: user ? user.username : formData.name }],
            [{ value: t('checkout_label_email'), ...BOLD_STYLE }, { value: user ? user.email : formData.email }],
            [{ value: t('checkout_label_phone'), ...BOLD_STYLE }, { value: finalPhone }],
        ];

        if (formData.note) {
            data.push([]);
            data.push([
                { value: t('checkout_label_notes'), fontWeight: 'bold', color: '#6b7280' }
            ]);
            data.push([
                {
                    value: formData.note,
                    span: 5,
                    wrap: true,
                    align: 'left',
                    alignVertical: 'top'
                }
            ]);
        }

        data.push([], []);

        data.push([
            { value: badgeHeader, ...HEADER_STYLE },
            { value: getSafeText('excel_col_title', 'Title'), ...HEADER_STYLE },
            { value: getSafeText('excel_col_qty', 'Quantity'), ...HEADER_STYLE },
            { value: getSafeText('excel_col_unit', 'Unit Price'), ...HEADER_STYLE },
            { value: getSafeText('excel_col_total', 'Total'), ...HEADER_STYLE }
        ]);

        cart.forEach(item => {
            data.push([
                { value: getBadge(item) },
                { value: item.title, fontWeight: 'bold' },
                { value: item.cartQuantity, align: 'center' },
                { value: item.price, format: NUMBER_FORMAT },
                { value: item.price * item.cartQuantity, format: NUMBER_FORMAT, fontWeight: 'bold' }
            ]);
        });

        data.push([]);
        data.push([
            null, null, null,
            { value: t('checkout_total'), fontWeight: 'bold', align: 'right' },
            {
                value: total,
                format: NUMBER_FORMAT,
                fontWeight: 'bold',
                backgroundColor: '#fef08a'
            }
        ]);

        await writeXlsxFile(data, {
            columns,
            fileName
        });
    };

    const handleManualDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        const finalPhone = hasProfilePhone ? user!.phone : formData.phone;

        if (!formData.name && !user) {
            alert(t('checkout_ph_name') + " is required.");
            return;
        }

        try {
            setIsDownloading(true);
            await generateAndDownloadExcel(finalPhone);
        } catch (error) {
            console.error("Excel error:", error);
            alert("Failed to generate quote.");
        } finally {
            setIsDownloading(false);
        }
    };

    const submitOrder = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user && !enableGuestCheckout) {
             alert(t('cart_guest_disabled'));
             return;
        }

        if (isAdmin) {
            alert(t('checkout_admin_error'));
            return;
        }

        const finalPhone = hasProfilePhone ? user!.phone : formData.phone;

        const orderItems = cart.map(c => ({
            gameId: c.id,
            gameTitle: c.title,
            quantity: c.cartQuantity,
            priceAtPurchase: c.price,
            imageUrl: (c.images && c.images.length > 0) ? c.images[0] : ''
        }));

        const newOrder: Partial<Order> = {
            items: orderItems,
            totalAmount: total,
            note: formData.note,
            userId: user ? user.id : undefined,
            guestName: !user ? formData.name : undefined,
            guestEmail: !user ? formData.email : undefined,
            guestPhone: finalPhone
        };

        const result = await BackendService.createOrder(newOrder);

        if (result.success) {
            setCart([]);
            // Use router navigation
            navigate({ to: user ? '/orders' : '/' });
            alert(t('checkout_success'));
        } else {
            alert(`${t('checkout_fail')}: ${result.error || 'Unknown error'}`);
        }
    };

    const isCheckoutBlocked = !user && !enableGuestCheckout;

    return (
        <div className="max-w-6xl mx-auto animate-fadeIn pb-20">
            {/* UPDATED BACK BUTTON -> LINK */}
            <Link
                to="/"
                className="mb-8 group flex items-center gap-3 text-gray-400 hover:text-white transition-colors w-fit"
            >
                <div className="p-2.5 rounded-lg bg-vault-900 border border-vault-700 group-hover:border-vault-accent/50 group-hover:bg-vault-800 transition-all">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/>
                </div>
                <span className="font-bold text-sm tracking-wide uppercase">{t('checkout_back')}</span>
            </Link>

            <h2 className="text-4xl font-black text-white mb-8 flex items-center gap-3">
                <CreditCard className="text-vault-secondary" size={32}/> {t('checkout_title')}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-vault-800 p-8 rounded-2xl border border-vault-700 shadow-xl">
                        <h3 className="text-xl font-bold text-white mb-6 border-b border-vault-700 pb-4 flex items-center gap-2">
                            <UserIcon className="text-vault-accent" size={20} /> {t('checkout_customer_details')}
                        </h3>

                        {isCheckoutBlocked && (
                            <div className="mb-8 bg-yellow-950/20 border border-yellow-700/50 p-4 rounded-xl flex items-start gap-4">
                                <div className="p-2 bg-yellow-900/30 rounded-full shrink-0">
                                    <ShieldAlert className="text-yellow-500" size={20} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-yellow-200 mb-1">
                                        {t('cart_guest_disabled') || "Guest Checkout Disabled"}
                                    </h4>
                                    <p className="text-xs text-yellow-400/70 leading-relaxed mb-3">
                                        {getSafeText('checkout_guest_quote_desc', "Online orders are currently disabled for guests. You may still fill out your details below to download an official quote (.xlsx), but you must sign in to complete the purchase.")}
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        asChild // Use asChild to wrap the Link
                                        className="border-yellow-700/50 text-yellow-400 hover:bg-yellow-900/40 hover:text-yellow-200 h-8 text-xs font-bold"
                                    >
                                        <Link to="/login">
                                            <LogIn className="mr-2" size={14} /> {t('sign_in')}
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        )}

                        <form id="checkout-form" onSubmit={submitOrder} className="space-y-6">
                                {/* Guest Fields */}
                                {!user && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t('checkout_label_name')}</label>
                                        <div className="flex items-center bg-vault-900 border border-vault-600 rounded-xl px-4 py-3.5 focus-within:border-vault-secondary focus-within:ring-1 focus-within:ring-vault-secondary transition">
                                            <UserIcon size={18} className="text-gray-500 mr-3 shrink-0" />
                                            <input
                                                required
                                                className="bg-transparent border-none p-0 text-white w-full focus:ring-0 outline-none placeholder:text-gray-600"
                                                value={formData.name}
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                                placeholder={t('checkout_ph_name')}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t('checkout_label_email')}</label>
                                        <div className="flex items-center bg-vault-900 border border-vault-600 rounded-xl px-4 py-3.5 focus-within:border-vault-secondary focus-within:ring-1 focus-within:ring-vault-secondary transition">
                                            <Mail size={18} className="text-gray-500 mr-3 shrink-0" />
                                            <input
                                                required
                                                type="email"
                                                className="bg-transparent border-none p-0 text-white w-full focus:ring-0 outline-none placeholder:text-gray-600"
                                                value={formData.email}
                                                onChange={e => setFormData({...formData, email: e.target.value})}
                                                placeholder={t('checkout_ph_email')}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t('checkout_label_phone')}</label>
                                        <div className="flex items-center bg-vault-900 border border-vault-600 rounded-xl px-4 py-3.5 focus-within:border-vault-secondary focus-within:ring-1 focus-within:ring-vault-secondary transition">
                                            <Phone size={18} className="text-gray-500 mr-3 shrink-0" />
                                            <input
                                                required
                                                type="tel"
                                                className="bg-transparent border-none p-0 text-white w-full focus:ring-0 outline-none placeholder:text-gray-600"
                                                value={formData.phone}
                                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                                placeholder={t('checkout_ph_phone')}
                                            />
                                        </div>
                                    </div>
                                    </div>
                                )}

                                {/* User Fields */}
                                {user && (
                                    <div className="bg-vault-900/50 p-6 rounded-xl border border-vault-700/50 flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-full bg-vault-800 border-2 border-vault-700 flex items-center justify-center overflow-hidden shrink-0">
                                            <UserIcon className="text-gray-400" size={32}/>
                                        </div>
                                        <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 font-bold uppercase">{t('checkout_label_account')}</p>
                                                <p className="font-bold text-white text-lg truncate">{user.username}</p>
                                                <p className="text-sm text-vault-accent truncate">{user.email}</p>
                                            </div>
                                            {hasProfilePhone ? (
                                            <div>
                                                <p className="text-xs text-gray-500 font-bold uppercase">{t('checkout_label_phone_short')}</p>
                                                <p className="font-bold text-white text-lg font-mono flex items-center gap-2">
                                                    <Phone size={16} className="text-gray-500"/> {user.phone}
                                                </p>
                                            </div>
                                            ) : (
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t('checkout_label_phone_req')}</label>
                                                <div className="flex items-center bg-vault-900 border border-vault-600 rounded-xl px-4 py-2.5 focus-within:border-vault-secondary focus-within:ring-1 focus-within:ring-vault-secondary transition">
                                                    <Phone size={18} className="text-gray-500 mr-3 shrink-0" />
                                                    <input
                                                        required
                                                        type="tel"
                                                        className="bg-transparent border-none p-0 text-white w-full focus:ring-0 outline-none text-sm placeholder:text-gray-600"
                                                        value={formData.phone}
                                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                                        placeholder={t('checkout_ph_phone')}
                                                    />
                                                </div>
                                            </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold text-gray-400 uppercase">{t('checkout_label_notes')}</label>
                                    <span className={`text-[10px] font-bold ${formData.note.length >= 500 ? 'text-red-400' : 'text-gray-500'}`}>
                                        {formData.note.length}/500
                                    </span>
                                </div>
                                <div className="flex items-start bg-vault-900 border border-vault-600 rounded-xl px-4 py-3.5 focus-within:border-vault-secondary focus-within:ring-1 focus-within:ring-vault-secondary transition">
                                    <FileText size={18} className="text-gray-500 mr-3 mt-1 shrink-0" />
                                    <textarea
                                        className="bg-transparent border-none p-0 text-white w-full focus:ring-0 outline-none h-32 resize-none placeholder:text-gray-600"
                                        placeholder={t('checkout_ph_notes')}
                                        maxLength={500}
                                        value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Download Btn */}
                            <div className="pt-2 border-t border-vault-700">
                                <button
                                    type="button"
                                    onClick={handleManualDownload}
                                    disabled={isDownloading}
                                    className="w-full md:w-auto bg-green-700/20 hover:bg-green-700/40 border border-green-700/50 text-green-400 font-bold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isDownloading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            {getSafeText('checkout_download_generating', 'Generating...')}
                                        </>
                                    ) : (
                                        <>
                                            <FileSpreadsheet size={18} className="group-hover:scale-110 transition-transform" />
                                            {getSafeText('checkout_download_btn', 'Download Quote (.xlsx)')}
                                        </>
                                    )}
                                </button>
                                <p className="text-[10px] text-gray-500 mt-2">
                                    {getSafeText('checkout_download_hint', '* Downloads a copy of your cart and details without submitting the order.')}
                                </p>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white text-vault-900 rounded-2xl shadow-2xl overflow-hidden sticky top-24">
                        <div className="bg-vault-900 p-4 text-center">
                             <div className="flex items-center justify-center gap-2 text-white font-black text-xl">
                                <Receipt size={20} /> {t('checkout_summary')}
                             </div>
                        </div>
                        <div className="p-6 bg-gray-50 relative">
                            <div className="absolute top-0 left-0 w-full h-2 bg-[linear-gradient(135deg,transparent_50%,#f9fafb_50%),linear-gradient(45deg,#f9fafb_50%,transparent_50%)] bg-[length:10px_10px] -mt-1"></div>

                            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar-light pr-2">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-start text-sm border-b border-gray-200 pb-3 last:border-0">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="font-bold text-gray-900 flex-shrink-0">{item.cartQuantity}x</div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-gray-800 leading-tight force-wrap">{item.title}</div>
                                            </div>
                                        </div>
                                        <span className="font-mono font-bold text-gray-700 flex-shrink-0 ml-2">{t('currencySign')} {(item.price * item.cartQuantity).toFixed(2)} {t('currency')}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t-2 border-gray-900 pt-4 mt-4">
                                <div className="flex justify-between items-end">
                                    <span className="font-black text-2xl text-gray-900">{t('checkout_total')}</span>
                                    <span className="font-black text-3xl text-vault-secondary font-mono">{total.toFixed(2)} {t('currency')}</span>
                                </div>
                            </div>

                            {isAdmin ? (
                                <div className="mt-8 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2">
                                    <ShieldAlert size={18}/> {t('checkout_admin_error')}
                                </div>
                            ) : isCheckoutBlocked ? (
                                <button disabled className="w-full bg-gray-400 text-white font-bold py-4 rounded-xl cursor-not-allowed mt-8 flex items-center justify-center gap-2 opacity-70">
                                    <Lock size={16} /> {t('cart_guest_disabled')}
                                </button>
                            ) : (
                                <button form="checkout-form" className="w-full bg-vault-900 text-white font-bold py-4 rounded-xl shadow-xl hover:bg-black transition mt-8 flex items-center justify-center gap-2">
                                    <Lock size={16} /> {t('checkout_btn_confirm')}
                                </button>
                            )}
                            <div className="text-center mt-4">
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{t('checkout_secure')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
