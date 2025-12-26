import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/storage'
import { getFileType } from '@/lib/utils'

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
        fileType: getFileType(file.type),
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

