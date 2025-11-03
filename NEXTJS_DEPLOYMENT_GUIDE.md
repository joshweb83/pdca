# Next.js 배포 가이드

## 개요

PDCA 대학 성과관리 시스템이 Vite + Express 구조에서 Next.js Full Stack으로 성공적으로 마이그레이션되었습니다. 이 가이드는 로컬 개발 환경 설정부터 Vercel 프로덕션 배포까지 전체 과정을 안내합니다.

## 주요 변경사항

### 아키텍처 변화
- **이전**: React (Vite) + Express API 서버
- **현재**: Next.js Full Stack (App Router + API Routes)

### 주요 이점
1. **서버 없이 배포 가능**: 별도의 백엔드 서버 관리 불필요
2. **Server Components**: 데이터베이스 직접 접근으로 API 호출 감소
3. **API Routes**: 프론트엔드와 동일한 코드베이스에서 API 관리
4. **자동 최적화**: Next.js의 빌트인 최적화 (이미지, 폰트, 코드 스플리팅)
5. **Vercel 원클릭 배포**: Git 푸시만으로 자동 배포

## 1. 로컬 개발 환경 설정

### 필수 요구사항
- Node.js 20 이상
- PostgreSQL 16 (로컬 또는 클라우드)
- npm 또는 yarn

### 단계별 설정

#### 1.1 의존성 설치
```bash
cd frontend
npm install
```

#### 1.2 환경 변수 설정
`frontend/.env.local` 파일을 생성하고 다음 내용을 입력:

```env
# Database (필수)
DATABASE_URL="postgresql://pdca_user:your_password@localhost:5432/pdca_db?schema=public"

# JWT Secret (필수 - 보안을 위해 랜덤 문자열 생성)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long"
JWT_EXPIRES_IN="7d"

# App Configuration
NEXT_PUBLIC_APP_NAME="PDCA"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NODE_ENV="development"
```

**보안 주의사항**: JWT_SECRET은 최소 32자 이상의 강력한 랜덤 문자열을 사용하세요.

생성 방법:
```bash
# OpenSSL을 사용한 랜덤 문자열 생성
openssl rand -base64 32
```

#### 1.3 데이터베이스 설정

##### PostgreSQL 로컬 설치 (Docker 사용)
```bash
# 프로젝트 루트 디렉토리에서
docker-compose up -d postgres

# 또는 직접 PostgreSQL 컨테이너 실행
docker run --name pdca-postgres \
  -e POSTGRES_DB=pdca_db \
  -e POSTGRES_USER=pdca_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:16-alpine
```

##### Prisma 마이그레이션 실행
```bash
cd frontend

# Prisma Client 생성
npx prisma generate

# 데이터베이스 마이그레이션 (개발 환경)
npx prisma db push

# 또는 프로덕션용 마이그레이션
npx prisma migrate deploy
```

##### 초기 데이터 생성 (선택사항)
```bash
# Prisma Studio로 데이터 직접 입력
npx prisma studio
```

#### 1.4 개발 서버 실행
```bash
cd frontend
npm run dev
```

서버가 `http://localhost:3000`에서 실행됩니다.

### 1.5 초기 관리자 계정 생성

브라우저에서 회원가입 API를 직접 호출하거나 Prisma Studio를 사용하여 초기 관리자 계정을 생성:

```bash
# Prisma Studio 실행
npx prisma studio

# 또는 curl로 API 호출
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@university.ac.kr",
    "password": "Admin123!@#",
    "name": "시스템 관리자",
    "role": "SUPER_ADMIN"
  }'
```

## 2. Vercel 배포

### 2.1 Vercel 프로젝트 생성

1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. "New Project" 클릭
3. GitHub 저장소 연결 (joshweb83/pdca)
4. 프로젝트 설정:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npx prisma generate && npm run build`
   - **Output Directory**: `.next` (자동)

### 2.2 환경 변수 설정

Vercel 프로젝트 Settings > Environment Variables에서 다음 변수를 추가:

#### 필수 환경 변수
```
DATABASE_URL = postgresql://user:password@host:5432/dbname?sslmode=require
JWT_SECRET = [32자 이상의 랜덤 문자열]
JWT_EXPIRES_IN = 7d
NODE_ENV = production
```

#### 프로덕션 데이터베이스 옵션

**옵션 1: Vercel Postgres (추천)**
```bash
# Vercel CLI 설치
npm i -g vercel

# Vercel Postgres 생성
vercel postgres create

# 환경 변수 자동 연결
# Vercel 대시보드에서 Storage 탭에서 데이터베이스를 프로젝트에 연결
```

**옵션 2: Supabase**
1. [Supabase](https://supabase.com) 프로젝트 생성
2. Settings > Database에서 Connection String 복사
3. Vercel 환경 변수에 `DATABASE_URL`로 추가

**옵션 3: Neon**
1. [Neon](https://neon.tech) 프로젝트 생성
2. Connection String 복사
3. Vercel 환경 변수에 추가

### 2.3 배포 실행

#### 방법 1: Git Push (권장)
```bash
# 변경사항 커밋
git add .
git commit -m "feat: Deploy Next.js application"

# 메인 브랜치에 푸시
git push origin main
```

Vercel이 자동으로 감지하고 배포를 시작합니다.

#### 방법 2: Vercel CLI
```bash
# Vercel CLI로 배포
cd frontend
vercel --prod
```

### 2.4 배포 후 설정

#### 프로덕션 데이터베이스 마이그레이션
```bash
# 환경 변수에 프로덕션 DATABASE_URL 설정
export DATABASE_URL="postgresql://..."

# Prisma 마이그레이션 실행
npx prisma migrate deploy

# 또는 Vercel CLI 사용
vercel env pull .env.production
npx prisma migrate deploy
```

#### 초기 관리자 계정 생성
배포된 애플리케이션의 `/api/auth/register` 엔드포인트를 호출하거나, Prisma Studio를 프로덕션 DB에 연결하여 계정 생성.

## 3. 디렉토리 구조

```
frontend/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── auth/            # 인증 API
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── me/
│   │   │   └── logout/
│   │   ├── programs/        # 프로그램 CRUD
│   │   │   ├── [id]/
│   │   │   └── route.ts
│   │   └── departments/     # 부서 관리
│   ├── dashboard/           # 대시보드 페이지
│   ├── login/               # 로그인 페이지
│   ├── layout.tsx           # 루트 레이아웃
│   ├── page.tsx             # 홈 페이지
│   └── globals.css          # 글로벌 스타일
├── components/              # React 컴포넌트
│   └── providers.tsx        # React Query Provider
├── lib/                     # 유틸리티 라이브러리
│   ├── auth.ts             # JWT 인증 헬퍼
│   └── prisma.ts           # Prisma Client 싱글톤
├── types/                   # TypeScript 타입 정의
│   └── api.ts              # API 타입
├── prisma/                  # Prisma 설정
│   └── schema.prisma       # 데이터베이스 스키마
├── next.config.js          # Next.js 설정
├── tsconfig.json           # TypeScript 설정
├── tailwind.config.js      # Tailwind CSS 설정
└── package.json            # 의존성 및 스크립트
```

## 4. 주요 기능 구현 상태

### ✅ 완료된 기능
- [x] Next.js 프로젝트 구조 설정
- [x] Prisma 클라이언트 연동
- [x] JWT 기반 인증 시스템
- [x] 인증 API Routes (register, login, me, logout)
- [x] Program CRUD API Routes
- [x] Department API Routes
- [x] 로그인 페이지
- [x] 대시보드 (Server Components)
- [x] Vercel 배포 설정

### 🚧 진행 예정
- [ ] KPI 관리 API Routes
- [ ] Indicator 관리 API Routes
- [ ] 프로그램 관리 페이지 (목록, 상세, 생성, 수정)
- [ ] KPI 입력 페이지
- [ ] 지표 계산 및 표시
- [ ] 예산 관리 기능
- [ ] 보고서 생성
- [ ] 권한 기반 접근 제어 UI

## 5. API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보
- `POST /api/auth/logout` - 로그아웃

### 프로그램
- `GET /api/programs` - 프로그램 목록 (페이지네이션, 필터링)
- `POST /api/programs` - 프로그램 생성
- `GET /api/programs/[id]` - 프로그램 상세
- `PUT /api/programs/[id]` - 프로그램 수정
- `DELETE /api/programs/[id]` - 프로그램 삭제

### 부서
- `GET /api/departments` - 부서 목록
- `POST /api/departments` - 부서 생성 (관리자 전용)

## 6. 트러블슈팅

### 데이터베이스 연결 오류
```
Error: Can't reach database server
```

**해결 방법**:
1. DATABASE_URL이 올바르게 설정되었는지 확인
2. PostgreSQL 서버가 실행 중인지 확인
3. 방화벽/보안그룹에서 포트 5432가 열려있는지 확인
4. SSL 모드 확인 (프로덕션: `?sslmode=require`)

### Prisma Client 오류
```
PrismaClient is unable to run in this browser environment
```

**해결 방법**:
- Prisma Client는 Server Components나 API Routes에서만 사용
- Client Components에서는 API Routes를 통해 데이터 접근

### JWT 토큰 검증 실패
```
Invalid or expired token
```

**해결 방법**:
1. JWT_SECRET이 일관되게 설정되었는지 확인
2. 토큰 만료 시간 확인
3. 쿠키 설정 확인 (httpOnly, secure, sameSite)

### Vercel 빌드 실패
```
Error: Cannot find module '@prisma/client'
```

**해결 방법**:
1. `vercel.json`의 buildCommand에 `npx prisma generate` 포함 확인
2. Vercel 환경 변수에 DATABASE_URL 설정 확인
3. package.json에 prisma가 dependencies에 있는지 확인

## 7. 성능 최적화

### 데이터베이스 쿼리 최적화
```typescript
// ✅ Good: 필요한 필드만 선택
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  },
});

// ❌ Bad: 모든 필드 가져오기
const users = await prisma.user.findMany();
```

### Server Components 활용
```typescript
// ✅ Good: Server Component에서 직접 DB 접근
export default async function ProgramsPage() {
  const programs = await prisma.program.findMany();
  return <ProgramList programs={programs} />;
}

// ❌ Bad: Client Component에서 API 호출
'use client';
export default function ProgramsPage() {
  const { data } = useQuery(['programs'], fetchPrograms);
  return <ProgramList programs={data} />;
}
```

### 캐싱 전략
```typescript
// Revalidate every 60 seconds
export const revalidate = 60;

// Or use on-demand revalidation
import { revalidatePath } from 'next/cache';
revalidatePath('/dashboard');
```

## 8. 보안 체크리스트

- [ ] JWT_SECRET을 강력한 랜덤 문자열로 설정 (최소 32자)
- [ ] 프로덕션 환경에서 NODE_ENV=production 설정
- [ ] 데이터베이스 연결에 SSL 사용 (`sslmode=require`)
- [ ] 쿠키에 httpOnly, secure 플래그 설정
- [ ] API Routes에서 입력 유효성 검사 (Zod 사용)
- [ ] 비밀번호 해싱 (bcrypt, 10 rounds)
- [ ] CORS 설정 확인
- [ ] Rate limiting 고려 (프로덕션)

## 9. 추가 리소스

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Prisma 공식 문서](https://www.prisma.io/docs)
- [Vercel 배포 가이드](https://vercel.com/docs)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [React Query 문서](https://tanstack.com/query/latest)

## 10. 지원 및 문의

프로젝트 관련 문의사항이나 이슈는 GitHub Issues를 통해 제출해주세요.

---

**마지막 업데이트**: 2025-11-03
**버전**: 1.0.0
**작성자**: Claude (AI Assistant)
