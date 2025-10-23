import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/tags/[id] - Get single tag
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            articles: true
          }
        }
      }
    });

    if (!tag) {
      return NextResponse.json({
        success: false,
        error: 'Tag not found'
      }, { status: 404 });
    }

    const transformedTag = {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      color: tag.color,
      articleCount: tag._count.articles,
      createdAt: tag.createdAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      data: transformedTag
    });
  } catch (error) {
    console.error('Error fetching tag:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch tag'
    }, { status: 500 });
  }
}

// PUT /api/tags/[id] - Update tag
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, description, color } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json({
        success: false,
        error: 'Name and slug are required'
      }, { status: 400 });
    }

    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
      where: { id }
    });

    if (!existingTag) {
      return NextResponse.json({
        success: false,
        error: 'Tag not found'
      }, { status: 404 });
    }

    // Check if another tag with same name or slug exists
    const duplicateTag = await prisma.tag.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              { name: name },
              { slug: slug }
            ]
          }
        ]
      }
    });

    if (duplicateTag) {
      return NextResponse.json({
        success: false,
        error: 'Tag with this name or slug already exists'
      }, { status: 400 });
    }

    // Update tag
    const updatedTag = await prisma.tag.update({
      where: { id },
      data: {
        name,
        slug,
        description: description || null,
        color: color || '#3B82F6'
      },
      include: {
        _count: {
          select: {
            articles: true
          }
        }
      }
    });

    const transformedTag = {
      id: updatedTag.id,
      name: updatedTag.name,
      slug: updatedTag.slug,
      description: updatedTag.description,
      color: updatedTag.color,
      articleCount: updatedTag._count.articles,
      createdAt: updatedTag.createdAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      data: transformedTag,
      message: 'Tag updated successfully'
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update tag'
    }, { status: 500 });
  }
}

// DELETE /api/tags/[id] - Delete tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            articles: true
          }
        }
      }
    });

    if (!existingTag) {
      return NextResponse.json({
        success: false,
        error: 'Tag not found'
      }, { status: 404 });
    }

    // Delete tag (this will remove it from articles due to the relation)
    await prisma.tag.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: `Tag deleted successfully. Removed from ${existingTag._count.articles} articles.`
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete tag'
    }, { status: 500 });
  }
}
