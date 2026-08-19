import { Router } from 'express';
import { authenticate, attachHousehold, validateSession, authorize } from '../middleware/auth';
import * as authController from '../controllers/authController';
import * as dashboardController from '../controllers/dashboardController';
import * as expenseController from '../controllers/expenseController';
import * as billController from '../controllers/billController';
import * as inventoryController from '../controllers/inventoryController';
import * as applianceController from '../controllers/applianceController';
import * as medicineController from '../controllers/medicineController';
import * as taskController from '../controllers/taskController';
import * as familyController from '../controllers/familyController';
import * as aiController from '../controllers/aiController';
import * as notificationController from '../controllers/notificationController';
import * as reportController from '../controllers/reportController';
import * as settingController from '../controllers/settingController';
import * as incomeController from '../controllers/incomeController';
import * as assistantController from '../controllers/assistantController';
import { validate } from '../middleware/validator';
import { registerSchema, loginSchema, googleAuthSchema } from '../utils/validators';

const router = Router();

// ==========================================
// PUBLIC AUTHENTICATION ENDPOINTS
// ==========================================
router.post('/auth/register', validate(registerSchema), authController.register);
router.post('/auth/login', validate(loginSchema), authController.login);
router.post('/auth/google', validate(googleAuthSchema), authController.googleLogin);
router.post('/auth/phone/request-otp', authController.requestPhoneOTP);
router.post('/auth/phone/verify-otp', authController.verifyPhoneOTP);
router.post('/auth/email/request-otp', authController.requestEmailOTP);
router.post('/auth/email/verify-otp', authController.verifyEmailOTP);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authController.logout);

// ==========================================
// PROTECTED API ROUTES (JWT + Household Isolation)
// ==========================================
router.use(authenticate);
router.use(attachHousehold);
router.use(validateSession);

// Session Profile & Devices
router.get('/auth/me', authController.getMe);
router.put('/auth/profile', authController.updateProfile);
router.post('/auth/logout-all', authController.logoutAllDevices);

// Household Settings & Currency Engine
router.get('/settings', settingController.getSettings);
router.put('/settings', authorize(['OWNER', 'CO-OWNER', 'ADMIN']), settingController.updateSettings);

// Dashboard Overview Telemetry
router.get('/dashboard/summary', dashboardController.getDashboardSummary);

// Income Management
router.get('/income', incomeController.getIncomes);
router.post('/income', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), incomeController.createIncome);
router.delete('/income/:id', authorize(['OWNER', 'CO-OWNER', 'ADMIN']), incomeController.deleteIncome);

// Expense Management
router.get('/expenses', expenseController.getExpenses);
router.post('/expenses', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), expenseController.createExpense);
router.delete('/expenses/:id', authorize(['OWNER', 'CO-OWNER', 'ADMIN']), expenseController.deleteExpense);

// Bills Management
router.get('/bills', billController.getBills);
router.post('/bills', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), billController.createBill);
router.put('/bills/:id/pay', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), billController.markBillPaid);

// Grocery Inventory
router.get('/inventory', inventoryController.getInventory);
router.post('/inventory', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), inventoryController.createGroceryItem);
router.put('/inventory/:id/quantity', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), inventoryController.updateQuantity);
router.delete('/inventory/:id', authorize(['OWNER', 'CO-OWNER', 'ADMIN']), inventoryController.deleteGroceryItem);

// Appliances Management
router.get('/appliances', applianceController.getAppliances);
router.post('/appliances', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), applianceController.createAppliance);

// Medicines Tracker
router.get('/medicines', medicineController.getMedicines);
router.post('/medicines', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), medicineController.createMedicine);

// Tasks & Family Workspace
router.get('/tasks', taskController.getTasks);
router.post('/tasks', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), taskController.createTask);
router.put('/tasks/:id/status', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), taskController.updateTaskStatus);

// Family Members Workspace
router.get('/family/members', familyController.getHouseholdMembers);
router.get('/family/aggregate', familyController.getAggregateData);
router.put('/family/members/:userId/role', authorize(['OWNER', 'CO-OWNER', 'ADMIN']), familyController.updateMemberRole);
router.post('/family/join', familyController.joinHouseholdWithCode);

// ==========================================
// NEXT-GEN AI HOUSEHOLD AGENT ENDPOINTS
// ==========================================
router.post('/assistant/chat', assistantController.chat);
router.post('/assistant/stream', assistantController.streamChat);
router.get('/assistant/summary', assistantController.getDailySummary);
router.get('/assistant/threads', assistantController.getThreads);
router.get('/assistant/threads/:threadId', assistantController.getThreadMessages);
router.delete('/assistant/threads/:threadId', assistantController.deleteThread);
router.get('/assistant/memories', assistantController.getMemories);
router.post('/assistant/memories', assistantController.createMemory);
router.delete('/assistant/memories/:id', assistantController.deleteMemory);
router.post('/assistant/actions/execute', assistantController.executeConfirmedAction);

// Legacy AI Assistance & Telemetry (Preserved)
router.get('/ai/forecasts', aiController.getAIForecasts);
router.post('/ai/scan', aiController.scanReceiptOrPantry);
router.post('/ai/chat', aiController.chatWithAI);

// Notifications & Reports
router.get('/notifications', notificationController.getNotifications);
router.put('/notifications/:id/read', notificationController.markAsRead);
router.get('/reports/monthly', reportController.exportMonthlyReport);
router.get('/reports/monthly/pdf', reportController.exportMonthlyReport);
router.get('/analytics/summary', reportController.getAnalyticsSummary);

export default router;
