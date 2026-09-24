import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuthStore } from "@/store/auth";

import { HomePage } from "@/pages/HomePage";
import { CatalogPage } from "@/pages/CatalogPage";
import { ProductPage } from "@/pages/ProductPage";
import { FarmersPage } from "@/pages/FarmersPage";
import { FarmerProfilePage } from "@/pages/FarmerProfilePage";
import { AboutPage } from "@/pages/AboutPage";
import { TermsPage } from "@/pages/TermsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";

import { CartPage } from "@/pages/cart/CartPage";
import { CheckoutPage } from "@/pages/cart/CheckoutPage";

import { OrdersPage } from "@/pages/account/OrdersPage";
import { OrderDetailPage } from "@/pages/account/OrderDetailPage";
import { FavoritesPage } from "@/pages/account/FavoritesPage";
import { ProfilePage } from "@/pages/account/ProfilePage";
import { ReferralsPage } from "@/pages/account/ReferralsPage";

import { ChatPage } from "@/pages/chat/ChatPage";
import { ConversationPage } from "@/pages/chat/ConversationPage";

import { FarmerDashboardPage } from "@/pages/farmer/FarmerDashboardPage";
import { FarmerProductsPage } from "@/pages/farmer/FarmerProductsPage";
import { FarmerProductFormPage } from "@/pages/farmer/FarmerProductFormPage";
import { FarmerOrdersPage } from "@/pages/farmer/FarmerOrdersPage";

import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { AdminApplicationsPage } from "@/pages/admin/AdminApplicationsPage";
import { AdminOrdersPage } from "@/pages/admin/AdminOrdersPage";
import { AdminPromotionsPage } from "@/pages/admin/AdminPromotionsPage";

import { Spinner } from "@/components/ui/skeleton";

export default function App() {
  const init = useAuthStore((s) => s.init);
  const initialized = useAuthStore((s) => s.initialized);
  const location = useLocation();

  useEffect(() => {
    void init();
  }, [init]);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <ScrollToTop />
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 pb-20 md:pb-0">
          <Routes location={location}>
            {/* Публичные */}
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/farmers" element={<FarmersPage />} />
            <Route path="/farmers/:id" element={<FarmerProfilePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Корзина и чекаут (любой, но checkout требует login) */}
            <Route path="/cart" element={<CartPage />} />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />

            {/* Кабинет клиента */}
            <Route
              path="/account/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/favorites"
              element={
                <ProtectedRoute>
                  <FavoritesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/referrals"
              element={
                <ProtectedRoute>
                  <ReferralsPage />
                </ProtectedRoute>
              }
            />

            {/* Чат */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:id"
              element={
                <ProtectedRoute>
                  <ConversationPage />
                </ProtectedRoute>
              }
            />

            {/* Фермер */}
            <Route
              path="/farmer"
              element={
                <ProtectedRoute roles={["farmer", "admin"]}>
                  <FarmerDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/products"
              element={
                <ProtectedRoute roles={["farmer", "admin"]}>
                  <FarmerProductsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/products/new"
              element={
                <ProtectedRoute roles={["farmer", "admin"]}>
                  <FarmerProductFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/products/:id/edit"
              element={
                <ProtectedRoute roles={["farmer", "admin"]}>
                  <FarmerProductFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/orders"
              element={
                <ProtectedRoute roles={["farmer", "admin"]}>
                  <FarmerOrdersPage />
                </ProtectedRoute>
              }
            />

            {/* Админ */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/applications"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminApplicationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/promotions"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminPromotionsPage />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </main>
        <Footer />
        <MobileNav />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
