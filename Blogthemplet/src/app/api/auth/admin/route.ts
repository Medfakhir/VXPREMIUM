import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeDbOperation } from '@/lib/db-utils';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '@/types/database'

// POST /api/auth/admin - Admin login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 })
    }

    // Find admin user with retry logic
    const adminUser = await safeDbOperation(
      () => prisma.adminUser.findUnique({
        where: { email }
      })
    )

    if (!adminUser) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 })
    }

    // Handle database connection issues
    if (adminUser === null) {
      return NextResponse.json({
        success: false,
        error: 'Database connection error. Please try again.'
      }, { status: 503 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, adminUser.password)

    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 })
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: adminUser.id, 
        email: adminUser.email, 
        role: adminUser.role 
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Create response with secure cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role
        }
      },
      message: 'Login successful'
    })

    // Set secure HTTP-only cookie
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error) {
    console.error('Admin login error:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Login failed'
    }
    return NextResponse.json(response, { status: 500 })
  }
}

// DELETE /api/auth/admin - Admin logout
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    })

    // Clear the admin token cookie
    response.cookies.delete('admin-token')

    return response
  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json({
      success: false,
      error: 'Logout failed'
    }, { status: 500 })
  }
}
