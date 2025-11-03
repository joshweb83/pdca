/**
 * 외부 시스템 연동을 위한 표준 인터페이스
 */

export interface AdapterConfig {
  systemId: string;
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
  [key: string]: any;
}

export interface ExternalSystemAdapter {
  /**
   * 연결 초기화
   */
  connect(): Promise<void>;

  /**
   * 연결 종료
   */
  disconnect(): Promise<void>;

  /**
   * 헬스체크
   */
  healthCheck(): Promise<boolean>;

  /**
   * 데이터 가져오기 (Pull)
   */
  fetchData<T>(endpoint: string, params?: any): Promise<T>;

  /**
   * 데이터 전송하기 (Push)
   */
  sendData<T>(endpoint: string, data: any): Promise<T>;
}

export interface StudentFilter {
  department?: string;
  enrollmentYear?: number;
  status?: 'active' | 'inactive' | 'graduated';
  grade?: number;
}

export interface Student {
  id: string;
  studentId: string;
  name: string;
  department: string;
  grade: number;
  enrollmentDate: Date;
  status: string;
}

export interface EmployeeFilter {
  department?: string;
  position?: string;
  employmentType?: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  position: string;
}

export interface BudgetFilter {
  department?: string;
  fiscalYear?: number;
  category?: string;
}

export interface Budget {
  id: string;
  department: string;
  category: string;
  allocatedAmount: number;
  executedAmount: number;
  fiscalYear: number;
}

export interface PerformanceData {
  programId: string;
  programName: string;
  indicators: Array<{
    indicatorId: string;
    indicatorName: string;
    value: number;
    targetValue: number;
    achievementRate: number;
  }>;
  period: string;
  completedAt: Date;
}

export interface SyncConfig {
  entityType: string;
  syncType: 'full' | 'incremental';
  lastSyncTime?: Date;
  batchSize?: number;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsSuccess: number;
  recordsFailed: number;
  errors?: Array<{
    record: any;
    error: string;
  }>;
}

export class AdapterError extends Error {
  constructor(message: string, public cause?: any) {
    super(message);
    this.name = 'AdapterError';
  }
}
