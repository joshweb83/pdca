// Common API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: string;
  departmentId?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  departmentId?: string;
  department?: Department;
  createdAt: string;
  updatedAt: string;
}

// Department types
export interface Department {
  id: string;
  code: string;
  name: string;
  type: 'ACADEMIC' | 'ADMINISTRATIVE';
  parentDepartmentId?: string;
  managerId?: string;
  createdAt: string;
  updatedAt: string;
}

// Program types
export interface Program {
  id: string;
  code: string;
  name: string;
  description?: string;
  departmentId: string;
  department?: Department;
  managerId: string;
  manager?: User;
  startDate: string;
  endDate: string;
  totalBudget: number;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  _count?: {
    kpis: number;
    indicators: number;
  };
}

export interface CreateProgramRequest {
  code: string;
  name: string;
  description?: string;
  departmentId: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
}

export interface UpdateProgramRequest {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  totalBudget?: number;
  status?: Program['status'];
}

// KPI types
export interface KPI {
  id: string;
  code: string;
  name: string;
  description?: string;
  unit: string;
  dataType: 'NUMBER' | 'PERCENTAGE' | 'CURRENCY' | 'TEXT';
  measureCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Indicator types
export interface Indicator {
  id: string;
  code: string;
  name: string;
  description?: string;
  formula: string;
  unit: string;
  targetValue?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
