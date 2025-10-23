import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ApiResponse, PaginatedResponse, ArticleListItem } from '@/types/database'

// GET /api/articles - Get all published articles with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    // Handle status filter
    if (status === 'all') {
      // No status filter - show all articles (admin view)
    } else if (status) {
      // Specific status requested
      where.status = status
    } else {
      // Default: show only published articles (public view)
      where.status = 'PUBLISHED'
    }

    if (category) {
      where.category = {
        slug: category
      }
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            slug: tag
          }
        }
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { content: { contains: search } }
      ]
    }

    // Get articles with pagination
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featuredImage: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          viewCount: true,
          readTime: true,
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
              slug: true,
              color: true
            }
          },
          tags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          }
        },
        orderBy: {
          publishedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.article.count({ where })
    ])

    const response: PaginatedResponse<ArticleListItem> = {
      success: true,
      data: articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching articles:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch articles'
    }
    return NextResponse.json(response, { status: 500 })
  }
}

// POST /api/articles - Create new article (Admin only)
export async function POST(request: NextRequest) {
  try {
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

    // Check if slug already exists
    const existingArticle = await prisma.article.findUnique({
      where: { slug }
    })

    if (existingArticle) {
      return NextResponse.json({
        success: false,
        error: 'Article with this slug already exists'
      }, { status: 400 })
    }

    // Create article
    const article = await prisma.article.create({
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
        tags: {
          create: tagIds.map((tagId: string) => ({
            tag: {
              connect: { id: tagId }
            }
          }))
        }
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
      data: article,
      message: 'Article created successfully'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating article:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create article'
    }
    return NextResponse.json(response, { status: 500 })
  }
}
