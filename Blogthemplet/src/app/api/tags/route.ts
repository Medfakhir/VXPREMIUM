import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/tags - Get all tags
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            articles: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const transformedTags = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      color: tag.color,
      articleCount: tag._count.articles,
      createdAt: tag.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: transformedTags
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch tags'
    }, { status: 500 });
  }
}

// POST /api/tags - Create new tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, color } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json({
        success: false,
        error: 'Name and slug are required'
      }, { status: 400 });
    }

    // Check if tag with same name or slug already exists
    const existingTag = await prisma.tag.findFirst({
      where: {
        OR: [
          { name: name },
          { slug: slug }
        ]
      }
    });

    if (existingTag) {
      return NextResponse.json({
        success: false,
        error: 'Tag with this name or slug already exists'
      }, { status: 400 });
    }

    // Create tag
    const tag = await prisma.tag.create({
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
      data: transformedTag,
      message: 'Tag created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create tag'
    }, { status: 500 });
  }
}
