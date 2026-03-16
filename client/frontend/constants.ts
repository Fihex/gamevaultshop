
import { Game, User, UserRole, Category, Order, OrderStatus, AuditLog } from './types';

// In production (Vite build), use relative path so Nginx proxies to backend. 
// In development, point to localhost:8080.
export const API_BASE_URL = (import.meta as any).env?.PROD ? '/api' : 'http://localhost:8080/api';

export const USE_MOCK_DATA = false; 

// --- TOAST NOTIFICATION SYSTEM ---
// Simple Event Bus to avoid prop drilling through the entire app
type ToastType = 'success' | 'error' | 'info';
export interface ToastEvent {
    message: string;
    type: ToastType;
}

export const toast = {
    success: (message: string) => dispatchToast(message, 'success'),
    error: (message: string) => dispatchToast(message, 'error'),
    info: (message: string) => dispatchToast(message, 'info'),
};

const dispatchToast = (message: string, type: ToastType) => {
    window.dispatchEvent(new CustomEvent('gamevault-toast', { detail: { message, type } }));
};

// --- HELPER FUNCTIONS ---

// Helper to resolve image URLs safely
export const resolveImageUrl = (url: string | undefined | null): string => {
  const PLACEHOLDER = 'https://placehold.co/600x800/1e293b/475569?text=No+Image';
  if (!url) return PLACEHOLDER;
  
  // Ensure url is string
  let cleanUrl = String(url).trim();
  if (!cleanUrl) return PLACEHOLDER;

  // 1. Handle External URLs (HTTP/HTTPS/Data)
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:')) {
      return cleanUrl;
  }

  // 2. Handle "www." or domain-like strings missing protocol
  if (cleanUrl.startsWith('www.') || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(cleanUrl)) {
      return `https://${cleanUrl}`;
  }
  
  // 3. Handle Relative API paths (e.g., /api/images/uuid.jpg)
  if (cleanUrl.startsWith('/api/')) {
      // If API_BASE_URL is relative (e.g. '/api'), we need to prepend window.origin for a full URL, 
      // or just return the relative path if it matches the current domain serving strategy.
      if (API_BASE_URL.startsWith('/')) {
          // Both are relative, safe to return as is for <img> src
          return cleanUrl;
      }

      // If API_BASE_URL is absolute (http://localhost:8080/api), we need to replace '/api' with the full base
      // OR, if the cleanUrl implies it's on the same server as API_BASE_URL:
      try {
          const apiUrl = new URL(API_BASE_URL);
          return `${apiUrl.origin}${cleanUrl}`;
      } catch (e) {
          // Fallback if API_BASE_URL is somehow invalid
          return cleanUrl;
      }
  }

  // 4. Fallback for legacy filenames (e.g. "uuid.jpg" without path)
  if (!cleanUrl.includes('/') && !cleanUrl.startsWith('http')) {
     if (API_BASE_URL.startsWith('/')) return `/api/images/${cleanUrl}`;
     try {
         const apiUrl = new URL(API_BASE_URL);
         return `${apiUrl.origin}/api/images/${cleanUrl}`;
     } catch(e) {
         return cleanUrl;
     }
  }

  return cleanUrl;
};

export const MOCK_CATEGORIES: Category[] = [
  { id: 1, type: 'PLATFORM', name: 'PlayStation 5', isVisible: true },
  { id: 2, type: 'PLATFORM', name: 'Xbox Series X', isVisible: true },
  { id: 3, type: 'PLATFORM', name: 'PC', isVisible: true },
  { id: 4, type: 'PLATFORM', name: 'Nintendo Switch', isVisible: true },
  { id: 6, type: 'GENRE', name: 'Action', isVisible: true },
  { id: 7, type: 'GENRE', name: 'RPG', isVisible: true },
  { id: 8, type: 'GENRE', name: 'Strategy', isVisible: true },
  { id: 9, type: 'GENRE', name: 'Adventure', isVisible: true },
];

// Generate 200 Mock Games
export const MOCK_GAMES: Game[] = Array.from({ length: 200 }).map((_, i) => {
  const genre = MOCK_CATEGORIES.filter(c => c.type === 'GENRE')[i % 4];
  const platform = MOCK_CATEGORIES.filter(c => c.type === 'PLATFORM')[i % 4];
  
  return {
    id: i + 1,
    title: `Cyber Legend ${i + 1}: The Awakening`,
    description: `Experience the thrill of Cyber Legend ${i + 1}. In a world dominated by neon lights and shadow corporations, you must fight for survival. Features immersive combat, a deep storyline, and next-gen graphics.`,
    price: parseFloat((19.99 + (Math.random() * 50)).toFixed(2)),
    quantity: Math.floor(Math.random() * 100),
    images: [
      `https://picsum.photos/600/800?random=${i}`,
      `https://picsum.photos/600/800?random=${i + 500}`,
      `https://picsum.photos/600/800?random=${i + 1000}`
    ],
    categories: [genre, platform],
    isArchived: false
  };
});

export const MOCK_USER: User = {
  id: 1,
  username: "admin_user",
  email: "admin@gamevault.com",
  role: UserRole.ADMIN,
  enabled: true,
  phone: "123-456-7890"
};

export const MOCK_ORDERS: Order[] = [
  {
    id: 1001,
    userId: 1,
    userDetails: MOCK_USER,
    items: [
      { gameId: 1, gameTitle: "Cyber Legend 1", quantity: 1, priceAtPurchase: 29.99, imageUrl: MOCK_GAMES[0].images[0] }
    ],
    totalAmount: 32.39, // Approx with tax
    status: OrderStatus.ORDERED,
    date: new Date().toISOString(),
    note: "Please leave at front door",
    guestPhone: "123-456-7890"
  },
  {
    id: 1002,
    guestName: "Guest Gamer",
    guestEmail: "guest@example.com",
    guestPhone: "555-0199",
    items: [
      { gameId: 5, gameTitle: "Cyber Legend 5", quantity: 2, priceAtPurchase: 59.99, imageUrl: MOCK_GAMES[4].images[0] }
    ],
    totalAmount: 129.58,
    status: OrderStatus.PROCESSING,
    date: new Date(Date.now() - 86400000).toISOString(),
    note: "Gift wrap please"
  }
];

export const MOCK_AUDIT_LOGS: AuditLog[] = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  timestamp: new Date(Date.now() - i * 3600000).toISOString(),
  username: i % 3 === 0 ? 'admin_user' : 'system',
  action: i % 2 === 0 ? 'UPDATE_GAME' : 'LOGIN',
  details: i % 2 === 0 ? `Updated price for game #${100 + i}` : 'User logged in successfully',
  entityId: i % 2 === 0 ? String(100 + i) : undefined
}));
