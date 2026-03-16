import React, { useState, useEffect } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './routeTree';
import { GameVaultProvider } from './context/GameVaultContext';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { ToastEvent } from './constants';

// --- TOAST CONTAINER ---
export const ToastContainer = () => {
    const [toasts, setToasts] = useState<{id: string, message: string, type: string}[]>([]);

    useEffect(() => {
        const handleToast = (e: Event) => {
            const detail = (e as CustomEvent<ToastEvent>).detail;
            const id = Math.random().toString(36).substring(2, 9);
            setToasts(prev => [...prev, { id, ...detail }]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 3000);
        };
        window.addEventListener('gamevault-toast', handleToast);
        return () => window.removeEventListener('gamevault-toast', handleToast);
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border animate-slideIn ${t.type === 'success' ? 'bg-vault-900 border-green-500/50 text-green-400' : t.type === 'error' ? 'bg-vault-900 border-red-500/50 text-red-400' : 'bg-vault-900 border-blue-500/50 text-blue-400'}`}>
                    {t.type === 'success' && <CheckCircle size={18} />}
                    {t.type === 'error' && <AlertCircle size={18} />}
                    {t.type === 'info' && <Info size={18} />}
                    <span className="text-sm font-bold text-white">{t.message}</span>
                </div>
            ))}
        </div>
    );
};

const App: React.FC = () => {
  return (
      <GameVaultProvider>
          <RouterProvider router={router} />
      </GameVaultProvider>
  );
};

export default App;
