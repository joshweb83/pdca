import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const createProgramSchema = z.object({
  code: z.string().min(1, 'Program code is required'),
  name: z.string().min(1, 'Program name is required'),
  description: z.string().optional(),
  departmentId: z.string().uuid('Invalid department ID'),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  totalBudget: z.number().min(0, 'Budget must be non-negative'),
});

// GET /api/programs - Get all programs
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // Build where clause
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;

    // Fetch programs with pagination
    const [programs, total] = await Promise.all([
      prisma.program.findMany({
        where,
        include: {
          department: true,
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
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.program.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      programs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error('Get programs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}

// POST /api/programs - Create new program
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

    const body = await request.json();

    // Validate request body
    const validatedData = createProgramSchema.parse(body);

    // Check if program code already exists
    const existingProgram = await prisma.program.findUnique({
      where: { code: validatedData.code },
    });

    if (existingProgram) {
      return NextResponse.json(
        { success: false, error: 'Program with this code already exists' },
        { status: 400 }
      );
    }

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: validatedData.departmentId },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    // Create program
    const program = await prisma.program.create({
      data: {
        ...validatedData,
        managerId: authUser.userId, // Set current user as manager
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

    return NextResponse.json(
      {
        success: true,
        program,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create program error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create program' },
      { status: 500 }
    );
  }
}
