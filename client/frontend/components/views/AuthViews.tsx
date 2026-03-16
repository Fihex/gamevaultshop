import React, { useState } from 'react';
import { User } from '../../types';
import { BackendService } from '../../services/backendService';
import { Gamepad2, User as UserIcon, Key, ArrowLeft, Mail, Lock, Loader } from 'lucide-react';
import { useLanguage } from '../../config/language';
import { Link, useNavigate } from '@tanstack/react-router';

export const LoginView = ({ setView, setUser, enableRegistration }: { setView: (v: any) => void, setUser: (u: User) => void, enableRegistration: boolean }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        const loggedUser = await BackendService.login(username, password);
        if (loggedUser) {
            setUser(loggedUser);
            navigate({ to: '/' });
        } else {
            alert(t('auth_login_fail'));
        }
    };

    return (
        // Added w-full here
        <div className="w-full flex items-center justify-center min-h-screen bg-vault-950 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-vault-accent/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-vault-secondary/10 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-md bg-vault-900 border border-vault-700 p-8 rounded-2xl shadow-2xl relative z-10 animate-fadeIn">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-vault-accent rounded-lg mx-auto flex items-center justify-center mb-4 shadow-lg shadow-vault-accent/20">
                        <Gamepad2 className="text-white" size={28}/>
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">{t('auth_welcome_back')}</h2>
                    <p className="text-gray-400 text-sm">{t('auth_sign_in_desc')}</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">{t('auth_label_username')}</label>
                        <div className="relative group">
                            <UserIcon size={18} className="absolute left-3.5 top-3.5 text-gray-500 group-focus-within:text-vault-accent transition"/>
                            <input name="username" required className="w-full bg-vault-800 border border-vault-600 rounded-xl py-3 pl-10 pr-4 text-white focus:border-vault-accent focus:ring-1 focus:ring-vault-accent outline-none transition" placeholder={t('auth_ph_username')} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">{t('auth_label_password')}</label>
                        <div className="relative group">
                            <Key size={18} className="absolute left-3.5 top-3.5 text-gray-500 group-focus-within:text-vault-accent transition"/>
                            <input name="password" type="password" required className="w-full bg-vault-800 border border-vault-600 rounded-xl py-3 pl-10 pr-4 text-white focus:border-vault-accent focus:ring-1 focus:ring-vault-accent outline-none transition" placeholder="••••••••" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                            <input type="checkbox" className="rounded border-vault-600 bg-vault-800 text-vault-accent focus:ring-vault-accent"/>
                            <span>{t('auth_remember_me')}</span>
                        </label>
                        <Link to="/forgot-password" className="text-vault-accent font-bold hover:underline">
                            {t('auth_forgot_pass')}
                        </Link>
                    </div>

                    <button type="submit" className="w-full bg-vault-accent hover:bg-vault-accentHover text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-vault-accent/20 flex items-center justify-center gap-2 transform active:scale-95">
                        {t('auth_btn_signin')} <ArrowLeft className="rotate-180" size={18}/>
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-400">
                    {enableRegistration ? (
                        <>
                            {t('auth_no_account')}{' '}
                            <Link to="/register" className="text-white font-bold hover:underline">
                                {t('auth_create_account')}
                            </Link>
                        </>
                    ) : (
                        <span className="text-gray-500">{t('auth_reg_closed')}</span>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-vault-800 text-center">
                    <Link to="/" className="text-gray-500 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition">
                        <ArrowLeft size={12}/> {t('auth_back_store')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export const RegisterView = ({ setView, enableRegistration }: { setView: (v: any) => void, enableRegistration: boolean }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!enableRegistration) return;

        const formData = new FormData(e.target as HTMLFormElement);
        const username = formData.get('username') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        const result = await BackendService.register(username, email, password);
        if (result.success) {
            alert(t('auth_reg_success'));
            navigate({ to: '/login' });
        } else {
          alert(`${t('auth_reg_fail')}: ${result.message || 'Unknown error'}`);
        }
    };

    if (!enableRegistration) {
        return (
            // Added w-full here
            <div className="w-full flex items-center justify-center min-h-screen bg-vault-950 relative overflow-hidden">
                <div className="w-full max-w-md bg-vault-900 border border-vault-700 p-8 rounded-2xl shadow-2xl text-center">
                     <h2 className="text-2xl font-black text-white mb-4">{t('auth_reg_closed_title')}</h2>
                     <p className="text-gray-400 mb-6">{t('auth_reg_closed_desc')}</p>
                     <Link to="/login" className="text-vault-accent font-bold hover:underline">{t('auth_back_login')}</Link>
                </div>
            </div>
        );
    }

    return (
        // Added w-full here
        <div className="w-full flex items-center justify-center min-h-screen bg-vault-950 relative overflow-hidden">
            <div className="w-full max-w-md bg-vault-900 border border-vault-700 p-8 rounded-2xl shadow-2xl relative z-10 animate-fadeIn">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-white mb-2">{t('auth_create_title')}</h2>
                    <p className="text-gray-400 text-sm">{t('auth_create_desc')}</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">{t('auth_label_username')}</label>
                        <div className="relative group">
                            <UserIcon size={18} className="absolute left-3.5 top-3.5 text-gray-500 group-focus-within:text-vault-secondary transition"/>
                            <input name="username" required className="w-full bg-vault-800 border border-vault-600 rounded-xl py-3 pl-10 pr-4 text-white focus:border-vault-secondary focus:ring-1 focus:ring-vault-secondary outline-none transition" placeholder={t('auth_ph_choose_user')} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">{t('auth_label_email')}</label>
                        <div className="relative group">
                            <Mail size={18} className="absolute left-3.5 top-3.5 text-gray-500 group-focus-within:text-vault-secondary transition"/>
                            <input name="email" type="email" required className="w-full bg-vault-800 border border-vault-600 rounded-xl py-3 pl-10 pr-4 text-white focus:border-vault-secondary focus:ring-1 focus:ring-vault-secondary outline-none transition" placeholder={t('auth_ph_email')} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">{t('auth_label_password')}</label>
                        <div className="relative group">
                            <Key size={18} className="absolute left-3.5 top-3.5 text-gray-500 group-focus-within:text-vault-secondary transition"/>
                            <input name="password" type="password" required className="w-full bg-vault-800 border border-vault-600 rounded-xl py-3 pl-10 pr-4 text-white focus:border-vault-secondary focus:ring-1 focus:ring-vault-secondary outline-none transition" placeholder="••••••••" />
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-vault-secondary text-vault-900 font-bold py-3.5 rounded-xl transition shadow-lg shadow-vault-secondary/20 hover:bg-emerald-400 transform active:scale-95">
                      {t('auth_btn_create')}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-400">
                    {t('auth_have_account')}{' '}
                    <Link to="/login" className="text-white font-bold hover:underline">
                        {t('auth_btn_signin')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export const ForgotPasswordView = ({ setView }: { setView: (v: any) => void }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPass, setNewPass] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const ok = await BackendService.requestPasswordReset(email);
        setIsLoading(false);
        if(ok) {
          alert(t('auth_alert_token_sent'));
            setStep(2);
        } else {
          alert(t('auth_alert_send_error'));
        }
    };

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const ok = await BackendService.confirmPasswordReset(token, newPass);
        setIsLoading(false);
        if(ok) {
            alert(t('auth_alert_reset_success'));
            navigate({ to: '/login' });
        } else {
            alert(t('auth_alert_reset_fail'));
        }
    };

    return (
        // Added w-full here
        <div className="w-full flex items-center justify-center min-h-screen bg-vault-950">
            <div className="w-full max-w-md bg-vault-900 border border-vault-700 p-8 rounded-2xl shadow-2xl animate-fadeIn">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-gray-800 rounded-full mx-auto flex items-center justify-center mb-4">
                        <Lock className="text-gray-400" size={24}/>
                    </div>
                    <h2 className="text-xl font-black text-white mb-2">{step === 1 ? t('auth_reset_title') : t('auth_new_pass_title')}</h2>
                    <p className="text-gray-400 text-sm">
                        {step === 1 ? t('auth_reset_desc') : t('auth_new_pass_desc')}
                    </p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleRequest} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">{t('auth_label_email_addr')}</label>
                            <input
                                type="email" required
                                className="w-full bg-vault-800 border border-vault-600 rounded-xl py-3 px-4 text-white focus:border-white outline-none transition"
                                placeholder={t('auth_ph_email')}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-white text-black font-bold py-3.5 rounded-xl transition hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2">
                            {isLoading ? <Loader className="animate-spin" size={18}/> : t('auth_btn_send_link')}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleConfirm} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">{t('auth_label_token')}</label>
                            <input
                                type="text" required
                                className="w-full bg-vault-800 border border-vault-600 rounded-xl py-3 px-4 text-white focus:border-white outline-none transition font-mono text-center tracking-widest"
                                placeholder="1234"
                                value={token}
                                onChange={e => setToken(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">{t('auth_label_new_pass')}</label>
                            <input
                                type="password" required
                                className="w-full bg-vault-800 border border-vault-600 rounded-xl py-3 px-4 text-white focus:border-white outline-none transition"
                                placeholder="••••••••"
                                value={newPass}
                                onChange={e => setNewPass(e.target.value)}
                            />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-vault-secondary text-vault-900 font-bold py-3.5 rounded-xl transition hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center gap-2">
                            {isLoading ? <Loader className="animate-spin" size={18}/> : t('auth_btn_change_pass')}
                        </button>
                    </form>
                )}

                <Link to="/login" className="w-full mt-4 text-gray-500 hover:text-white text-sm font-bold block text-center">
                    {t('auth_back_login')}
                </Link>
            </div>
        </div>
    );
};
