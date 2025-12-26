import { NextRequest, NextResponse } from 'next/server'
import { getOrRefreshToken, listDriveFiles, getDriveFile } from '@/lib/google/drive'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { folderId, categoryId } = body
    
    if (!folderId) {
      return NextResponse.json({ error: 'folderId is required' }, { status: 400 })
    }
    
    const accessToken = await getOrRefreshToken()
    const files = await listDriveFiles(folderId, accessToken)
    
    const syncedFiles = []
    
    for (const file of files) {
      if (!file.id || !file.name) continue
      
      const existing = await prisma.driveFile.findUnique({
        where: { driveFileId: file.id },
      })
      
      if (existing) {
        // Update existing
        const updated = await prisma.driveFile.update({
          where: { driveFileId: file.id },
          data: {
            fileName: file.name,
            mimeType: file.mimeType || existing.mimeType,
            fileSize: file.size ? parseInt(file.size) : existing.fileSize,
            webViewLink: file.webViewLink || existing.webViewLink,
            webContentLink: file.webContentLink || existing.webContentLink,
            thumbnailLink: file.thumbnailLink || existing.thumbnailLink,
            modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : existing.modifiedTime,
            categoryId: categoryId || existing.categoryId,
            lastChecked: new Date(),
          },
        })
        syncedFiles.push(updated)
      } else {
        // Create new
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
            categoryId: categoryId || null,
          },
        })
        syncedFiles.push(driveFile)
      }
    }
    
    // Update folder last synced time
    if (categoryId) {
      await prisma.driveFolder.updateMany({
        where: { categoryId },
        data: { lastSynced: new Date() },
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      synced: syncedFiles.length,
      files: syncedFiles 
    })
  } catch (error: any) {
    console.error('Sync Drive folder error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync Drive folder' },
      { status: 500 }
    )
  }
}

