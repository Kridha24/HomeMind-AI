export interface User {
  id: string;
  email?: string;
  phoneNumber?: string;
  name: string;
  age?: number;
  role: 'OWNER' | 'CO-OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
  householdId?: string;
  avatar?: string;
  avatarUrl?: string;
  provider?: 'GOOGLE' | 'PHONE';
  isVerified?: boolean;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  createdAt?: string;
  membersCount?: number;
  members?: User[];
}

export type HouseholdMember = User;

export interface HouseholdActivity {
  id: string;
  action: string;
  entity?: string;
  details?: string | null;
  description?: string;
  performerName?: string;
  timestamp?: string;
  createdAt?: string;
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
  householdId?: string;
  title: string;
  amount: number;
  dueDate: string;
  category: string;
  status: 'PAID' | 'UNPAID' | 'OVERDUE';
  provider?: string | null;
  paidAt?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GroceryItem {
  id: string;
  householdId?: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  expiryDate?: string | null;
  purchaseDate?: string | null;
  barcode?: string | null;
  dailyConsumption?: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  softDelete?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  householdId?: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string;
  isRecurring?: boolean;
  assigneeId?: string | null;
  assignee?: User | null;
  creatorId?: string;
  creator?: { id: string; name: string; email?: string } | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  softDelete?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
