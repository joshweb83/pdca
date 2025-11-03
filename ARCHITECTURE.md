# 대학 성과관리 툴 (PDCA) - 시스템 아키텍처

## 1. 시스템 개요

### 1.1 기술 스택
```
Frontend:
- React 18 + TypeScript
- TanStack Query v5 (데이터 페칭/캐싱)
- Zustand (전역 상태 관리)
- TailwindCSS + shadcn/ui
- Recharts (차트)
- React Hook Form + Zod (폼 검증)
- Vite

Backend:
- Node.js 20 LTS + TypeScript
- Express.js
- Prisma ORM
- PostgreSQL 16
- Redis 7 (캐싱/세션)
- BullMQ (작업 큐)
- Zod (스키마 검증)
- Winston (로깅)

Infrastructure:
- Docker + Docker Compose
- Nginx (리버스 프록시)
- PM2 (프로세스 관리)
```

### 1.2 설계 원칙

#### 유지관리성을 위한 원칙
1. **모듈화**: 기능별 독립적인 모듈 구조
2. **타입 안전성**: TypeScript 엄격 모드 사용
3. **일관된 코드 스타일**: ESLint + Prettier
4. **명확한 네이밍**: 도메인 용어 통일
5. **문서화**: JSDoc, README, API 문서
6. **테스트**: 단위/통합 테스트

#### 외부 연동을 위한 원칙
1. **Adapter 패턴**: 외부 시스템별 어댑터 분리
2. **표준 인터페이스**: REST API 우선, GraphQL 선택
3. **에러 핸들링**: 재시도, 로깅, 알림
4. **버전 관리**: API 버전 명시 (v1, v2)
5. **인증/인가**: JWT + API Key 지원
6. **모니터링**: 연동 상태 실시간 추적

---

## 2. 시스템 아키텍처

### 2.1 전체 구조도

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │Program   │  │KPI/      │  │Report    │   │
│  │          │  │Management│  │Indicator │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS/REST API
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Nginx)                       │
│                  - Rate Limiting                             │
│                  - Load Balancing                            │
│                  - SSL Termination                           │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  Backend API Server (Express)                │
│                                                              │
│  ┌──────────────────── Core Modules ───────────────────┐   │
│  │ Auth │ Program │ KPI │ Indicator │ Budget │ Report │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌────────────── Common Services ──────────────┐           │
│  │ Calculator Engine │ Formula Parser │ Validator│          │
│  └────────────────────────────────────────────────┘           │
│                                                              │
│  ┌────────────── Integration Layer ────────────┐           │
│  │                                              │           │
│  │  External System Adapters (양방향 연동)     │           │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐ │           │
│  │  │학사시스템│  │인사시스템│  │재무시스템│ │           │
│  │  │ Adapter  │  │ Adapter  │  │ Adapter  │ │           │
│  │  └──────────┘  └──────────┘  └──────────┘ │           │
│  │                                              │           │
│  │  ┌─────────────────────────────────────┐   │           │
│  │  │  Integration Manager                │   │           │
│  │  │  - Connection Pool                  │   │           │
│  │  │  - Retry Logic                      │   │           │
│  │  │  - Error Handling                   │   │           │
│  │  │  - Logging & Monitoring             │   │           │
│  │  └─────────────────────────────────────┘   │           │
│  └────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  Background Workers (BullMQ)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Indicator │  │Report    │  │Data Sync │  │Notification│  │
│  │Calculator│  │Generator │  │Worker    │  │Sender    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │PostgreSQL│  │Redis     │  │MinIO/S3  │  │Webhook   │   │
│  │(Main DB) │  │(Cache/   │  │(File     │  │Queue     │   │
│  │          │  │ Queue)   │  │ Storage) │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              External University Systems                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │학사정보  │  │인사시스템│  │재무회계  │  │기타시스템│   │
│  │시스템    │  │          │  │시스템    │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 외부 시스템 연동 아키텍처 (핵심)

### 3.1 연동 방식

#### 지원하는 연동 방식
1. **REST API** (우선)
   - JSON 기반 요청/응답
   - HTTP Methods: GET, POST, PUT, DELETE
   - 인증: Bearer Token, API Key

2. **SOAP/XML** (레거시 지원)
   - XML 파싱 및 변환
   - WSDL 기반 연동

3. **Database Direct Connection** (제한적)
   - Read-only 뷰 제공
   - 배치 작업에만 사용

4. **File Transfer** (CSV/Excel)
   - SFTP/FTP
   - 정기 배치 업로드/다운로드

5. **Webhook** (실시간 푸시)
   - 이벤트 기반 알림
   - 양방향 동기화

### 3.2 Adapter 패턴 설계

```typescript
// 표준 인터페이스
interface ExternalSystemAdapter {
  // 연결 관리
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;

  // 데이터 가져오기 (Pull)
  fetchStudentData(filters: StudentFilter): Promise<Student[]>;
  fetchEmployeeData(filters: EmployeeFilter): Promise<Employee[]>;
  fetchBudgetData(filters: BudgetFilter): Promise<Budget[]>;

  // 데이터 전송하기 (Push)
  sendPerformanceData(data: PerformanceData): Promise<void>;
  sendReportData(report: Report): Promise<void>;

  // 양방향 동기화
  syncData(config: SyncConfig): Promise<SyncResult>;
}

// 학사시스템 어댑터 예시
class AcademicSystemAdapter implements ExternalSystemAdapter {
  private client: AxiosInstance;
  private config: AdapterConfig;

  constructor(config: AdapterConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async connect(): Promise<void> {
    // 연결 초기화
  }

  async fetchStudentData(filters: StudentFilter): Promise<Student[]> {
    try {
      const response = await this.client.get('/api/v1/students', {
        params: filters
      });
      return this.transformStudentData(response.data);
    } catch (error) {
      throw new AdapterError('Failed to fetch student data', error);
    }
  }

  private transformStudentData(rawData: any[]): Student[] {
    // 외부 시스템 데이터 → 내부 포맷 변환
    return rawData.map(item => ({
      id: item.student_id,
      name: item.student_name,
      department: item.dept_code,
      // ... 필드 매핑
    }));
  }
}
```

### 3.3 Integration Manager

```typescript
// 통합 관리자
class IntegrationManager {
  private adapters: Map<string, ExternalSystemAdapter>;
  private connectionPool: ConnectionPool;
  private retryPolicy: RetryPolicy;
  private logger: Logger;

  // 어댑터 등록
  registerAdapter(systemId: string, adapter: ExternalSystemAdapter): void {
    this.adapters.set(systemId, adapter);
  }

  // 데이터 가져오기 (재시도 로직 포함)
  async fetchData<T>(
    systemId: string,
    operation: string,
    params: any
  ): Promise<T> {
    const adapter = this.adapters.get(systemId);
    if (!adapter) {
      throw new Error(`Adapter not found: ${systemId}`);
    }

    return await this.retryPolicy.execute(async () => {
      try {
        this.logger.info(`Fetching data from ${systemId}`, { operation, params });
        const result = await adapter[operation](params);
        this.logger.info(`Successfully fetched from ${systemId}`);
        return result;
      } catch (error) {
        this.logger.error(`Failed to fetch from ${systemId}`, error);
        throw error;
      }
    });
  }

  // 헬스체크
  async checkAllConnections(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [systemId, adapter] of this.adapters.entries()) {
      try {
        results[systemId] = await adapter.healthCheck();
      } catch (error) {
        results[systemId] = false;
      }
    }

    return results;
  }
}
```

### 3.4 데이터 동기화 전략

#### Pull 방식 (정기 동기화)
```typescript
// 스케줄 기반 데이터 가져오기
@Cron('0 2 * * *') // 매일 새벽 2시
async syncStudentData() {
  const adapter = this.integrationManager.getAdapter('academic_system');

  // 변경된 데이터만 가져오기
  const lastSync = await this.getLastSyncTime('students');
  const students = await adapter.fetchStudentData({
    updatedAfter: lastSync
  });

  // 배치 저장
  await this.batchInsertOrUpdate(students);

  // 동기화 시간 기록
  await this.updateSyncTime('students', new Date());
}
```

#### Push 방식 (실시간 전송)
```typescript
// 이벤트 발생 시 즉시 전송
@OnEvent('program.completed')
async sendProgramResult(programId: string) {
  const program = await this.programService.findById(programId);
  const performance = await this.calculatePerformance(programId);

  // 외부 시스템으로 전송
  const adapter = this.integrationManager.getAdapter('reporting_system');
  await adapter.sendPerformanceData({
    programId: program.id,
    programName: program.name,
    indicators: performance.indicators,
    completedAt: new Date()
  });
}
```

#### Webhook 방식 (양방향 실시간)
```typescript
// Webhook 수신 엔드포인트
@Post('/webhooks/academic-system')
async handleAcademicSystemWebhook(@Body() payload: WebhookPayload) {
  // 서명 검증
  if (!this.verifyWebhookSignature(payload)) {
    throw new UnauthorizedException();
  }

  // 이벤트 타입별 처리
  switch (payload.event) {
    case 'student.enrolled':
      await this.handleStudentEnrolled(payload.data);
      break;
    case 'student.graduated':
      await this.handleStudentGraduated(payload.data);
      break;
    default:
      this.logger.warn(`Unknown webhook event: ${payload.event}`);
  }

  return { success: true };
}
```

### 3.5 에러 처리 및 재시도

```typescript
// 재시도 정책
class RetryPolicy {
  async execute<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      backoffMs = 1000,
      backoffMultiplier = 2,
      retryableErrors = [NetworkError, TimeoutError]
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // 재시도 가능한 에러인지 확인
        if (!this.isRetryable(error, retryableErrors)) {
          throw error;
        }

        // 마지막 시도면 에러 던지기
        if (attempt === maxAttempts) {
          throw error;
        }

        // 백오프
        const delayMs = backoffMs * Math.pow(backoffMultiplier, attempt - 1);
        await this.sleep(delayMs);

        this.logger.warn(`Retry attempt ${attempt}/${maxAttempts}`, {
          error: error.message,
          delayMs
        });
      }
    }

    throw lastError!;
  }
}

// Circuit Breaker (과부하 방지)
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime?: Date;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      // 일정 시간 후 HALF_OPEN으로 전환
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new CircuitBreakerOpenError();
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.logger.error('Circuit breaker opened');
    }
  }
}
```

### 3.6 API 명세 (외부 시스템 연동용)

#### 외부 시스템이 PDCA 시스템으로 데이터 전송 (Push)

```typescript
// POST /api/v1/integrations/kpi-data
// 외부 시스템에서 KPI 데이터 전송
{
  "apiKey": "external_system_api_key",
  "systemId": "academic_system",
  "data": [
    {
      "programCode": "PROG_2025_001",
      "kpiCode": "STD_PARTICIPATION",
      "value": 85,
      "period": "2025-10",
      "metadata": {
        "source": "academic_system",
        "collectedAt": "2025-10-15T10:30:00Z"
      }
    }
  ]
}

// Response
{
  "success": true,
  "processedCount": 1,
  "errors": []
}
```

#### PDCA 시스템이 외부 시스템에서 데이터 가져오기 (Pull)

```typescript
// GET /api/v1/external/academic-system/students
// PDCA → 학사시스템 데이터 요청
{
  "department": "CSE",
  "enrollmentYear": 2025,
  "status": "active"
}

// Response from Academic System
{
  "students": [
    {
      "studentId": "2025001",
      "name": "홍길동",
      "department": "CSE",
      "grade": 3,
      "enrollmentDate": "2023-03-02"
    }
  ],
  "total": 150,
  "page": 1
}
```

### 3.7 연동 모니터링 대시보드

```typescript
// 연동 상태 조회 API
// GET /api/v1/integrations/status

{
  "systems": [
    {
      "systemId": "academic_system",
      "name": "학사정보시스템",
      "status": "healthy",
      "lastSyncAt": "2025-11-03T02:00:00Z",
      "lastSuccessAt": "2025-11-03T02:00:00Z",
      "lastErrorAt": null,
      "statistics": {
        "totalRequests": 1234,
        "successfulRequests": 1230,
        "failedRequests": 4,
        "avgResponseTimeMs": 250
      }
    },
    {
      "systemId": "hr_system",
      "name": "인사시스템",
      "status": "degraded",
      "lastSyncAt": "2025-11-03T01:00:00Z",
      "lastSuccessAt": "2025-11-03T01:00:00Z",
      "lastErrorAt": "2025-11-03T01:30:00Z",
      "statistics": {
        "totalRequests": 567,
        "successfulRequests": 550,
        "failedRequests": 17,
        "avgResponseTimeMs": 1200
      }
    }
  ]
}
```

---

## 4. 데이터베이스 설계

### 4.1 핵심 테이블

```sql
-- 외부 시스템 연동 설정
CREATE TABLE external_systems (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL, -- rest_api, soap, database, file, webhook
  base_url VARCHAR(500),
  api_key_encrypted TEXT,
  config JSON, -- 연결 설정
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 연동 로그
CREATE TABLE integration_logs (
  id SERIAL PRIMARY KEY,
  system_id VARCHAR(50) REFERENCES external_systems(id),
  operation VARCHAR(100), -- fetch_students, send_report 등
  direction VARCHAR(10), -- push, pull
  status VARCHAR(20), -- success, failure, timeout
  request_payload JSON,
  response_payload JSON,
  error_message TEXT,
  execution_time_ms INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 동기화 이력
CREATE TABLE sync_history (
  id SERIAL PRIMARY KEY,
  system_id VARCHAR(50) REFERENCES external_systems(id),
  entity_type VARCHAR(50), -- students, employees, budgets
  sync_type VARCHAR(20), -- full, incremental
  records_processed INT,
  records_success INT,
  records_failed INT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  status VARCHAR(20),
  error_details JSON
);

-- 데이터 매핑 (필드 매핑 정보)
CREATE TABLE field_mappings (
  id SERIAL PRIMARY KEY,
  system_id VARCHAR(50) REFERENCES external_systems(id),
  entity_type VARCHAR(50),
  external_field VARCHAR(100),
  internal_field VARCHAR(100),
  transformation_rule JSON, -- 변환 규칙
  is_required BOOLEAN DEFAULT false
);
```

---

## 5. 프로젝트 구조

```
pdca/
├── frontend/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/      # 대시보드 컴포넌트
│   │   │   ├── program/        # 프로그램 관리
│   │   │   ├── kpi/            # KPI 관리
│   │   │   ├── indicator/      # 지표 관리
│   │   │   ├── formula/        # 산출식 편집기
│   │   │   ├── budget/         # 예산 관리
│   │   │   ├── report/         # 보고서
│   │   │   ├── integration/    # 연동 관리
│   │   │   └── common/         # 공통 컴포넌트
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/           # API 호출
│   │   ├── stores/             # Zustand 스토어
│   │   ├── utils/
│   │   └── types/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                     # Express 백엔드
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # 인증/인가
│   │   │   ├── program/        # 프로그램 관리
│   │   │   ├── kpi/            # KPI 관리
│   │   │   ├── indicator/      # 지표 관리
│   │   │   ├── budget/         # 예산 관리
│   │   │   ├── report/         # 보고서 생성
│   │   │   ├── notification/   # 알림
│   │   │   └── integration/    # 외부 연동 (핵심)
│   │   │       ├── adapters/   # 시스템별 어댑터
│   │   │       │   ├── academic-system.adapter.ts
│   │   │       │   ├── hr-system.adapter.ts
│   │   │       │   └── finance-system.adapter.ts
│   │   │       ├── integration.manager.ts
│   │   │       ├── retry-policy.ts
│   │   │       ├── circuit-breaker.ts
│   │   │       └── webhook.handler.ts
│   │   ├── common/
│   │   │   ├── calculator/     # 산출식 계산 엔진
│   │   │   │   ├── formula-parser.ts
│   │   │   │   ├── calculator.engine.ts
│   │   │   │   └── formula-validator.ts
│   │   │   ├── middlewares/
│   │   │   ├── decorators/
│   │   │   ├── filters/        # 에러 필터
│   │   │   └── interceptors/
│   │   ├── workers/            # 백그라운드 작업
│   │   │   ├── indicator-calculator.worker.ts
│   │   │   ├── report-generator.worker.ts
│   │   │   ├── data-sync.worker.ts
│   │   │   └── notification.worker.ts
│   │   ├── database/
│   │   │   ├── prisma/
│   │   │   │   └── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   ├── config/             # 설정 파일
│   │   │   ├── database.config.ts
│   │   │   ├── redis.config.ts
│   │   │   ├── integration.config.ts
│   │   │   └── app.config.ts
│   │   ├── utils/
│   │   └── app.ts
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                      # 공유 코드
│   ├── types/                  # 공통 타입 정의
│   │   ├── program.types.ts
│   │   ├── kpi.types.ts
│   │   ├── indicator.types.ts
│   │   └── integration.types.ts
│   ├── constants/
│   ├── schemas/                # Zod 스키마
│   └── utils/
│
├── docs/                        # 문서
│   ├── api/                    # API 문서
│   │   ├── internal-api.md     # 내부 API
│   │   └── integration-api.md  # 연동 API
│   ├── integration-guide/      # 연동 가이드
│   │   ├── academic-system.md
│   │   ├── hr-system.md
│   │   └── custom-integration.md
│   └── architecture/
│
├── scripts/                     # 유틸리티 스크립트
│   ├── seed-data.ts
│   └── test-integration.ts
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── .gitignore
├── package.json                 # Root package.json (workspace)
├── README.md
├── ARCHITECTURE.md              # 이 문서
└── INTEGRATION_GUIDE.md         # 연동 가이드
```

---

## 6. 유지관리성 강화 방안

### 6.1 코드 품질 관리

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "interface",
        "format": ["PascalCase"],
        "prefix": ["I"]
      }
    ]
  }
}
```

### 6.2 문서화 전략

1. **코드 문서화**: JSDoc/TSDoc
```typescript
/**
 * 지표를 계산합니다.
 *
 * @param indicatorId - 지표 ID
 * @param period - 계산 기간 (예: "2025-10", "2025-Q1")
 * @returns 계산된 지표 값 및 메타데이터
 * @throws {CalculationError} 계산 중 오류 발생 시
 *
 * @example
 * ```typescript
 * const result = await calculator.calculate('IND_001', '2025-10');
 * console.log(result.value); // 85.5
 * ```
 */
async calculate(indicatorId: string, period: string): Promise<CalculationResult>
```

2. **API 문서화**: OpenAPI/Swagger
3. **아키텍처 문서**: ADR (Architecture Decision Records)
4. **연동 가이드**: 외부 시스템 개발자용

### 6.3 로깅 전략

```typescript
// 구조화된 로깅
logger.info('Calculating indicator', {
  indicatorId: 'IND_001',
  programId: 'PROG_123',
  period: '2025-10',
  userId: 'user123',
  duration: 250
});

// 에러 로깅
logger.error('Integration failed', {
  systemId: 'academic_system',
  operation: 'fetchStudents',
  error: error.message,
  stack: error.stack,
  requestId: req.id
});
```

### 6.4 모니터링

1. **애플리케이션 모니터링**
   - 응답 시간
   - 에러율
   - 메모리/CPU 사용량

2. **연동 모니터링**
   - 외부 시스템 연결 상태
   - API 호출 성공/실패율
   - 평균 응답 시간

3. **비즈니스 메트릭**
   - KPI 입력률
   - 지표 계산 성공률
   - 보고서 생성 건수

---

## 7. 배포 및 운영

### 7.1 환경 구성

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://backend:4000
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://pdca:password@postgres:5432/pdca
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend/logs:/app/logs

  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: npm run worker
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://pdca:password@postgres:5432/pdca
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=pdca
      - POSTGRES_USER=pdca
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

### 7.2 CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        run: |
          docker-compose down
          docker-compose pull
          docker-compose up -d
```

---

## 8. 보안

### 8.1 인증/인가

1. **JWT 기반 인증**
2. **역할 기반 접근 제어 (RBAC)**
3. **API Key 관리** (외부 시스템용)

### 8.2 데이터 보안

1. **암호화**: API Key, 비밀번호 등
2. **SQL Injection 방지**: Prisma ORM 사용
3. **XSS 방지**: 입력 검증 및 이스케이프

---

## 9. 확장 로드맵

### Phase 1: MVP (현재)
- 기본 프로그램/KPI/지표 관리
- 단순 연동 (REST API)

### Phase 2: 고도화
- 복잡한 산출식
- 다양한 연동 방식 지원
- 고급 분석

### Phase 3: 확장
- AI 기반 예측
- 모바일 앱
- 멀티테넌시 (여러 대학 지원)

---

이 아키텍처를 기반으로 프로젝트를 진행하겠습니다.
