import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ExternalSystemAdapter,
  AdapterConfig,
  AdapterError,
} from '../integration.interface';
import { integrationLogger } from '@/common/logger';

/**
 * 외부 시스템 어댑터 베이스 클래스
 * 공통 기능을 제공하고 재사용성을 높입니다.
 */
export abstract class BaseAdapter implements ExternalSystemAdapter {
  protected client: AxiosInstance;
  protected config: AdapterConfig;
  protected isConnected: boolean = false;

  constructor(config: AdapterConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        integrationLogger.info('External API Request', {
          systemId: this.config.systemId,
          method: config.method,
          url: config.url,
          params: config.params,
        });
        return config;
      },
      (error) => {
        integrationLogger.error('Request Error', {
          systemId: this.config.systemId,
          error: error.message,
        });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        integrationLogger.info('External API Response', {
          systemId: this.config.systemId,
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error: AxiosError) => {
        integrationLogger.error('Response Error', {
          systemId: this.config.systemId,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
        });
        return Promise.reject(this.handleError(error));
      }
    );
  }

  async connect(): Promise<void> {
    try {
      const isHealthy = await this.healthCheck();
      if (isHealthy) {
        this.isConnected = true;
        integrationLogger.info('Connected to external system', {
          systemId: this.config.systemId,
        });
      } else {
        throw new AdapterError('Health check failed');
      }
    } catch (error) {
      integrationLogger.error('Connection failed', {
        systemId: this.config.systemId,
        error,
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    integrationLogger.info('Disconnected from external system', {
      systemId: this.config.systemId,
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      integrationLogger.warn('Health check failed', {
        systemId: this.config.systemId,
        error,
      });
      return false;
    }
  }

  async fetchData<T>(endpoint: string, params?: any): Promise<T> {
    try {
      const response = await this.client.get<T>(endpoint, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async sendData<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await this.client.post<T>(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  protected handleError(error: any): AdapterError {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      return new AdapterError(
        `External system error: ${message}`,
        error.response?.data
      );
    }
    return new AdapterError('Unknown error occurred', error);
  }

  /**
   * 외부 시스템 데이터를 내부 포맷으로 변환하는 추상 메서드
   * 각 어댑터에서 구현해야 합니다.
   */
  protected abstract transform<T>(data: any): T;
}
