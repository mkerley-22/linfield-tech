import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteFile } from '@/lib/storage'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: params.id },
    })

    if (!attachment) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete file from storage (Vercel Blob or local filesystem)
    try {
      await deleteFile(attachment.filePath)
    } catch (error) {
      console.warn('File not found in storage, continuing with database deletion:', error)
    }

    // Delete from database
    await prisma.attachment.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete file error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete file' },
      { status: 500 }
    )
  }
}

