import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeDbOperation } from '@/lib/db-utils';

// GET /api/export - Export all data
export async function GET() {
  try {
    // Get all data from database
    const [
      settings,
      categories,
      tags,
      articles,
      comments,
      adminUsers
    ] = await Promise.all([
      safeDbOperation(() => prisma.siteSetting.findMany(), []),
      safeDbOperation(() => prisma.category.findMany(), []),
      safeDbOperation(() => prisma.tag.findMany(), []),
      safeDbOperation(() => prisma.article.findMany({
        include: {
          author: {
            select: {
              name: true,
              email: true
            }
          },
          category: {
            select: {
              name: true,
              slug: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          }
        }
      }), []),
      safeDbOperation(() => prisma.comment.findMany({
        include: {
          article: {
            select: {
              title: true,
              slug: true
            }
          }
        }
      }), []),
      safeDbOperation(() => prisma.adminUser.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
          // Don't export password hash for security
        }
      }), [])
    ]);

    // Create export data structure
    const exportData = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        source: 'IPTV Blog'
      },
      settings: settings || [],
      categories: categories || [],
      tags: tags || [],
      articles: articles || [],
      comments: comments || [],
      adminUsers: adminUsers || []
    };

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `iptv-blog-export-${timestamp}.json`;

    // Return JSON file as download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to export data'
    }, { status: 500 });
  }
}
