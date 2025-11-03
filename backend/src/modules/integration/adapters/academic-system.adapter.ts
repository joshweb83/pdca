import { BaseAdapter } from './base.adapter';
import {
  Student,
  StudentFilter,
  PerformanceData,
} from '../integration.interface';

/**
 * 학사정보시스템 어댑터
 * 학생 정보, 수강 정보 등을 연동합니다.
 */
export class AcademicSystemAdapter extends BaseAdapter {
  /**
   * 학생 데이터 가져오기
   */
  async fetchStudentData(filters: StudentFilter): Promise<Student[]> {
    try {
      const response = await this.fetchData<any>('/api/v1/students', filters);
      return this.transformStudentData(response.data || response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 특정 학생 정보 가져오기
   */
  async fetchStudent(studentId: string): Promise<Student> {
    try {
      const response = await this.fetchData<any>(`/api/v1/students/${studentId}`);
      return this.transformStudentData([response])[0];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 프로그램 참여 학생 목록 가져오기
   */
  async fetchProgramParticipants(programCode: string): Promise<Student[]> {
    try {
      const response = await this.fetchData<any>(
        `/api/v1/programs/${programCode}/participants`
      );
      return this.transformStudentData(response.data || response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 성과 데이터 전송
   */
  async sendPerformanceData(data: PerformanceData): Promise<void> {
    try {
      await this.sendData('/api/v1/performance', {
        program_code: data.programId,
        program_name: data.programName,
        indicators: data.indicators.map((ind) => ({
          indicator_id: ind.indicatorId,
          indicator_name: ind.indicatorName,
          value: ind.value,
          target_value: ind.targetValue,
          achievement_rate: ind.achievementRate,
        })),
        period: data.period,
        completed_at: data.completedAt.toISOString(),
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 외부 시스템의 학생 데이터를 내부 포맷으로 변환
   */
  private transformStudentData(rawData: any[]): Student[] {
    return rawData.map((item) => ({
      id: item.id || item.student_id,
      studentId: item.student_id || item.studentId,
      name: item.student_name || item.name,
      department: item.dept_code || item.department,
      grade: parseInt(item.grade || item.year_level || '1'),
      enrollmentDate: new Date(item.enrollment_date || item.enrolledAt),
      status: item.status || 'active',
    }));
  }

  protected transform<T>(data: any): T {
    // Generic transform - can be overridden
    return data as T;
  }
}
