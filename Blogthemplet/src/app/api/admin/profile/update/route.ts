import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { safeDbOperation } from '@/lib/db-utils';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

export async function PUT(request: NextRequest) {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-token')?.value;

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid token'
      }, { status: 401 });
    }

    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({
        success: false,
        error: 'Name and email are required'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 });
    }

    // Check if email is already taken by another user
    const existingUser = await safeDbOperation(
      () => prisma.adminUser.findFirst({
        where: {
          email,
          NOT: { id: decoded.userId }
        }
      })
    );

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'Email is already in use'
      }, { status: 400 });
    }

    // Update user profile
    const updatedUser = await safeDbOperation(
      () => prisma.adminUser.update({
        where: { id: decoded.userId },
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase()
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      })
    );

    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update profile'
    }, { status: 500 });
  }
}
