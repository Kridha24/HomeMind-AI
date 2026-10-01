import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { MobileBottomDock } from './components/layout/MobileBottomDock';
import { CommandPalette } from './components/common/CommandPalette';
import { AIChatDrawer } from './components/common/AIChatDrawer';
import { DraggableFAB } from './components/common/DraggableFAB';
import { NotificationDrawer } from './components/common/NotificationDrawer';

// Modals
import { AddExpenseModal } from './components/common/AddExpenseModal';
import { AddBillModal } from './components/common/AddBillModal';
import { AddGroceryModal } from './components/common/AddGroceryModal';
import { AddTaskModal } from './components/common/AddTaskModal';
import { AddApplianceModal } from './components/common/AddApplianceModal';
import { AddMedicineModal } from './components/common/AddMedicineModal';

// Pages
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
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setVerified(false);
      return;
    }
    apiClient
      .get('/auth/me')
      .then(() => setVerified(true))
      .catch(() => {
        setVerified(true);
      });
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (verified === null) {
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
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isFABVisible, setIsFABVisible] = useState(true);

  // Global Quick Action Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isGroceryModalOpen, setIsGroceryModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isApplianceModalOpen, setIsApplianceModalOpen] = useState(false);
  const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const { fetchSettings, theme, sidebarCollapsed } = useSettingStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) fetchSettings();
  }, [isAuthenticated]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark' || theme === 'glass') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  // Global Keyboard Listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Android Native Back Navigation: dismiss modals/drawers first, then history back, then exit
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backListenerPromise = CapApp.addListener('backButton', () => {
      // 1. Close overlay drawers & command palette
      if (isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
        return;
      }
      if (isAIChatOpen) {
        setIsAIChatOpen(false);
        return;
      }
      if (isNotificationsOpen) {
        setIsNotificationsOpen(false);
        return;
      }
      if (isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
        return;
      }

      // 2. Close quick action modals
      if (isExpenseModalOpen) {
        setIsExpenseModalOpen(false);
        return;
      }
      if (isBillModalOpen) {
        setIsBillModalOpen(false);
        return;
      }
      if (isGroceryModalOpen) {
        setIsGroceryModalOpen(false);
        return;
      }
      if (isTaskModalOpen) {
        setIsTaskModalOpen(false);
        return;
      }
      if (isApplianceModalOpen) {
        setIsApplianceModalOpen(false);
        return;
      }
      if (isMedicineModalOpen) {
        setIsMedicineModalOpen(false);
        return;
      }

      // 3. React Router navigation
      if (location.pathname !== '/' && location.pathname !== '/login') {
        navigate(-1);
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      backListenerPromise.then((handle) => handle.remove()).catch(() => {});
    };
  }, [
    isCommandPaletteOpen,
    isAIChatOpen,
    isNotificationsOpen,
    isMobileSidebarOpen,
    isExpenseModalOpen,
    isBillModalOpen,
    isGroceryModalOpen,
    isTaskModalOpen,
    isApplianceModalOpen,
    isMedicineModalOpen,
    location.pathname,
    navigate,
  ]);

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

        {/* Main content: offset for slim 80px sidebar on large screens, full-width on mobile */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto lg:ml-20 ml-0 transition-all duration-300 pb-24 lg:pb-8">
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

      {/* AI FAB */}
      {isFABVisible && (
        <div className="hidden lg:block">
          <DraggableFAB onClick={() => setIsAIChatOpen(true)} onDismiss={() => setIsFABVisible(false)} />
        </div>
      )}

      {/* Mobile Bottom Dock */}
      <MobileBottomDock
        onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
        onOpenBillModal={() => setIsBillModalOpen(true)}
        onOpenGroceryModal={() => setIsGroceryModalOpen(true)}
        onOpenTaskModal={() => setIsTaskModalOpen(true)}
        onOpenAIChat={() => setIsAIChatOpen(true)}
      />

      {/* Cmd + K Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
        onOpenBillModal={() => setIsBillModalOpen(true)}
        onOpenGroceryModal={() => setIsGroceryModalOpen(true)}
        onOpenTaskModal={() => setIsTaskModalOpen(true)}
        onOpenApplianceModal={() => setIsApplianceModalOpen(true)}
        onOpenMedicineModal={() => setIsMedicineModalOpen(true)}
        onOpenAIChat={() => setIsAIChatOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Global Modals & Drawers */}
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />
      <AddBillModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
      />
      <AddGroceryModal
        isOpen={isGroceryModalOpen}
        onClose={() => setIsGroceryModalOpen(false)}
      />
      <AddTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />
      <AddApplianceModal
        isOpen={isApplianceModalOpen}
        onClose={() => setIsApplianceModalOpen(false)}
      />
      <AddMedicineModal
        isOpen={isMedicineModalOpen}
        onClose={() => setIsMedicineModalOpen(false)}
      />

      <AIChatDrawer isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
      <NotificationDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </div>
  );
}

// ─── Native App Bridge (Status Bar, Splash Screen, Login Back Button) ────────
function NativeAppBridge() {
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    SplashScreen.hide().catch(() => {});

    // On login screen, pressing Android back exits the app
    if (location.pathname === '/login') {
      const listenerPromise = CapApp.addListener('backButton', () => {
        CapApp.exitApp();
      });
      return () => {
        listenerPromise.then((handle) => handle.remove()).catch(() => {});
      };
    }
  }, [location.pathname]);

  return null;
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export function App() {
  return (
    <Router>
      <NativeAppBridge />
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
