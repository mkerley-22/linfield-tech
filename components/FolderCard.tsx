'use client'

import Link from 'next/link'
import { Folder, FileText } from 'lucide-react'

interface FolderCardProps {
  name: string
  slug: string
  color?: string
  fileCount: number
  subfolderCount?: number
  description?: string
}

export default function FolderCard({ 
  name, 
  slug, 
  color = '#2563eb', 
  fileCount,
  subfolderCount = 0,
  description 
}: FolderCardProps) {
  // Lighten the color for the tab
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 37, g: 99, b: 235 }
  }

  const rgb = hexToRgb(color)
  const lighterColor = `rgb(${Math.min(255, rgb.r + 40)}, ${Math.min(255, rgb.g + 40)}, ${Math.min(255, rgb.b + 40)})`

  return (
    <Link
      href={`/categories/${slug}`}
      className="group relative block"
    >
      <div className="relative bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        {/* Folder Icon Container */}
        <div className="relative h-32 mb-4 flex items-center justify-center">
          {/* Simple Folder Shape */}
          <div className="relative">
            {/* Main folder body */}
            <div
              className="relative w-24 h-20 rounded-lg shadow-sm"
              style={{
                backgroundColor: color,
              }}
            >
              {/* Folder tab (top-left) */}
              <div
                className="absolute -top-2 left-2 w-10 h-4 rounded-t"
                style={{
                  backgroundColor: lighterColor,
                }}
              />
            </div>
          </div>
        </div>

        {/* Folder Name and Info */}
        <div className="text-center">
          <h3 className="font-semibold text-gray-900 mb-1 text-base">
            {name}
          </h3>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            {fileCount > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {fileCount} {fileCount === 1 ? 'file' : 'files'}
              </span>
            )}
            {fileCount === 0 && (
              <span className="text-gray-400">0 files</span>
            )}
            {subfolderCount > 0 && (
              <span className="flex items-center gap-1">
                <Folder className="w-4 h-4" />
                {subfolderCount} {subfolderCount === 1 ? 'folder' : 'folders'}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

