# 배포 가이드

PDCA 시스템을 GitHub와 Vercel을 통해 배포하는 전체 가이드입니다.

---

## 📋 목차

1. [GitHub 설정](#1-github-설정)
2. [Vercel 배포 (Frontend)](#2-vercel-배포-frontend)
3. [Backend 배포 (별도 서버)](#3-backend-배포-별도-서버)
4. [환경 변수 설정](#4-환경-변수-설정)
5. [자동 배포 설정](#5-자동-배포-설정)
6. [배포 확인](#6-배포-확인)

---

## 1. GitHub 설정

### 1.1 GitHub 저장소 생성

1. GitHub에서 새 저장소 생성
   - 저장소 이름: `pdca` (또는 원하는 이름)
   - Public 또는 Private 선택
   - README, .gitignore 추가하지 않음 (이미 있음)

2. 로컬 저장소와 연결 (이미 완료됨)
```bash
# 이미 설정되어 있음
git remote -v
```

### 1.2 Main 브랜치로 푸시

현재 `claude/university-performance-tool-011CUkchJWWqRNQvEAEReGry` 브랜치에 있습니다.

**옵션 1: Main 브랜치 생성 및 머지 (권장)**
```bash
# Main 브랜치 생성
git checkout -b main

# 현재 작업 내용 Main으로 가져오기
git merge claude/university-performance-tool-011CUkchJWWqRNQvEAEReGry

# Main 브랜치 푸시
git push -u origin main
```

**옵션 2: 현재 브랜치 그대로 사용**
```bash
# 현재 브랜치를 기본 브랜치로 설정 (GitHub 웹에서)
# Settings > Branches > Default branch 변경
```

### 1.3 Branch Protection 설정 (선택사항)

GitHub 저장소 > Settings > Branches > Add rule

- Branch name pattern: `main`
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging

---

## 2. Vercel 배포 (Frontend)

### 2.1 Vercel 계정 생성 및 프로젝트 연결

1. **Vercel 계정 생성**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **새 프로젝트 생성**
   - Dashboard > "Add New..." > "Project"
   - GitHub 저장소 선택: `joshweb83/pdca`
   - Import 클릭

### 2.2 Vercel 프로젝트 설정

#### Build & Development Settings

```
Framework Preset: Other
Root Directory: ./  (루트 유지)
Build Command: cd frontend && npm install && npm run build
Output Directory: frontend/dist
Install Command: npm install
Development Command: cd frontend && npm run dev
```

또는 `vercel.json` 파일 사용 (이미 생성됨):
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "npm install"
}
```

#### Environment Variables 설정

Vercel Dashboard > Settings > Environment Variables

**Production 환경:**
```
VITE_API_URL = https://api.yourdomain.com
```

**Preview 환경:**
```
VITE_API_URL = https://api-dev.yourdomain.com
```

**Development 환경:**
```
VITE_API_URL = http://localhost:4000
```

### 2.3 도메인 설정 (선택사항)

Vercel Dashboard > Settings > Domains

- Vercel 기본 도메인: `pdca-xxx.vercel.app`
- 커스텀 도메인 추가: `pdca.youruniversity.edu`

---

## 3. Backend 배포 (별도 서버)

Backend는 Node.js 서버이므로 별도 호스팅이 필요합니다.

### 옵션 1: DigitalOcean / AWS / GCP

#### 3.1 서버 설정

```bash
# 서버 접속
ssh user@your-server-ip

# Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Docker 설치 (권장)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 프로젝트 클론
git clone https://github.com/joshweb83/pdca.git
cd pdca
```

#### 3.2 Docker로 배포

```bash
# 환경 변수 설정
cp backend/.env.example backend/.env
nano backend/.env  # 실제 값으로 수정

# Docker Compose로 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f backend
```

#### 3.3 Nginx 리버스 프록시 설정

```nginx
# /etc/nginx/sites-available/pdca-api
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 설정 활성화
sudo ln -s /etc/nginx/sites-available/pdca-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL 인증서 설치 (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### 옵션 2: Railway / Render

#### Railway 배포

1. https://railway.app 접속
2. "New Project" > "Deploy from GitHub repo"
3. 저장소 선택 및 설정:
   ```
   Root Directory: backend
   Build Command: npm install && npx prisma generate && npm run build
   Start Command: npm start
   ```
4. 환경 변수 추가 (DATABASE_URL, REDIS_URL 등)

#### Render 배포

1. https://render.com 접속
2. "New +" > "Web Service"
3. GitHub 저장소 연결
4. 설정:
   ```
   Name: pdca-backend
   Root Directory: backend
   Build Command: npm install && npx prisma generate && npm run build
   Start Command: npm start
   ```
5. 환경 변수 추가

---

## 4. 환경 변수 설정

### 4.1 Frontend 환경 변수 (Vercel)

Vercel Dashboard > Settings > Environment Variables

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_API_URL` | `https://api.yourdomain.com` | Production |
| `VITE_API_URL` | `https://api-staging.yourdomain.com` | Preview |
| `VITE_API_URL` | `http://localhost:4000` | Development |
| `VITE_APP_NAME` | `PDCA` | All |

### 4.2 Backend 환경 변수

서버의 `.env` 파일 또는 호스팅 플랫폼 환경 변수:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/pdca

# Redis
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET=your-production-jwt-secret-here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://pdca.yourdomain.com

# External Systems
ACADEMIC_SYSTEM_URL=https://academic.university.edu
ACADEMIC_SYSTEM_API_KEY=your-api-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-email-password
```

---

## 5. 자동 배포 설정

### 5.1 GitHub Actions CI/CD

이미 설정된 워크플로우:
- `.github/workflows/ci.yml` - 빌드 및 테스트
- `.github/workflows/vercel-deploy.yml` - Vercel 자동 배포

#### GitHub Secrets 설정

GitHub 저장소 > Settings > Secrets and variables > Actions

**필수 Secrets:**
```
VERCEL_TOKEN          # Vercel 계정 토큰
VERCEL_ORG_ID         # Vercel Organization ID
VERCEL_PROJECT_ID     # Vercel Project ID
```

**Vercel 토큰 발급:**
1. Vercel Dashboard > Settings > Tokens
2. "Create Token" 클릭
3. 이름 입력 후 생성
4. 토큰 복사하여 GitHub Secrets에 추가

**Vercel IDs 확인:**
```bash
# 로컬에서 Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 프로젝트 연결
vercel link

# ID 확인
cat .vercel/project.json
```

### 5.2 자동 배포 흐름

```
┌─────────────────────┐
│  Code Push/PR       │
│  to GitHub          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  GitHub Actions     │
│  - Run Tests        │
│  - Lint Code        │
│  - Type Check       │
└──────────┬──────────┘
           │
           ▼
     ┌────┴────┐
     │ Success? │
     └────┬────┘
          │ Yes
          ▼
┌─────────────────────┐
│  Vercel Deploy      │
│  - Build Frontend   │
│  - Deploy to CDN    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Live Website       │
│  https://pdca.app   │
└─────────────────────┘
```

### 5.3 배포 브랜치 전략

#### Production 배포
- Branch: `main`
- Trigger: Push to `main`
- Environment: Production
- URL: https://pdca.yourdomain.com

#### Preview 배포
- Branch: `develop` 또는 PR
- Trigger: Push to `develop` or PR 생성
- Environment: Preview
- URL: https://pdca-pr-123.vercel.app

#### Development
- Branch: 개발 브랜치
- Environment: Local
- URL: http://localhost:3000

---

## 6. 배포 확인

### 6.1 Frontend 배포 확인

```bash
# Vercel CLI로 확인
vercel list

# 브라우저에서 확인
curl https://pdca.vercel.app
```

**확인 사항:**
- ✅ 페이지가 정상적으로 로드되는가?
- ✅ API 요청이 올바른 Backend URL로 전송되는가?
- ✅ 환경 변수가 올바르게 설정되어 있는가?

### 6.2 Backend 배포 확인

```bash
# Health check
curl https://api.yourdomain.com/health

# API 테스트
curl https://api.yourdomain.com/api
```

**확인 사항:**
- ✅ API 서버가 정상 작동하는가?
- ✅ 데이터베이스 연결이 되는가?
- ✅ Redis 연결이 되는가?
- ✅ CORS가 올바르게 설정되어 있는가?

### 6.3 통합 테스트

1. Frontend에서 로그인 시도
2. 프로그램 목록 조회
3. KPI 데이터 입력
4. 대시보드 확인

---

## 7. 트러블슈팅

### 문제: Vercel 빌드 실패

**원인:** Frontend 경로 문제

**해결:**
```bash
# vercel.json 확인
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist"
}
```

### 문제: API 요청 CORS 에러

**원인:** Backend CORS 설정 누락

**해결:**
```typescript
// backend/src/app.ts
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://pdca.vercel.app',
  credentials: true
}));
```

### 문제: 환경 변수가 적용되지 않음

**원인:** Vercel 환경 변수 설정 누락

**해결:**
1. Vercel Dashboard > Settings > Environment Variables
2. 필요한 변수 추가
3. Redeploy 트리거

### 문제: Database 마이그레이션 필요

**해결:**
```bash
# 서버에서 실행
npm run prisma:migrate:prod -w backend

# 또는 Docker에서
docker-compose exec backend npx prisma migrate deploy
```

---

## 8. 배포 체크리스트

### 배포 전

- [ ] 모든 테스트 통과
- [ ] 환경 변수 설정 완료
- [ ] Database 백업 완료
- [ ] API 문서 업데이트
- [ ] README 업데이트

### Frontend 배포

- [ ] Vercel 프로젝트 생성
- [ ] 환경 변수 설정
- [ ] 도메인 연결 (선택)
- [ ] SSL 인증서 확인
- [ ] 빌드 성공 확인

### Backend 배포

- [ ] 서버 설정 완료
- [ ] Docker 컨테이너 실행
- [ ] Database 마이그레이션
- [ ] Nginx 설정
- [ ] SSL 인증서 설치
- [ ] Health check 통과

### 배포 후

- [ ] Frontend 접속 확인
- [ ] API 통신 확인
- [ ] 로그 모니터링
- [ ] 성능 테스트
- [ ] 사용자 테스트

---

## 9. 유용한 명령어

### Vercel CLI

```bash
# 로그인
vercel login

# 프로젝트 배포
vercel

# Production 배포
vercel --prod

# 환경 변수 추가
vercel env add VITE_API_URL

# 로그 확인
vercel logs

# 도메인 추가
vercel domains add pdca.yourdomain.com
```

### Docker

```bash
# 컨테이너 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f

# 재시작
docker-compose restart

# 재빌드 및 재시작
docker-compose up -d --build

# 정리
docker-compose down -v
```

---

## 10. 모니터링 및 로깅

### Vercel Analytics

Vercel Dashboard > Analytics에서 확인:
- 페이지 뷰
- 응답 시간
- 지역별 트래픽
- 에러율

### Backend 로깅

Winston 로그 확인:
```bash
# 로그 디렉토리
tail -f backend/logs/combined-$(date +%Y-%m-%d).log
tail -f backend/logs/error-$(date +%Y-%m-%d).log
tail -f backend/logs/integration-$(date +%Y-%m-%d).log
```

---

## 11. 추가 리소스

- [Vercel 공식 문서](https://vercel.com/docs)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Prisma 배포 가이드](https://www.prisma.io/docs/guides/deployment)
- [Nginx 설정 가이드](https://nginx.org/en/docs/)

---

**배포 관련 질문이나 문제가 있으면 이슈를 등록해주세요!**
