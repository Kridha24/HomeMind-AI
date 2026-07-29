import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
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

const router = Router();

// Public Authentication Endpoints (Google OAuth & Mobile Phone OTP ONLY)
router.post('/auth/google', authController.googleLogin);
router.post('/auth/phone/send-otp', authController.sendPhoneOTP);
router.post('/auth/phone/verify-otp', authController.verifyPhoneOTP);
router.post('/auth/refresh', authController.refresh);

// Protected routes requiring valid JWT containing householdId
router.use(authenticateToken);

// User Profile
router.get('/auth/profile', authController.getProfile);

// Dashboard Overview Telemetry
router.get('/dashboard/summary', dashboardController.getDashboardSummary);

// Expense Management
router.get('/expenses', expenseController.getExpenses);
router.post('/expenses', expenseController.createExpense);
router.delete('/expenses/:id', expenseController.deleteExpense);

// Bills Management
router.get('/bills', billController.getBills);
router.post('/bills', billController.createBill);
router.put('/bills/:id/pay', billController.markBillPaid);

// Grocery Inventory
router.get('/inventory', inventoryController.getInventory);
router.post('/inventory', inventoryController.createGroceryItem);
router.put('/inventory/:id/quantity', inventoryController.updateQuantity);
router.delete('/inventory/:id', inventoryController.deleteGroceryItem);

// Appliance Manager
router.get('/appliances', applianceController.getAppliances);
router.post('/appliances', applianceController.createAppliance);
router.post('/appliances/:id/maintenance', applianceController.logMaintenance);

// Medicine Manager
router.get('/medicines', medicineController.getMedicines);
router.post('/medicines', medicineController.createMedicine);
router.put('/medicines/schedules/:scheduleId/taken', medicineController.toggleScheduleTaken);

// Household Task Workspace
router.get('/tasks', taskController.getTasks);
router.post('/tasks', taskController.createTask);
router.put('/tasks/:id/status', taskController.updateTaskStatus);

// Family Workspace
router.get('/family/members', familyController.getHouseholdMembers);
router.put('/family/members/:userId/role', familyController.updateMemberRole);
router.post('/family/join', familyController.joinHouseholdWithCode);

// AI Services (OCR, Recipe Engine, Forecasting, DB Chat)
router.get('/ai/forecasts', aiController.getAIForecasts);
router.post('/ai/ocr', aiController.scanReceiptOrPantry);
router.get('/ai/recipes', aiController.getRecipeRecommendations);
router.post('/ai/chat', aiController.chatWithAI);

// Notifications
router.get('/notifications', notificationController.getNotifications);
router.put('/notifications/:id/read', notificationController.markAsRead);

// Reports Exporter
router.get('/reports/monthly/pdf', reportController.exportMonthlyReport);

export default router;
