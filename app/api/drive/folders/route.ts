import { NextRequest, NextResponse } from 'next/server'
import { getOrRefreshToken, createDriveFolder, listDriveFiles } from '@/lib/google/drive'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')
    
    if (categoryId) {
      const folder = await prisma.driveFolder.findUnique({
        where: { categoryId },
        include: { category: true },
      })
      return NextResponse.json(folder)
    }
    
    const folders = await prisma.driveFolder.findMany({
      include: { category: true },
    })
    return NextResponse.json({ folders })
  } catch (error: any) {
    console.error('Drive folders error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Drive folders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { categoryId, name, parentFolderId, autoSync } = body
    
    if (!categoryId || !name) {
      return NextResponse.json({ error: 'categoryId and name are required' }, { status: 400 })
    }
    
    const accessToken = await getOrRefreshToken()
    
    // Create folder in Drive
    const driveFolder = await createDriveFolder(name, parentFolderId || null, accessToken)
    
    if (!driveFolder.id) {
      return NextResponse.json({ error: 'Failed to create Drive folder' }, { status: 500 })
    }
    
    // Save folder mapping
    const folder = await prisma.driveFolder.upsert({
      where: { categoryId },
      create: {
        driveFolderId: driveFolder.id,
        name: driveFolder.name || name,
        categoryId,
        autoSync: autoSync || false,
      },
      update: {
        driveFolderId: driveFolder.id,
        name: driveFolder.name || name,
        autoSync: autoSync !== undefined ? autoSync : undefined,
      },
    })
    
    return NextResponse.json(folder)
  } catch (error: any) {
    console.error('Create Drive folder error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create Drive folder' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { folderId, autoSync } = body
    
    if (!folderId) {
      return NextResponse.json({ error: 'folderId is required' }, { status: 400 })
    }
    
    const folder = await prisma.driveFolder.update({
      where: { id: folderId },
      data: {
        autoSync: autoSync !== undefined ? autoSync : undefined,
      },
    })
    
    return NextResponse.json(folder)
  } catch (error: any) {
    console.error('Update Drive folder error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update Drive folder' },
      { status: 500 }
    )
  }
}

