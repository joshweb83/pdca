import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export default async function DashboardPage() {
  // Get authentication from cookies
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  // Verify token
  let user;
  try {
    user = verifyToken(token);
  } catch {
    redirect('/login');
  }

  // Fetch dashboard data directly from database (Server Component)
  const [programStats, recentPrograms, userDetails] = await Promise.all([
    // Get program statistics by status
    prisma.program.groupBy({
      by: ['status'],
      _count: true,
    }),

    // Get recent programs
    prisma.program.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        department: {
          select: {
            name: true,
          },
        },
        manager: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            kpis: true,
            indicators: true,
          },
        },
      },
    }),

    // Get user details
    prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  // Calculate total programs
  const totalPrograms = programStats.reduce((sum, stat) => sum + stat._count, 0);

  // Get stats by status
  const statsMap = programStats.reduce((acc, stat) => {
    acc[stat.status] = stat._count;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">대시보드</h1>
              <p className="mt-1 text-sm text-gray-500">
                환영합니다, {userDetails?.name}님 ({userDetails?.role})
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/programs"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                프로그램 관리
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-300"
                >
                  로그아웃
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">전체 프로그램</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              {totalPrograms}
            </dd>
          </div>

          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">진행중</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-blue-600">
              {statsMap.IN_PROGRESS || 0}
            </dd>
          </div>

          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">계획중</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-yellow-600">
              {statsMap.PLANNING || 0}
            </dd>
          </div>

          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">완료</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-600">
              {statsMap.COMPLETED || 0}
            </dd>
          </div>
        </div>

        {/* Recent Programs */}
        <div className="mt-8">
          <div className="rounded-lg bg-white shadow">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">최근 프로그램</h3>
              <div className="mt-5">
                {recentPrograms.length === 0 ? (
                  <p className="text-sm text-gray-500">등록된 프로그램이 없습니다.</p>
                ) : (
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            프로그램명
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            부서
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            담당자
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            상태
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            KPI/지표
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {recentPrograms.map((program) => (
                          <tr key={program.id}>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                              <Link
                                href={`/programs/${program.id}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                {program.name}
                              </Link>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {program.department.name}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {program.manager.name}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              <span
                                className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                  program.status === 'IN_PROGRESS'
                                    ? 'bg-blue-100 text-blue-800'
                                    : program.status === 'COMPLETED'
                                    ? 'bg-green-100 text-green-800'
                                    : program.status === 'PLANNING'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {program.status === 'IN_PROGRESS'
                                  ? '진행중'
                                  : program.status === 'COMPLETED'
                                  ? '완료'
                                  : program.status === 'PLANNING'
                                  ? '계획중'
                                  : '보류'}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {program._count.kpis} / {program._count.indicators}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
