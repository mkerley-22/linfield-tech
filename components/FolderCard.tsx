'use client'

import { useState } from 'react'
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
  const [isHovered, setIsHovered] = useState(false)

  // Generate file icons for animation (up to 3 visible)
  const visibleFiles = Math.min(fileCount, 3)
  const fileIcons = Array.from({ length: visibleFiles }, (_, i) => i)

  return (
    <Link
      href={`/categories/${slug}`}
      className="group relative block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Folder Icon Container */}
        <div className="relative h-40 mb-4 flex items-center justify-center">
          {/* Folder Base */}
          <div
            className="relative transition-all duration-300 ease-out"
            style={{
              transform: isHovered ? 'translateY(-12px)' : 'translateY(0)',
            }}
          >
            {/* Folder Body - opens on hover */}
            <div
              className="w-28 h-24 rounded-t-lg rounded-b-sm relative shadow-lg"
              style={{
                backgroundColor: color,
                transform: isHovered 
                  ? 'perspective(300px) rotateX(12deg) scale(1.05)' 
                  : 'perspective(300px) rotateX(0deg) scale(1)',
                transformOrigin: 'bottom center',
                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: isHovered 
                  ? `0 10px 25px -5px ${color}40, 0 0 0 1px ${color}20` 
                  : `0 4px 6px -1px ${color}20`,
              }}
            >
              {/* Folder Tab */}
              <div
                className="absolute -top-3 left-3 w-10 h-4 rounded-t transition-all duration-300"
                style={{
                  backgroundColor: color,
                  opacity: 0.9,
                  transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                }}
              />
              
              {/* Files peeking out - animate up on hover */}
              {fileIcons.map((index) => {
                const baseLeft = 24 + index * 10
                const baseTop = -6 - index * 3
                return (
                  <div
                    key={index}
                    className="absolute bg-white rounded-sm shadow-md transition-all duration-400 border border-gray-200"
                    style={{
                      width: '24px',
                      height: '28px',
                      left: `${baseLeft}px`,
                      top: isHovered ? `${baseTop - 12 - index * 4}px` : `${baseTop}px`,
                      opacity: isHovered ? 1 : fileCount > 0 ? 0.6 : 0,
                      transform: isHovered 
                        ? `translateY(${-index * 6}px) rotate(${-3 + index * 2}deg) scale(1.1)` 
                        : `translateY(0) rotate(0deg) scale(1)`,
                      transitionDelay: `${index * 80}ms`,
                      transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                      zIndex: 10 - index,
                    }}
                  >
                    {/* PDF indicator on first file */}
                    {index === 0 && fileCount > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[7px] font-bold text-gray-700 leading-none">PDF</span>
                      </div>
                    )}
                    {/* Folded corner on documents */}
                    <div 
                      className="absolute top-0 right-0 w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-gray-300"
                    />
                  </div>
                )
              })}
              
              {/* Empty folder indicator - just shows opening animation */}
              {fileCount === 0 && (
                <div
                  className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
                  style={{
                    opacity: isHovered ? 0.3 : 0.1,
                  }}
                >
                  <FileText className="w-8 h-8" style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Folder Name and Info */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
            {name}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {fileCount} {fileCount === 1 ? 'file' : 'files'}
            </span>
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

