export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MEMBER' | 'CHILD' | 'GUEST';
  householdId?: string;
  avatarUrl?: string;
}

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  members?: User[];
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  isRecurring: boolean;
  user?: { name: string; email: string };
}

export interface Income {
  id: string;
  title: string;
  amount: number;
  source: string;
  date: string;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  month: string;
}

export interface Bill {
  id: string;
  title: string;
  category: string;
  amount: number;
  dueDate: string;
  status: 'UNPAID' | 'PAID' | 'OVERDUE';
  provider?: string;
  paidAt?: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  expiryDate?: string;
  dailyConsumption?: number;
}

export interface Recipe {
  id?: string;
  title: string;
  description?: string;
  prepTimeMins: number;
  calories: number;
  category: string;
  isVegetarian: boolean;
  ingredients: string[] | { name: string; quantity: number; unit: string }[];
  instructions: string;
  reason?: string;
}

export interface Appliance {
  id: string;
  name: string;
  brand: string;
  modelNumber?: string;
  purchaseDate: string;
  warrantyYears: number;
  lastServicedDate?: string;
  nextServiceDueDate?: string;
  maintenanceLogs?: ApplianceMaintenance[];
}

export interface ApplianceMaintenance {
  id: string;
  cost: number;
  description: string;
  serviceDate: string;
  technician?: string;
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  stockCount: number;
  expiryDate: string;
  doctorName?: string;
  schedules?: MedicineSchedule[];
}

export interface MedicineSchedule {
  id: string;
  timeOfDay: string;
  memberAssignee: string;
  taken: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string;
  isRecurring: boolean;
  assignee?: { id: string; name: string };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface AIRecommendation {
  id: string;
  module: string;
  title: string;
  description: string;
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  savingsEstimate?: number;
}
