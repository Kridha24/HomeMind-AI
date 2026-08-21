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
import { googleAuthSchema } from '../utils/validators';
import { authLimiter, otpLimiter } from '../app';

const router = Router();

// ==========================================
// PUBLIC AUTHENTICATION ENDPOINTS
// Auth endpoints are rate-limited (30 req/15 min).
// OTP request endpoints are additionally limited (10 req/15 min).
// ==========================================

router.post('/auth/google', authLimiter, validate(googleAuthSchema), authController.googleLogin);
router.post('/auth/phone/request-otp', otpLimiter, authController.requestPhoneOTP);
router.post('/auth/phone/verify-otp', authLimiter, authController.verifyPhoneOTP);
router.post('/auth/email/request-otp', otpLimiter, authController.requestEmailOTP);
router.post('/auth/email/verify-otp', authLimiter, authController.verifyEmailOTP);
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
// Only ADMIN/HEAD can change settings; GUESTs cannot.
router.get('/settings', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), settingController.getSettings);
router.put('/settings', authorize(['OWNER', 'CO-OWNER', 'ADMIN']), settingController.updateSettings);

// Dashboard Overview Telemetry
router.get('/dashboard/summary', dashboardController.getDashboardSummary);

// Income Management
router.get('/income', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), incomeController.getIncomes);
router.post('/income', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), incomeController.createIncome);
router.delete('/income/:id', authorize(['OWNER', 'CO-OWNER', 'ADMIN']), incomeController.deleteIncome);

// Expense Management
router.get('/expenses', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), expenseController.getExpenses);
router.post('/expenses', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), expenseController.createExpense);
router.delete('/expenses/:id', authorize(['OWNER', 'CO-OWNER', 'ADMIN']), expenseController.deleteExpense);

// Bills Management
router.get('/bills', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), billController.getBills);
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
router.post('/appliances/:id/maintenance', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), applianceController.logMaintenance);

// Medicines Tracker
router.get('/medicines', medicineController.getMedicines);
router.post('/medicines', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), medicineController.createMedicine);
router.put('/medicines/schedule/:scheduleId/toggle', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), medicineController.toggleScheduleTaken);

// Tasks & Family Workspace
router.get('/tasks', taskController.getTasks);
router.post('/tasks', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), taskController.createTask);
router.put('/tasks/:id/status', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), taskController.updateTaskStatus);

// Family Members Workspace
router.get('/family/members', familyController.getHouseholdMembers);
router.get('/family/aggregate', familyController.getAggregateData);
router.put('/family/name', authorize(['OWNER', 'ADMIN', 'HEAD']), familyController.updateHouseholdName);
// Role update: ADMIN/HEAD only (familyController enforces this too as defense-in-depth)
router.put('/family/members/:userId/role', authorize(['OWNER', 'CO-OWNER', 'ADMIN']), familyController.updateMemberRole);
router.post('/family/join', familyController.joinHouseholdWithCode);

// ==========================================
// NEXT-GEN AI HOUSEHOLD AGENT ENDPOINTS
// GUESTs cannot use AI agent features.
// ==========================================
router.post('/assistant/chat', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), assistantController.chat);
router.post('/assistant/stream', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), assistantController.streamChat);
router.get('/assistant/summary', assistantController.getDailySummary);
router.get('/assistant/threads', assistantController.getThreads);
router.get('/assistant/threads/:threadId', assistantController.getThreadMessages);
router.delete('/assistant/threads/:threadId', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), assistantController.deleteThread);
router.get('/assistant/memories', assistantController.getMemories);
router.post('/assistant/memories', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), assistantController.createMemory);
router.delete('/assistant/memories/:id', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), assistantController.deleteMemory);
router.post('/assistant/actions/execute', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), assistantController.executeConfirmedAction);

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
