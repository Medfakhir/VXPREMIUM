import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { safeDbOperation } from '@/lib/db-utils'
import { broadcastUpdate } from '@/app/api/events/route'

interface ApiResponse {
  success: boolean
  data?: any
  error?: string
  message?: string
}

// GET /api/categories/[id] - Get single category by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const category = await prisma.category.findUnique({
      where: { id },
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
      }
    })

    if (!category) {
      return NextResponse.json({
        success: false,
        error: 'Category not found'
      }, { status: 404 })
    }

    const response: ApiResponse = {
      success: true,
      data: category
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching category:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch category'
    }
    return NextResponse.json(response, { status: 500 })
  }
}

// PUT /api/categories/[id] - Update category by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { 
      name, 
      slug, 
      description, 
      color, 
      icon,
      showInMenu,
      menuOrder,
      isActive,
      menuLabel
    } = body

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json({
        success: false,
        error: 'Name and slug are required'
      }, { status: 400 })
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return NextResponse.json({
        success: false,
        error: 'Category not found'
      }, { status: 404 })
    }

    // Check if slug already exists (excluding current category)
    const slugExists = await prisma.category.findFirst({
      where: { 
        slug,
        id: { not: id }
      }
    })

    if (slugExists) {
      return NextResponse.json({
        success: false,
        error: 'Category with this slug already exists'
      }, { status: 400 })
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id },
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
      },
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
      data: updatedCategory,
      message: 'Category updated successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating category:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update category'
    }
    return NextResponse.json(response, { status: 500 })
  }
}

// DELETE /api/categories/[id] - Delete category by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            articles: true
          }
        }
      }
    })

    if (!existingCategory) {
      return NextResponse.json({
        success: false,
        error: 'Category not found'
      }, { status: 404 })
    }

    // Check if category has articles
    if (existingCategory._count.articles > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete category with ${existingCategory._count.articles} articles. Please move or delete the articles first.`
      }, { status: 400 })
    }

    // Delete category
    await prisma.category.delete({
      where: { id }
    })

    const response: ApiResponse = {
      success: true,
      message: 'Category deleted successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error deleting category:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete category'
    }
    return NextResponse.json(response, { status: 500 })
  }
}
