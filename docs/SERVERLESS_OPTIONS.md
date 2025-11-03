# 백엔드 없이 구현하는 방법 (Serverless/BaaS)

백엔드 서버를 따로 관리하지 않고 PDCA 시스템을 구현하는 방법들입니다.

---

## 🎯 옵션 비교

| 옵션 | 난이도 | 비용 | 확장성 | 추천도 |
|-----|-------|------|--------|--------|
| **1. Next.js Full Stack** | ⭐⭐ | 무료 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **2. Supabase** | ⭐ | 무료/유료 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **3. Firebase** | ⭐ | 무료/유료 | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **4. Vercel Functions + Prisma** | ⭐⭐⭐ | 무료/유료 | ⭐⭐⭐ | ⭐⭐⭐ |

---

## 🚀 옵션 1: Next.js Full Stack (최고 추천 ⭐)

### 개요
React를 Next.js로 전환하여 **하나의 프로젝트**에서 Frontend + Backend 모두 처리

### 장점
- ✅ **Vercel에 한 번에 배포** (Frontend + API Routes)
- ✅ TypeScript 풀스택
- ✅ Server Components로 성능 향상
- ✅ API Routes로 백엔드 로직 처리
- ✅ Prisma + PostgreSQL 그대로 사용
- ✅ 파일 기반 라우팅
- ✅ 무료 (Vercel 호스팅)

### 단점
- ⚠️ 러닝 커브 (Next.js 학습 필요)
- ⚠️ 기존 React 코드 전환 필요

### 프로젝트 구조

```
pdca-nextjs/
├── app/
│   ├── api/                    # Backend API Routes
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── route.ts    # POST /api/auth/login
│   │   │   └── register/
│   │   │       └── route.ts
│   │   ├── programs/
│   │   │   ├── route.ts        # GET /api/programs
│   │   │   └── [id]/
│   │   │       └── route.ts    # GET /api/programs/:id
│   │   └── kpis/
│   │       └── route.ts
│   ├── (auth)/                 # Frontend Pages (Auth Group)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── dashboard/              # Frontend Pages
│   │   └── page.tsx
│   ├── programs/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   └── layout.tsx
├── lib/
│   ├── prisma.ts              # Prisma Client
│   ├── auth.ts                # Auth utilities
│   └── calculator.ts          # 산출식 계산
├── components/
├── prisma/
│   └── schema.prisma
└── package.json
```

### API Route 예시

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 사용자 조회
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 비밀번호 확인
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/programs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 프로그램 목록 조회
    const programs = await prisma.program.findMany({
      where: {
        // 사용자의 부서 프로그램만
        departmentId: user.departmentId,
      },
      include: {
        department: true,
        manager: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(programs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const program = await prisma.program.create({
      data: {
        ...data,
        managerId: user.userId,
      },
    });

    return NextResponse.json(program, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Server Component 예시

```typescript
// app/dashboard/page.tsx (Server Component)
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  // 서버에서 직접 DB 조회 (API 호출 불필요!)
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }

  const stats = await prisma.program.groupBy({
    by: ['status'],
    _count: true,
  });

  const programs = await prisma.program.findMany({
    where: { managerId: session.user.id },
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1>대시보드</h1>
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.status} className="card">
            <h3>{stat.status}</h3>
            <p>{stat._count}</p>
          </div>
        ))}
      </div>
      <ProgramList programs={programs} />
    </div>
  );
}
```

### 전환 방법

```bash
# 1. Next.js 프로젝트 생성
npx create-next-app@latest pdca-nextjs --typescript --tailwind --app

# 2. 필요한 패키지 설치
cd pdca-nextjs
npm install @prisma/client bcrypt jsonwebtoken zod
npm install -D prisma @types/bcrypt @types/jsonwebtoken

# 3. Prisma 설정 복사
cp ../pdca/backend/src/database/prisma/schema.prisma ./prisma/

# 4. 기존 Frontend 코드 이동
# frontend/src/components → pdca-nextjs/components
# frontend/src/pages → pdca-nextjs/app

# 5. Backend 로직을 API Routes로 이동
# backend/src/modules → pdca-nextjs/app/api
```

### Vercel 배포

```bash
# vercel.json 불필요! Next.js는 자동 감지
vercel

# 또는 GitHub 연결하면 자동 배포
```

---

## 🔥 옵션 2: Supabase (가장 쉬움 ⭐)

### 개요
**PostgreSQL + Auth + Storage + Functions**를 제공하는 BaaS (Backend as a Service)

### 장점
- ✅ **완전 무료** (처음 시작할 때)
- ✅ PostgreSQL 자동 제공
- ✅ 인증 기능 내장 (소셜 로그인 포함)
- ✅ Row Level Security (RLS)
- ✅ 실시간 구독 기능
- ✅ Storage (파일 업로드)
- ✅ Edge Functions (서버리스)
- ✅ Prisma 대신 **Supabase Client** 사용

### 단점
- ⚠️ Vendor Lock-in
- ⚠️ 복잡한 비즈니스 로직은 Edge Functions 필요
- ⚠️ 무료 티어 제한 (500MB DB, 2GB 전송)

### 프로젝트 구조

```
pdca/
├── frontend/              # React (기존 유지)
│   ├── src/
│   │   ├── lib/
│   │   │   └── supabase.ts    # Supabase Client
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   └── program.service.ts
│   │   └── pages/
├── supabase/
│   ├── migrations/        # SQL 마이그레이션
│   └── functions/         # Edge Functions
│       ├── calculate-indicator/
│       └── send-notification/
└── package.json
```

### 설정

```bash
# 1. Supabase 프로젝트 생성
# https://supabase.com 에서 New Project 생성

# 2. Supabase CLI 설치
npm install -g supabase

# 3. 로컬 Supabase 초기화
supabase init

# 4. Supabase Client 설치
npm install @supabase/supabase-js
```

### Supabase Client 설정

```typescript
// frontend/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 인증 예시

```typescript
// frontend/src/services/auth.service.ts
import { supabase } from '@/lib/supabase';

export const authService = {
  async register(email: string, password: string, name: string) {
    // Supabase Auth 사용
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // 메타데이터
      },
    });

    if (error) throw error;
    return data;
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },
};
```

### 데이터 조회 예시

```typescript
// frontend/src/services/program.service.ts
import { supabase } from '@/lib/supabase';

export const programService = {
  async getPrograms() {
    const { data, error } = await supabase
      .from('programs')
      .select(`
        *,
        department:departments(*),
        manager:users(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getProgram(id: string) {
    const { data, error } = await supabase
      .from('programs')
      .select(`
        *,
        department:departments(*),
        manager:users(*),
        kpis:program_kpis(*, kpi:kpis(*))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createProgram(program: any) {
    const { data, error } = await supabase
      .from('programs')
      .insert(program)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProgram(id: string, updates: any) {
    const { data, error } = await supabase
      .from('programs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
```

### Row Level Security (RLS) 설정

```sql
-- supabase/migrations/20250101000000_enable_rls.sql

-- 프로그램 테이블 RLS 활성화
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- 정책: 사용자는 자신의 부서 프로그램만 조회 가능
CREATE POLICY "Users can view their department programs"
  ON programs FOR SELECT
  USING (
    department_id IN (
      SELECT department_id FROM users WHERE id = auth.uid()
    )
  );

-- 정책: 매니저만 프로그램 생성 가능
CREATE POLICY "Managers can create programs"
  ON programs FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('ADMIN', 'MANAGER')
  );
```

### Edge Function 예시 (복잡한 로직)

```typescript
// supabase/functions/calculate-indicator/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { programId, indicatorId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // KPI 값 조회
    const { data: kpiValues } = await supabase
      .from('kpi_values')
      .select('*')
      .eq('program_kpi.program_id', programId);

    // 지표 산출식 조회
    const { data: indicator } = await supabase
      .from('indicators')
      .select('*')
      .eq('id', indicatorId)
      .single();

    // 계산 수행
    const result = calculateFormula(indicator.formula, kpiValues);

    // 결과 저장
    await supabase.from('indicator_values').insert({
      program_indicator_id: `${programId}_${indicatorId}`,
      calculated_value: result,
      calculated_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

### 실시간 구독

```typescript
// 프로그램 변경사항 실시간 감지
supabase
  .channel('programs')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'programs' },
    (payload) => {
      console.log('Program changed:', payload);
      // UI 자동 업데이트
    }
  )
  .subscribe();
```

---

## 📦 옵션 3: Firebase

### 개요
Google의 BaaS, NoSQL(Firestore) 기반

### 장점
- ✅ 인증 기능 강력
- ✅ Realtime Database
- ✅ Cloud Functions
- ✅ Hosting 포함

### 단점
- ⚠️ **NoSQL (Firestore)** - 복잡한 쿼리 어려움
- ⚠️ PostgreSQL에서 마이그레이션 필요
- ⚠️ 비용 예측 어려움
- ⚠️ 산출식 계산 등 복잡한 로직은 Cloud Functions 필요

### 추천하지 않는 이유
PDCA 시스템은 **관계형 데이터**가 많고 복잡한 쿼리가 필요하므로, NoSQL은 적합하지 않습니다.

---

## ⚡ 옵션 4: Vercel Functions + Prisma

### 개요
현재 React (Vite)를 유지하고, Vercel Serverless Functions로 API 구현

### 장점
- ✅ 현재 프로젝트 구조 거의 유지
- ✅ Prisma 그대로 사용

### 단점
- ⚠️ Cold Start (첫 요청 느림)
- ⚠️ 10초 실행 시간 제한 (Pro는 60초)
- ⚠️ 복잡한 로직에 부적합
- ⚠️ Database Connection Pool 관리 어려움

### 구조

```
pdca/
├── frontend/          # React (Vite)
├── api/               # Vercel Functions
│   ├── auth/
│   │   └── login.ts   # /api/auth/login
│   └── programs/
│       └── index.ts   # /api/programs
└── vercel.json
```

### 추천하지 않는 이유
복잡한 비즈니스 로직과 산출식 계산에는 부적합합니다.

---

## 🎯 최종 추천

### 프로젝트 특성 고려

| 요구사항 | Next.js | Supabase | Firebase |
|---------|---------|----------|----------|
| 복잡한 산출식 계산 | ✅ 적합 | ⚠️ Edge Functions | ❌ 어려움 |
| 관계형 데이터 | ✅ Prisma | ✅ PostgreSQL | ❌ NoSQL |
| 외부 연동 | ✅ API Routes | ⚠️ Functions | ⚠️ Functions |
| 실시간 업데이트 | ⚠️ 추가 구현 | ✅ 내장 | ✅ 내장 |
| 무료 시작 | ✅ Vercel | ✅ 무료 티어 | ✅ 무료 티어 |
| 학습 곡선 | ⭐⭐ | ⭐ | ⭐ |

### 1순위: Next.js Full Stack ⭐⭐⭐⭐⭐

**이유:**
- ✅ 복잡한 비즈니스 로직 처리 용이
- ✅ TypeScript 풀스택
- ✅ Prisma + PostgreSQL 그대로 사용
- ✅ Vercel 배포 완벽 통합
- ✅ 장기적으로 유지보수 용이

**단점:**
- Next.js 학습 필요 (하지만 React 경험 있으면 쉬움)
- 기존 코드 전환 작업

### 2순위: Supabase ⭐⭐⭐⭐

**이유:**
- ✅ 가장 빠르게 시작 가능
- ✅ Auth, DB, Storage 모두 제공
- ✅ 무료로 시작

**단점:**
- Edge Functions로 복잡한 로직 구현 필요
- Vendor Lock-in

---

## 📋 전환 가이드

### Next.js로 전환하기

상세 가이드는 별도 문서 참조:
- [NEXTJS_MIGRATION.md](./NEXTJS_MIGRATION.md) (예정)

간단 요약:
```bash
# 1. Next.js 프로젝트 생성
npx create-next-app@latest pdca-nextjs --typescript --tailwind --app

# 2. 기존 코드 이동
# Components → 그대로 사용 가능
# Pages → app/ 디렉토리로 전환
# API 로직 → app/api/ 로 전환

# 3. Prisma 설정 복사

# 4. Vercel 배포
vercel
```

### Supabase로 전환하기

상세 가이드는 별도 문서 참조:
- [SUPABASE_MIGRATION.md](./SUPABASE_MIGRATION.md) (예정)

간단 요약:
```bash
# 1. Supabase 프로젝트 생성 (웹사이트)

# 2. Supabase Client 설치
npm install @supabase/supabase-js

# 3. Prisma Schema → Supabase Migrations 변환

# 4. Backend 로직 제거, Supabase Client로 대체

# 5. 복잡한 로직은 Edge Functions로
```

---

## 💡 결론

**즉시 시작하고 싶다면**: Supabase
**장기적으로 안정적인 시스템**: Next.js

**개인 추천**: Next.js Full Stack ⭐
- 초기 전환 비용은 있지만, 장기적으로 가장 유연하고 확장 가능합니다.
- PDCA 시스템의 복잡한 산출식 계산, 외부 연동 등을 고려하면 Next.js가 최적입니다.

---

## 🔄 다음 단계

어떤 옵션을 선택하셨나요?

1. **Next.js** → Next.js 전환 가이드 제공
2. **Supabase** → Supabase 구현 가이드 제공
3. **현재 구조 유지** → Express Backend 계속 개발

말씀해주시면 상세 가이드를 작성하겠습니다!
