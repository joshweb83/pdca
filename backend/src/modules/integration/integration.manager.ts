import { ExternalSystemAdapter, AdapterConfig } from './integration.interface';
import { RetryPolicy } from './retry-policy';
import { integrationLogger } from '@/common/logger';

/**
 * 통합 연동 관리자
 * 여러 외부 시스템 어댑터를 등록하고 관리합니다.
 */
export class IntegrationManager {
  private adapters: Map<string, ExternalSystemAdapter> = new Map();
  private retryPolicy: RetryPolicy;

  constructor() {
    this.retryPolicy = new RetryPolicy({
      maxAttempts: parseInt(process.env.INTEGRATION_RETRY_ATTEMPTS || '3'),
      backoffMs: parseInt(process.env.INTEGRATION_RETRY_DELAY || '1000'),
    });
  }

  /**
   * 어댑터 등록
   */
  registerAdapter(systemId: string, adapter: ExternalSystemAdapter): void {
    this.adapters.set(systemId, adapter);
    integrationLogger.info('Adapter registered', { systemId });
  }

  /**
   * 어댑터 가져오기
   */
  getAdapter(systemId: string): ExternalSystemAdapter {
    const adapter = this.adapters.get(systemId);
    if (!adapter) {
      throw new Error(`Adapter not found: ${systemId}`);
    }
    return adapter;
  }

  /**
   * 데이터 가져오기 (재시도 로직 포함)
   */
  async fetchData<T>(
    systemId: string,
    operation: string,
    params?: any
  ): Promise<T> {
    const adapter = this.getAdapter(systemId);

    return await this.retryPolicy.execute(async () => {
      integrationLogger.info('Fetching data', {
        systemId,
        operation,
        params,
      });

      const startTime = Date.now();

      try {
        const result = await (adapter as any)[operation](params);
        const duration = Date.now() - startTime;

        integrationLogger.info('Data fetched successfully', {
          systemId,
          operation,
          duration,
        });

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;

        integrationLogger.error('Failed to fetch data', {
          systemId,
          operation,
          duration,
          error: error.message,
        });

        throw error;
      }
    });
  }

  /**
   * 데이터 전송하기 (재시도 로직 포함)
   */
  async sendData<T>(
    systemId: string,
    operation: string,
    data: any
  ): Promise<T> {
    const adapter = this.getAdapter(systemId);

    return await this.retryPolicy.execute(async () => {
      integrationLogger.info('Sending data', {
        systemId,
        operation,
      });

      const startTime = Date.now();

      try {
        const result = await (adapter as any)[operation](data);
        const duration = Date.now() - startTime;

        integrationLogger.info('Data sent successfully', {
          systemId,
          operation,
          duration,
        });

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;

        integrationLogger.error('Failed to send data', {
          systemId,
          operation,
          duration,
          error: error.message,
        });

        throw error;
      }
    });
  }

  /**
   * 모든 연결 상태 확인
   */
  async checkAllConnections(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [systemId, adapter] of this.adapters.entries()) {
      try {
        results[systemId] = await adapter.healthCheck();
      } catch (error) {
        integrationLogger.error('Health check failed', {
          systemId,
          error,
        });
        results[systemId] = false;
      }
    }

    return results;
  }

  /**
   * 특정 시스템 연결 상태 확인
   */
  async checkConnection(systemId: string): Promise<boolean> {
    const adapter = this.getAdapter(systemId);
    try {
      return await adapter.healthCheck();
    } catch (error) {
      integrationLogger.error('Health check failed', {
        systemId,
        error,
      });
      return false;
    }
  }

  /**
   * 등록된 모든 어댑터 목록 가져오기
   */
  getRegisteredSystems(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * 어댑터 제거
   */
  unregisterAdapter(systemId: string): void {
    this.adapters.delete(systemId);
    integrationLogger.info('Adapter unregistered', { systemId });
  }

  /**
   * 모든 어댑터 연결 해제
   */
  async disconnectAll(): Promise<void> {
    for (const [systemId, adapter] of this.adapters.entries()) {
      try {
        await adapter.disconnect();
        integrationLogger.info('Adapter disconnected', { systemId });
      } catch (error) {
        integrationLogger.error('Failed to disconnect adapter', {
          systemId,
          error,
        });
      }
    }
  }
}

// Singleton instance
export const integrationManager = new IntegrationManager();
