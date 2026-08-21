import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { AIChatDrawer } from './components/common/AIChatDrawer';
import { DraggableFAB } from './components/common/DraggableFAB';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { Dashboard } from './pages/Dashboard';
import { Income } from './pages/Income';
import { Expenses } from './pages/Expenses';
import { Bills } from './pages/Bills';
import { Inventory } from './pages/Inventory';
import { PantryVision } from './pages/PantryVision';
import { Appliances } from './pages/Appliances';
import { Medicines } from './pages/Medicines';
import { Tasks } from './pages/Tasks';
import { FamilyWorkspace } from './pages/FamilyWorkspace';
import { Sustainability } from './pages/Sustainability';
import { Analytics } from './pages/Analytics';
import { Reports } from './pages/Reports';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { UserManual } from './pages/UserManual';
import { Login } from './pages/Auth/Login';
import { useAuthStore } from './stores/useAuthStore';
import { useSettingStore } from './stores/useSettingStore';
import apiClient from './services/apiClient';

// ─── Protected Route ─────────────────────────────────────────────────────────
// If accessToken is present but /auth/me fails (e.g. revoked), we try a
// refresh via the apiClient interceptor (which handles 401 → refresh → retry).
// If refresh also fails, the interceptor redirects to /login?sessionExpired=true.
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setVerified(false);
      return;
    }
    // Fire /auth/me to confirm the stored token is still valid.
    // On 401 the interceptor will try refresh; if that fails it redirects.
    apiClient.get('/auth/me')
      .then(() => setVerified(true))
      .catch(() => {
        // Interceptor already handled redirect on refresh failure;
        // if we land here with a non-401 error, still treat as verified.
        setVerified(true);
      });
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (verified === null) {
    // Minimal splash while verifying — avoids flash to login then back
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
};

// ─── App Shell ───────────────────────────────────────────────────────────────
function AppShell() {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isFABVisible, setIsFABVisible] = useState(true);
  const { fetchSettings, theme } = useSettingStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) fetchSettings();
  }, [isAuthenticated]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark' || theme === 'glass') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  const themeClass =
    theme === 'glass'
      ? 'min-h-[100dvh] bg-background text-primary flex bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950'
      : 'min-h-[100dvh] bg-background text-primary flex';

  return (
    <div className={themeClass}>
      <Sidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onOpenAIChat={() => setIsAIChatOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((p) => !p)}
        />

        {/* Main content: offset for sidebar on large screens, full-width on mobile */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto lg:ml-64 ml-0 pb-20 lg:pb-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/income" element={<Income />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/pantry-vision" element={<PantryVision />} />
            <Route path="/appliances" element={<Appliances />} />
            <Route path="/medicines" element={<Medicines />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/family" element={<FamilyWorkspace />} />
            <Route path="/sustainability" element={<Sustainability />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/manual" element={<UserManual />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* AI FAB — hidden on login, safe padding from bottom CTAs */}
      {isFABVisible && (
        <DraggableFAB onClick={() => setIsAIChatOpen(true)} onDismiss={() => setIsFABVisible(false)} />
      )}

      <AIChatDrawer isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
      <NotificationDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
