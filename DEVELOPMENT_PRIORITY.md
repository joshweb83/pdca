# 개발 우선순위 및 로드맵

PDCA 시스템의 단계별 개발 계획입니다. 우선은 **웹앱 기본 기능**에 집중하고, AI 등 고급 기능은 체계만 갖추어 향후 확장합니다.

---

## 🎯 개발 철학

1. **MVP First**: 핵심 기능부터 빠르게 구현
2. **점진적 개선**: 단계별로 기능 추가
3. **확장 가능**: 향후 AI/고급 기능 추가 용이하도록 설계
4. **사용자 중심**: 실제 사용 가능한 기능부터 개발

---

## 📍 현재 상태

```
✅ 프로젝트 구조 설정
✅ 데이터베이스 스키마 설계
✅ 외부 연동 아키텍처
✅ GitHub 버전 관리
✅ Vercel 배포 설정

🎯 다음: Phase 1 MVP 개발
```

---

## 🚀 Phase 1: MVP (Core Web App) - **최우선 집중** ⭐

> **목표**: 실제 사용 가능한 기본 웹앱 완성
> **기간**: 4-6주

### 1.1 사용자 인증 (Week 1)

**필수 기능:**
- [ ] 회원가입 (이메일 + 비밀번호)
- [ ] 로그인 / 로그아웃
- [ ] JWT 토큰 발급 및 검증
- [ ] 비밀번호 암호화 (bcrypt)

**구현 위치:**
- `backend/src/modules/auth/`
- `frontend/src/pages/auth/`

**보류:**
- ❌ 소셜 로그인 (Google, Kakao 등)
- ❌ 2FA (Two-Factor Authentication)
- ❌ 비밀번호 찾기/재설정 (나중에 추가)

### 1.2 부서/학과 관리 (Week 1)

**필수 기능:**
- [ ] 부서/학과 목록 조회
- [ ] 부서/학과 등록/수정
- [ ] 계층 구조 (상위/하위 부서)

**구현 위치:**
- `backend/src/modules/department/`
- `frontend/src/pages/department/`

### 1.3 프로그램 관리 (Week 2)

**필수 기능:**
- [ ] 프로그램 등록 (기본 정보)
  - 프로그램명, 목적, 담당자
  - 시작/종료일
  - 총 예산
- [ ] 프로그램 목록 (필터링, 검색)
- [ ] 프로그램 상세 조회
- [ ] 프로그램 수정/삭제
- [ ] 상태 변경 (계획 → 진행 → 완료)

**구현 위치:**
- `backend/src/modules/program/`
- `frontend/src/pages/program/`

**보류:**
- ❌ 프로그램 템플릿
- ❌ 일괄 업로드 (나중에 추가)

### 1.4 KPI 관리 (Week 2-3)

**필수 기능:**
- [ ] KPI 정의 (마스터 데이터)
  - KPI 코드, 이름, 단위
  - 측정 주기
- [ ] 프로그램별 KPI 선택/추가
- [ ] KPI 값 입력 (월별/분기별)
- [ ] KPI 입력 이력 조회
- [ ] 단순 검증 (필수값, 범위)

**구현 위치:**
- `backend/src/modules/kpi/`
- `frontend/src/pages/kpi/`

**보류:**
- ❌ 엑셀 일괄 업로드
- ❌ 외부 시스템 자동 연동
- ❌ 고급 검증 규칙

### 1.5 지표 관리 - 단순 버전 (Week 3-4)

**필수 기능:**
- [ ] 지표 정의 (4대 자율성과지표)
- [ ] **단순 산출식만 지원** (우선)
  - 비율: `(A / B) × 100`
  - 평균: `(A + B + C) / 3`
  - 가중평균: `(A×0.3 + B×0.7)`
- [ ] 프로그램별 지표 목표값 설정
- [ ] **수동 계산** (버튼 클릭 시)
- [ ] 지표 값 조회

**구현 위치:**
- `backend/src/modules/indicator/`
- `backend/src/common/calculator/` (단순 버전)
- `frontend/src/pages/indicator/`

**보류:**
- ❌ 복잡한 산출식 (IF문, CASE문 등)
- ❌ 시각적 산출식 편집기
- ❌ 실시간 자동 계산
- ❌ 산출식 시뮬레이션
- ❌ 의존성 분석

### 1.6 기본 대시보드 (Week 4)

**필수 기능:**
- [ ] 프로그램 현황 요약
  - 전체 프로그램 수
  - 진행 중인 프로그램
  - 완료된 프로그램
- [ ] 내 담당 프로그램 목록
- [ ] KPI 입력 현황 (입력률)
- [ ] 지표 달성률 (간단한 차트)

**구현 위치:**
- `frontend/src/pages/dashboard/`

**보류:**
- ❌ 실시간 업데이트
- ❌ 고급 차트 (다차원 분석)
- ❌ 맞춤형 위젯

### 1.7 예산 관리 - 기본 (Week 5)

**필수 기능:**
- [ ] 예산 항목 등록 (비목별)
- [ ] 예산 집행 내역 등록
- [ ] 집행률 조회 (단순 계산)

**구현 위치:**
- `backend/src/modules/budget/`
- `frontend/src/pages/budget/`

**보류:**
- ❌ 증빙 서류 업로드
- ❌ 승인 프로세스
- ❌ 예산 이관/변경

### 1.8 기본 보고서 (Week 5-6)

**필수 기능:**
- [ ] 프로그램 성과 보고서 (HTML)
- [ ] 엑셀 내보내기 (기본)

**구현 위치:**
- `backend/src/modules/report/`
- `frontend/src/pages/report/`

**보류:**
- ❌ PDF 생성
- ❌ 템플릿 편집기
- ❌ 자동 보고서 생성

### 1.9 권한 관리 (Week 6)

**필수 기능:**
- [ ] 역할 기반 접근 제어 (RBAC)
  - ADMIN: 모든 권한
  - MANAGER: 부서 관리
  - USER: 프로그램 입력
  - VIEWER: 조회만
- [ ] 자신의 프로그램만 수정 가능

**구현 위치:**
- `backend/src/common/middlewares/auth.middleware.ts`

**보류:**
- ❌ 세밀한 권한 설정
- ❌ 동적 권한 관리

---

## 🔮 Phase 2: 고급 기능 (체계만 준비) - **향후 확장**

> **목표**: Phase 1 완성 후 추가
> **기간**: 6-8주

### 2.1 고급 산출식 엔진 ⚡

**확장 포인트:**
- `backend/src/common/calculator/formula-parser.ts`
- `backend/src/common/calculator/formula-validator.ts`

**구현 예정:**
- [ ] 복잡한 산출식 지원
  - IF, CASE, 조건문
  - SUM, AVG, MAX, MIN 등 함수
  - 중첩 수식
- [ ] 시각적 산출식 편집기 (Frontend)
- [ ] 산출식 시뮬레이션
- [ ] 의존성 자동 분석
- [ ] 실시간 자동 계산 (KPI 입력 시)

**데이터 구조:**
```typescript
// 이미 DB 스키마에 포함됨
interface Indicator {
  formula: string;           // 텍스트 수식
  formulaJson: Json;         // 파싱된 AST
  dependencies: KPI[];       // 의존 KPI 목록
}
```

### 2.2 외부 시스템 연동 🔗

**확장 포인트:**
- `backend/src/modules/integration/`

**구현 예정:**
- [ ] 학사정보시스템 연동 (학생 데이터)
- [ ] 인사시스템 연동 (교직원 데이터)
- [ ] 재무시스템 연동 (예산 데이터)
- [ ] 자동 데이터 동기화
- [ ] 연동 모니터링 대시보드

**현재 상태:**
- ✅ Adapter 패턴 구조 완성
- ✅ BaseAdapter 구현 완료
- ✅ IntegrationManager 준비
- ⏳ 실제 시스템 연동 대기

### 2.3 PDCA 환류 관리 📊

**확장 포인트:**
- `backend/src/modules/feedback/`
- DB 테이블: `feedback_tasks`

**구현 예정:**
- [ ] 성과 분석 (자동 이슈 감지)
- [ ] 개선 과제 등록
- [ ] 개선 활동 추적
- [ ] 환류 보고서

### 2.4 고급 대시보드 & 분석 📈

**구현 예정:**
- [ ] 실시간 업데이트 (WebSocket)
- [ ] 다차원 분석
  - 부서별 비교
  - 기간별 추이
  - 프로그램 간 비교
- [ ] 맞춤형 위젯
- [ ] 드릴다운 분석

### 2.5 알림 시스템 🔔

**확장 포인트:**
- `backend/src/modules/notification/`
- DB 테이블: `notifications`

**구현 예정:**
- [ ] 이메일 알림
- [ ] 웹 푸시 알림
- [ ] KPI 입력 리마인더
- [ ] 목표 미달 경고
- [ ] 승인 요청 알림

---

## 🤖 Phase 3: AI 기능 (체계만 준비) - **미래 확장**

> **목표**: AI를 활용한 지능형 성과 관리
> **기간**: 추후 결정

### 3.1 AI 기반 성과 예측 🔮

**확장 포인트:**
- `backend/src/modules/ai/prediction/`

**구현 예정:**
- [ ] 과거 데이터 기반 성과 예측
- [ ] 목표 달성 가능성 예측
- [ ] 리스크 조기 감지

**필요 기술:**
- Python FastAPI 마이크로서비스
- scikit-learn / TensorFlow
- 시계열 분석 모델

### 3.2 AI 보고서 자동 생성 📝

**확장 포인트:**
- `backend/src/modules/ai/report-generator/`

**구현 예정:**
- [ ] GPT 기반 성과 분석 요약
- [ ] 자동 개선 제안 생성
- [ ] 자연어 보고서 작성

**필요 기술:**
- OpenAI API / Claude API
- 프롬프트 엔지니어링

### 3.3 AI 산출식 추천 🎯

**구현 예정:**
- [ ] 프로그램 유형별 적합한 KPI 추천
- [ ] 유사 프로그램 분석
- [ ] 산출식 자동 생성

### 3.4 자연어 쿼리 💬

**구현 예정:**
- [ ] "작년 대비 참여율이 가장 많이 증가한 프로그램은?"
- [ ] 자연어로 대시보드 조회
- [ ] 챗봇 인터페이스

**필요 기술:**
- LangChain
- Vector Database (Pinecone/Chroma)
- RAG (Retrieval-Augmented Generation)

---

## 🏗️ 확장 가능한 아키텍처

### AI 서비스 분리 (마이크로서비스)

```
┌─────────────────┐
│  Frontend       │
│  (React)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Backend API    │──────│  AI Service      │
│  (Node.js)      │      │  (Python/FastAPI)│
│  - CRUD         │      │  - 예측 모델     │
│  - 기본 계산    │      │  - GPT 연동      │
│  - 인증         │      │  - 추천 시스템   │
└────────┬────────┘      └──────────────────┘
         │
         ▼
┌─────────────────┐
│  Database       │
│  (PostgreSQL)   │
└─────────────────┘
```

### 확장 포인트 정리

```typescript
// backend/src/modules/ai/index.ts (미래 구현)
export interface AIService {
  predict(programId: string): Promise<Prediction>;
  generateReport(programId: string): Promise<Report>;
  recommendKPIs(programType: string): Promise<KPI[]>;
  chat(query: string): Promise<string>;
}

// 플러그인 방식으로 쉽게 추가
class AIServiceManager {
  registerService(name: string, service: AIService): void;
  getService(name: string): AIService;
}
```

---

## 📋 개발 체크리스트

### Phase 1 MVP (진행 중)

**Backend API:**
- [ ] 인증 (Auth)
- [ ] 부서 관리 (Department)
- [ ] 프로그램 관리 (Program)
- [ ] KPI 관리 (KPI)
- [ ] 지표 관리 - 단순 버전 (Indicator)
- [ ] 예산 관리 - 기본 (Budget)
- [ ] 보고서 - 기본 (Report)

**Frontend:**
- [ ] 로그인/회원가입 페이지
- [ ] 대시보드 (기본)
- [ ] 프로그램 목록/상세
- [ ] KPI 입력 화면
- [ ] 지표 설정 화면
- [ ] 예산 관리 화면

**Database:**
- [x] Prisma 스키마 완성
- [ ] 초기 마이그레이션
- [ ] 시드 데이터

**배포:**
- [x] Vercel 설정
- [x] GitHub Actions
- [ ] Backend 배포 (Railway/Render)
- [ ] 환경 변수 설정

### Phase 2 (보류)

- [ ] 고급 산출식 엔진
- [ ] 외부 시스템 연동 (실제 구현)
- [ ] PDCA 환류
- [ ] 고급 대시보드
- [ ] 알림 시스템

### Phase 3 (보류)

- [ ] AI 예측 모델
- [ ] AI 보고서 생성
- [ ] AI 추천 시스템
- [ ] 자연어 쿼리

---

## 🎯 즉시 시작할 작업

### 1단계: Backend API 기본 구조

```bash
cd backend

# Auth 모듈
mkdir -p src/modules/auth/{controllers,services,middlewares}
touch src/modules/auth/auth.controller.ts
touch src/modules/auth/auth.service.ts
touch src/modules/auth/auth.routes.ts

# Program 모듈
mkdir -p src/modules/program/{controllers,services}
touch src/modules/program/program.controller.ts
touch src/modules/program/program.service.ts
touch src/modules/program/program.routes.ts

# KPI 모듈
mkdir -p src/modules/kpi/{controllers,services}
touch src/modules/kpi/kpi.controller.ts
touch src/modules/kpi/kpi.service.ts
touch src/modules/kpi/kpi.routes.ts
```

### 2단계: Frontend 페이지 구조

```bash
cd frontend

# Auth 페이지
mkdir -p src/pages/auth
touch src/pages/auth/LoginPage.tsx
touch src/pages/auth/RegisterPage.tsx

# Dashboard
touch src/pages/dashboard/DashboardPage.tsx

# Program
mkdir -p src/pages/program
touch src/pages/program/ProgramListPage.tsx
touch src/pages/program/ProgramDetailPage.tsx
touch src/pages/program/ProgramFormPage.tsx
```

### 3단계: Database 초기화

```bash
cd backend

# Prisma 마이그레이션
npm run prisma:migrate

# 시드 데이터 생성
npm run prisma:seed
```

---

## 📚 관련 문서

- **전체 아키텍처**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **배포 가이드**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **빠른 배포**: [QUICKSTART_DEPLOYMENT.md](./QUICKSTART_DEPLOYMENT.md)
- **프로젝트 개요**: [README.md](./README.md)

---

## 💡 개발 원칙

### DO ✅
- 단순하고 명확한 코드
- 재사용 가능한 컴포넌트
- 적절한 에러 처리
- 의미 있는 커밋 메시지
- 기능별 PR

### DON'T ❌
- 과도한 추상화 (YAGNI - You Aren't Gonna Need It)
- 불필요한 최적화
- 미사용 코드
- 복잡한 의존성

---

**Phase 1 MVP에 집중하여 실제 사용 가능한 웹앱을 먼저 완성합시다! 🚀**

질문이나 논의할 사항이 있으면 언제든 말씀해주세요!
