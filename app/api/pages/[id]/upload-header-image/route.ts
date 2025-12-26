import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadFile, deleteFile } from '@/lib/storage'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Get existing page to delete old image if exists
    const existingPage = await prisma.page.findUnique({
      where: { id: params.id },
    })

    if (existingPage?.headerImage) {
      // Delete old image file from storage
      try {
        await deleteFile(existingPage.headerImage)
      } catch (e) {
        console.error('Failed to delete old image:', e)
      }
    }
    
    const fileName = `header-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const uploadResult = await uploadFile(file, fileName, `uploads/pages/${params.id}`)
    
    const imageUrl = uploadResult.path
    
    // Update page with new header image URL
    const updated = await prisma.page.update({
      where: { id: params.id },
      data: { headerImage: imageUrl },
    })

    return NextResponse.json({ headerImage: updated.headerImage })
  } catch (error: any) {
    console.error('Upload header image error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload header image' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const page = await prisma.page.findUnique({
      where: { id: params.id },
    })

    if (page?.headerImage) {
      // Delete image file from storage
      try {
        await deleteFile(page.headerImage)
      } catch (e) {
        console.error('Failed to delete image:', e)
      }
    }

    await prisma.page.update({
      where: { id: params.id },
      data: { headerImage: null },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete header image error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete header image' },
      { status: 500 }
    )
  }
}

