export type ProductStatus = 'LIVE' | 'UPCOMING' | 'OUT_OF_STOCK' | 'INACTIVE';
export type VariantStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PACKAGING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface Variant {
  variantId: string;
  size: string; // e.g. "250 ML", "500 ML", "1 Litre", "5 Litre"
  mrp: number; // e.g. 60
  sellingPrice: number; // e.g. 49
  offer: string; // e.g. "₹11 OFF (18%)"
  stockQuantity: number; // e.g. 20
  soldQuantity: number; // e.g. 0
  status: VariantStatus;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  category: string;
  description: string;
  features: string[];
  image: string; // Persistent uploaded photo URL or high-res graphic data URI
  status: ProductStatus;
  variants: Variant[];
  createdAt: string;
  updatedAt: string;
}

export type OrderItemStatus = 'AVAILABLE' | 'PROCESSING' | 'PACKAGING' | 'OUT_OF_STOCK' | 'DELIVERED';

export interface OrderItem {
  productId: string;
  productName: string;
  variantId: string;
  size: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  subtotal: number;
  status?: OrderItemStatus;
}

export interface OrderTrackingHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface OrderTracking {
  status: OrderStatus;
  expectedDelivery: string; // e.g. "4–5 Days"
  updatedAt: string;
  history: OrderTrackingHistoryItem[];
}

export interface Order {
  id: string; // CLZ-YYYYMMDD-XXXX
  customerId?: string; // Unique verified customer ID (e.g. CUST-9876543210)
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes?: string;
  items: OrderItem[];
  grandTotal: number;
  status: OrderStatus;
  tracking?: OrderTracking;
  paymentStatus?: 'PENDING' | 'PAID' | 'VERIFIED';
  sourceUrl?: string; // customer ref if any
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  packagingAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  paidAt?: string;
  deliveredRevenue?: number;
  customRevenue?: number | null;
  isRevenueCustomized?: boolean;
  finalRevenue?: number;
  revenueCounted?: boolean;
  revenueProcessedAt?: string;
  revenueContribution?: number;
}

export interface CustomerProfile {
  customerId: string;
  name: string;
  verifiedMobile: string;
  verifiedMobileNumber?: string;
  phoneVerified?: boolean;
  address?: string;
  registeredAt: string;
  lastLogin: string;
  createdAt?: string;
  updatedAt?: string;
  referralSource?: string;
  passwordHash?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  deliveredOrders?: number;
  pendingOrders?: number;
  deliveredRevenue?: number;
  totalSpent: number;
  verified: boolean;
  lastOrderDate: string;
  sourceUrl?: string;
}

export interface StockAuditEntry {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  size: string;
  previousStock: number;
  newStock: number;
  quantityChanged: number;
  reason: string;
  orderId?: string;
  timestamp: string;
  actor: 'OWNER' | 'SYSTEM' | 'ORDER';
}

export interface RevenueAuditEntry {
  id: string;
  orderId?: string;
  amount: number;
  type: 'AUTOMATIC_DELIVERED' | 'MANUAL_ADJUSTMENT' | 'MANUAL_SYNC';
  previousTotal: number;
  newTotal: number;
  reason: string;
  timestamp: string;
  actor: 'OWNER' | 'SYSTEM';
}

export interface AuditLogEntry {
  id: string;
  action: string;
  details: string;
  orderId?: string;
  customerId?: string;
  timestamp: string;
  actor: 'OWNER' | 'CUSTOMER' | 'SYSTEM';
}

export interface RevenueTransaction {
  id: string; // REV-orderId
  orderId: string;
  customerName: string;
  customerPhone: string;
  orderTotal: number;
  revenueAmount: number;
  status: OrderStatus;
  revenueCounted: boolean;
  deliveredAt?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  liveProducts: number;
  upcomingProducts: number;
  outOfStockProducts: number;
  totalStock: number;
  totalOrders: number;
  pendingOrders: number;
  acceptedOrders: number;
  packagingOrders: number;
  outForDeliveryOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalSoldQuantity: number;
  totalSales: number;
  calculatedSales: number;
  customRevenue?: number | null;
  isCustomRevenue: boolean;
  revenueMode: 'manual' | 'orders';
  totalCustomers: number;
  verifiedCustomers: number;
}

export interface StoreSettings {
  brandName: string;
  tagline: string;
  heroTitle?: string;
  heroSubtitle?: string;
  customPublicUrl?: string;
  activeTunnelUrl?: string;
  activePublicUrl?: string;
  updatedAt?: string;
}

export interface CustomerAuthSession {
  token: string;
  customer: CustomerProfile;
}

