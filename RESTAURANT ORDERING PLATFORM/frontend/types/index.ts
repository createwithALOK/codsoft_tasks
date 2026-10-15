export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'KITCHEN' | 'ADMIN';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  category?: Category;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  isVeg: boolean;
  spiceLevel: number | string;
  preparationTime: number;
}

export interface Table {
  id: string;
  tableNumber: number;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  location: string;
}

export interface Reservation {
  id: string;
  userId: string;
  tableId: string;
  table?: Table;
  date: string;
  timeSlot: string;
  partySize: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  specialRequests: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem?: MenuItem;
  quantity: number;
  unitPrice: number;
  notes: string;
}

export interface Order {
  id: string;
  userId: string;
  user?: User;
  tableId?: string | null;
  table?: Table;
  orderNumber: string;
  status: 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  deliveryAddress?: string | null;
  createdAt: string;
  orderItems?: OrderItem[];
}

export interface Payment {
  id: string;
  orderId: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
