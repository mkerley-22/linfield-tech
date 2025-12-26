import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// One-time endpoint to ensure mkerley@linfield.com is admin
// This can be called manually or run as a migration
export async function POST(request: NextRequest) {
  try {
    const adminEmail = 'mkerley@linfield.com'
    
    // Find or create the admin user
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        id: crypto.randomUUID(),
        email: adminEmail,
        name: 'Michael Kerley',
        role: 'admin',
        updatedAt: new Date(),
      },
      update: {
        role: 'admin', // Always ensure admin role
      },
    })

    return NextResponse.json({
      success: true,
      message: `${adminEmail} is now set as admin`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error('Ensure admin error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to ensure admin user' },
      { status: 500 }
    )
  }
}

