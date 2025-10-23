import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface ApiResponse {
  success: boolean
  data?: any
  error?: string
  message?: string
}

// GET /api/articles/[id] - Get single article by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    })

    if (!article) {
      return NextResponse.json({
        success: false,
        error: 'Article not found'
      }, { status: 404 })
    }

    const response: ApiResponse = {
      success: true,
      data: {
        ...article,
        categoryId: article.category.id
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching article:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch article'
    }
    return NextResponse.json(response, { status: 500 })
  }
}

// PUT /api/articles/[id] - Update article by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      categoryId,
      tagIds = [],
      seoTitle,
      seoDescription,
      seoKeywords,
      status = 'DRAFT',
      publishedAt,
      authorId
    } = body

    // Validate required fields
    if (!title || !slug || !content || !categoryId || !authorId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id }
    })

    if (!existingArticle) {
      return NextResponse.json({
        success: false,
        error: 'Article not found'
      }, { status: 404 })
    }

    // Check if slug already exists (excluding current article)
    const slugExists = await prisma.article.findFirst({
      where: { 
        slug,
        id: { not: id }
      }
    })

    if (slugExists) {
      return NextResponse.json({
        success: false,
        error: 'Article with this slug already exists'
      }, { status: 400 })
    }

    // Update article
    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt,
        content,
        featuredImage,
        status,
        publishedAt: status === 'PUBLISHED' ? publishedAt || new Date() : null,
        seoTitle,
        seoDescription,
        seoKeywords,
        readTime: Math.ceil(content.split(' ').length / 200), // Estimate reading time
        author: {
          connect: { id: authorId }
        },
        category: {
          connect: { id: categoryId }
        },
        // TODO: Handle tags update
        // tags: {
        //   deleteMany: {},
        //   create: tagIds.map((tagId: string) => ({
        //     tag: {
        //       connect: { id: tagId }
        //     }
        //   }))
        // }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        category: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    const response: ApiResponse = {
      success: true,
      data: updatedArticle,
      message: 'Article updated successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating article:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update article'
    }
    return NextResponse.json(response, { status: 500 })
  }
}

// DELETE /api/articles/[id] - Delete article by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id }
    })

    if (!existingArticle) {
      return NextResponse.json({
        success: false,
        error: 'Article not found'
      }, { status: 404 })
    }

    // Delete article (this will cascade delete related tags due to foreign key constraints)
    await prisma.article.delete({
      where: { id }
    })

    const response: ApiResponse = {
      success: true,
      message: 'Article deleted successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error deleting article:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete article'
    }
    return NextResponse.json(response, { status: 500 })
  }
}
