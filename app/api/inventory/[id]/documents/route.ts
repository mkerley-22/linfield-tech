import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/storage'

function getFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image'
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext || '')) return 'video'
  if (['pdf', 'doc', 'docx'].includes(ext || '')) return 'document'
  if (['pdf'].includes(ext || '')) return 'manual'
  return 'document'
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const uploadResult = await uploadFile(file, fileName, `uploads/inventory/${params.id}`)
    
    const document = await prisma.inventoryDocument.create({
      data: {
        id: crypto.randomUUID(),
        inventoryId: params.id,
        fileName: file.name,
        filePath: uploadResult.path,
        fileType: getFileType(file.name),
        mimeType: file.type,
        fileSize: file.size,
      },
    })
    
    return NextResponse.json({ document }, { status: 201 })
  } catch (error: any) {
    console.error('Upload document error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload document' },
      { status: 500 }
    )
  }
}

function getFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image'
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext || '')) return 'video'
  if (['pdf', 'doc', 'docx'].includes(ext || '')) return 'document'
  if (['pdf'].includes(ext || '')) return 'manual'
  return 'document'
}

