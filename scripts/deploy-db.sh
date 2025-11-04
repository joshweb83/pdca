#!/bin/bash

# Vercel 프로젝트 이름을 여기에 입력하세요
PROJECT_NAME="pdca"

echo "🔄 Vercel에서 환경변수를 가져오는 중..."
vercel env pull .env.production --yes

echo "📦 Prisma 마이그레이션 실행 중..."
cd frontend
npx prisma generate
npx prisma db push

echo "✅ 데이터베이스 초기화 완료!"
echo ""
echo "이제 관리자 계정을 만드세요:"
echo "https://your-app.vercel.app/api/auth/register 로 POST 요청"
