import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadFile, deleteFile } from '@/lib/storage'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const inventoryId = resolvedParams.id

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

    // Get existing item to delete old image if exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: inventoryId },
    })

    if (existingItem?.imageUrl) {
      // Delete old image file from storage
      try {
        await deleteFile(existingItem.imageUrl)
      } catch (e) {
        console.error('Failed to delete old image:', e)
      }
    }
    
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const uploadResult = await uploadFile(file, fileName, `uploads/inventory/${inventoryId}`)
    
    const imageUrl = uploadResult.path
    
    // Update inventory item with new image URL
    const updated = await prisma.inventoryItem.update({
      where: { id: inventoryId },
      data: { imageUrl },
    })
    
    return NextResponse.json({ imageUrl: updated.imageUrl })
  } catch (error: any) {
    console.error('Upload image error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const inventoryId = resolvedParams.id

    // Get existing item
    const item = await prisma.inventoryItem.findUnique({
      where: { id: inventoryId },
    })

    if (item?.imageUrl) {
      // Delete image file from storage
      try {
        await deleteFile(item.imageUrl)
      } catch (e) {
        console.error('Failed to delete image:', e)
      }
    }

    // Update inventory item to remove image URL
    const updated = await prisma.inventoryItem.update({
      where: { id: inventoryId },
      data: { imageUrl: null },
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete image error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete image' },
      { status: 500 }
    )
  }
}

