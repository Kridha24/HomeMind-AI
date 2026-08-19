import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Bot, Sparkles } from 'lucide-react';
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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export function App() {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isFABVisible, setIsFABVisible] = useState(true);
  const { fetchSettings, theme } = useSettingStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchSettings();
    }
  }, []);

  const getThemeClass = () => {
    if (theme === 'light') return 'min-h-screen bg-slate-100 text-slate-900 flex';
    if (theme === 'glass') return 'min-h-screen bg-slate-950 text-slate-100 flex bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950';
    return 'min-h-screen bg-slate-950 text-slate-100 flex';
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className={getThemeClass()}>
                <Sidebar
                  isOpen={isMobileSidebarOpen}
                  onClose={() => setIsMobileSidebarOpen(false)}
                />
                <div className="flex-1 flex flex-col min-w-0">
                  <Navbar
                    onOpenAIChat={() => setIsAIChatOpen(true)}
                    onOpenNotifications={() => setIsNotificationsOpen(true)}
                    onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
                  />
                  <main className="flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto lg:ml-64 ml-0">
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

                {/* Draggable AI Assistant Button */}
                {isFABVisible && (
                  <DraggableFAB 
                    onClick={() => setIsAIChatOpen(true)} 
                    onDismiss={() => setIsFABVisible(false)} 
                  />
                )}

                <AIChatDrawer isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
                <NotificationDrawer
                  isOpen={isNotificationsOpen}
                  onClose={() => setIsNotificationsOpen(false)}
                />
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
