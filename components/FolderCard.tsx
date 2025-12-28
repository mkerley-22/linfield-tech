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

  // Darken the folder color for modern aesthetic while preserving the color identity
  const darkenColor = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = (num >> 16) & 255
    const g = (num >> 8) & 255
    const b = num & 255
    const darkR = Math.max(0, Math.floor(r * (1 - percent)))
    const darkG = Math.max(0, Math.floor(g * (1 - percent)))
    const darkB = Math.max(0, Math.floor(b * (1 - percent)))
    return `#${((darkR << 16) | (darkG << 8) | darkB).toString(16).padStart(6, '0')}`
  }
  
  const folderBaseColor = darkenColor(color, 0.5) // Darken by 50% for modern look
  const accentColor = color // Keep original for accents

  return (
    <Link
      href={`/categories/${slug}`}
      className="group relative block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Folder Icon Container */}
        <div className="relative h-48 mb-4 flex items-center justify-center">
          {/* Folder Base */}
          <div
            className="relative transition-all duration-300 ease-out"
            style={{
              transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
            }}
          >
            {/* Modern Folder Body with curved top */}
            <div className="relative">
              {/* Folder Back (darker) */}
              <div
                className="absolute w-32 h-28 rounded-lg"
                style={{
                  backgroundColor: folderBaseColor,
                  opacity: 0.3,
                  transform: 'translate(2px, 2px)',
                }}
              />
              
              {/* Folder Front with curved top edge */}
              <div
                className="relative w-32 h-28 rounded-lg shadow-lg transition-all duration-400"
                style={{
                  backgroundColor: folderBaseColor,
                  transform: isHovered 
                    ? 'perspective(400px) rotateX(15deg) scale(1.05)' 
                    : 'perspective(400px) rotateX(0deg) scale(1)',
                  transformOrigin: 'bottom center',
                  transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                {/* Curved top edge using SVG path */}
                <svg
                  className="absolute -top-1 left-0 w-full"
                  viewBox="0 0 128 12"
                  style={{ height: '12px' }}
                  preserveAspectRatio="none"
                >
                  <path
                    d={`M 0 12 Q 32 ${isHovered ? 4 : 6} 64 ${isHovered ? 2 : 4} T 128 ${isHovered ? 4 : 6} L 128 12 Z`}
                    fill={folderBaseColor}
                    style={{
                      transition: 'd 0.4s ease-out',
                    }}
                  />
                </svg>
                
                {/* Files peeking out - animate up on hover */}
                {fileIcons.map((index) => {
                  const baseLeft = 28 + index * 12
                  const baseTop = -8 - index * 4
                  return (
                    <div
                      key={index}
                      className="absolute bg-white rounded-sm shadow-lg transition-all duration-400 border border-gray-200"
                      style={{
                        width: '28px',
                        height: '32px',
                        left: `${baseLeft}px`,
                        top: isHovered ? `${baseTop - 16 - index * 5}px` : `${baseTop}px`,
                        opacity: isHovered ? 1 : fileCount > 0 ? 0.7 : 0,
                        transform: isHovered 
                          ? `translateY(${-index * 8}px) rotate(${-4 + index * 2}deg) scale(1.15)` 
                          : `translateY(0) rotate(0deg) scale(1)`,
                        transitionDelay: `${index * 100}ms`,
                        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                        zIndex: 10 - index,
                      }}
                    >
                      {/* Document icon inside */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileText 
                          className="w-4 h-4 text-gray-400" 
                          style={{ 
                            opacity: isHovered ? 1 : 0.6,
                            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                            transition: 'all 0.3s ease-out',
                          }}
                        />
                      </div>
                      {/* Folded corner on documents */}
                      <div 
                        className="absolute top-0 right-0 w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-gray-300"
                      />
                    </div>
                  )
                })}
                
                {/* Empty folder - show subtle document icon */}
                {fileCount === 0 && (
                  <div
                    className="absolute inset-0 flex items-center justify-center transition-all duration-300"
                    style={{
                      opacity: isHovered ? 0.4 : 0.2,
                    }}
                  >
                    <FileText 
                      className="w-10 h-10 text-white" 
                      style={{
                        transform: isHovered ? 'scale(1.1) translateY(-4px)' : 'scale(1)',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Folder Name and Info */}
        <div className="text-center">
          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors text-lg">
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

