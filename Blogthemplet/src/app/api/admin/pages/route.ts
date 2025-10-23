import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeDbOperation } from '@/lib/db-utils';

// GET /api/admin/pages - Get all pages
export async function GET() {
  try {
    const pages = await safeDbOperation(
      () => prisma.page.findMany({
        orderBy: {
          updatedAt: 'desc'
        }
      }),
      []
    ) || [];

    return NextResponse.json({
      success: true,
      data: pages
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch pages'
    }, { status: 500 });
  }
}

// POST /api/admin/pages - Create new page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, content, isActive } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({
        success: false,
        error: 'Title, slug, and content are required'
      }, { status: 400 });
    }

    // Check if slug already exists
    const existingPage = await safeDbOperation(
      () => prisma.page.findUnique({
        where: { slug }
      })
    );

    if (existingPage) {
      return NextResponse.json({
        success: false,
        error: 'A page with this slug already exists'
      }, { status: 400 });
    }

    const page = await safeDbOperation(
      () => prisma.page.create({
        data: {
          title,
          slug,
          content,
          isActive: isActive ?? true
        }
      })
    );

    if (!page) {
      throw new Error('Failed to create page');
    }

    return NextResponse.json({
      success: true,
      data: page,
      message: 'Page created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create page'
    }, { status: 500 });
  }
}
