import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeDbOperation } from '@/lib/db-utils';
import { getSettings } from '@/lib/settings';

// GET /api/comments - Get comments for an article
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');

    if (!articleId) {
      return NextResponse.json({
        success: false,
        error: 'Article ID is required'
      }, { status: 400 });
    }

    const comments = await safeDbOperation(
      () => prisma.comment.findMany({
        where: {
          articleId,
          isApproved: true // Only show approved comments
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

// POST /api/comments - Create new comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, content, authorName, authorEmail, authorUrl } = body;

    if (!articleId || !content || !authorName || !authorEmail) {
      return NextResponse.json({
        success: false,
        error: 'Article ID, content, name, and email are required'
      }, { status: 400 });
    }

    // Get settings to check if comments are enabled and moderation settings
    const settings = await getSettings();
    
    if (!settings.enableComments) {
      return NextResponse.json({
        success: false,
        error: 'Comments are disabled'
      }, { status: 403 });
    }

    // Check if article exists
    const article = await safeDbOperation(
      () => prisma.article.findUnique({
        where: { id: articleId },
        select: { id: true }
      })
    );

    if (!article) {
      return NextResponse.json({
        success: false,
        error: 'Article not found'
      }, { status: 404 });
    }

    // Create comment
    const comment = await safeDbOperation(
      () => prisma.comment.create({
        data: {
          articleId,
          content,
          authorName,
          authorEmail,
          authorUrl: authorUrl || null,
          isGuest: true,
          isApproved: !settings.moderateComments // Auto-approve if moderation is disabled
        }
      })
    );

    if (!comment) {
      throw new Error('Failed to create comment');
    }

    return NextResponse.json({
      success: true,
      data: comment,
      message: settings.moderateComments 
        ? 'Comment submitted for approval' 
        : 'Comment posted successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create comment'
    }, { status: 500 });
  }
}
