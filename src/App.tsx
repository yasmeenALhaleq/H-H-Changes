import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { I18nProvider } from "@/i18n";
import { StoreProvider } from "@/store";
import { AdminProvider } from "@/admin/data";
import { AdminLayout } from "@/admin/layout";
import {
  AdminCustomerDetails,
  AdminCustomers,
  AdminDeliveries,
  AdminLogin,
  AdminOrderDetails,
  AdminOrders,
  AdminProducts,
  AdminReports,
  AdminSettings,
  Dashboard,
  ProductEditor,
} from "@/admin/screens";
import {
  AuthSuccess,
  ForgotPassword,
  Login,
  NewPassword,
  Otp,
  SignUp,
  VerifyMethod,
  Welcome,
} from "@/customer/auth";
import { CancelOrder, MyOrders, OrderDetails, OrderTracking } from "@/customer/orders";
import {
  BusinessInformation,
  HelpContact,
  LanguageSettings,
  NotificationSettings,
  Profile,
  SavedAddresses,
} from "@/customer/profile";
import {
  AddAddress,
  Home,
  OrderConfirmation,
  OrderForm,
  OrderReview,
  OrderSubmitting,
  ProductDetails,
  Products,
  RewardCelebration,
} from "@/customer/shop";

/**
 * H&H — medical gases & dry ice ordering.
 * Customer app (mobile) lives at the root routes; the operations dashboard (desktop) under /admin.
 */
export default function App() {
  return (
    <I18nProvider>
      <StoreProvider>
        <AdminProvider>
          <HashRouter>
            <Routes>
              {/* Customer — auth */}
              <Route path="/" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/verify-method" element={<VerifyMethod />} />
              <Route path="/otp" element={<Otp mode="signup" />} />
              <Route path="/verified" element={<AuthSuccess kind="verified" />} />
              <Route path="/forgot" element={<ForgotPassword />} />
              <Route path="/verify-code" element={<Otp mode="reset" />} />
              <Route path="/new-password" element={<NewPassword />} />
              <Route path="/password-updated" element={<AuthSuccess kind="password" />} />

              {/* Customer — shop & ordering */}
              <Route path="/home" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/order/review" element={<OrderReview />} />
              <Route path="/order/submitting" element={<OrderSubmitting />} />
              <Route path="/order/reward/:uid" element={<RewardCelebration />} />
              <Route path="/order/confirmed/:uid" element={<OrderConfirmation />} />
              <Route path="/order/:id" element={<OrderForm />} />
              <Route path="/addresses/new" element={<AddAddress />} />

              {/* Customer — orders */}
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/orders/:uid" element={<OrderDetails />} />
              <Route path="/orders/:uid/track" element={<OrderTracking />} />
              <Route path="/orders/:uid/cancel" element={<CancelOrder />} />

              {/* Customer — profile */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/business" element={<BusinessInformation />} />
              <Route path="/profile/addresses" element={<SavedAddresses />} />
              <Route path="/profile/notifications" element={<NotificationSettings />} />
              <Route path="/profile/language" element={<LanguageSettings />} />
              <Route path="/profile/help" element={<HelpContact />} />

              {/* Admin dashboard */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/:id" element={<ProductEditor />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:uid" element={<AdminOrderDetails />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="customers/:id" element={<AdminCustomerDetails />} />
                <Route path="deliveries" element={<AdminDeliveries />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </AdminProvider>
      </StoreProvider>
    </I18nProvider>
  );
}
