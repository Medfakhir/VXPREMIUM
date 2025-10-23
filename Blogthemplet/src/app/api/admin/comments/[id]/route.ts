import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeDbOperation } from '@/lib/db-utils';

// PATCH /api/admin/comments/[id] - Update comment approval status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isApproved } = body;

    if (typeof isApproved !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'isApproved must be a boolean'
      }, { status: 400 });
    }

    const comment = await safeDbOperation(
      () => prisma.comment.update({
        where: { id },
        data: { isApproved }
      })
    );

    if (!comment) {
      return NextResponse.json({
        success: false,
        error: 'Comment not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: comment,
      message: isApproved ? 'Comment approved' : 'Comment rejected'
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update comment'
    }, { status: 500 });
  }
}

// DELETE /api/admin/comments/[id] - Delete comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const comment = await safeDbOperation(
      () => prisma.comment.delete({
        where: { id }
      })
    );

    if (!comment) {
      return NextResponse.json({
        success: false,
        error: 'Comment not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete comment'
    }, { status: 500 });
  }
}
