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
  const folderIcon = fileCount > 0 
    ? '/folder-icons/folder-files.svg'
    : '/folder-icons/folder-empty.svg'

  return (
    <Link
      href={`/categories/${slug}`}
      className="group relative block"
    >
      <div className="relative bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        {/* Folder Icon Container */}
        <div className="relative h-32 mb-4 flex items-center justify-center">
          <img
            src={folderIcon}
            alt={fileCount > 0 ? 'Folder with files' : 'Empty folder'}
            className="w-32 h-24 object-contain"
          />
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

