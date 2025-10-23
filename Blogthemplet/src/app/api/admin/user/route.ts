import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/admin/user - Get admin user info (for article creation)
export async function GET() {
  try {
    // For now, get the seeded admin user
    // In production, this would get the current authenticated user
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: 'admin@iptvhub.com' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    if (!adminUser) {
      return NextResponse.json({
        success: false,
        error: 'Admin user not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: adminUser
    })
  } catch (error) {
    console.error('Error fetching admin user:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch admin user'
    }, { status: 500 })
  }
}
