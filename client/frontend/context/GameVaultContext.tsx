import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, CartItem, Game, Category, FilterState } from '../types';
import { BackendService } from '../services/backendService';
import { toast } from '../constants';
import { useLanguage } from '../config/language';

interface GameVaultContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    cart: CartItem[];
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    isCartOpen: boolean;
    setIsCartOpen: (v: boolean) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (v: boolean) => void;
    categories: Category[];
    groupOrder: string[];
    mainCategoryGroup: string;
    sortConfig: Record<string, boolean>;
    systemConfig: { enableRegistration: boolean, enableGuestCheckout: boolean };
    addToCart: (game: Game) => void;
    removeFromCart: (id: number) => void;
    updateCartQuantity: (id: number, delta: number) => void;
    handleCartInputChange: (id: number, val: string) => void;
    toggleCategory: (id: number) => void;
    logout: () => void;
    loadSettings: () => Promise<void>;

    // NEW: Store Persistence State
    storeState: {
        games: Game[];
        page: number;
        hasMore: boolean;
        totalGames: number;
        scrollPos: number;
        loading: boolean;
    };
    setStoreState: React.Dispatch<React.SetStateAction<{
        games: Game[];
        page: number;
        hasMore: boolean;
        totalGames: number;
        scrollPos: number;
        loading: boolean;
    }>>;
}

const GameVaultContext = createContext<GameVaultContextType | undefined>(undefined);

export const GameVaultProvider = ({ children }: { children: React.ReactNode }) => {
    const { t } = useLanguage();

    const [user, setUser] = useState<User | null>(() => BackendService.getCurrentUser());
    const [cart, setCart] = useState<CartItem[]>(() => {
        try {
            const saved = localStorage.getItem('gamevault_cart');
            return saved ? JSON.parse(saved) : [];
        } catch(e) { return []; }
    });

    const [filters, setFilters] = useState<FilterState>({ search: '', categories: [], sortBy: 'id', sortDir: 'desc', archived: false });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Config State
    const [categories, setCategories] = useState<Category[]>([]);
    const [groupOrder, setGroupOrder] = useState<string[]>(['GENRE', 'PLATFORM']);
    const [mainCategoryGroup, setMainCategoryGroup] = useState<string>('PLATFORM');
    const [sortConfig, setSortConfig] = useState<Record<string, boolean>>({});
    const [systemConfig, setSystemConfig] = useState({ enableRegistration: true, enableGuestCheckout: true });

    // NEW: Store Persistence State
    const [storeState, setStoreState] = useState({
        games: [] as Game[],
        page: 0,
        hasMore: true,
        totalGames: 0,
        scrollPos: 0,
        loading: false
    });

    // --- EFFECTS ---
    useEffect(() => {
        const handleAuthError = () => {
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            toast.info(t('app_toast_session_expired'));
        };
        window.addEventListener('gamevault-auth-error', handleAuthError);
        return () => window.removeEventListener('gamevault-auth-error', handleAuthError);
    }, [t]);

    useEffect(() => {
        localStorage.setItem('gamevault_cart', JSON.stringify(cart));
    }, [cart]);

    const loadSettings = useCallback(async () => {
        try {
          const cats = await BackendService.getCategories();
          setCategories(cats);
          const order = await BackendService.getCategoryGroupOrder();
          const mainGroup = await BackendService.getMainCategoryGroup();
          const config = await BackendService.getCategorySortConfig();
          const sysConf = await BackendService.getSystemConfig();

          setMainCategoryGroup(mainGroup || 'PLATFORM');
          setSortConfig(config);
          setSystemConfig(sysConf);

          const allTypes = Array.from(new Set(cats.map(c => c.type)));
          let newOrder = [...order];
          if (newOrder.length === 0) newOrder = allTypes;
          else {
              allTypes.forEach(t => { if(!newOrder.includes(t)) newOrder.push(t); });
          }
          if(order.length === 0) {
               newOrder = newOrder.filter(t => t !== 'PUBLISHER');
               if(newOrder.length === 0) newOrder = ['GENRE', 'PLATFORM'];
          }
          setGroupOrder(newOrder);
        } catch (e) {}
    }, []);

    useEffect(() => { loadSettings(); }, [loadSettings]);

    // --- ACTIONS ---
    const addToCart = useCallback((game: Game) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === game.id);
            if (existing) {
                if (existing.cartQuantity >= game.quantity) {
                    toast.error(t('app_toast_only_units').replace('{qty}', game.quantity.toString()));
                    return prev;
                }
                toast.success(t('app_toast_qty_increased').replace('{title}', game.title));
                return prev.map(i => i.id === game.id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i);
            } else {
                if (game.quantity < 1) {
                    toast.error(t('app_toast_out_stock'));
                    return prev;
                }
                toast.success(t('app_toast_added_cart'));
                return [...prev, { ...game, cartQuantity: 1 }];
            }
        });
    }, [t]);

    const removeFromCart = useCallback((id: number) => {
        setCart(prev => prev.filter(i => i.id !== id));
        toast.info(t('app_toast_item_removed'));
    }, [t]);

    const updateCartQuantity = useCallback((id: number, delta: number) => {
        setCart(prev => {
            const updated = prev.map(item => {
                if (item.id === id) {
                    if (delta < 0) return { ...item, cartQuantity: item.cartQuantity + delta };
                    const maxStock = item.quantity;
                    return { ...item, cartQuantity: Math.min(item.cartQuantity + delta, maxStock) };
                }
                return item;
            });
            return updated.filter(item => item.cartQuantity > 0);
        });
    }, []);

    const handleCartInputChange = useCallback((id: number, val: string) => {
        let newQty = parseInt(val);
        if (isNaN(newQty) || val === "") {
            if (val === "") return;
            newQty = 1;
        }
        setCart(prev => prev.map(item => {
          if (item.id === id) {
              const maxStock = item.quantity;
              return { ...item, cartQuantity: newQty > maxStock ? maxStock : Math.max(1, newQty) };
          }
          return item;
        }));
    }, []);

    const toggleCategory = useCallback((id: number) => {
        setFilters(prev => {
          const exists = prev.categories.includes(id);
          return { ...prev, categories: exists ? prev.categories.filter(c => c !== id) : [...prev.categories, id] };
        });
    }, []);

    const logout = () => {
        BackendService.logout();
        setUser(null);
        toast.info(t('app_toast_logged_out'));
    };

    return (
        <GameVaultContext.Provider value={{
            user, setUser, cart, setCart, filters, setFilters,
            isCartOpen, setIsCartOpen, isSidebarOpen, setIsSidebarOpen,
            categories, groupOrder, mainCategoryGroup, sortConfig, systemConfig,
            addToCart, removeFromCart, updateCartQuantity, handleCartInputChange, toggleCategory, logout, loadSettings,
            storeState, setStoreState // Expose store state
        }}>
            {children}
        </GameVaultContext.Provider>
    );
};

export const useGameVault = () => {
    const context = useContext(GameVaultContext);
    if (!context) throw new Error("useGameVault must be used within a GameVaultProvider");
    return context;
};
