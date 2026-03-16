
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum OrderStatus {
  ORDERED = 'ORDERED',
  PROCESSING = 'PROCESSING',
  RECEIVED = 'RECEIVED'
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  enabled: boolean;
  phone?: string;
}

export interface Category {
  id: number;
  type: string; // e.g., "GENRE", "PLATFORM"
  name: string; // e.g., "RPG", "PC", "PS5"
  isVisible: boolean; // Controls sidebar visibility
}

export interface Game {
  id: number;
  title: string;
  description: string;
  price: number;
  quantity: number;
  images: string[];
  categories: Category[];
  isArchived: boolean;
}

export interface CartItem extends Game {
  cartQuantity: number;
}

export interface OrderItem {
  gameId: number;
  gameTitle: string;
  quantity: number;
  priceAtPurchase: number;
  imageUrl: string;
}

export interface Order {
  id: number;
  userId?: number; // Optional if guest
  userDetails?: User;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  note?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  date: string;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  username: string;
  action: string; // e.g., "CREATE_GAME", "UPDATE_USER"
  details: string;
  entityId?: string;
}

export interface FilterState {
  search: string;
  categories: number[]; 
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  maxStock?: number;
  availability?: 'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK';
  sortBy?: 'id' | 'price' | 'title';
  sortDir?: 'asc' | 'desc';
  archived?: boolean;
}

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  last: boolean;
}