import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteFile } from '@/lib/storage'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> | { id: string; docId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const { id: inventoryId, docId } = resolvedParams

    // Get document to find file path
    const document = await prisma.inventoryDocument.findUnique({
      where: { id: docId },
    })

    if (!document || document.inventoryId !== inventoryId) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Delete file from storage
    try {
      await deleteFile(document.filePath)
    } catch (error) {
      console.warn('File not found in storage, continuing with database deletion:', error)
    }

    // Delete from database
    await prisma.inventoryDocument.delete({
      where: { id: docId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete document error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete document' },
      { status: 500 }
    )
  }
}

