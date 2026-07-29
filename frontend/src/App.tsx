import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { AIChatDrawer } from './components/common/AIChatDrawer';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { useAuthStore } from './stores/useAuthStore';

import { Dashboard } from './pages/Dashboard';
import { Expenses } from './pages/Expenses';
import { Bills } from './pages/Bills';
import { Inventory } from './pages/Inventory';
import { PantryVision } from './pages/PantryVision';
import { Recipes } from './pages/Recipes';
import { Appliances } from './pages/Appliances';
import { Medicines } from './pages/Medicines';
import { Tasks } from './pages/Tasks';
import { FamilyWorkspace } from './pages/FamilyWorkspace';
import { Analytics } from './pages/Analytics';
import { Sustainability } from './pages/Sustainability';
import { Reports } from './pages/Reports';
import { Login } from './pages/Auth/Login';

const mockNotifications = [
  { id: '1', title: 'Expiring Item Warning', message: 'Fresh Spinach 500g expires tomorrow! Cook Creamy Spinach Pasta.', type: 'GROCERY_EXPIRING', isRead: false, createdAt: new Date().toISOString() },
  { id: '2', title: 'Bill Payment Reminder', message: 'City Electricity Grid bill of $142.50 is due in 7 days.', type: 'BILL_DUE', isRead: false, createdAt: new Date().toISOString() },
  { id: '3', title: 'Low Stock Alert', message: 'Extra Virgin Olive Oil is below threshold (0.2L remaining).', type: 'LOW_STOCK', isRead: false, createdAt: new Date().toISOString() }
];

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onOpenAIChat={() => setIsAIChatOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadCount={mockNotifications.filter(n => !n.isRead).length}
        />
        <main className="flex-1 ml-64 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/pantry-vision" element={<PantryVision />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/appliances" element={<Appliances />} />
            <Route path="/medicines" element={<Medicines />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/family" element={<FamilyWorkspace />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/sustainability" element={<Sustainability />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <AIChatDrawer isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
      <NotificationDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} notifications={mockNotifications} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </BrowserRouter>
  );
};
export default App;
