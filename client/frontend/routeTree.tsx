import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import {
    createRootRoute,
    createRoute,
    createRouter,
    Outlet,
    useNavigate,
    useLocation
} from '@tanstack/react-router';
import { useGameVault } from './context/GameVaultContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { CartDrawer } from './components/layout/CartDrawer';
import { StoreView } from './components/views/StoreView';
import { LoginView, RegisterView, ForgotPasswordView } from './components/views/AuthViews';
import { ProfileView } from './components/views/ProfileView';
import { OrdersView } from './components/views/OrdersView';
import { CheckoutView } from './components/views/CheckoutView';
import { AboutView } from './components/views/AboutView';
import { AdminLayout } from './components/layout/AdminLayout';
import { InventoryManager } from './components/admin/InventoryManager';
import { UsersManager } from './components/admin/UsersManager';
import { OrdersManager } from './components/admin/OrdersManager';
import { FiltersManager } from './components/admin/FiltersManager';
import { AuditManager } from './components/admin/AuditManager';
import { ProductDetailsView } from './components/views/ProductDetailsView';
import { NotFoundView } from './components/views/NotFoundView';
import { UserRole, Game } from './types';
import { ToastContainer } from './App';
import { BackendService } from './services/backendService';

// --- ROOT LAYOUT ---
const RootComponent = () => {
    const {
        isCartOpen, setIsCartOpen, cart, user, setFilters, logout, filters,
        isSidebarOpen, setIsSidebarOpen,
        setCart, updateCartQuantity, handleCartInputChange, removeFromCart
    } = useGameVault();

    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');
    const setViewAdapter = (view: any) => {};

    return (
        <div className="flex flex-col min-h-screen bg-vault-950 text-white font-sans selection:bg-vault-accent selection:text-white">
            <ToastContainer />

            {!isAdminRoute && (
                <div className="sticky top-0 z-[100] w-full">
                    <Navbar
                        view="ROUTER"
                        setView={setViewAdapter}
                        setIsSidebarOpen={setIsSidebarOpen}
                        isSidebarOpen={isSidebarOpen}
                        setIsCartOpen={setIsCartOpen}
                        cart={cart}
                        user={user}
                        setFilters={setFilters}
                        logout={logout}
                        filters={filters}
                    />
                </div>
            )}

            {/* items-start ensures Sidebar and Store content align correctly at the top */}
            <div className="flex flex-1 relative items-start">
                <Outlet />
            </div>

            <CartDrawer
                cart={cart} setCart={setCart}
                isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen}
                user={user} setView={setViewAdapter}
                updateCartQuantity={updateCartQuantity}
                handleCartInputChange={handleCartInputChange}
                removeFromCart={removeFromCart}
                games={[]}
            />
        </div>
    );
};

export const rootRoute = createRootRoute({
    component: RootComponent,
    notFoundComponent: () => <div className="w-full"><NotFoundView /></div>,
});

// --- STORE (INDEX) ROUTE ---
const StoreRouteContainer = () => {
    const {
        isSidebarOpen, setIsSidebarOpen, groupOrder, filters, setFilters, categories, toggleCategory, sortConfig,
        cart, addToCart, updateCartQuantity, mainCategoryGroup,
        storeState, setStoreState
    } = useGameVault();

    const navigate = useNavigate();
    const observer = useRef<IntersectionObserver | null>(null);
    const prevFiltersRef = useRef(filters);

    // 1. Restore Scroll Position on Mount
    useLayoutEffect(() => {
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }

        // Restore scroll only if we have games and a position saved
        if (storeState.games.length > 0 && storeState.scrollPos > 0) {
            window.scrollTo({ top: storeState.scrollPos, behavior: 'instant' });
        } else {
            // Only trigger initial load if we have NO data
            if (storeState.games.length === 0) {
                setStoreState(prev => ({ ...prev, loading: true }));
            }
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, []);

    // 2. EXPLICIT SAVE SCROLL (Passed to StoreView -> GameCard)
    // This runs immediately when a user clicks a product card, ensuring exact capture.
    const handleSaveScroll = useCallback(() => {
        setStoreState(prev => ({ ...prev, scrollPos: window.scrollY }));
    }, [setStoreState]);

    // 3. Fallback: Auto-Save Scroll Position on Unmount
    useEffect(() => {
        return () => {
            // Only save if we are not at 0 (prevents overwriting valid scroll with 0 during rapid transitions)
            if (window.scrollY > 0) {
                setStoreState(prev => ({ ...prev, scrollPos: window.scrollY }));
            }
        };
    }, [setStoreState]);

    // 4. Infinite Scroll Observer
    const lastGameRef = useCallback((node: HTMLDivElement) => {
        if (storeState.loading || !storeState.hasMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                // Trigger loading for next page
                setStoreState(prev => ({ ...prev, page: prev.page + 1, loading: true }));
            }
        });
        if (node) observer.current.observe(node);
    }, [storeState.loading, storeState.hasMore, setStoreState]);

    // 5. Handle Filter Changes
    useEffect(() => {
        const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(filters);
        if (filtersChanged) {
            // Force reset and trigger load
            setStoreState(prev => ({
                ...prev,
                page: 0,
                hasMore: true,
                games: [],
                loading: true,
                scrollPos: 0
            }));
            window.scrollTo(0, 0);
            prevFiltersRef.current = filters;
        }
    }, [filters, setStoreState]);

    // 6. Data Fetching Logic
    useEffect(() => {
        if (!storeState.loading) return;

        let active = true;
        const loadGames = async () => {
            try {
                const result = await BackendService.getGames(storeState.page, 12, filters);
                if (active) {
                    setStoreState(prev => {
                        let newGames = result.content;
                        if (prev.page > 0) {
                            const currentGames = prev.games;
                            const existingIds = new Set(currentGames.map(g => g.id));
                            const uniqueNew = result.content.filter(g => !existingIds.has(g.id));
                            newGames = [...currentGames, ...uniqueNew];
                        }

                        return {
                            ...prev,
                            games: newGames,
                            totalGames: result.totalElements,
                            hasMore: !result.last,
                            loading: false
                        };
                    });
                }
            } catch(e) {
                console.error(e);
                setStoreState(prev => ({ ...prev, loading: false }));
            }
        };

        loadGames();
        return () => { active = false; };
    }, [storeState.loading, storeState.page, filters, setStoreState]);

    return (
        <>
             <Sidebar
                isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
                groupOrder={groupOrder} filters={filters} setFilters={setFilters}
                categories={categories} toggleCategory={toggleCategory}
                sortConfig={sortConfig}
            />
            <main className="flex-1 w-full p-4 md:p-8 min-h-0">
                <StoreView
                    games={storeState.games}
                    totalGames={storeState.totalGames}
                    loading={storeState.loading}
                    hasMore={storeState.hasMore}
                    lastGameRef={lastGameRef}
                    cart={cart}
                    addToCart={addToCart}
                    updateCartQuantity={updateCartQuantity}
                    viewProduct={() => {}}
                    mainCategoryGroup={mainCategoryGroup}
                    filters={filters}
                    setFilters={setFilters}
                    onSaveScroll={handleSaveScroll} // <--- KEY FIX: Passing the handler
                />
            </main>
        </>
    );
}

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: StoreRouteContainer });

// --- AUTH ---
const LoginRoute = createRoute({
    getParentRoute: () => rootRoute, path: '/login',
    component: () => {
        const { setUser, systemConfig } = useGameVault();
        const navigate = useNavigate();
        return <LoginView setView={() => navigate({ to: '/register' })} setUser={(u) => { setUser(u); navigate({ to: '/' }) }} enableRegistration={systemConfig.enableRegistration} />
    }
});
const RegisterRoute = createRoute({
    getParentRoute: () => rootRoute, path: '/register',
    component: () => {
        const { systemConfig } = useGameVault();
        const navigate = useNavigate();
        return <RegisterView setView={() => navigate({ to: '/login' })} enableRegistration={systemConfig.enableRegistration} />
    }
});
const ForgotPasswordRoute = createRoute({
    getParentRoute: () => rootRoute, path: '/forgot-password',
    component: () => {
        const navigate = useNavigate();
        return <ForgotPasswordView setView={() => navigate({ to: '/login' })} />
    }
});

// --- PRODUCT DETAILS ---
const ProductDetailsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/product/$productId',
    component: () => {
        const { productId } = ProductDetailsRoute.useParams();
        const { mainCategoryGroup, addToCart, cart, updateCartQuantity } = useGameVault();
        const [game, setGame] = useState<Game | null>(null);

        useLayoutEffect(() => { window.scrollTo(0, 0); }, []);
        useEffect(() => { BackendService.getGameById(Number(productId)).then(setGame); }, [productId]);

        return (
            <main className="flex-1 w-full p-4 md:p-8 min-h-0">
                <ProductDetailsView
                    game={game}
                    mainCategoryGroup={mainCategoryGroup}
                    addToCart={addToCart}
                    cart={cart}
                    updateCartQuantity={updateCartQuantity}
                />
            </main>
        );
    }
});

// --- ADMIN ---
const AdminRoute = createRoute({
    getParentRoute: () => rootRoute, path: '/admin',
    component: () => {
        const { user } = useGameVault(); const navigate = useNavigate();
        if (user?.role !== UserRole.ADMIN) { useEffect(() => { navigate({ to: '/' }); }, []); return null; }
        return <main className="flex-1 w-full p-4 md:p-8 min-h-0"><AdminLayout /></main>;
    }
});
const AdminIndexRoute = createRoute({ getParentRoute: () => AdminRoute, path: '/', component: () => { const navigate = useNavigate(); useEffect(() => { navigate({ to: '/admin/inventory', replace: true }) }, []); return null; } });
const AdminInventoryRoute = createRoute({ getParentRoute: () => AdminRoute, path: '/inventory', component: InventoryManager });
const AdminUsersRoute = createRoute({ getParentRoute: () => AdminRoute, path: '/users', component: UsersManager });
const AdminOrdersRoute = createRoute({ getParentRoute: () => AdminRoute, path: '/orders', component: OrdersManager });
const AdminFiltersRoute = createRoute({ getParentRoute: () => AdminRoute, path: '/filters', component: () => { const { loadSettings } = useGameVault(); return <FiltersManager onSettingsChange={loadSettings} /> } });
const AdminAuditRoute = createRoute({ getParentRoute: () => AdminRoute, path: '/audit', component: AuditManager });

// --- PROTECTED ROUTES ---
const ProtectedComponent = ({ children }: { children: React.ReactNode }) => {
    const { user } = useGameVault(); const navigate = useNavigate();
    useEffect(() => { if (!user) navigate({ to: '/login' }); }, [user, navigate]);
    if (!user) return null;
    return <>{children}</>;
};

const ProfileRoute = createRoute({ getParentRoute: () => rootRoute, path: '/profile', component: () => { const { user, setUser } = useGameVault(); const navigate = useNavigate(); return <ProtectedComponent><main className="flex-1 w-full p-4 md:p-8 min-h-0"><ProfileView user={user!} setUser={setUser} setView={() => navigate({ to: '/' })} /></main></ProtectedComponent> }});
const OrdersRoute = createRoute({ getParentRoute: () => rootRoute, path: '/orders', component: () => { const { user } = useGameVault(); const navigate = useNavigate(); return <ProtectedComponent><main className="flex-1 w-full p-4 md:p-8 min-h-0"><OrdersView user={user} setView={() => navigate({ to: '/' })} /></main></ProtectedComponent> }});
const CheckoutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/checkout', component: () => { const { user, cart, setCart, mainCategoryGroup, systemConfig } = useGameVault(); const navigate = useNavigate(); return <main className="flex-1 w-full p-4 md:p-8 min-h-0"><CheckoutView user={user} cart={cart} setCart={setCart} setView={(v) => v === 'ORDERS' ? navigate({ to: '/orders' }) : navigate({ to: '/' })} mainCategoryGroup={mainCategoryGroup} enableGuestCheckout={systemConfig.enableGuestCheckout} /></main> }});
const AboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: () => { const navigate = useNavigate(); return <main className="flex-1 w-full p-4 md:p-8 min-h-0"><AboutView setView={() => navigate({ to: '/' })} /></main> }});

const routeTree = rootRoute.addChildren([
    indexRoute, LoginRoute, RegisterRoute, ForgotPasswordRoute,
    ProductDetailsRoute, ProfileRoute, OrdersRoute, CheckoutRoute, AboutRoute,
    AdminRoute.addChildren([AdminIndexRoute, AdminInventoryRoute, AdminUsersRoute, AdminOrdersRoute, AdminFiltersRoute, AdminAuditRoute])
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' { interface Register { router: typeof router } }
