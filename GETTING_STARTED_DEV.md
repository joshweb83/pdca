# 개발 시작 가이드

PDCA 시스템 개발을 바로 시작할 수 있는 단계별 가이드입니다.

---

## 🚀 빠른 시작 (5분)

```bash
# 1. 저장소 클론
git clone https://github.com/joshweb83/pdca.git
cd pdca

# 2. 의존성 설치
npm install

# 3. DB 및 Redis 시작 (Docker)
docker-compose -f docker-compose.dev.yml up -d

# 4. 환경 변수 설정
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 5. DB 마이그레이션
cd backend
npm run prisma:generate
npm run prisma:migrate
cd ..

# 6. 개발 서버 시작
npm run dev

# Frontend: http://localhost:3000
# Backend: http://localhost:4000
```

---

## 📋 Phase 1 개발 순서

### ✅ Step 1: 인증 (Auth) - 1-2일

Backend부터 시작합니다.

#### 1.1 Backend API 구현

```bash
cd backend
```

**파일 생성:**
```bash
touch src/modules/auth/auth.controller.ts
touch src/modules/auth/auth.service.ts
touch src/modules/auth/auth.routes.ts
touch src/common/middlewares/auth.middleware.ts
```

**코드 작성:**

```typescript
// backend/src/modules/auth/auth.service.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export class AuthService {
  async register(email: string, password: string, name: string) {
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
    });

    return { id: user.id, email: user.email, name: user.name };
  }

  async login(email: string, password: string) {
    // 사용자 조회
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }

    // 비밀번호 확인
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

export const authService = new AuthService();
```

```typescript
// backend/src/modules/auth/auth.controller.ts
import { Request, Response } from 'express';
import { authService } from './auth.service';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      // 입력 검증
      const body = registerSchema.parse(req.body);

      // 회원가입
      const user = await authService.register(body.email, body.password, body.name);

      res.status(201).json({ success: true, user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const body = loginSchema.parse(req.body);

      const result = await authService.login(body.email, body.password);

      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async me(req: Request, res: Response) {
    // 인증된 사용자 정보 반환
    res.json({ user: (req as any).user });
  }
}

export const authController = new AuthController();
```

```typescript
// backend/src/common/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { authService } from '@/modules/auth/auth.service';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decoded = await authService.verifyToken(token);

    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

```typescript
// backend/src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '@/common/middlewares/auth.middleware';

const router = Router();

router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.get('/me', authMiddleware, (req, res) => authController.me(req, res));

export default router;
```

**app.ts에 라우트 추가:**
```typescript
// backend/src/app.ts
import authRoutes from './modules/auth/auth.routes';

// ...
app.use('/api/v1/auth', authRoutes);
```

#### 1.2 Frontend 구현

```bash
cd frontend
```

**파일 생성:**
```bash
mkdir -p src/pages/auth
mkdir -p src/services
mkdir -p src/stores

touch src/services/api.ts
touch src/services/auth.service.ts
touch src/stores/authStore.ts
touch src/pages/auth/LoginPage.tsx
touch src/pages/auth/RegisterPage.tsx
```

**코드 작성:**

```typescript
// frontend/src/services/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 토큰 자동 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

```typescript
// frontend/src/services/auth.service.ts
import { api } from './api';

export const authService = {
  async register(email: string, password: string, name: string) {
    const response = await api.post('/api/v1/auth/register', {
      email,
      password,
      name,
    });
    return response.data;
  },

  async login(email: string, password: string) {
    const response = await api.post('/api/v1/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  async me() {
    const response = await api.get('/api/v1/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
  },
};
```

```typescript
// frontend/src/stores/authStore.ts
import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('token'),

  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));
```

```typescript
// frontend/src/pages/auth/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.login(email, password);
      setAuth(result.user, result.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || '로그인에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">로그인</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="text-center text-sm">
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

**테스트:**
```bash
# Backend 테스트
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

### ✅ Step 2: 프로그램 관리 - 2-3일

동일한 패턴으로 진행합니다.

```bash
# Backend
touch backend/src/modules/program/program.controller.ts
touch backend/src/modules/program/program.service.ts
touch backend/src/modules/program/program.routes.ts

# Frontend
mkdir -p frontend/src/pages/program
touch frontend/src/pages/program/ProgramListPage.tsx
touch frontend/src/pages/program/ProgramDetailPage.tsx
touch frontend/src/pages/program/ProgramFormPage.tsx
touch frontend/src/services/program.service.ts
```

**Backend Service 예시:**
```typescript
// backend/src/modules/program/program.service.ts
export class ProgramService {
  async getPrograms(filters?: any) {
    return await prisma.program.findMany({
      where: filters,
      include: {
        department: true,
        manager: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProgram(id: string) {
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        department: true,
        manager: true,
        kpis: { include: { kpi: true } },
        indicators: { include: { indicator: true } },
      },
    });

    if (!program) {
      throw new Error('Program not found');
    }

    return program;
  }

  async createProgram(data: any, userId: string) {
    return await prisma.program.create({
      data: {
        ...data,
        managerId: userId,
      },
    });
  }

  // ...
}
```

---

## 🛠️ 개발 팁

### 1. Prisma Studio로 DB 확인
```bash
npm run prisma:studio -w backend
# http://localhost:5555
```

### 2. API 테스트
```bash
# REST Client (VSCode extension) 사용
# 또는 Postman, Insomnia
```

### 3. Hot Reload 확인
코드 수정 시 자동으로 재시작되는지 확인

### 4. 에러 로그 확인
```bash
# Backend 로그
tail -f backend/logs/combined-*.log

# Frontend 콘솔
브라우저 개발자 도구
```

---

## 📚 다음 단계

1. **Auth 완성** → 로그인/회원가입 동작 확인
2. **Dashboard 기본** → 간단한 통계 표시
3. **Program CRUD** → 프로그램 등록/수정/삭제
4. **KPI 입력** → 값 입력 및 조회
5. **지표 계산** → 단순 산출식 계산

---

## 🆘 문제 해결

### DB 연결 실패
```bash
# Docker 확인
docker-compose -f docker-compose.dev.yml ps

# DB 재시작
docker-compose -f docker-compose.dev.yml restart postgres
```

### Port 충돌
```bash
# 사용 중인 포트 확인
lsof -i :3000
lsof -i :4000

# 프로세스 종료
kill -9 <PID>
```

### TypeScript 에러
```bash
# 타입 재생성
npm run prisma:generate -w backend

# 캐시 삭제
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
```

---

**개발을 시작하세요! 막히는 부분이 있으면 이슈를 등록하거나 문의하세요! 🚀**
