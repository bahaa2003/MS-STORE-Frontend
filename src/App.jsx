import React, { Suspense, lazy } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import FloatingWhatsApp from './components/ui/FloatingWhatsApp';
import RouteWarmup from './components/app/RouteWarmup';
import SessionBootstrap from './components/app/SessionBootstrap';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { ADMIN_ROLES, SUPERVISOR_ROLES } from './utils/authRoles';
import { PERMISSIONS } from './utils/permissions';
import {
  ACCOUNT_PENDING_ROUTE,
  ACCOUNT_REJECTED_ROUTE,
  ACCOUNT_VERIFICATION_ROUTE,
} from './utils/accountStatus';

const Layout = lazy(() => import('./components/layout/Layout'));
const Auth = lazy(() => import('./pages/Auth'));
const AccountPending = lazy(() => import('./pages/AccountPending'));
const AccountRejected = lazy(() => import('./pages/AccountRejected'));
const AccountVerificationRequired = lazy(() => import('./pages/AccountVerificationRequired'));
const EmailVerified = lazy(() => import('./pages/EmailVerified'));
const PublicCatalog = lazy(() => import('./pages/PublicCatalog'));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Orders = lazy(() => import('./pages/Orders'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Wallet = lazy(() => import('./pages/Wallet'));
const Settings = lazy(() => import('./pages/Settings'));
const CreatedByPage = lazy(() => import('./pages/CreatedByPage'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const Account = lazy(() => import('./pages/Account'));
const AccountSecurity = lazy(() => import('./pages/AccountSecurity'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminGroups = lazy(() => import('./pages/admin/AdminGroups'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminWallet = lazy(() => import('./pages/admin/AdminWallet'));
const AdminCurrencies = lazy(() => import('./pages/admin/AdminCurrencies'));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'));
const AdminPaymentMethods = lazy(() => import('./pages/admin/AdminPaymentMethods'));
const AdminSupervisors = lazy(() => import('./pages/admin/AdminSupervisors'));
const SupervisorMonitoring = lazy(() => import('./pages/admin/SupervisorMonitoring'));
const AdminSuppliers = lazy(() => import('./pages/admin/AdminSuppliers'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUserTransactions = lazy(() => import('./pages/admin/AdminUserTransactions'));
const AdminTargetRequests = lazy(() => import('./pages/admin/AdminTargetRequests'));
const BuyTarget = lazy(() => import('./pages/BuyTarget'));
const AddBalance = lazy(() => import('./pages/AddBalance'));
const PaymentDetails = lazy(() => import('./pages/PaymentDetails'));

const ADMIN_PANEL_ROLES = [...ADMIN_ROLES, ...SUPERVISOR_ROLES];

const RouteLoader = () => null;

const renderSuspended = (element) => (
  <Suspense fallback={<RouteLoader />}>
    {element}
  </Suspense>
);

const AnimatedAppRoutes = () => {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  const initial = reduceMotion ? { opacity: 1 } : { opacity: 0 };
  const animate = { opacity: 1 };
  const exit = reduceMotion ? { opacity: 1 } : { opacity: 0 };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}
        className="min-h-screen"
      >
        <Routes location={location}>
          <Route path="/" element={renderSuspended(<PublicCatalog />)} />
          <Route path="/catalog" element={renderSuspended(<PublicCatalog />)} />
          <Route path="/about-us" element={renderSuspended(<AboutUsPage />)} />
          <Route path="/auth" element={renderSuspended(<Auth />)} />
          <Route path="/login" element={renderSuspended(<Auth />)} />
          <Route path="/created-by" element={renderSuspended(<CreatedByPage />)} />
          <Route path="/email-verified" element={renderSuspended(<EmailVerified />)} />
          <Route path={ACCOUNT_PENDING_ROUTE} element={renderSuspended(<AccountPending />)} />
          <Route path={ACCOUNT_REJECTED_ROUTE} element={renderSuspended(<AccountRejected />)} />
          <Route path={ACCOUNT_VERIFICATION_ROUTE} element={renderSuspended(<AccountVerificationRequired />)} />
          <Route path="/account-pending" element={<Navigate to={ACCOUNT_PENDING_ROUTE} replace />} />
          <Route path="/account-rejected" element={<Navigate to={ACCOUNT_REJECTED_ROUTE} replace />} />

          <Route element={renderSuspended(<Layout />)}>
            <Route
              path="/dashboard"
              element={(
                <ProtectedRoute roles={['customer', 'admin']}>
                  {renderSuspended(<Dashboard />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/products"
              element={(
                <ProtectedRoute roles={['customer', 'admin']}>
                  {renderSuspended(<Products />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/products/:id"
              element={(
                <ProtectedRoute roles={['customer', 'admin']}>
                  {renderSuspended(<ProductDetails />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/wallet"
              element={(
                <ProtectedRoute roles={['customer']}>
                  {renderSuspended(<Wallet />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/contact-us"
              element={(
                <ProtectedRoute roles={['customer', 'manager']}>
                  {renderSuspended(<ContactUs />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/orders"
              element={(
                <ProtectedRoute roles={['customer']}>
                  {renderSuspended(<Orders />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/buy-target"
              element={(
                <ProtectedRoute roles={['customer']}>
                  {renderSuspended(<BuyTarget />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/wallet/add-balance"
              element={(
                <ProtectedRoute roles={['customer']}>
                  {renderSuspended(<AddBalance />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/wallet/payment-details/:methodId"
              element={(
                <ProtectedRoute roles={['customer']}>
                  {renderSuspended(<PaymentDetails />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/settings"
              element={(
                <ProtectedRoute>
                  {renderSuspended(<Settings />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/account"
              element={(
                <ProtectedRoute>
                  {renderSuspended(<Account />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/account-security"
              element={(
                <ProtectedRoute>
                  {renderSuspended(<AccountSecurity />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/manager/dashboard"
              element={(
                <ProtectedRoute roles={ADMIN_PANEL_ROLES}>
                  <Navigate to="/admin/dashboard" replace />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/supervisor/dashboard"
              element={(
                <ProtectedRoute roles={ADMIN_PANEL_ROLES}>
                  <Navigate to="/admin/dashboard" replace />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin"
              element={(
                <ProtectedRoute roles={ADMIN_PANEL_ROLES}>
                  <Navigate to="/admin/dashboard" replace />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/dashboard"
              element={(
                <ProtectedRoute roles={ADMIN_PANEL_ROLES}>
                  {renderSuspended(<AdminDashboard />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/users"
              element={(
                <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_USERS}>
                  {renderSuspended(<AdminUsers />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/users/:userId/transactions"
              element={(
                <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_USERS}>
                  {renderSuspended(<AdminUserTransactions />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/supervisors"
              element={(
                <ProtectedRoute roles={ADMIN_ROLES}>
                  {renderSuspended(<AdminSupervisors />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/supervisor-monitoring"
              element={(
                <ProtectedRoute roles={ADMIN_ROLES}>
                  {renderSuspended(<SupervisorMonitoring />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/groups"
              element={(
                <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_GROUPS}>
                  {renderSuspended(<AdminGroups />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/products"
              element={(
                <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_PRODUCTS}>
                  {renderSuspended(<AdminProducts />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/wallet"
              element={(
                <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_WALLET}>
                  {renderSuspended(<AdminWallet />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/orders"
              element={(
                <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_ORDERS}>
                  {renderSuspended(<AdminOrders />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/topups"
              element={(
                <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_PAYMENTS}>
                  <Navigate to="/admin/payments" replace />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/payments"
              element={(
                <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_PAYMENTS}>
                  {renderSuspended(<AdminPayments />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/payment-methods"
              element={(
                <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_PAYMENT_METHODS}>
                  {renderSuspended(<AdminPaymentMethods />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/currencies"
              element={(
                <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_CURRENCIES}>
                  {renderSuspended(<AdminCurrencies />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/suppliers"
              element={(
                <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_SUPPLIERS}>
                  {renderSuspended(<AdminSuppliers />)}
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin/target-requests"
              element={(
                <ProtectedRoute roles={ADMIN_PANEL_ROLES} permission={PERMISSIONS.ADMIN_TARGET_REQUESTS}>
                  {renderSuspended(<AdminTargetRequests />)}
                </ProtectedRoute>
              )}
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <SessionBootstrap />
          <RouteWarmup />
          <BrowserRouter>
            <AnimatedAppRoutes />
            <FloatingWhatsApp />
          </BrowserRouter>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
