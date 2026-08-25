export type UserRole = 'CLIENT' | 'SELLER' | 'SUPER_ADMIN';
export type PlanCode = 'FREE' | 'PRO' | 'BUSINESS';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PaymentMode = 'MANUAL' | 'GATEWAY';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  code: PlanCode;
  name: string;
  description: string | null;
  price_usd: number;
  duration_days: number;
  max_products: number | null;
  max_stores: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  whatsapp_number: string | null;
  is_active: boolean;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  images: string[];
  is_available: boolean;
  stock: number;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  store?: { name?: string | null } | null;
}

export interface Report {
  id: string;
  reporter_id: string | null;
  target_type: string;
  target_id: string;
  reason: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  seller_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan | null;
}

export interface Payment {
  id: string;
  seller_id: string;
  subscription_id: string | null;
  plan_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  mode: PaymentMode;
  proof_image_url: string | null;
  reference: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan | null;
  seller?: Profile | null;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  store_id: string;
  customer_name: string | null;
  customer_phone: string;
  customer_email: string | null;
  address: string | null;
  status: OrderStatus;
  total: number;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  currency: string;
  product?: Product | null;
}

export interface CartItem {
  id: string;
  profile_id: string | null;
  store_id: string;
  product_id: string;
  quantity: number;
  product?: Product | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PlatformSettings {
  id: number;
  trial_duration_days: number;
  trial_alert_days: number;
  created_at: string;
  updated_at: string;
}

export interface StatusPost {
  id: string;
  store_id: string;
  product_id: string | null;
  product_ids: string[];
  slug: string;
  cover_image_url: string | null;
  image_url: string | null;
  caption: string | null;
  store_link: string;
  views: number;
  created_at: string;
}
