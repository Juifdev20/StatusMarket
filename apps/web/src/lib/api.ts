import { supabase } from './supabase';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function token() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

async function fetcher(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  const access = await token();
  if (access) headers.Authorization = `Bearer ${access}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  // Admin
  getAdminStats: () => fetcher('/api/admin/dashboard'),
  getAdminSellers: () => fetcher('/api/admin/sellers'),
  getAdminShops: () => fetcher('/api/admin/stores'),
  getAdminReports: () => fetcher('/api/admin/reports'),
  updateReport: (id: string, body: object) => fetcher(`/api/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getAdminProducts: () => fetcher('/api/admin/products'),
  updateAdminProduct: (id: string, body: object) => fetcher(`/api/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  updateShop: (id: string, body: object) => fetcher(`/api/admin/stores/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getPayments: (status?: string) => fetcher(`/api/admin/payments${status ? `?status=${status}` : ''}`),
  reviewPayment: (id: string, body: object) => fetcher(`/api/admin/payments/${id}/review`, { method: 'PATCH', body: JSON.stringify(body) }),
  getPlans: () => fetcher('/api/admin/plans'),
  updatePlan: (id: string, body: object) => fetcher(`/api/admin/plans/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getAdminSettings: () => fetcher('/api/admin/settings'),
  updateAdminSettings: (body: object) => fetcher('/api/admin/settings', { method: 'PATCH', body: JSON.stringify(body) }),

  // Shops
  getMyShops: () => fetcher('/api/shops/my'),
  createShop: (body: object) => fetcher('/api/shops', { method: 'POST', body: JSON.stringify(body) }),

  // Products
  getProducts: (storeId: string) => fetcher(`/api/products/store/${storeId}`),
  createProduct: (body: object) => fetcher('/api/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id: string, body: object) => fetcher(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteProduct: (id: string) => fetcher(`/api/products/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: (storeId: string) => fetcher(`/api/categories/store/${storeId}`),
  createCategory: (body: object) => fetcher('/api/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id: string, body: object) => fetcher(`/api/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCategory: (id: string) => fetcher(`/api/categories/${id}`, { method: 'DELETE' }),
};
