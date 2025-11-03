import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const updateProgramSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  totalBudget: z.number().min(0).optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'SUSPENDED']).optional(),
});

// GET /api/programs/[id] - Get single program
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const program = await prisma.program.findUnique({
      where: { id: params.id },
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        kpis: {
          include: {
            kpi: true,
          },
        },
        indicators: {
          include: {
            indicator: true,
          },
        },
        _count: {
          select: {
            kpis: true,
            indicators: true,
            budgetItems: true,
          },
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      program,
    });
  } catch (error: any) {
    console.error('Get program error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch program' },
      { status: 500 }
    );
  }
}

// PUT /api/programs/[id] - Update program
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validatedData = updateProgramSchema.parse(body);

    // Check if program exists
    const existingProgram = await prisma.program.findUnique({
      where: { id: params.id },
    });

    if (!existingProgram) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    // Check permissions (only manager or admin can update)
    if (
      existingProgram.managerId !== authUser.userId &&
      !['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to update this program' },
        { status: 403 }
      );
    }

    // Update program
    const program = await prisma.program.update({
      where: { id: params.id },
      data: validatedData,
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

    return NextResponse.json({
      success: true,
      program,
    });
  } catch (error: any) {
    console.error('Update program error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update program' },
      { status: 500 }
    );
  }
}

// DELETE /api/programs/[id] - Delete program
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if program exists
    const existingProgram = await prisma.program.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            kpis: true,
            indicators: true,
          },
        },
      },
    });

    if (!existingProgram) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    // Check permissions (only admin can delete)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(authUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only administrators can delete programs' },
        { status: 403 }
      );
    }

    // Check if program has associated data
    if (existingProgram._count.kpis > 0 || existingProgram._count.indicators > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete program with associated KPIs or indicators. Please remove them first.',
        },
        { status: 400 }
      );
    }

    // Delete program
    await prisma.program.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Program deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete program error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete program' },
      { status: 500 }
    );
  }
}
