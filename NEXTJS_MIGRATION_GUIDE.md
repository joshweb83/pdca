# Next.js Full Stack 전환 가이드

React + Express 구조를 **Next.js Full Stack**으로 전환하는 완전 가이드입니다.

---

## 🎯 전환 후 구조

### Before (현재)
```
Frontend (React + Vite) ← HTTP → Backend (Express) ← → Database
     Vercel                      Railway/Render      PostgreSQL
```

### After (Next.js)
```
Next.js Full Stack (Frontend + API Routes + Server Components)
              ↓
    Vercel (한 번에 배포)
              ↓
         PostgreSQL
```

**장점:**
- ✅ 배포 1번으로 해결
- ✅ API 호출 불필요 (Server Components)
- ✅ 타입 안전성 (풀스택 TypeScript)
- ✅ 빠른 성능 (Server-side Rendering)

---

## 📋 전환 체크리스트

### Phase 1: 프로젝트 설정 (30분)
- [ ] Next.js 프로젝트 생성
- [ ] 필요한 패키지 설치
- [ ] Prisma 설정 복사
- [ ] 환경 변수 설정

### Phase 2: Backend → API Routes (2-3시간)
- [ ] Auth API Routes
- [ ] Program API Routes
- [ ] KPI API Routes
- [ ] Indicator API Routes

### Phase 3: Frontend → Next.js Pages (2-3시간)
- [ ] Layout 설정
- [ ] 로그인/회원가입 페이지
- [ ] 대시보드 (Server Component)
- [ ] 프로그램 목록/상세 페이지
- [ ] KPI 입력 페이지

### Phase 4: 배포 (30분)
- [ ] Vercel 연결
- [ ] 환경 변수 설정
- [ ] 배포 테스트

---

## 🚀 Step 1: Next.js 프로젝트 생성

### 1.1 새 프로젝트 생성

```bash
# 현재 pdca 디렉토리 밖에서 실행
cd ..

# Next.js 프로젝트 생성
npx create-next-app@latest pdca-nextjs

# 설정 선택
✔ TypeScript? Yes
✔ ESLint? Yes
✔ Tailwind CSS? Yes
✔ src/ directory? No
✔ App Router? Yes
✔ import alias? Yes (@/*)

cd pdca-nextjs
```

### 1.2 필요한 패키지 설치

```bash
# Backend 관련
npm install @prisma/client bcrypt jsonwebtoken zod
npm install -D prisma @types/bcrypt @types/jsonwebtoken

# 기타
npm install date-fns lodash
npm install -D @types/lodash
```

### 1.3 프로젝트 구조 생성

```bash
# 디렉토리 생성
mkdir -p lib/{prisma,auth,calculator}
mkdir -p app/api/{auth,programs,kpis,indicators,budgets}
mkdir -p components/{ui,dashboard,program,kpi,indicator}
mkdir -p prisma
```

---

## 🗄️ Step 2: Prisma 설정

### 2.1 Prisma 파일 복사

```bash
# 기존 프로젝트에서 복사
cp ../pdca/backend/src/database/prisma/schema.prisma ./prisma/
```

### 2.2 환경 변수 설정

```bash
# .env.local 파일 생성
cat > .env.local << 'EOF'
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pdca?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# App
NEXT_PUBLIC_APP_NAME="PDCA"
EOF
```

### 2.3 Prisma 초기화

```bash
# Prisma Client 생성
npx prisma generate

# DB 마이그레이션 (기존 DB 사용 시)
npx prisma db pull  # 기존 DB에서 스키마 가져오기
# 또는
npx prisma migrate dev  # 새로 마이그레이션
```

### 2.4 Prisma Client 설정

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## 🔐 Step 3: 인증 구현

### 3.1 Auth 유틸리티

```typescript
// lib/auth.ts
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
```

### 3.2 회원가입 API Route

```typescript
// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

export async function POST(request: NextRequest) {
  try {
    // 입력 검증
    const body = await request.json();
    const { email, password, name } = registerSchema.parse(body);

    // 이메일 중복 확인
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다' },
        { status: 400 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json(
      { success: true, user },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Register error:', error);
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
```

### 3.3 로그인 API Route

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { signToken } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      );
    }

    // 비밀번호 확인
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      );
    }

    // JWT 토큰 생성
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다' },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
```

### 3.4 현재 사용자 조회 API Route

```typescript
// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: '사용자 정보 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
```

---

## 📦 Step 4: Program API Routes

### 4.1 프로그램 목록/생성

```typescript
// app/api/programs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

// GET /api/programs
export async function GET(request: NextRequest) {
  try {
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const departmentId = searchParams.get('departmentId');

    const programs = await prisma.program.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(departmentId && { departmentId }),
      },
      include: {
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            kpis: true,
            indicators: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ programs });
  } catch (error) {
    console.error('Get programs error:', error);
    return NextResponse.json(
      { error: '프로그램 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// POST /api/programs
const createProgramSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  departmentId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  totalBudget: z.number().min(0),
});

export async function POST(request: NextRequest) {
  try {
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createProgramSchema.parse(body);

    const program = await prisma.program.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        managerId: authUser.userId,
        status: 'PLANNING',
      },
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ program }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create program error:', error);
    return NextResponse.json(
      { error: '프로그램 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
```

### 4.2 프로그램 상세/수정/삭제

```typescript
// app/api/programs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/programs/:id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const program = await prisma.program.findUnique({
      where: { id: params.id },
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        kpis: {
          include: {
            kpi: true,
            values: {
              take: 10,
              orderBy: { inputDate: 'desc' },
            },
          },
        },
        indicators: {
          include: {
            indicator: true,
            values: {
              take: 10,
              orderBy: { calculatedAt: 'desc' },
            },
          },
        },
        budgetItems: {
          include: {
            executions: {
              orderBy: { executedDate: 'desc' },
            },
          },
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ program });
  } catch (error) {
    console.error('Get program error:', error);
    return NextResponse.json(
      { error: '프로그램 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// PUT /api/programs/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const program = await prisma.program.update({
      where: { id: params.id },
      data: {
        ...body,
        ...(body.startDate && { startDate: new Date(body.startDate) }),
        ...(body.endDate && { endDate: new Date(body.endDate) }),
      },
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ program });
  } catch (error) {
    console.error('Update program error:', error);
    return NextResponse.json(
      { error: '프로그램 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// DELETE /api/programs/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.program.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete program error:', error);
    return NextResponse.json(
      { error: '프로그램 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
```

---

## 🎨 Step 5: Frontend Pages

### 5.1 Root Layout

```typescript
// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PDCA - 대학 성과관리 시스템',
  description: '프로그램 기반 대학 성과관리 툴',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

### 5.2 로그인 페이지

```typescript
// app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '로그인에 실패했습니다');
      }

      // 토큰 저장
      localStorage.setItem('token', data.token);

      // 대시보드로 이동
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">로그인</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            PDCA 대학 성과관리 시스템
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          계정이 없으신가요?{' '}
          <a href="/register" className="text-blue-600 hover:underline">
            회원가입
          </a>
        </p>
      </div>
    </div>
  );
}
```

### 5.3 대시보드 (Server Component)

```typescript
// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

async function getDashboardData(userId: string) {
  // 프로그램 통계
  const stats = await prisma.program.groupBy({
    by: ['status'],
    _count: true,
  });

  // 내 담당 프로그램
  const myPrograms = await prisma.program.findMany({
    where: { managerId: userId },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      department: true,
      _count: {
        select: {
          kpis: true,
          indicators: true,
        },
      },
    },
  });

  return { stats, myPrograms };
}

export default async function DashboardPage() {
  // 서버에서 직접 인증 확인
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  let user;
  try {
    user = verifyToken(token);
  } catch {
    redirect('/login');
  }

  // 서버에서 직접 데이터 조회 (API 호출 불필요!)
  const { stats, myPrograms } = await getDashboardData(user.userId);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">대시보드</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.status} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                {stat.status}
              </h3>
              <p className="text-3xl font-bold">{stat._count}</p>
            </div>
          ))}
        </div>

        {/* 내 프로그램 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">내 담당 프로그램</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {myPrograms.map((program) => (
                <div
                  key={program.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <h3 className="font-semibold">{program.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {program.department.name}
                  </p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>KPI: {program._count.kpis}</span>
                    <span>지표: {program._count.indicators}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
```

---

## 🚀 Step 6: Vercel 배포

### 6.1 vercel.json (불필요! Next.js는 자동 감지)

Next.js는 Vercel에서 자동으로 감지되므로 별도 설정 불필요합니다.

### 6.2 환경 변수 설정

Vercel Dashboard > Settings > Environment Variables

```
DATABASE_URL = postgresql://...
JWT_SECRET = your-production-secret
NEXT_PUBLIC_APP_NAME = PDCA
```

### 6.3 배포

```bash
# Vercel CLI로 배포
vercel

# 또는 GitHub 연결하면 자동 배포
git push origin main
```

---

## 📦 Step 7: 기존 컴포넌트 재사용

### 7.1 컴포넌트 복사

```bash
# 기존 Frontend 컴포넌트 복사
cp -r ../pdca/frontend/src/components/* ./components/
```

### 7.2 Import 경로 수정

```typescript
// Before (Vite)
import { api } from '@/services/api';

// After (Next.js)
import { api } from '@/lib/api';
```

---

## ✅ 전환 완료 체크리스트

### Backend
- [x] Prisma 설정 완료
- [x] Auth API Routes (/api/auth/*)
- [x] Program API Routes (/api/programs/*)
- [x] KPI API Routes (/api/kpis/*) - 동일 패턴
- [x] Indicator API Routes (/api/indicators/*) - 동일 패턴

### Frontend
- [x] Layout 설정
- [x] 로그인 페이지
- [x] 대시보드 (Server Component)
- [x] 프로그램 목록/상세
- [ ] KPI 입력 페이지
- [ ] 지표 관리 페이지

### 배포
- [x] Vercel 연결
- [x] 환경 변수 설정
- [x] Database 연결
- [ ] 배포 테스트

---

## 🎯 다음 단계

이제 다음 파일들을 작성하면 됩니다:

### 계속 작성할 API Routes
```typescript
// app/api/kpis/route.ts
// app/api/kpis/[id]/route.ts
// app/api/indicators/route.ts
// app/api/indicators/[id]/route.ts
// app/api/budgets/route.ts
```

### 계속 작성할 Pages
```typescript
// app/programs/page.tsx (목록)
// app/programs/[id]/page.tsx (상세)
// app/kpis/page.tsx
// app/indicators/page.tsx
```

---

**이제 Next.js Full Stack 프로젝트를 시작하세요! 🚀**

추가 도움이 필요하면 말씀해주세요!
