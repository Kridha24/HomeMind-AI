import { Router } from 'express';
import { authenticate, attachHousehold, validateSession, authorize } from '../middleware/auth';
import * as authController from '../controllers/authController';
import { dashboardRoutes } from '../modules/dashboard';
import { expenseRoutes } from '../modules/finance/expenses';
import { incomeRoutes } from '../modules/finance/income';
import { billRoutes } from '../modules/bills';
import { notificationRoutes } from '../modules/notifications';
import { communicationRoutes } from '../modules/communication';
import { transactionRoutes } from '../modules/finance/transactions';
import * as inventoryController from '../controllers/inventoryController';
import * as applianceController from '../controllers/applianceController';
import * as medicineController from '../controllers/medicineController';
import * as taskController from '../controllers/taskController';
import * as familyController from '../controllers/familyController';
import * as aiController from '../controllers/aiController';
import * as reportController from '../controllers/reportController';
import * as settingController from '../controllers/settingController';
import * as assistantController from '../controllers/assistantController';
import { validate } from '../middleware/validator';
import { googleAuthSchema } from '../utils/validators';
import {
  loginDistributedLimiter,
  googleAuthDistributedLimiter,
  sensitiveEndpointLimiter,
} from '../infrastructure/rate-limit';
import { storageRoutes } from '../infrastructure/storage';

const router = Router();

// ==========================================
// PUBLIC AUTHENTICATION ENDPOINTS
// Protected by Redis-backed Distributed Rate Limiters
// and multi-layered OTP abuse mitigation
// ==========================================

router.post('/auth/google', googleAuthDistributedLimiter, validate(googleAuthSchema), authController.googleLogin);
router.post('/auth/phone/request-otp', sensitiveEndpointLimiter, authController.requestPhoneOTP);
router.post('/auth/phone/verify-otp', loginDistributedLimiter, authController.verifyPhoneOTP);
router.post('/auth/email/request-otp', sensitiveEndpointLimiter, authController.requestEmailOTP);
router.post('/auth/email/verify-otp', loginDistributedLimiter, authController.verifyEmailOTP);
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
router.get('/auth/sessions', authController.getActiveSessions);
router.delete('/auth/sessions/:sessionId', authController.revokeSession);
router.delete('/auth/account', authController.deleteAccount);

// Household Settings & Currency Engine
// Only ADMIN/HEAD can change settings; GUESTs cannot.
router.get('/settings', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), settingController.getSettings);
router.put('/settings', authorize(['OWNER', 'CO-OWNER', 'ADMIN']), settingController.updateSettings);

// Dashboard Overview Telemetry (Redis Cached)
router.use('/dashboard', dashboardRoutes);

// Income Management (Modular Domain)
router.use('/income', incomeRoutes);

// Automatic SMS / Bank Transaction Engine (Modular Domain)
router.use('/transactions', transactionRoutes);

// Expense Management (Modular Domain)
router.use('/expenses', expenseRoutes);

// Bills Management (Modular Domain)
router.use('/bills', billRoutes);


// Grocery Inventory & Shopping Workspace
router.get('/inventory', inventoryController.getInventory);
router.post('/inventory', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), inventoryController.createGroceryItem);
router.put('/inventory/:id', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), inventoryController.updateGroceryItem);
router.put('/inventory/:id/purchase', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), inventoryController.togglePurchase);
router.put('/inventory/:id/quantity', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), inventoryController.updateQuantity);
router.delete('/inventory/:id', authorize(['OWNER', 'CO-OWNER', 'ADMIN']), inventoryController.deleteGroceryItem);

// Groceries semantic endpoints (household-scoped)
router.get('/groceries', inventoryController.getInventory);
router.post('/groceries', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), inventoryController.createGroceryItem);
router.put('/groceries/:id', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), inventoryController.updateGroceryItem);
router.put('/groceries/:id/purchase', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), inventoryController.togglePurchase);
router.put('/groceries/:id/quantity', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), inventoryController.updateQuantity);
router.delete('/groceries/:id', authorize(['OWNER', 'CO-OWNER', 'ADMIN']), inventoryController.deleteGroceryItem);


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
router.put('/tasks/:id', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), taskController.updateTask);
router.put('/tasks/:id/status', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']), taskController.updateTaskStatus);
router.delete('/tasks/:id', authorize(['OWNER', 'CO-OWNER', 'ADMIN']), taskController.deleteTask);

// Family Members Workspace & Danger Zone
router.get('/family/members', familyController.getHouseholdMembers);
router.get('/family/aggregate', familyController.getAggregateData);
router.put('/family/name', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'HEAD']), familyController.updateHouseholdName);
router.put('/family/members/:userId/role', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'HEAD']), familyController.updateMemberRole);
router.delete('/family/members/:userId', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'HEAD']), familyController.removeHouseholdMember);
router.post('/family/leave', familyController.leaveHousehold);
router.delete('/family/:id', authorize(['OWNER']), familyController.deleteHousehold);
router.post('/family/join', familyController.joinHouseholdWithCode);
router.post('/family/regenerate-code', authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'HEAD']), familyController.regenerateInviteCode);
router.post('/family/transfer-ownership', authorize(['OWNER']), familyController.transferOwnership);
router.get('/family/activity', familyController.getHouseholdActivity);
router.get('/family/households', familyController.getAvailableHouseholds);
router.post('/family/switch', familyController.switchHousehold);

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

// Notifications, Reports & WebRTC Communication
router.use('/notifications', notificationRoutes);
router.use('/communication', communicationRoutes);

router.get('/reports/monthly', reportController.exportMonthlyReport);
router.get('/reports/monthly/pdf', reportController.exportMonthlyReport);
router.get('/analytics/summary', reportController.getAnalyticsSummary);

// Signed Object Storage (Receipts, Avatars, Documents)
router.use('/storage', storageRoutes);

export default router;
