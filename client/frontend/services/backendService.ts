import { Game, User, Category, UserRole, FilterState, PageResult, Order, OrderStatus, AuditLog } from '../types';
import { API_BASE_URL, USE_MOCK_DATA, MOCK_GAMES, MOCK_CATEGORIES, MOCK_USER, MOCK_ORDERS, MOCK_AUDIT_LOGS } from '../constants';

let currentGames = [...MOCK_GAMES];
let currentCategories = [...MOCK_CATEGORIES];
let currentUsers = [MOCK_USER, { ...MOCK_USER, id: 2, username: 'guest_gamer', email: 'guest@example.com', role: UserRole.USER }];
let currentOrders = [...MOCK_ORDERS];
let currentAuditLogs = [...MOCK_AUDIT_LOGS];
let currentGroupOrder = ['GENRE', 'PLATFORM'];
let currentMainCategoryGroup = 'PLATFORM';
let currentSortConfig: Record<string, boolean> = {};
// Mock config state
let mockConfig = {
    ENABLE_REGISTRATION: 'true',
    ENABLE_GUEST_CHECKOUT: 'true'
};

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

// Helper to handle auth errors gracefully without forcing a reload loop
const handleAuthError = () => {
    console.warn("Authentication invalid or expired.");
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('gamevault-auth-error'));
};

// Helper to safely fetch paginated results without crashing on 401/403/Empty Body
const safeFetchPage = async <T>(url: string): Promise<PageResult<T>> => {
    const emptyPage = { content: [], totalElements: 0, totalPages: 0, last: true };
    try {
        const res = await fetch(url, { headers: getHeaders() });
        
        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                handleAuthError();
                return emptyPage;
            }
            console.warn(`Fetch error for ${url} (${res.status})`);
            return emptyPage;
        }

        const text = await res.text();
        // Prevent syntax error if body is empty
        return text ? JSON.parse(text) : emptyPage;
    } catch (e) {
        console.error(`Network error fetching ${url}:`, e);
        return emptyPage;
    }
};

// Helper for standard requests
const safeFetch = async <T>(url: string, options?: RequestInit): Promise<T | null> => {
    try {
        const res = await fetch(url, { ...options, headers: { ...getHeaders(), ...options?.headers } });
        if (!res.ok) {
             if (res.status === 401 || res.status === 403) {
                 handleAuthError();
                 return null;
             }
             // If bad request (e.g. validation), typically return null or handle specific errors
             // but we don't want to log out for 400s
             console.error(`Fetch failed: ${res.status} ${res.statusText}`);
             return null;
        }
        const text = await res.text();
        return text ? JSON.parse(text) : null;
    } catch(e) {
        console.error(`Request error for ${url}:`, e);
        return null;
    }
};

export const BackendService = {
  // --- CONFIGURATION ---
  getSystemConfig: async (): Promise<{ enableRegistration: boolean, enableGuestCheckout: boolean }> => {
      if (USE_MOCK_DATA) {
          return {
              enableRegistration: mockConfig.ENABLE_REGISTRATION === 'true',
              enableGuestCheckout: mockConfig.ENABLE_GUEST_CHECKOUT === 'true'
          };
      }
      try {
          const reg = await safeFetch<{value: string}>(`${API_BASE_URL}/settings/ENABLE_REGISTRATION`);
          const guest = await safeFetch<{value: string}>(`${API_BASE_URL}/settings/ENABLE_GUEST_CHECKOUT`);
          
          // Default to true if setting doesn't exist yet
          return {
              enableRegistration: reg?.value !== 'false',
              enableGuestCheckout: guest?.value !== 'false'
          };
      } catch (e) {
          return { enableRegistration: true, enableGuestCheckout: true };
      }
  },

  saveSystemConfig: async (key: 'ENABLE_REGISTRATION' | 'ENABLE_GUEST_CHECKOUT', value: boolean) => {
      if (USE_MOCK_DATA) {
          mockConfig[key] = String(value);
      } else {
          await safeFetch(`${API_BASE_URL}/settings/${key}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ value: String(value) })
          });
      }
  },

  // --- AUTH ---
  login: async (username: string, password: string): Promise<User | null> => {
      if (USE_MOCK_DATA) {
          await new Promise(r => setTimeout(r, 50)); // Reduced delay
          if (username.toLowerCase().includes('admin')) return MOCK_USER;
          return { ...MOCK_USER, role: UserRole.USER, username, id: 999 };
      }
      try {
        const res = await fetch(`${API_BASE_URL}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) return null;
        
        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
      } catch (e) {
          console.error(e);
          return null;
      }
  },

  register: async (username: string, email: string, password: string): Promise<{success: boolean, message?: string}> => {
      if (USE_MOCK_DATA) {
          await new Promise(r => setTimeout(r, 50));
          if (mockConfig.ENABLE_REGISTRATION === 'false') return { success: false, message: "Registration is currently disabled." };
          return { success: true };
      }
      try {
        const res = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        if (res.ok) return { success: true };
        const txt = await res.text();
        return { success: false, message: txt };
      } catch (e) {
          console.error(e);
          return { success: false, message: "Network error" };
      }
  },

  requestPasswordReset: async (email: string): Promise<boolean> => {
    if (USE_MOCK_DATA) {
        await new Promise(r => setTimeout(r, 500));
        return true;
    }
    try {
        const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return res.ok;
    } catch (e) {
        console.error(e);
        return false;
    }
  },

  confirmPasswordReset: async (token: string, newPassword: string): Promise<boolean> => {
    if (USE_MOCK_DATA) {
        await new Promise(r => setTimeout(r, 500));
        return token === "1234";
    }
    try {
        const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });
        return res.ok;
    } catch(e) {
        console.error(e);
        return false;
    }
  },

  logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
  },

  getCurrentUser: (): User | null => {
      try {
        const u = localStorage.getItem('user');
        return u ? JSON.parse(u) : null;
      } catch(e) {
          return null;
      }
  },

  // --- AUDIT LOGS ---
  getAuditLogs: async (page: number, size: number, search: string): Promise<PageResult<AuditLog>> => {
      if (USE_MOCK_DATA) {
          await new Promise(r => setTimeout(r, 50));
          let filtered = currentAuditLogs;
          if (search) {
              const lower = search.toLowerCase();
              filtered = filtered.filter(l => 
                  l.username.toLowerCase().includes(lower) || 
                  l.action.toLowerCase().includes(lower) ||
                  l.details.toLowerCase().includes(lower)
              );
          }
          filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          const totalElements = filtered.length;
          const totalPages = Math.ceil(totalElements / size);
          const start = page * size;
          return {
              content: filtered.slice(start, start + size),
              totalElements,
              totalPages,
              last: (page + 1) >= totalPages
          };
      }
      return safeFetchPage(`${API_BASE_URL}/audit?page=${page}&size=${size}&search=${search}`);
  },

  // --- IMAGES ---
  uploadImage: async (file: File): Promise<string | null> => {
      if (USE_MOCK_DATA) return URL.createObjectURL(file);
      const formData = new FormData();
      formData.append('file', file);
      try {
          const res = await fetch(`${API_BASE_URL}/images/upload`, {
              method: 'POST',
              headers: { ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {}) },
              body: formData
          });
          if (res.ok) {
              const data = await res.json();
              return data.url;
          }
          return null;
      } catch (e) {
          console.error("Upload failed", e);
          return null;
      }
  },

  // --- GAMES ---
  getGames: async (page: number, size: number, filters: FilterState): Promise<PageResult<Game>> => {
    if (USE_MOCK_DATA) {
      await new Promise(r => setTimeout(r, 50)); // Instant load
      let filtered = currentGames;
      
      // Filter by Archive Status
      if (filters.archived !== undefined) {
          filtered = filtered.filter(g => !!g.isArchived === filters.archived);
      } else {
          // Default to non-archived if not specified (for store view compatibility)
          filtered = filtered.filter(g => !g.isArchived);
      }

      if (filters.search) {
        const lowerSearch = filters.search.toLowerCase();
        filtered = filtered.filter(g => g.title.toLowerCase().includes(lowerSearch));
      }
      
      // LOGIC FIX: Grouped AND, Internal OR
      if (filters.categories && filters.categories.length > 0) {
        // 1. Group selected IDs by their type
        const catsByType: Record<string, number[]> = {};
        
        filters.categories.forEach(id => {
            const cat = currentCategories.find(c => c.id === id);
            if (cat) {
                if (!catsByType[cat.type]) catsByType[cat.type] = [];
                catsByType[cat.type].push(id);
            }
        });

        // 2. Filter: Game must match at least one ID in EVERY group present
        // i.e. (Game matches Platform) AND (Game matches Genre) AND (Game matches Publisher)
        Object.keys(catsByType).forEach(type => {
            const typeIds = catsByType[type];
            filtered = filtered.filter(g => 
                g.categories.some(c => typeIds.includes(c.id))
            );
        });
      }

      if (filters.minPrice !== undefined && !isNaN(filters.minPrice)) filtered = filtered.filter(g => g.price >= filters.minPrice!);
      if (filters.maxPrice !== undefined && !isNaN(filters.maxPrice)) filtered = filtered.filter(g => g.price <= filters.maxPrice!);
      if (filters.minStock !== undefined && !isNaN(filters.minStock)) filtered = filtered.filter(g => g.quantity >= filters.minStock!);
      if (filters.maxStock !== undefined && !isNaN(filters.maxStock)) filtered = filtered.filter(g => g.quantity <= filters.maxStock!);
      
      if (filters.availability === 'IN_STOCK') filtered = filtered.filter(g => g.quantity > 0);
      if (filters.availability === 'OUT_OF_STOCK') filtered = filtered.filter(g => g.quantity === 0);

      // Sorting Mock Data
      if (filters.sortBy) {
          const { sortBy, sortDir } = filters;
          const mul = sortDir === 'asc' ? 1 : -1;
          filtered.sort((a, b) => {
              if (sortBy === 'price') return (a.price - b.price) * mul;
              if (sortBy === 'title') return a.title.localeCompare(b.title) * mul;
              return (a.id - b.id) * mul;
          });
      } else {
          // Default ID DESC
          filtered.sort((a, b) => b.id - a.id);
      }

      const totalElements = filtered.length;
      const totalPages = Math.ceil(totalElements / size);
      const start = page * size;
      return { content: filtered.slice(start, start + size), totalElements, totalPages, last: (page + 1) >= totalPages };
    } else {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', size.toString());
      
      // Pass archive flag to backend
      if (filters.archived !== undefined) {
          params.append('archived', filters.archived.toString());
      } else {
          params.append('archived', 'false');
      }

      if (filters.search) params.append('search', filters.search);
      if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.minStock !== undefined) params.append('minStock', filters.minStock.toString());
      if (filters.maxStock !== undefined) params.append('maxStock', filters.maxStock.toString());
      if (filters.availability && filters.availability !== 'ALL') params.append('availability', filters.availability);
      if (filters.categories) filters.categories.forEach(id => params.append('categories', id.toString()));
      
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortDir) params.append('sortDir', filters.sortDir);

      return safeFetchPage(`${API_BASE_URL}/games?${params.toString()}`);
    }
  },

  getGameById: async (id: number): Promise<Game | undefined> => {
      if(USE_MOCK_DATA) return currentGames.find(g => g.id === id);
      const res = await safeFetch<Game>(`${API_BASE_URL}/games/${id}`);
      return res || undefined;
  },

  saveGame: async (game: Partial<Game>): Promise<Game | null> => {
    if (USE_MOCK_DATA) {
       // Update the mock data array in memory so filters work immediately
       if (game.id) {
           const idx = currentGames.findIndex(g => g.id === game.id);
           if (idx !== -1) {
               const updated = { ...currentGames[idx], ...game } as Game;
               currentGames[idx] = updated;
               return updated;
           }
       } else {
           const newId = currentGames.length > 0 ? Math.max(...currentGames.map(g => g.id)) + 1 : 1;
           const newGame = { ...game, id: newId, images: game.images || [], categories: game.categories || [], isArchived: false } as Game;
           currentGames.unshift(newGame);
           return newGame;
       }
       return null;
    }
    const method = game.id ? 'PUT' : 'POST';
    const url = game.id ? `${API_BASE_URL}/games/${game.id}` : `${API_BASE_URL}/games`;
    return safeFetch<Game>(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(game)
    });
  },

  deleteGame: async (id: number) => {
    if (USE_MOCK_DATA) {
       currentGames = currentGames.filter(g => g.id !== id);
    } else {
      await safeFetch(`${API_BASE_URL}/games/${id}`, { method: 'DELETE' });
    }
  },

  // --- USERS ---
  getUsers: async (page: number, size: number, search: string): Promise<PageResult<User>> => {
    if (USE_MOCK_DATA) {
        await new Promise(r => setTimeout(r, 50));
        let filtered = currentUsers;
        if (search) {
            const lower = search.toLowerCase();
            filtered = filtered.filter(u => u.username.toLowerCase().includes(lower) || (u.email && u.email.toLowerCase().includes(lower)));
        }
        filtered.sort((a, b) => b.id - a.id);
        const totalElements = filtered.length;
        const totalPages = Math.ceil(totalElements / size);
        const start = page * size;
        return { content: filtered.slice(start, start + size), totalElements, totalPages, last: (page + 1) >= totalPages };
    }
    return safeFetchPage(`${API_BASE_URL}/users?page=${page}&size=${size}&search=${search}`);
  },

  updateUserStatus: async (id: number, updates: Partial<User>) => {
    if (USE_MOCK_DATA) {
      currentUsers = currentUsers.map(u => u.id === id ? { ...u, ...updates } : u);
    } else {
        await safeFetch(`${API_BASE_URL}/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
    }
  },

  updateUserProfile: async (id: number, updates: Partial<User> & { password?: string, newPassword?: string }) => {
      if (USE_MOCK_DATA) {
          currentUsers = currentUsers.map(u => u.id === id ? { ...u, ...updates } : u);
          return currentUsers.find(u => u.id === id);
      }
      return safeFetch<User>(`${API_BASE_URL}/users/${id}/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
      });
  },

  // --- CATEGORIES & SETTINGS ---
  getCategories: async (): Promise<Category[]> => {
    if (USE_MOCK_DATA) {
        // Return a fresh copy to trigger re-renders if content changed but array ref didn't
        return [...currentCategories]; 
    }
    const res = await safeFetch<Category[]>(`${API_BASE_URL}/categories`);
    return res || [];
  },

  getCategoryGroupOrder: async (): Promise<string[]> => {
      if (USE_MOCK_DATA) return currentGroupOrder;
      const setting = await safeFetch<{value: string}>(`${API_BASE_URL}/settings/CATEGORY_GROUP_ORDER`);
      if (setting && setting.value) {
          try { return JSON.parse(setting.value); } catch(e) { return []; }
      }
      return [];
  },

  saveCategoryGroupOrder: async (order: string[]) => {
      if (USE_MOCK_DATA) { currentGroupOrder = order; } 
      else {
          await safeFetch(`${API_BASE_URL}/settings/CATEGORY_GROUP_ORDER`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ value: JSON.stringify(order) })
          });
      }
  },

  getCategorySortConfig: async (): Promise<Record<string, boolean>> => {
      if (USE_MOCK_DATA) return { ...currentSortConfig };
      const setting = await safeFetch<{value: string}>(`${API_BASE_URL}/settings/CATEGORY_SORT_CONFIG`);
      if (setting && setting.value) {
          try { return JSON.parse(setting.value); } catch(e) { return {}; }
      }
      return {};
  },

  saveCategorySortConfig: async (config: Record<string, boolean>) => {
      if (USE_MOCK_DATA) { 
          // IMPORTANT: Create a fresh copy to ensure references are updated
          currentSortConfig = { ...config }; 
      } else {
          await safeFetch(`${API_BASE_URL}/settings/CATEGORY_SORT_CONFIG`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ value: JSON.stringify(config) })
          });
      }
  },

  getMainCategoryGroup: async (): Promise<string> => {
      if (USE_MOCK_DATA) return currentMainCategoryGroup;
      const setting = await safeFetch<{value: string}>(`${API_BASE_URL}/settings/MAIN_CATEGORY_GROUP`);
      return (setting && setting.value) ? setting.value : 'PLATFORM';
  },

  setMainCategoryGroup: async (group: string) => {
      if (USE_MOCK_DATA) { currentMainCategoryGroup = group; } 
      else {
          await safeFetch(`${API_BASE_URL}/settings/MAIN_CATEGORY_GROUP`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ value: group })
          });
      }
  },

  saveCategory: async (cat: Partial<Category>) => {
    if (USE_MOCK_DATA) {
        if (cat.id) {
            currentCategories = currentCategories.map(c => c.id === cat.id ? { ...c, ...cat } as Category : c);
        } else {
            const newId = Math.max(0, ...currentCategories.map(c => c.id)) + 1;
            const newCat = { ...cat, id: newId } as Category;
            // Prevent duplicate name check in mock logic for safety
            if (!currentCategories.some(c => c.name.toLowerCase() === newCat.name.toLowerCase() && c.type === newCat.type)) {
                currentCategories.push(newCat);
            }
        }
    } else {
        const method = cat.id ? 'PUT' : 'POST';
        const url = cat.id ? `${API_BASE_URL}/categories/${cat.id}` : `${API_BASE_URL}/categories`;
        await safeFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cat) });
    }
  },
  
  renameCategoryType: async (oldType: string, newType: string) => {
      if (USE_MOCK_DATA) {
          // Properly immutable update for mock data to ensure reactivity
          currentCategories = currentCategories.map(c => 
              c.type === oldType ? { ...c, type: newType } : c
          );
          currentGroupOrder = currentGroupOrder.map(t => t === oldType ? newType : t);
      } else {
          await safeFetch(`${API_BASE_URL}/categories/types/${encodeURIComponent(oldType)}?newType=${encodeURIComponent(newType)}`, {
              method: 'PUT'
          });
          const order = await BackendService.getCategoryGroupOrder();
          const newOrder = order.map(t => t === oldType ? newType : t);
          await BackendService.saveCategoryGroupOrder(newOrder);
      }
  },

  deleteCategory: async (id: number) => {
    if (USE_MOCK_DATA) {
      currentCategories = currentCategories.filter(c => c.id !== id);
    } else {
        await safeFetch(`${API_BASE_URL}/categories/${id}`, { method: 'DELETE' });
    }
  },

  // --- ORDERS ---
  getOrders: async (page: number, size: number, userId?: number, search?: string, status?: OrderStatus | 'ALL'): Promise<PageResult<Order>> => {
      if(USE_MOCK_DATA) {
          await new Promise(r => setTimeout(r, 50));
          let filtered = userId ? currentOrders.filter(o => o.userId === userId) : currentOrders;
          if (status && status !== 'ALL') filtered = filtered.filter(o => o.status === status);
          if (search) {
              const lower = search.toLowerCase();
              filtered = filtered.filter(o => o.id.toString().includes(lower) || (o.guestName && o.guestName.toLowerCase().includes(lower)));
          }
          filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const totalElements = filtered.length;
          const totalPages = Math.ceil(totalElements / size);
          const start = page * size;
          return { content: filtered.slice(start, start + size), totalElements, totalPages, last: (page + 1) >= totalPages };
      }
      
      let url = `${API_BASE_URL}/orders?page=${page}&size=${size}`;
      if (userId) url = `${API_BASE_URL}/orders/user/${userId}?page=${page}&size=${size}`;
      if (search) url += `&search=${search}`;
      if (status && status !== 'ALL') url += `&status=${status}`;
      
      return safeFetchPage(url);
  },

  createOrder: async (order: Partial<Order>): Promise<{success: boolean, order?: Order, error?: string}> => {
      if(USE_MOCK_DATA) {
          if (mockConfig.ENABLE_GUEST_CHECKOUT === 'false' && !order.userId) return { success: false, error: "Guest checkout is disabled." };
          return { success: true, order: order as Order };
      }
      try {
          const res = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: { ...getHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
          });
          
          if (!res.ok) {
              // Check for disabled feature error from backend
              const text = await res.text();
              let msg = "Failed to place order.";
              try { 
                  const json = JSON.parse(text);
                  msg = json.error || msg;
              } catch(e) { msg = text || msg; }
              
              return { success: false, error: msg };
          }
          const data = await res.json();
          return { success: true, order: data };
      } catch (e) {
          return { success: false, error: "Network error" };
      }
  },

  updateOrderStatus: async (id: number, status: OrderStatus) => {
      if(USE_MOCK_DATA) {
          currentOrders = currentOrders.map(o => o.id === id ? { ...o, status } : o);
      } else {
          await safeFetch(`${API_BASE_URL}/orders/${id}/status`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: status // Spring backend expects string body for this endpoint, or we can JSONify it
          });
      }
  }
};