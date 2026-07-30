export interface User {
  id: string;
  email?: string;
  phoneNumber?: string;
  name: string;
  age?: number;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
  householdId?: string;
  avatar?: string;
  avatarUrl?: string;
  provider?: 'GOOGLE' | 'PHONE';
  isVerified?: boolean;
  isActive?: boolean;
  lastLogin?: string;
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
  user?: { name: string; email?: string };
}

export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  category: string;
  status: 'PAID' | 'UNPAID' | 'OVERDUE';
  provider?: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  expiryDate?: string;
  barcode?: string;
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
}

export interface MedicineSchedule {
  id?: string;
  timeOfDay: string;
  memberAssignee?: string;
  taken?: boolean;
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

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string;
  assignee?: User;
}

export interface SustainabilityMetric {
  waterUsageLitre: number;
  electricityKwh: number;
  foodWasteKg: number;
  ecoScore: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}
