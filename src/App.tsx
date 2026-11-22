import { HashRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Spinner } from "@phosphor-icons/react";
import { I18nProvider } from "@/i18n";
import { peekReturnTo, setReturnTo, StoreProvider, useStore } from "@/store";
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
  InstallApp,
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

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg text-gold">
      <Spinner size={32} className="animate-hh-spin" />
    </div>
  );
}

/** Waits for the saved session to be checked; then guests and customers both see the screen. */
function Ready() {
  const { session } = useStore();
  return session.status === "loading" ? <Splash /> : <Outlet />;
}

/**
 * Screens that belong to an account (orders, business details, addresses).
 * A guest who opens one is asked to sign in, then brought back to it.
 */
function CustomerOnly() {
  const { session } = useStore();
  const { pathname } = useLocation();
  if (session.status === "loading") return <Splash />;
  if (session.status === "user") return <Outlet />;
  setReturnTo(pathname);
  return <Navigate to="/login" replace />;
}

/** Welcome / login / sign-up are skipped for customers who are already signed in. */
function GuestOnly() {
  const { session } = useStore();
  if (session.status === "loading") return <Splash />;
  return session.status === "guest" ? (
    <Outlet />
  ) : (
    <Navigate to={peekReturnTo() ?? "/home"} replace />
  );
}

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
              {/* The app opens on Home: guests browse freely and sign in only to place an order. */}
              <Route path="/" element={<Navigate to="/home" replace />} />

              {/* Customer — sign in (skipped once signed in) */}
              <Route element={<GuestOnly />}>
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
              </Route>
              <Route path="/verify-method" element={<VerifyMethod />} />
              <Route path="/otp" element={<Otp mode="signup" />} />
              <Route path="/verified" element={<AuthSuccess kind="verified" />} />
              <Route path="/forgot" element={<ForgotPassword />} />
              <Route path="/verify-code" element={<Otp mode="reset" />} />
              <Route path="/new-password" element={<NewPassword />} />
              <Route path="/password-updated" element={<AuthSuccess kind="password" />} />
              <Route path="/install" element={<InstallApp />} />

              {/* Customer — open to guests: browse, build an order, review it */}
              <Route element={<Ready />}>
                <Route path="/home" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/order/review" element={<OrderReview />} />
                <Route path="/order/:id" element={<OrderForm />} />
                <Route path="/addresses/new" element={<AddAddress />} />
                <Route path="/orders" element={<MyOrders />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/language" element={<LanguageSettings />} />
                <Route path="/profile/help" element={<HelpContact />} />
              </Route>

              {/* Customer — needs an account */}
              <Route element={<CustomerOnly />}>
                <Route path="/order/submitting" element={<OrderSubmitting />} />
                <Route path="/order/reward/:uid" element={<RewardCelebration />} />
                <Route path="/order/confirmed/:uid" element={<OrderConfirmation />} />
                <Route path="/orders/:uid" element={<OrderDetails />} />
                <Route path="/orders/:uid/track" element={<OrderTracking />} />
                <Route path="/orders/:uid/cancel" element={<CancelOrder />} />
                <Route path="/profile/business" element={<BusinessInformation />} />
                <Route path="/profile/addresses" element={<SavedAddresses />} />
                <Route path="/profile/notifications" element={<NotificationSettings />} />
              </Route>

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

              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </HashRouter>
        </AdminProvider>
      </StoreProvider>
    </I18nProvider>
  );
}
