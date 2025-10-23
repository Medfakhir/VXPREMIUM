import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth'
import { ApiResponse } from '@/types/database'

// GET /api/auth/admin/me - Get current admin user
export async function GET(request: NextRequest) {
  try {
    const adminUser = await verifyAdminToken(request)

    if (!adminUser) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    const response: ApiResponse = {
      success: true,
      data: {
        user: adminUser
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Auth check error:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Authentication check failed'
    }
    return NextResponse.json(response, { status: 500 })
  }
}
