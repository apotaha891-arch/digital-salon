import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Setup from './pages/Setup/index';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Tickets from './pages/Tickets';
import Integrations from './pages/Integrations';
import Billing from './pages/Billing';
import Customers from './pages/Customers';
import HelpCenter from './pages/HelpCenter';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminClients from './pages/admin/AdminClients';
import AdminSettings from './pages/admin/AdminSettings';
import AdminLeads from './pages/admin/AdminLeads';
import AdminSalesCRM from './pages/admin/AdminSalesCRM';
import AdminAgentConfig from './pages/admin/AdminAgentConfig';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import ResetPassword from './pages/ResetPassword';
import Contact from './pages/Contact';
import SalonPublicPage from './pages/SalonPublicPage';
import SalonConcierge from './components/SalonConcierge';
import './index.css';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const location = useLocation();
  const isPublicSalonPage = location.pathname.startsWith('/s/') ||
    /^\/[a-z0-9][a-z0-9-]*$/i.test(location.pathname) && !['login','reset-password','setup','dashboard','bookings','tickets','integrations','billing','customers','help','contact','admin'].some(r => location.pathname === '/' + r || location.pathname.startsWith('/' + r + '/'));

  useEffect(() => {
    const dir = i18n.dir();
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
    document.body.dir = dir;
  }, [i18n.language]);

  return (
    <>
    {!isPublicSalonPage && <SalonConcierge lang={i18n.language} />}
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Client Routes */}
      <Route path="/setup" element={<ProtectedRoute><Layout><Setup /></Layout></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/bookings" element={<ProtectedRoute><Layout><Bookings /></Layout></ProtectedRoute>} />
      <Route path="/tickets" element={<ProtectedRoute><Layout><Tickets /></Layout></ProtectedRoute>} />
      <Route path="/integrations" element={<ProtectedRoute><Layout><Integrations /></Layout></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><Layout><Billing /></Layout></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><Layout><Customers /></Layout></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><Layout><HelpCenter /></Layout></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><Layout isAdmin><AdminDashboard /></Layout></ProtectedRoute>} />
      <Route path="/admin/clients" element={<ProtectedRoute adminOnly><Layout isAdmin><AdminClients /></Layout></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute adminOnly><Layout isAdmin><AdminSettings /></Layout></ProtectedRoute>} />
      <Route path="/admin/leads" element={<ProtectedRoute adminOnly><Layout isAdmin><AdminLeads /></Layout></ProtectedRoute>} />
      <Route path="/admin/crm" element={<ProtectedRoute adminOnly><Layout isAdmin><AdminSalesCRM /></Layout></ProtectedRoute>} />
      <Route path="/admin/agent" element={<ProtectedRoute adminOnly><Layout isAdmin><AdminAgentConfig /></Layout></ProtectedRoute>} />

      <Route path="/" element={<Landing />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/s/:businessId" element={<SalonPublicPage />} />
      {/* Slug-based public salon URLs: digitalsalon.website/salon-name */}
      <Route path="/:businessId" element={<SalonPublicPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
