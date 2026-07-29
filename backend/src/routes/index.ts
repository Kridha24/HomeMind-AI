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

const router = Router();

// ==========================================
// PUBLIC AUTHENTICATION ENDPOINTS
// ==========================================
router.post('/auth/google', authController.googleLogin);
router.post('/auth/phone/request-otp', authController.requestPhoneOTP);
router.post('/auth/phone/verify-otp', authController.verifyPhoneOTP);
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
router.post('/auth/logout-all', authController.logoutAllDevices);

// Household Settings & Currency Engine
router.get('/settings', settingController.getSettings);
router.put('/settings', authorize(['OWNER', 'ADMIN']), settingController.updateSettings);

// Dashboard Overview Telemetry
router.get('/dashboard/summary', dashboardController.getDashboardSummary);

// Expense Management
router.get('/expenses', expenseController.getExpenses);
router.post('/expenses', authorize(['OWNER', 'ADMIN', 'MEMBER']), expenseController.createExpense);
router.delete('/expenses/:id', authorize(['OWNER', 'ADMIN']), expenseController.deleteExpense);

// Bills Management
router.get('/bills', billController.getBills);
router.post('/bills', authorize(['OWNER', 'ADMIN', 'MEMBER']), billController.createBill);
router.put('/bills/:id/pay', authorize(['OWNER', 'ADMIN', 'MEMBER']), billController.markBillPaid);

// Grocery Inventory
router.get('/inventory', inventoryController.getInventory);
router.post('/inventory', authorize(['OWNER', 'ADMIN', 'MEMBER']), inventoryController.createGroceryItem);
router.put('/inventory/:id/quantity', authorize(['OWNER', 'ADMIN', 'MEMBER']), inventoryController.updateQuantity);
router.delete('/inventory/:id', authorize(['OWNER', 'ADMIN']), inventoryController.deleteGroceryItem);

// Appliance Manager
router.get('/appliances', applianceController.getAppliances);
router.post('/appliances', authorize(['OWNER', 'ADMIN', 'MEMBER']), applianceController.createAppliance);
router.post('/appliances/:id/maintenance', authorize(['OWNER', 'ADMIN', 'MEMBER']), applianceController.logMaintenance);

// Medicine Manager
router.get('/medicines', medicineController.getMedicines);
router.post('/medicines', authorize(['OWNER', 'ADMIN', 'MEMBER']), medicineController.createMedicine);
router.put('/medicines/schedules/:scheduleId/taken', authorize(['OWNER', 'ADMIN', 'MEMBER']), medicineController.toggleScheduleTaken);

// Household Task Workspace
router.get('/tasks', taskController.getTasks);
router.post('/tasks', authorize(['OWNER', 'ADMIN', 'MEMBER']), taskController.createTask);
router.put('/tasks/:id/status', authorize(['OWNER', 'ADMIN', 'MEMBER']), taskController.updateTaskStatus);

// Family Workspace & Permissions
router.get('/family/members', familyController.getHouseholdMembers);
router.put('/family/members/:userId/role', authorize(['OWNER', 'ADMIN']), familyController.updateMemberRole);
router.post('/family/join', familyController.joinHouseholdWithCode);

// AI Security & DB Context Proxy
router.get('/ai/forecasts', aiController.getAIForecasts);
router.post('/ai/ocr', authorize(['OWNER', 'ADMIN', 'MEMBER']), aiController.scanReceiptOrPantry);
router.get('/ai/recipes', aiController.getRecipeRecommendations);
router.post('/ai/chat', aiController.chatWithAI);

// Notifications
router.get('/notifications', notificationController.getNotifications);
router.put('/notifications/:id/read', notificationController.markAsRead);

// Executive Reports Exporter
router.get('/reports/monthly/pdf', reportController.exportMonthlyReport);

export default router;
