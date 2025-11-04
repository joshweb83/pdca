'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CreateProgramModal } from '@/components/programs/create-program-modal';
import { Program } from '@/types/api';

// 프로그램 목록 가져오기
async function fetchPrograms(params: { departmentId?: string; status?: string }): Promise<{
  programs: Program[];
}> {
  const searchParams = new URLSearchParams();
  if (params.departmentId) searchParams.append('departmentId', params.departmentId);
  if (params.status) searchParams.append('status', params.status);

  const res = await fetch(`/api/programs?${searchParams.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch programs');
  }

  return res.json();
}

export default function ProgramsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['programs', { status: statusFilter }],
    queryFn: () => fetchPrograms({ status: statusFilter }),
  });

  // 검색 필터링 (클라이언트 사이드)
  const filteredPrograms = data?.programs?.filter((program) =>
    searchTerm
      ? program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.code.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'danger' }
    > = {
      PLANNING: { label: '계획중', variant: 'warning' },
      IN_PROGRESS: { label: '진행중', variant: 'default' },
      COMPLETED: { label: '완료', variant: 'success' },
      SUSPENDED: { label: '보류', variant: 'secondary' },
    };

    const { label, variant } = statusMap[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">프로그램 관리</h1>
              <p className="mt-1 text-sm text-gray-500">성과관리 프로그램을 등록하고 관리합니다</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/dashboard">대시보드</Link>
              </Button>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                프로그램 등록
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="프로그램명 또는 코드 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 상태</option>
              <option value="PLANNING">계획중</option>
              <option value="IN_PROGRESS">진행중</option>
              <option value="COMPLETED">완료</option>
              <option value="SUSPENDED">보류</option>
            </select>

            {/* Stats */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              총 <span className="font-semibold text-gray-900">{filteredPrograms?.length || 0}</span>개
              프로그램
            </div>
          </div>
        </Card>

        {/* Table */}
        {isLoading ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
              <p className="mt-4 text-sm text-gray-500">프로그램 목록을 불러오는 중...</p>
            </div>
          </Card>
        ) : error ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center">
              <p className="text-red-600">프로그램 목록을 불러오는데 실패했습니다.</p>
              <Button onClick={() => refetch()} variant="outline" className="mt-4">
                다시 시도
              </Button>
            </div>
          </Card>
        ) : filteredPrograms && filteredPrograms.length > 0 ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      프로그램 코드
                    </th>
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
                      기간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      예산
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
                  {filteredPrograms.map((program) => (
                    <tr key={program.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {program.code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <Link href={`/programs/${program.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                          {program.name}
                        </Link>
                        {program.description && (
                          <p className="mt-1 text-xs text-gray-500">{program.description}</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {program.department?.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {program.manager?.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {new Date(program.startDate).toLocaleDateString('ko-KR')} ~<br />
                        {new Date(program.endDate).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {new Intl.NumberFormat('ko-KR', {
                          style: 'currency',
                          currency: 'KRW',
                        }).format(program.totalBudget)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">{getStatusBadge(program.status)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {program._count?.kpis || 0} / {program._count?.indicators || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center">
              <p className="text-gray-500">등록된 프로그램이 없습니다.</p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                첫 프로그램 등록하기
              </Button>
            </div>
          </Card>
        )}
      </main>

      {/* Create Modal */}
      <CreateProgramModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
