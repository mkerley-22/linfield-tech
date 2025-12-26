import { NextRequest, NextResponse } from 'next/server'
import { getOrRefreshToken, listDriveFiles, getDriveFile } from '@/lib/google/drive'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const folderId = searchParams.get('folderId')
    const fileId = searchParams.get('fileId')
    const categoryId = searchParams.get('categoryId')
    const pageId = searchParams.get('pageId')
    
    // If categoryId or pageId, return linked files from database
    if (categoryId || pageId) {
      const where: any = {}
      if (categoryId) where.categoryId = categoryId
      if (pageId) where.pageId = pageId
      
      const files = await prisma.driveFile.findMany({
        where,
        orderBy: { modifiedTime: 'desc' },
      })
      
      return NextResponse.json(files)
    }
    
    // Otherwise, fetch from Drive API
    if (!folderId && !fileId) {
      return NextResponse.json({ error: 'folderId, fileId, categoryId, or pageId is required' }, { status: 400 })
    }
    
    const accessToken = await getOrRefreshToken()
    
    if (fileId) {
      const file = await getDriveFile(fileId, accessToken)
      return NextResponse.json(file)
    }
    
    if (folderId) {
      const files = await listDriveFiles(folderId, accessToken)
      return NextResponse.json({ files })
    }
    
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error: any) {
    console.error('Drive files error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Drive files' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileId, pageId, categoryId } = body
    
    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 })
    }
    
    const accessToken = await getOrRefreshToken()
    const file = await getDriveFile(fileId, accessToken)
    
    if (!file.id || !file.name) {
      return NextResponse.json({ error: 'Invalid file' }, { status: 400 })
    }
    
    // Check if already linked
    const existing = await prisma.driveFile.findUnique({
      where: { driveFileId: file.id },
    })
    
    if (existing) {
      // Update if pageId or categoryId changed
      const updated = await prisma.driveFile.update({
        where: { driveFileId: file.id },
        data: {
          pageId: pageId || null,
          categoryId: categoryId || null,
          lastChecked: new Date(),
        },
      })
      return NextResponse.json(updated)
    }
    
    // Create new link
    const driveFile = await prisma.driveFile.create({
      data: {
        driveFileId: file.id,
        fileName: file.name,
        mimeType: file.mimeType || 'application/octet-stream',
        fileSize: file.size ? parseInt(file.size) : null,
        webViewLink: file.webViewLink || '',
        webContentLink: file.webContentLink || null,
        thumbnailLink: file.thumbnailLink || null,
        modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : new Date(),
        createdTime: file.createdTime ? new Date(file.createdTime) : new Date(),
        pageId: pageId || null,
        categoryId: categoryId || null,
      },
    })
    
    return NextResponse.json(driveFile)
  } catch (error: any) {
    console.error('Link Drive file error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to link Drive file' },
      { status: 500 }
    )
  }
}

