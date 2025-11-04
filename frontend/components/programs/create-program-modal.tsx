'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Department } from '@/types/api';

const programSchema = z.object({
  code: z.string().min(1, '프로그램 코드를 입력하세요'),
  name: z.string().min(2, '프로그램명은 최소 2자 이상이어야 합니다'),
  description: z.string().optional(),
  departmentId: z.string().min(1, '부서를 선택하세요'),
  startDate: z.string().min(1, '시작일을 입력하세요'),
  endDate: z.string().min(1, '종료일을 입력하세요'),
  totalBudget: z.coerce.number().min(0, '예산은 0 이상이어야 합니다'),
});

type ProgramFormData = z.infer<typeof programSchema>;

interface CreateProgramModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

async function fetchDepartments(): Promise<{ departments: Department[] }> {
  const res = await fetch('/api/departments');
  if (!res.ok) throw new Error('Failed to fetch departments');
  return res.json();
}

export function CreateProgramModal({ open, onClose, onSuccess }: CreateProgramModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
  });

  // 부서 목록 가져오기
  const { data: departmentsData, isLoading: loadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  });

  // 모달이 닫힐 때 폼 초기화
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: ProgramFormData) => {
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          startDate: new Date(data.startDate).toISOString(),
          endDate: new Date(data.endDate).toISOString(),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || '프로그램 등록에 실패했습니다');
      }

      toast({
        title: '프로그램 등록 완료',
        description: `${data.name} 프로그램이 성공적으로 등록되었습니다.`,
        variant: 'success',
      });

      onSuccess();
      reset();
    } catch (error: any) {
      toast({
        title: '프로그램 등록 실패',
        description: error.message || '프로그램 등록 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>새 프로그램 등록</DialogTitle>
          <DialogDescription>성과관리를 위한 새로운 프로그램을 등록합니다.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 프로그램 코드 */}
            <Input
              {...register('code')}
              label="프로그램 코드"
              placeholder="PROG-2024-001"
              error={errors.code?.message}
              required
            />

            {/* 부서 선택 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                부서<span className="text-red-500">*</span>
              </label>
              <select
                {...register('departmentId')}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loadingDepartments}
              >
                <option value="">부서를 선택하세요</option>
                {departmentsData?.departments?.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              {errors.departmentId && (
                <p className="mt-1 text-sm text-red-600">{errors.departmentId.message}</p>
              )}
            </div>
          </div>

          {/* 프로그램명 */}
          <Input
            {...register('name')}
            label="프로그램명"
            placeholder="2024년 대학 혁신 프로그램"
            error={errors.name?.message}
            required
          />

          {/* 설명 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">프로그램 설명</label>
            <textarea
              {...register('description')}
              className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="프로그램에 대한 간단한 설명을 입력하세요"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 시작일 */}
            <Input
              {...register('startDate')}
              type="date"
              label="시작일"
              error={errors.startDate?.message}
              required
            />

            {/* 종료일 */}
            <Input
              {...register('endDate')}
              type="date"
              label="종료일"
              error={errors.endDate?.message}
              required
            />
          </div>

          {/* 총 예산 */}
          <Input
            {...register('totalBudget')}
            type="number"
            label="총 예산 (원)"
            placeholder="100000000"
            error={errors.totalBudget?.message}
            required
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '등록 중...' : '프로그램 등록'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
