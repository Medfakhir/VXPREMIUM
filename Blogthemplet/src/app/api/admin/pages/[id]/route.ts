import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeDbOperation } from '@/lib/db-utils';

// PUT /api/admin/pages/[id] - Update page
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, slug, content, isActive } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({
        success: false,
        error: 'Title, slug, and content are required'
      }, { status: 400 });
    }

    // Check if slug already exists (excluding current page)
    const existingPage = await safeDbOperation(
      () => prisma.page.findFirst({
        where: {
          slug,
          NOT: { id }
        }
      })
    );

    if (existingPage) {
      return NextResponse.json({
        success: false,
        error: 'A page with this slug already exists'
      }, { status: 400 });
    }

    const page = await safeDbOperation(
      () => prisma.page.update({
        where: { id },
        data: {
          title,
          slug,
          content,
          isActive: isActive ?? true
        }
      })
    );

    if (!page) {
      return NextResponse.json({
        success: false,
        error: 'Page not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: page,
      message: 'Page updated successfully'
    });
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update page'
    }, { status: 500 });
  }
}

// DELETE /api/admin/pages/[id] - Delete page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const page = await safeDbOperation(
      () => prisma.page.delete({
        where: { id }
      })
    );

    if (!page) {
      return NextResponse.json({
        success: false,
        error: 'Page not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete page'
    }, { status: 500 });
  }
}
