/**
 * Storage abstraction layer
 * Supports both local file system (development) and Vercel Blob (production)
 */

import { put, del } from '@vercel/blob'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Use Vercel Blob if token is available, or if we're in a serverless environment (Vercel)
// In Vercel, we can't write to filesystem, so we must use Blob storage
const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL_ENV
const USE_VERCEL_BLOB = !!(process.env.BLOB_READ_WRITE_TOKEN) || IS_VERCEL

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
    // Vercel Blob accepts File, Blob, or ReadableStream
    let blobResult
    if (file instanceof File) {
      blobResult = await put(`${folder}/${fileName}`, file, {
        access: 'public',
        addRandomSuffix: false,
      })
    } else {
      // Convert Buffer to ArrayBuffer, then to Uint8Array for Blob
      const buffer = file instanceof Buffer ? file : Buffer.from(file)
      // Create a new ArrayBuffer by copying the buffer data
      const arrayBuffer = new ArrayBuffer(buffer.length)
      const view = new Uint8Array(arrayBuffer)
      view.set(buffer)
      blobResult = await put(`${folder}/${fileName}`, new Blob([view]), {
        access: 'public',
        addRandomSuffix: false,
      })
    }
    
    return {
      url: blobResult.url,
      path: blobResult.url, // Store full URL for Vercel Blob
    }
  } else {
    // Use local file system (development only - not in Vercel)
    // If we're in Vercel but don't have blob token, throw an error
    if (IS_VERCEL) {
      throw new Error('BLOB_READ_WRITE_TOKEN is required for file uploads in Vercel. Please set it in your environment variables.')
    }
    
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

