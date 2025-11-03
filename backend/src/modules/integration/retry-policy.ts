import { integrationLogger } from '@/common/logger';

export interface RetryOptions {
  maxAttempts?: number;
  backoffMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: Array<new (...args: any[]) => Error>;
}

/**
 * 재시도 정책
 * 외부 시스템 호출 실패 시 자동으로 재시도합니다.
 */
export class RetryPolicy {
  private maxAttempts: number;
  private backoffMs: number;
  private backoffMultiplier: number;
  private retryableErrors: Array<new (...args: any[]) => Error>;

  constructor(options: RetryOptions = {}) {
    this.maxAttempts = options.maxAttempts || 3;
    this.backoffMs = options.backoffMs || 1000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.retryableErrors = options.retryableErrors || [Error];
  }

  /**
   * 함수를 재시도 정책과 함께 실행
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // 재시도 가능한 에러인지 확인
        if (!this.isRetryable(error)) {
          integrationLogger.warn('Non-retryable error occurred', {
            error: error.message,
          });
          throw error;
        }

        // 마지막 시도면 에러 던지기
        if (attempt === this.maxAttempts) {
          integrationLogger.error('Max retry attempts reached', {
            attempts: this.maxAttempts,
            error: error.message,
          });
          throw error;
        }

        // 백오프 계산 및 대기
        const delayMs = this.backoffMs * Math.pow(this.backoffMultiplier, attempt - 1);

        integrationLogger.warn(`Retry attempt ${attempt}/${this.maxAttempts}`, {
          error: error.message,
          nextRetryIn: delayMs,
        });

        await this.sleep(delayMs);
      }
    }

    throw lastError!;
  }

  /**
   * 재시도 가능한 에러인지 확인
   */
  private isRetryable(error: any): boolean {
    // 네트워크 관련 에러는 재시도
    if (error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND') {
      return true;
    }

    // 5xx 서버 에러는 재시도
    if (error.response?.status >= 500) {
      return true;
    }

    // 429 Rate Limit 에러는 재시도
    if (error.response?.status === 429) {
      return true;
    }

    // 등록된 재시도 가능한 에러 타입 확인
    return this.retryableErrors.some(
      (ErrorClass) => error instanceof ErrorClass
    );
  }

  /**
   * 지정된 시간만큼 대기
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 재시도 정책 설정 업데이트
   */
  updateOptions(options: Partial<RetryOptions>): void {
    if (options.maxAttempts !== undefined) {
      this.maxAttempts = options.maxAttempts;
    }
    if (options.backoffMs !== undefined) {
      this.backoffMs = options.backoffMs;
    }
    if (options.backoffMultiplier !== undefined) {
      this.backoffMultiplier = options.backoffMultiplier;
    }
    if (options.retryableErrors !== undefined) {
      this.retryableErrors = options.retryableErrors;
    }
  }
}
