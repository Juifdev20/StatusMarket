import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, getHomeRoute } from '../features/auth/authContext';
import { ProtectedRoute } from './ProtectedRoute';
import { VendorLayout } from '../layouts/VendorLayout';
import { AdminLayout } from '../layouts/AdminLayout';

import { CartPage } from '../features/cart/CartPage';
import { LandingPage } from '../features/shops/LandingPage';
import { CategoryBrowsePage } from '../features/shops/CategoryBrowsePage';
import { CategoriesListPage } from '../features/shops/CategoriesListPage';
import { PublicShopPage } from '../features/shops/PublicShopPage';
import { LoginPage } from '../features/auth/LoginPage';
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage';
import { AccountPage } from '../features/auth/AccountPage';
import { SellerDashboard } from '../features/shops/SellerDashboard';
import { CreateStorePage } from '../features/shops/CreateStorePage';
import { CategoriesPage } from '../features/categories/CategoriesPage';
import { ProductsPage } from '../features/products/ProductsPage';
import { StatusGenerator } from '../features/status-generator/StatusGenerator';
import { PublicationsPage } from '../features/status-generator/PublicationsPage';
import { PublicationPage } from '../features/status-generator/PublicationPage';
import { SubscriptionPage } from '../features/subscriptions/SubscriptionPage';
import { OrdersPage } from '../features/orders/OrdersPage';
import { AdminDashboard } from '../features/admin/AdminDashboard';
import { AdminSellersPage } from '../features/admin/AdminSellersPage';
import { AdminShopsPage } from '../features/admin/AdminShopsPage';
import { AdminProductsPage } from '../features/admin/AdminProductsPage';
import { AdminReportsPage } from '../features/admin/AdminReportsPage';
import { AdminPaymentsPage } from '../features/admin/AdminPaymentsPage';
import { AdminSubscriptionsPage } from '../features/admin/AdminSubscriptionsPage';
import { AdminSettingsPage } from '../features/admin/AdminSettingsPage';
import { Footer } from '../components/Footer';
import { HelpPage } from '../features/pages/HelpPage';
import { PrivacyPage } from '../features/pages/PrivacyPage';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';

function RootRedirect() {
  const { profile, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-vert-marche border-t-transparent" /></div>;
  return <Navigate to={getHomeRoute(profile?.role)} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/recuperation" element={<ResetPasswordPage />} />
          <Route path="/boutique/:slug" element={<PublicShopPage />} />
          <Route path="/categorie/:slug" element={<CategoryBrowsePage />} />
          <Route path="/categories" element={<CategoriesListPage />} />
          <Route path="/pub/:slug" element={<PublicationPage />} />
          <Route path="/panier" element={<CartPage />} />
          <Route path="/aide" element={<HelpPage />} />
          <Route path="/confidentialite" element={<PrivacyPage />} />

          {/* Seller routes */}
          <Route path="/vendeur" element={
            <ProtectedRoute roles={['SELLER']}>
              <VendorLayout />
            </ProtectedRoute>
          }>
            <Route index element={<SellerDashboard />} />
            <Route path="produits" element={<ProductsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="publications" element={<PublicationsPage />} />
            <Route path="statut" element={<StatusGenerator />} />
            <Route path="commandes" element={<OrdersPage />} />
            <Route path="abonnement" element={<SubscriptionPage />} />
            <Route path="compte" element={<AccountPage />} />
            <Route path="boutique/nouvelle" element={<CreateStorePage />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="vendeurs" element={<AdminSellersPage />} />
            <Route path="boutiques" element={<AdminShopsPage />} />
            <Route path="produits" element={<AdminProductsPage />} />
            <Route path="signalements" element={<AdminReportsPage />} />
            <Route path="paiements" element={<AdminPaymentsPage />} />
            <Route path="abonnements" element={<AdminSubscriptionsPage />} />
          <Route path="parametres" element={<AdminSettingsPage />} />
            <Route path="*" element={<AdminDashboard />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
        <Footer />
        <PWAInstallPrompt />
      </BrowserRouter>
    </AuthProvider>
  );
}
