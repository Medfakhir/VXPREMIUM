import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeDbOperation } from '@/lib/db-utils';
import { broadcastUpdate } from '@/app/api/events/route';
import { ApiResponse, CategoryWithCount } from '@/types/database'

// GET /api/categories - Get all categories with article counts
export async function GET(request: NextRequest) {
  try {
    const categories = await safeDbOperation(
      () => prisma.category.findMany({
        include: {
          _count: {
            select: {
              articles: {
                where: {
                  status: 'PUBLISHED'
                }
              }
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      }),
      []
    ) || [];

    const response: ApiResponse<CategoryWithCount[]> = {
      success: true,
      data: categories
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching categories:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch categories'
    }
    return NextResponse.json(response, { status: 500 })
  }
}

// POST /api/categories - Create new category (Admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      slug, 
      description, 
      color, 
      icon,
      showInMenu = true,
      menuOrder = 0,
      isActive = true,
      menuLabel
    } = body

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json({
        success: false,
        error: 'Name and slug are required'
      }, { status: 400 })
    }

    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug }
    })

    if (existingCategory) {
      return NextResponse.json({
        success: false,
        error: 'Category with this slug already exists'
      }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        color,
        icon,
        showInMenu,
        menuOrder,
        isActive,
        menuLabel
      }
    })

    // Broadcast categories update
    const updatedCategories = await safeDbOperation(
      () => prisma.category.findMany({
        where: { isActive: true },
        orderBy: { menuOrder: 'asc' }
      }),
      []
    ) || [];
    
    broadcastUpdate('categories_updated', updatedCategories);

    const response: ApiResponse = {
      success: true,
      data: category,
      message: 'Category created successfully'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create category'
    }
    return NextResponse.json(response, { status: 500 })
  }
}
