import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeDbOperation } from '@/lib/db-utils';

// GET /api/admin/comments - Get all comments for admin
export async function GET() {
  try {
    const comments = await safeDbOperation(
      () => prisma.comment.findMany({
        include: {
          article: {
            select: {
              title: true,
              slug: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      []
    ) || [];

    return NextResponse.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch comments'
    }, { status: 500 });
  }
}
