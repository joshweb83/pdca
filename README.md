# PDCA - 대학 성과관리 시스템

프로그램 기반 대학 성과관리 툴입니다. 부서/학과가 운영하는 프로그램별로 KPI를 관리하고, 산출식 기반 지표를 통해 성과를 모니터링하며, PDCA 사이클로 환류합니다.

## 📋 주요 기능

### 1. 프로그램 중심 관리
- 부서/학과별 프로그램 등록 및 운영
- 프로그램 목표, 일정, 예산, 담당자 관리
- 프로그램 상태 추적 (계획/진행/완료)

### 2. KPI (성과 요소) 관리
- 원시 데이터로서의 KPI 정의 및 입력
- 다양한 측정 단위 및 주기 지원
- 입력 이력 및 검증 시스템

### 3. 지표 (산출식) 관리
- **4대 자율성과지표** 운영
- KPI를 활용한 복잡한 산출식 설계
- 실시간 자동 계산 엔진
- 산출식 버전 관리 및 시뮬레이션

### 4. 성과 모니터링
- 실시간 KPI 달성률 추적
- 목표 대비 실적 비교 및 시각화
- 프로그램별/부서별 성과 비교
- 이슈 및 리스크 관리

### 5. 예산 관리
- 예산 편성 및 집행 관리
- 집행률 분석 및 모니터링
- 증빙 서류 관리

### 6. 외부 시스템 연동 ⭐
- **양방향 API 연동** (학사/인사/재무 시스템 등)
- Adapter 패턴 기반 확장 가능한 구조
- 재시도 로직 및 에러 처리
- 연동 상태 실시간 모니터링

### 7. PDCA 환류
- 성과 분석 및 개선 과제 관리
- 문제점 식별 및 근본 원인 분석
- 개선 활동 추적

### 8. 보고서 자동 생성
- 프로그램별/부서별 성과 보고서
- 엑셀/PDF 내보내기
- 맞춤형 보고서 템플릿

---

## 🏗️ 기술 스택

### Frontend
- **React 18** + TypeScript
- **TanStack Query** - 서버 상태 관리
- **Zustand** - 클라이언트 상태 관리
- **TailwindCSS** + shadcn/ui - UI 프레임워크
- **Recharts** - 데이터 시각화
- **Vite** - 빌드 도구

### Backend
- **Node.js 20** + TypeScript
- **Express.js** - API 서버
- **Prisma ORM** - 데이터베이스 ORM
- **PostgreSQL 16** - 메인 데이터베이스
- **Redis 7** - 캐싱 및 작업 큐
- **BullMQ** - 백그라운드 작업 처리
- **Winston** - 로깅

### Infrastructure
- **Docker** + Docker Compose
- **Nginx** - 리버스 프록시
- **GitHub Actions** - CI/CD (예정)

---

## 🚀 빠른 시작

### 사전 요구사항
- Node.js >= 20.0.0
- Docker & Docker Compose
- Git

### 1. 저장소 클론
```bash
git clone <repository-url>
cd pdca
```

### 2. 환경 변수 설정
```bash
# Backend 환경 변수
cp backend/.env.example backend/.env
# 필요한 환경 변수 값 수정

# Frontend 환경 변수
cp frontend/.env.example frontend/.env
```

### 3. Docker로 실행 (권장)
```bash
# 모든 서비스 시작 (PostgreSQL, Redis, Backend, Frontend, Worker)
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 종료
docker-compose down
```

서비스가 시작되면:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Documentation: http://localhost:4000/api

### 4. 로컬 개발 환경 (Docker 없이)

#### 데이터베이스만 Docker로 실행
```bash
docker-compose -f docker-compose.dev.yml up -d
```

#### 의존성 설치
```bash
npm install
```

#### Prisma 설정
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

#### 개발 서버 실행
```bash
# Root에서 Frontend + Backend 동시 실행
npm run dev

# 또는 개별 실행
npm run dev -w frontend  # Frontend만
npm run dev -w backend   # Backend만
```

---

## 📁 프로젝트 구조

```
pdca/
├── frontend/                # React Frontend
│   ├── src/
│   │   ├── components/      # UI 컴포넌트
│   │   │   ├── dashboard/   # 대시보드
│   │   │   ├── program/     # 프로그램 관리
│   │   │   ├── kpi/         # KPI 관리
│   │   │   ├── indicator/   # 지표 관리
│   │   │   ├── formula/     # 산출식 편집기
│   │   │   ├── budget/      # 예산 관리
│   │   │   ├── report/      # 보고서
│   │   │   └── integration/ # 연동 관리
│   │   ├── pages/           # 페이지 컴포넌트
│   │   ├── hooks/           # Custom Hooks
│   │   ├── services/        # API 호출
│   │   ├── stores/          # 상태 관리
│   │   └── utils/
│   └── package.json
│
├── backend/                 # Express Backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/        # 인증/인가
│   │   │   ├── program/     # 프로그램 관리
│   │   │   ├── kpi/         # KPI 관리
│   │   │   ├── indicator/   # 지표 관리
│   │   │   ├── budget/      # 예산 관리
│   │   │   ├── report/      # 보고서
│   │   │   └── integration/ # 외부 연동 ⭐
│   │   │       ├── adapters/         # 시스템별 어댑터
│   │   │       ├── integration.manager.ts
│   │   │       └── retry-policy.ts
│   │   ├── common/
│   │   │   ├── calculator/  # 산출식 계산 엔진
│   │   │   └── logger.ts
│   │   ├── workers/         # 백그라운드 작업
│   │   ├── database/
│   │   │   └── prisma/
│   │   │       └── schema.prisma  # DB 스키마 ⭐
│   │   └── app.ts
│   └── package.json
│
├── shared/                  # 공유 타입 및 유틸
│   ├── types/
│   ├── constants/
│   └── schemas/
│
├── docs/                    # 문서
│   ├── api/                 # API 문서
│   ├── integration-guide/   # 연동 가이드
│   └── architecture/
│
├── docker-compose.yml       # Docker 구성
├── ARCHITECTURE.md          # 아키텍처 문서 ⭐
└── README.md               # 이 파일
```

---

## 🔗 외부 시스템 연동

### 지원하는 연동 방식
1. **REST API** (우선)
2. **SOAP/XML** (레거시 지원)
3. **Database Direct Connection** (제한적)
4. **File Transfer** (CSV/Excel)
5. **Webhook** (실시간 푸시)

### 연동 시스템 예시
- 학사정보시스템 (학생 정보, 수강 정보)
- 인사시스템 (교직원 정보)
- 재무시스템 (예산 정보)

### 새로운 시스템 연동 추가

1. **Adapter 구현**
```typescript
// backend/src/modules/integration/adapters/your-system.adapter.ts
import { BaseAdapter } from './base.adapter';

export class YourSystemAdapter extends BaseAdapter {
  async fetchData(params: any): Promise<any> {
    const response = await this.fetchData('/your-endpoint', params);
    return this.transform(response);
  }

  protected transform(data: any): any {
    // 데이터 변환 로직
    return data;
  }
}
```

2. **Adapter 등록**
```typescript
import { integrationManager } from './integration.manager';
import { YourSystemAdapter } from './adapters/your-system.adapter';

const adapter = new YourSystemAdapter({
  systemId: 'your_system',
  baseUrl: process.env.YOUR_SYSTEM_URL!,
  apiKey: process.env.YOUR_SYSTEM_API_KEY,
});

integrationManager.registerAdapter('your_system', adapter);
```

자세한 내용은 [연동 가이드](./docs/integration-guide/)를 참고하세요.

---

## 🗄️ 데이터베이스

### Prisma 마이그레이션
```bash
# 개발 환경 마이그레이션 생성 및 적용
npm run prisma:migrate -w backend

# 프로덕션 마이그레이션 적용
npm run prisma:migrate:prod -w backend

# Prisma Studio (DB GUI)
npm run prisma:studio -w backend
```

### 핵심 테이블
- `users` - 사용자
- `departments` - 부서/학과
- `programs` - 프로그램
- `kpis` - KPI 정의
- `kpi_values` - KPI 입력 값
- `indicators` - 지표 정의
- `indicator_values` - 지표 계산 결과
- `external_systems` - 외부 시스템 연동 설정 ⭐
- `integration_logs` - 연동 로그 ⭐
- `budget_items` - 예산 항목
- `feedback_tasks` - 환류 과제

---

## 🧪 테스트

```bash
# 단위 테스트
npm test

# 커버리지
npm run test:cov

# 특정 패키지 테스트
npm test -w backend
npm test -w frontend
```

---

## 📚 주요 문서

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** ⭐ - 전체 시스템 아키텍처 및 외부 연동 설계
2. **[API 문서](./docs/api/)** - REST API 명세
3. **[연동 가이드](./docs/integration-guide/)** - 외부 시스템 연동 방법
4. **산출식 가이드** - KPI 산출식 작성 방법

---

## 🛠️ 개발 가이드

### 코드 스타일
```bash
# Lint 검사
npm run lint

# Lint 자동 수정
npm run lint:fix
```

### 타입 검사
```bash
npm run type-check -w frontend
```

### Git 워크플로우
1. Feature 브랜치 생성 (`feature/기능명`)
2. 개발 및 커밋
3. Pull Request 생성
4. 리뷰 후 Merge

---

## 🌟 주요 특징

### 1. 유지보수성
- ✅ TypeScript 엄격 모드
- ✅ 모듈화된 구조
- ✅ 명확한 네이밍
- ✅ 포괄적인 문서화
- ✅ 일관된 코드 스타일

### 2. 확장성
- ✅ Adapter 패턴으로 새로운 시스템 연동 쉽게 추가
- ✅ 플러그인 가능한 산출식 함수
- ✅ 모듈별 독립적인 개발 가능

### 3. 안정성
- ✅ 재시도 로직 (Retry Policy)
- ✅ Circuit Breaker 패턴
- ✅ 에러 핸들링 및 로깅
- ✅ 데이터 검증 (Zod)

### 4. 성능
- ✅ Redis 캐싱
- ✅ 백그라운드 작업 처리 (BullMQ)
- ✅ 데이터베이스 인덱싱
- ✅ API 응답 압축

---

## 📝 환경 변수

### Backend 주요 환경 변수
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pdca

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key

# External Systems
ACADEMIC_SYSTEM_URL=https://academic.university.edu
ACADEMIC_SYSTEM_API_KEY=your-api-key

# Integration
INTEGRATION_RETRY_ATTEMPTS=3
INTEGRATION_RETRY_DELAY=1000
```

전체 목록은 `.env.example` 파일을 참고하세요.

---

## 🤝 기여하기

이슈 및 Pull Request는 언제나 환영합니다!

---

## 📄 라이선스

MIT License

---

## 📞 문의

프로젝트 관련 문의사항은 이슈를 등록해주세요.

---

## 🗺️ 로드맵

### Phase 1: MVP (현재)
- [x] 프로젝트 구조 설정
- [x] 데이터베이스 스키마 설계
- [x] 외부 연동 아키텍처 구현
- [ ] 기본 CRUD API 구현
- [ ] 프론트엔드 기본 화면

### Phase 2: 핵심 기능
- [ ] KPI 입력 및 관리
- [ ] 산출식 편집기
- [ ] 지표 자동 계산
- [ ] 대시보드 구현
- [ ] 예산 관리

### Phase 3: 고급 기능
- [ ] 실시간 알림
- [ ] 보고서 자동 생성
- [ ] 환류 관리 (PDCA)
- [ ] 다차원 분석
- [ ] 엑셀 일괄 업로드

### Phase 4: 최적화
- [ ] 성능 최적화
- [ ] 모바일 반응형
- [ ] 다국어 지원
- [ ] 테스트 커버리지 90%+
- [ ] CI/CD 파이프라인

---

**Built with ❤️ for University Performance Management**
