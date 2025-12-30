import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { sendUserInvitation } from '@/lib/email'

// Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can view all users
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    })

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// Create a new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can create users
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email, name, role } = body

    if (!email || !name || !role) {
      return NextResponse.json(
        { error: 'Email, name, and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be admin, editor, or viewer' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Create user (they'll need to log in via Google OAuth to set up their account)
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: role,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Send invitation email
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
        (request.headers.get('origin') || new URL(request.url).origin)
      const loginUrl = `${baseUrl}/login`
      
      await sendUserInvitation(
        user.email,
        user.name,
        user.role as 'admin' | 'editor' | 'viewer',
        loginUrl
      )
      console.log('Invitation email sent to:', user.email)
    } catch (error) {
      console.error('Failed to send invitation email:', error)
      // Don't fail the user creation if email fails
    }

    return NextResponse.json({ user }, { status: 201 })
  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    )
  }
}

