import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getFileType } from '@/lib/utils'
import { uploadFile } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const pageId = formData.get('pageId') as string

    if (!pageId) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 })
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const uploadedFiles = []

    for (const file of files) {
      const fileType = getFileType(file.type)
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      
      // Upload file using storage abstraction (Vercel Blob in production, local in dev)
      const uploadResult = await uploadFile(file, fileName, 'uploads')

      const attachment = await prisma.attachment.create({
        data: {
          id: crypto.randomUUID(),
          pageId,
          fileName: file.name,
          filePath: uploadResult.path,
          fileType,
          mimeType: file.type,
          fileSize: file.size,
        },
      })

      uploadedFiles.push({
        id: attachment.id,
        fileName: attachment.fileName,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
      })
    }

    return NextResponse.json({ files: uploadedFiles })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload files' },
      { status: 500 }
    )
  }
}

