#!/bin/bash

echo "🔄 Vercel Postgres 초기화 스크립트"
echo "=================================="
echo ""

# Vercel CLI 설치 확인
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI 설치 중..."
    npm install -g vercel
fi

echo "🔑 Vercel 로그인..."
vercel login

echo "🔗 프로젝트 연결 중..."
cd frontend
vercel link

echo "📥 환경변수 가져오는 중..."
vercel env pull .env.production

echo "🗄️ Prisma Client 생성 중..."
npx prisma generate

echo "📊 데이터베이스 스키마 생성 중..."
npx prisma db push --accept-data-loss

echo ""
echo "✅ 데이터베이스 초기화 완료!"
echo ""
echo "다음 단계: 관리자 계정 생성"
echo "=============================="
echo ""
echo "브라우저 콘솔(F12)에서 실행:"
echo ""
echo "fetch('https://YOUR-APP.vercel.app/api/auth/register', {"
echo "  method: 'POST',"
echo "  headers: { 'Content-Type': 'application/json' },"
echo "  body: JSON.stringify({"
echo "    email: 'admin@university.ac.kr',"
echo "    password: 'Admin123!@#',"
echo "    name: '시스템 관리자',"
echo "    role: 'SUPER_ADMIN'"
echo "  })"
echo "}).then(r => r.json()).then(console.log)"
