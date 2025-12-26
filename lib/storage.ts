/**
 * Storage abstraction layer
 * Supports both local file system (development) and Vercel Blob (production)
 */

import { put, del } from '@vercel/blob'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const USE_VERCEL_BLOB = process.env.BLOB_READ_WRITE_TOKEN && process.env.NODE_ENV === 'production'

export interface UploadResult {
  url: string
  path: string
}

/**
 * Upload a file to storage
 */
export async function uploadFile(
  file: File | Buffer,
  fileName: string,
  folder: string = 'uploads'
): Promise<UploadResult> {
  if (USE_VERCEL_BLOB) {
    // Use Vercel Blob Storage
    const buffer = file instanceof File ? await file.arrayBuffer() : file
    const blob = await put(`${folder}/${fileName}`, buffer, {
      access: 'public',
      addRandomSuffix: false,
    })
    
    return {
      url: blob.url,
      path: blob.url, // Store full URL for Vercel Blob
    }
  } else {
    // Use local file system (development)
    const uploadsDir = join(process.cwd(), 'public', folder)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }
    
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = join(uploadsDir, sanitizedFileName)
    
    await writeFile(filePath, buffer)
    
    const relativePath = `/${folder}/${sanitizedFileName}`
    
    return {
      url: relativePath,
      path: relativePath,
    }
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  if (USE_VERCEL_BLOB && filePath.startsWith('http')) {
    // Vercel Blob - delete by URL
    try {
      await del(filePath)
    } catch (error) {
      console.error('Failed to delete blob:', error)
    }
  } else {
    // Delete from local file system
    const fullPath = filePath.startsWith('/')
      ? join(process.cwd(), 'public', filePath)
      : join(process.cwd(), 'public', filePath)
    
    if (existsSync(fullPath)) {
      try {
        await unlink(fullPath)
      } catch (error) {
        console.error('Failed to delete file:', error)
      }
    }
  }
}

/**
 * Get file URL (handles both local and blob storage)
 */
export function getFileUrl(filePath: string): string {
  if (filePath.startsWith('http')) {
    return filePath
  }
  
  if (USE_VERCEL_BLOB) {
    // Vercel Blob URLs are already absolute
    return filePath
  }
  
  // Local file system - return relative path
  return filePath
}

