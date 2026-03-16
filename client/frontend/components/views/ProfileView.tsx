import React from 'react';
import { User } from '../../types';
import { BackendService } from '../../services/backendService';
import { ArrowLeft, Camera, Save } from 'lucide-react';
import { useLanguage } from '../../config/language';
import { Link } from '@tanstack/react-router'; // <--- IMPORT THIS

// Helper
const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : '??';
};

export const ProfileView = ({ user, setUser, setView }: { user: User, setUser: (u: User) => void, setView: (v: any) => void }) => {
  const { t } = useLanguage();

  const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        const username = fd.get('username') as string;
        const email = fd.get('email') as string;
        const phone = fd.get('phone') as string;
        const newPassword = fd.get('newPassword') as string;

        const updatedUser = await BackendService.updateUserProfile(user.id, {
            username, email, phone, newPassword: newPassword || undefined
        });
        if (updatedUser) {
            setUser({...updatedUser});
            alert(t('profile_success'));
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-fadeIn pb-20">
            {/* Back Button -> Converted to Link */}
            <Link
                to="/"
                className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition w-fit"
            >
              <ArrowLeft size={20}/> {t('back_store')}
            </Link>

            <h2 className="text-3xl font-black text-white mb-8 border-b border-vault-700 pb-4">{t('account_settings')}</h2>

            <form onSubmit={handleProfileUpdate} className="bg-vault-900 border border-vault-700 rounded-xl p-8 space-y-8 shadow-2xl">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-vault-800 rounded-full flex items-center justify-center text-2xl font-bold text-gray-500 border-2 border-vault-700 relative group cursor-pointer">
                        {getInitials(user.username)}
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <Camera size={20} className="text-white"/>
                        </div>
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-2xl font-bold text-white force-wrap">{user.username}</h3>
                        <p className="text-gray-400 force-wrap">{user.email}</p>
                        <span className="inline-block mt-2 text-[10px] font-bold bg-vault-800 text-vault-accent px-2 py-1 rounded border border-vault-700">{user.role}</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-vault-800 pb-2">{t('personal_info')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">{t('label_username')}</label>
                            <input name="username" defaultValue={user.username} className="w-full bg-vault-800 border border-vault-700 rounded-lg p-3 text-white focus:border-vault-accent outline-none transition"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">{t('label_email')}</label>
                            <input name="email" type="email" defaultValue={user.email} className="w-full bg-vault-800 border border-vault-700 rounded-lg p-3 text-white focus:border-vault-accent outline-none transition"/>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-400 mb-2">{t('label_phone')}</label>
                            <input name="phone" defaultValue={user.phone} className="w-full bg-vault-800 border border-vault-700 rounded-lg p-3 text-white focus:border-vault-accent outline-none transition" placeholder="+1 (555) 000-0000"/>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-vault-800 pb-2">{t('section_security')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">{t('label_new_pass')}</label>
                            <input name="newPassword" type="password" className="w-full bg-vault-800 border border-vault-700 rounded-lg p-3 text-white focus:border-vault-accent outline-none transition" placeholder={t('ph_new_pass')}/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">{t('label_confirm_pass')}</label>
                            <input type="password" className="w-full bg-vault-800 border border-vault-700 rounded-lg p-3 text-white focus:border-vault-accent outline-none transition" placeholder={t('ph_confirm_pass')}/>
                        </div>
                    </div>
                </div>

                <div className="pt-6 flex justify-end border-t border-vault-800">
                    <button type="submit" className="bg-vault-accent text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-vault-accentHover transition shadow-lg shadow-vault-accent/20 flex items-center gap-2">
                        <Save size={18}/> {t('btn_save')}
                    </button>
                </div>
            </form>
        </div>
    );
};
