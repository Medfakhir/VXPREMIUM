import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from './db'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'EDITOR'
}

export async function verifyAdminToken(request: NextRequest): Promise<AdminUser | null> {
  try {
    const token = request.cookies.get('admin-token')?.value

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any

    // Verify user still exists in database
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    return adminUser
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

export function requireAdmin(handler: (request: NextRequest, adminUser: AdminUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    const adminUser = await verifyAdminToken(request)

    if (!adminUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized - Admin access required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return handler(request, adminUser)
  }
}
