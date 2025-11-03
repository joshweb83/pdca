import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const createDepartmentSchema = z.object({
  code: z.string().min(1, 'Department code is required'),
  name: z.string().min(1, 'Department name is required'),
  type: z.enum(['ACADEMIC', 'ADMINISTRATIVE']),
  parentDepartmentId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
});

// GET /api/departments - Get all departments
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Build where clause
    const where: any = {};
    if (type) where.type = type;

    // Fetch departments
    const departments = await prisma.department.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parentDepartment: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            programs: true,
            members: true,
            childDepartments: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      departments,
    });
  } catch (error: any) {
    console.error('Get departments error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

// POST /api/departments - Create new department
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only administrators can create departments' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = createDepartmentSchema.parse(body);

    // Check if department code already exists
    const existingDepartment = await prisma.department.findUnique({
      where: { code: validatedData.code },
    });

    if (existingDepartment) {
      return NextResponse.json(
        { success: false, error: 'Department with this code already exists' },
        { status: 400 }
      );
    }

    // Create department
    const department = await prisma.department.create({
      data: validatedData,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parentDepartment: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        department,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create department error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create department' },
      { status: 500 }
    );
  }
}
