# 향후 확장 기능 가이드

PDCA 시스템의 미래 확장을 위한 설계 문서입니다. 현재는 구현하지 않지만, 체계적으로 확장 가능하도록 준비되어 있습니다.

---

## 🎯 확장 철학

1. **플러그인 아키텍처**: 기존 코드 수정 최소화
2. **마이크로서비스**: AI/고급 기능은 별도 서비스로
3. **명확한 인터페이스**: 확장 포인트 표준화
4. **점진적 추가**: 필요할 때 추가

---

## 🤖 AI 기능 확장

### 1. AI 서비스 아키텍처

#### 현재 구조
```
Frontend ← → Backend (Node.js) ← → Database
```

#### 확장 후 구조
```
                    ┌─────────────────┐
                    │   Frontend      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  API Gateway    │
                    │  (Node.js)      │
                    └────┬───────┬────┘
                         │       │
          ┌──────────────┘       └──────────────┐
          ▼                                     ▼
┌─────────────────┐                  ┌─────────────────┐
│  Core Services  │                  │  AI Services    │
│  (Node.js)      │                  │  (Python)       │
│  - Auth         │                  │  - Prediction   │
│  - CRUD         │                  │  - GPT API      │
│  - Basic Calc   │                  │  - ML Models    │
└────────┬────────┘                  └────────┬────────┘
         │                                    │
         └──────────────┬─────────────────────┘
                        ▼
                ┌─────────────────┐
                │   PostgreSQL    │
                │   + Redis       │
                └─────────────────┘
```

### 2. AI 서비스 인터페이스

```typescript
// backend/src/modules/ai/ai.interface.ts (미래 구현)

/**
 * AI 서비스 표준 인터페이스
 */
export interface IAIService {
  // 초기화
  initialize(): Promise<void>;

  // 헬스체크
  healthCheck(): Promise<boolean>;
}

/**
 * 예측 서비스
 */
export interface IPredictionService extends IAIService {
  /**
   * 프로그램 성과 예측
   * @param programId 프로그램 ID
   * @param months 예측 기간 (월)
   * @returns 예측 결과
   */
  predictPerformance(
    programId: string,
    months: number
  ): Promise<PredictionResult>;

  /**
   * 목표 달성 가능성 예측
   */
  predictGoalAchievement(
    programId: string,
    targetValue: number
  ): Promise<{
    probability: number; // 0-1
    expectedValue: number;
    confidence: number;
  }>;

  /**
   * 리스크 분석
   */
  analyzeRisks(programId: string): Promise<Risk[]>;
}

/**
 * GPT 보고서 생성 서비스
 */
export interface IReportGeneratorService extends IAIService {
  /**
   * 성과 분석 요약 생성
   */
  generateSummary(
    programId: string,
    period: string
  ): Promise<string>;

  /**
   * 개선 제안 생성
   */
  generateImprovements(
    programId: string,
    issues: string[]
  ): Promise<Improvement[]>;

  /**
   * 전체 보고서 생성
   */
  generateFullReport(
    programId: string,
    template: ReportTemplate
  ): Promise<Report>;
}

/**
 * 추천 서비스
 */
export interface IRecommendationService extends IAIService {
  /**
   * KPI 추천
   */
  recommendKPIs(
    programType: string,
    department: string
  ): Promise<KPIRecommendation[]>;

  /**
   * 산출식 추천
   */
  recommendFormula(
    indicatorType: string,
    availableKPIs: string[]
  ): Promise<FormulaRecommendation[]>;

  /**
   * 유사 프로그램 찾기
   */
  findSimilarPrograms(
    programId: string,
    limit: number
  ): Promise<Program[]>;
}

/**
 * 자연어 쿼리 서비스
 */
export interface INLQueryService extends IAIService {
  /**
   * 자연어 쿼리 처리
   */
  query(question: string): Promise<QueryResult>;

  /**
   * 대화형 챗봇
   */
  chat(
    message: string,
    conversationId?: string
  ): Promise<ChatResponse>;
}
```

### 3. AI 서비스 구현 예시 (Python FastAPI)

```python
# ai-service/app/main.py (미래 구현)
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import openai
from typing import List, Optional

app = FastAPI(title="PDCA AI Service")

# 모델 로드 (시작 시)
prediction_model = None

@app.on_event("startup")
async def load_models():
    global prediction_model
    prediction_model = joblib.load("models/performance_predictor.pkl")

# Health Check
@app.get("/health")
async def health_check():
    return {"status": "ok", "model_loaded": prediction_model is not None}

# 1. 성과 예측
class PredictionRequest(BaseModel):
    program_id: str
    months: int
    historical_data: List[dict]

@app.post("/predict/performance")
async def predict_performance(request: PredictionRequest):
    try:
        # 데이터 전처리
        features = preprocess_data(request.historical_data)

        # 예측
        predictions = prediction_model.predict(features)

        return {
            "program_id": request.program_id,
            "predictions": predictions.tolist(),
            "confidence": calculate_confidence(predictions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 2. GPT 보고서 생성
class ReportRequest(BaseModel):
    program_id: str
    program_name: str
    indicators: List[dict]
    period: str

@app.post("/generate/summary")
async def generate_summary(request: ReportRequest):
    try:
        prompt = f"""
        다음 프로그램의 성과를 분석하고 요약해주세요:

        프로그램명: {request.program_name}
        기간: {request.period}

        성과 지표:
        {format_indicators(request.indicators)}

        다음을 포함해주세요:
        1. 주요 성과 요약
        2. 목표 달성 여부
        3. 개선이 필요한 부분
        """

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )

        return {
            "summary": response.choices[0].message.content,
            "model": "gpt-4"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 3. KPI 추천
@app.post("/recommend/kpis")
async def recommend_kpis(
    program_type: str,
    department: str
):
    # 유사 프로그램에서 많이 사용된 KPI 추천
    recommendations = get_kpi_recommendations(program_type, department)
    return {"recommendations": recommendations}

# 4. 자연어 쿼리
class QueryRequest(BaseModel):
    question: str
    context: Optional[dict] = None

@app.post("/query")
async def natural_language_query(request: QueryRequest):
    try:
        # 질문을 SQL이나 API 호출로 변환
        parsed_query = parse_nl_to_query(request.question)

        # 결과 반환
        return {
            "question": request.question,
            "answer": execute_query(parsed_query),
            "query_type": parsed_query["type"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 4. Node.js에서 AI 서비스 호출

```typescript
// backend/src/modules/ai/ai.client.ts (미래 구현)

import axios, { AxiosInstance } from 'axios';

export class AIServiceClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
      timeout: 60000, // AI 연산은 오래 걸릴 수 있음
    });
  }

  /**
   * 성과 예측
   */
  async predictPerformance(
    programId: string,
    months: number,
    historicalData: any[]
  ): Promise<any> {
    const response = await this.client.post('/predict/performance', {
      program_id: programId,
      months,
      historical_data: historicalData,
    });
    return response.data;
  }

  /**
   * GPT 보고서 생성
   */
  async generateSummary(
    programId: string,
    programName: string,
    indicators: any[],
    period: string
  ): Promise<string> {
    const response = await this.client.post('/generate/summary', {
      program_id: programId,
      program_name: programName,
      indicators,
      period,
    });
    return response.data.summary;
  }

  /**
   * KPI 추천
   */
  async recommendKPIs(
    programType: string,
    department: string
  ): Promise<any[]> {
    const response = await this.client.post('/recommend/kpis', {
      program_type: programType,
      department,
    });
    return response.data.recommendations;
  }

  /**
   * 자연어 쿼리
   */
  async query(question: string, context?: any): Promise<any> {
    const response = await this.client.post('/query', {
      question,
      context,
    });
    return response.data;
  }
}

// Singleton
export const aiClient = new AIServiceClient();
```

### 5. 확장 시 필요한 패키지

#### Python AI Service
```bash
# requirements.txt
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
openai==1.3.5
scikit-learn==1.3.2
pandas==2.1.3
numpy==1.26.2
joblib==1.3.2
langchain==0.0.340
chromadb==0.4.18  # Vector DB for RAG
```

#### Node.js Backend (AI 연동)
```json
{
  "dependencies": {
    "axios": "^1.6.2",
    "@langchain/core": "^0.1.0"
  }
}
```

---

## 📊 고급 분석 기능 확장

### 1. 실시간 대시보드 (WebSocket)

```typescript
// backend/src/modules/realtime/socket.manager.ts (미래 구현)

import { Server } from 'socket.io';

export class SocketManager {
  private io: Server;

  constructor(server: any) {
    this.io = new Server(server, {
      cors: { origin: process.env.CORS_ORIGIN }
    });

    this.setupHandlers();
  }

  private setupHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // 프로그램 모니터링 구독
      socket.on('subscribe:program', (programId: string) => {
        socket.join(`program:${programId}`);
      });

      // KPI 입력 시 실시간 업데이트
      socket.on('kpi:updated', (data) => {
        this.io.to(`program:${data.programId}`).emit('kpi:changed', data);
      });
    });
  }

  // 지표 계산 완료 시 알림
  notifyIndicatorCalculated(programId: string, indicator: any) {
    this.io.to(`program:${programId}`).emit('indicator:calculated', indicator);
  }
}
```

### 2. 고급 차트 컴포넌트

```typescript
// frontend/src/components/charts/AdvancedChart.tsx (미래 구현)

import { Line, Bar, Radar, Scatter } from 'recharts';

interface AdvancedChartProps {
  type: 'line' | 'bar' | 'radar' | 'scatter';
  data: any[];
  dimensions: string[];
  metrics: string[];
  interactive?: boolean;
}

export const AdvancedChart: React.FC<AdvancedChartProps> = ({
  type,
  data,
  dimensions,
  metrics,
  interactive = true
}) => {
  // 다차원 분석
  // 드릴다운
  // 필터링
  // 확대/축소
  // CSV 내보내기

  return (
    <div className="advanced-chart">
      {/* 구현 */}
    </div>
  );
};
```

---

## 🔗 고급 외부 연동 확장

### 1. Webhook 수신 서버

```typescript
// backend/src/modules/integration/webhook.handler.ts (미래 구현)

import { Request, Response } from 'express';
import crypto from 'crypto';

export class WebhookHandler {
  /**
   * 외부 시스템에서 Webhook 수신
   */
  async handleWebhook(req: Request, res: Response) {
    // 서명 검증
    if (!this.verifySignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { event, data } = req.body;

    try {
      switch (event) {
        case 'student.enrolled':
          await this.handleStudentEnrolled(data);
          break;

        case 'student.graduated':
          await this.handleStudentGraduated(data);
          break;

        case 'budget.updated':
          await this.handleBudgetUpdated(data);
          break;

        default:
          console.warn('Unknown webhook event:', event);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private verifySignature(req: Request): boolean {
    const signature = req.headers['x-webhook-signature'];
    const payload = JSON.stringify(req.body);
    const secret = process.env.WEBHOOK_SECRET!;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }
}
```

### 2. 배치 동기화 작업

```typescript
// backend/src/workers/sync.worker.ts (미래 구현)

import { Queue, Worker } from 'bullmq';

const syncQueue = new Queue('data-sync', {
  connection: { /* Redis */ }
});

// Worker
new Worker('data-sync', async (job) => {
  const { systemId, entityType } = job.data;

  switch (entityType) {
    case 'students':
      await syncStudentData(systemId);
      break;

    case 'budgets':
      await syncBudgetData(systemId);
      break;
  }
}, {
  connection: { /* Redis */ },
  concurrency: 5
});

// 스케줄링
async function scheduleSync() {
  // 매일 새벽 2시 동기화
  await syncQueue.add('daily-sync', {
    systemId: 'academic_system',
    entityType: 'students'
  }, {
    repeat: { cron: '0 2 * * *' }
  });
}
```

---

## 📱 모바일 앱 확장

### React Native 구조

```
mobile/
├── src/
│   ├── screens/
│   │   ├── DashboardScreen.tsx
│   │   ├── ProgramListScreen.tsx
│   │   └── KPIInputScreen.tsx
│   ├── components/
│   ├── services/
│   │   └── api.ts  (Backend API 재사용)
│   └── navigation/
├── ios/
├── android/
└── package.json
```

### API 재사용

```typescript
// mobile/src/services/api.ts
import { apiClient } from '@pdca/shared/api';  // 공통 API 클라이언트

// Backend API를 그대로 사용
export const programService = {
  getPrograms: () => apiClient.get('/api/v1/programs'),
  getProgram: (id: string) => apiClient.get(`/api/v1/programs/${id}`),
  // ...
};
```

---

## 🔐 고급 보안 기능

### 1. 2FA (Two-Factor Authentication)

```typescript
// backend/src/modules/auth/2fa.service.ts (미래 구현)

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class TwoFactorService {
  async generateSecret(userId: string) {
    const secret = speakeasy.generateSecret({
      name: `PDCA (${userId})`
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    return { secret: secret.base32, qrCode };
  }

  verify(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token
    });
  }
}
```

### 2. 감사 로그 고급 분석

```typescript
// backend/src/modules/audit/analyzer.ts (미래 구현)

export class AuditAnalyzer {
  /**
   * 이상 행동 감지
   */
  async detectAnomalies(userId: string): Promise<Anomaly[]> {
    // 비정상적인 접근 패턴 감지
    // 대량 데이터 다운로드 감지
    // 권한 밖 접근 시도 감지
  }

  /**
   * 사용 패턴 분석
   */
  async analyzeUsagePatterns(): Promise<UsageReport> {
    // 가장 많이 사용되는 기능
    // 피크 타임
    // 부서별 사용 통계
  }
}
```

---

## 📦 확장 시 설치할 패키지

### AI/ML 관련
```bash
# Python
pip install fastapi uvicorn openai scikit-learn pandas
pip install langchain chromadb tensorflow

# Node.js
npm install @langchain/core axios
```

### 실시간 기능
```bash
npm install socket.io socket.io-client
```

### 고급 분석
```bash
npm install d3 recharts visx
```

### 모바일
```bash
npx react-native init PDCAMobile
npm install @react-navigation/native
```

---

## 🗺️ 확장 로드맵

```
Phase 1 (현재)
└── 기본 웹앱

Phase 2 (3-6개월)
├── 고급 산출식 엔진
├── 외부 시스템 연동 (실제)
└── 고급 대시보드

Phase 3 (6-12개월)
├── AI 예측 모델
├── GPT 보고서 생성
└── 실시간 알림

Phase 4 (12개월+)
├── 모바일 앱
├── 자연어 쿼리
└── 완전 자동화
```

---

## 💡 확장 시 고려사항

### 성능
- AI 서비스는 캐싱 필수
- 예측 결과는 일정 기간 재사용
- 배치 처리로 부하 분산

### 비용
- OpenAI API 비용 관리
- 서버 리소스 모니터링
- 필요시 스케일아웃

### 보안
- AI 서비스 API 인증
- 민감 데이터 암호화
- 감사 로그 철저

---

**현재는 Phase 1에 집중하고, 필요할 때 단계적으로 확장하세요! 🚀**
