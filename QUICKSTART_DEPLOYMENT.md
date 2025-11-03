# 빠른 배포 가이드 ⚡

5분 안에 PDCA 시스템을 Vercel에 배포하세요!

---

## 🚀 1단계: GitHub 저장소 준비

```bash
# Main 브랜치 생성 및 푸시
git checkout -b main
git push -u origin main
```

---

## 🌐 2단계: Vercel 배포 (Frontend)

### 방법 1: Vercel 웹사이트 사용 (추천)

1. **https://vercel.com** 접속
2. **GitHub로 로그인**
3. **New Project** 클릭
4. **GitHub 저장소 선택**: `joshweb83/pdca`
5. **Configure Project**:
   ```
   Framework Preset: Other
   Root Directory: ./
   Build Command: cd frontend && npm install && npm run build
   Output Directory: frontend/dist
   Install Command: npm install
   ```
6. **Environment Variables 추가**:
   ```
   VITE_API_URL = http://localhost:4000  (나중에 실제 API URL로 변경)
   ```
7. **Deploy** 클릭! 🎉

### 방법 2: Vercel CLI 사용

```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 프로젝트 배포
vercel

# Production 배포
vercel --prod
```

---

## 🔧 3단계: 환경 변수 설정

### Vercel Dashboard에서:

**Settings > Environment Variables**

```
Production:
  VITE_API_URL = https://api.yourdomain.com

Preview:
  VITE_API_URL = https://api-dev.yourdomain.com

Development:
  VITE_API_URL = http://localhost:4000
```

---

## 🎉 완료!

Frontend가 배포되었습니다!

**배포 URL 확인:**
- Vercel 기본 URL: `https://pdca-xxx.vercel.app`
- 커스텀 도메인: `https://pdca.yourdomain.com` (설정 필요)

---

## 📌 다음 단계

### Backend 배포 (필수)

Backend는 별도로 배포해야 합니다:

**옵션 1: Railway (추천)**
```bash
# 1. Railway 계정 생성: https://railway.app
# 2. New Project > Deploy from GitHub
# 3. 저장소 선택 후 backend 폴더 설정
# 4. 환경 변수 추가 (DATABASE_URL, REDIS_URL 등)
```

**옵션 2: Render**
```bash
# 1. Render 계정 생성: https://render.com
# 2. New Web Service
# 3. GitHub 저장소 연결
# 4. Root Directory: backend
# 5. Build Command: npm install && npx prisma generate && npm run build
# 6. Start Command: npm start
```

**옵션 3: 자체 서버**
```bash
# Docker로 배포
git clone https://github.com/joshweb83/pdca.git
cd pdca
cp backend/.env.example backend/.env
# .env 파일 수정
docker-compose up -d
```

### Frontend 환경 변수 업데이트

Backend 배포 완료 후:
1. Vercel Dashboard > Settings > Environment Variables
2. `VITE_API_URL` 값을 실제 Backend URL로 변경
3. Redeploy 트리거

---

## ✅ 배포 확인

### Frontend 확인
```bash
curl https://your-app.vercel.app
```

### Backend 확인
```bash
curl https://your-backend-url.com/health
```

### 통합 테스트
1. Frontend 접속
2. 로그인 시도
3. API 통신 확인

---

## 🔄 자동 배포 설정

### GitHub Actions 설정

**1. GitHub Secrets 추가**

Repository > Settings > Secrets and variables > Actions

```
VERCEL_TOKEN          # Vercel Settings > Tokens
VERCEL_ORG_ID         # .vercel/project.json
VERCEL_PROJECT_ID     # .vercel/project.json
```

**2. 자동 배포 활성화**

이제 `main` 브랜치에 푸시하면 자동으로 Vercel에 배포됩니다!

```bash
git add .
git commit -m "Update feature"
git push origin main
# 자동으로 Vercel에 배포됨! 🚀
```

---

## 🆘 문제 해결

### 빌드 실패
```bash
# vercel.json 확인
# buildCommand와 outputDirectory가 올바른지 확인
```

### API 연결 안 됨
```bash
# CORS 설정 확인
# Backend의 CORS_ORIGIN에 Vercel URL 추가
```

### 환경 변수 적용 안 됨
```bash
# Vercel Dashboard > Deployments > Redeploy
```

---

## 📚 더 자세한 가이드

- **전체 배포 가이드**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **아키텍처 문서**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **프로젝트 README**: [README.md](./README.md)

---

**5분 안에 배포 완료! 🎊**

질문이 있으면 이슈를 등록해주세요!
