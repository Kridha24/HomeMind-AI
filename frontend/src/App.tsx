import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Bot, Sparkles } from 'lucide-react';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { AIChatDrawer } from './components/common/AIChatDrawer';
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
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                  <Navbar
                    onOpenAIChat={() => setIsAIChatOpen(true)}
                    onOpenNotifications={() => setIsNotificationsOpen(true)}
                  />
                  <main className="flex-1 p-6 overflow-y-auto ml-64">
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
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                </div>

                {/* Floating AI Assistant Trigger Button (Bottom Right Corner) */}
                <button
                  onClick={() => setIsAIChatOpen(true)}
                  className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-3 rounded-full font-bold text-xs shadow-2xl shadow-blue-500/40 border border-blue-400/30 transition-all hover:scale-105 active:scale-95 group"
                  title="Ask HomeMind AI Assistant"
                >
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
                  </div>
                  <span>Ask HomeMind AI</span>
                  <Sparkles className="w-3.5 h-3.5 text-blue-200 animate-pulse" />
                </button>

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
