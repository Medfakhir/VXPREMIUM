import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdminToken } from '@/lib/auth'
import { ApiResponse } from '@/types/database'

// GET /api/admin/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const adminUser = await verifyAdminToken(request)

    if (!adminUser) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Get article statistics
    const [
      totalArticles,
      publishedArticles,
      draftArticles,
      totalCategories,
      totalTags,
      totalViewsResult,
      recentArticles
    ] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { status: 'PUBLISHED' } }),
      prisma.article.count({ where: { status: 'DRAFT' } }),
      prisma.category.count(),
      prisma.tag.count(),
      prisma.article.aggregate({
        _sum: {
          viewCount: true
        }
      }),
      prisma.article.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          status: true,
          viewCount: true,
          createdAt: true
        }
      })
    ])

    const stats = {
      totalArticles,
      publishedArticles,
      draftArticles,
      totalCategories,
      totalTags,
      totalViews: totalViewsResult._sum.viewCount || 0,
      recentArticles
    }

    const response: ApiResponse = {
      success: true,
      data: stats
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch dashboard statistics'
    }
    return NextResponse.json(response, { status: 500 })
  }
}
