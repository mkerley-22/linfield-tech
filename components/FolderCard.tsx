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

// Helper function to lighten a color
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * percent))
  const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * percent))
  const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * percent))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

export default function FolderCard({ 
  name, 
  slug, 
  color = '#2563eb', 
  fileCount,
  subfolderCount = 0,
  description 
}: FolderCardProps) {
  // Create lighter variant for the tab/back part (similar to #76D0F7 from original)
  const lighterColor = lightenColor(color, 0.5)

  return (
    <Link
      href={`/categories/${slug}`}
      className="group relative block"
    >
      <div className="relative bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        {/* Folder Icon Container */}
        <div className="relative h-32 mb-4 flex items-center justify-center">
          {fileCount > 0 ? (
            // Folder with files SVG
            <svg width="1169" height="886" viewBox="0 0 1169 886" fill="none" className="w-32 h-24" style={{ maxHeight: '96px' }}>
              <path d="M2.73049 818.67C0.970488 813.69 0.000488281 808.34 0.000488281 802.78V48.94C0.000488281 21.91 22.6805 0 50.6605 0H392.36C408.94 0 424.95 5.9 437.33 16.56L529.521 96.02C541.901 106.68 557.9 112.58 574.49 112.58H959.151C987.131 112.58 1009.81 134.49 1009.81 161.52V225.33L2.73049 818.67Z" fill={lighterColor} />
              <path d="M937.88 171.27H98.2603C83.2548 171.27 71.0903 183.434 71.0903 198.44V786.43C71.0903 801.436 83.2548 813.6 98.2603 813.6H937.88C952.886 813.6 965.05 801.436 965.05 786.43V198.44C965.05 183.434 952.886 171.27 937.88 171.27Z" fill="#DDDDE8" />
              <path d="M964.9 193.75H125.28C110.275 193.75 98.1104 205.914 98.1104 220.92V808.91C98.1104 823.916 110.275 836.08 125.28 836.08H964.9C979.906 836.08 992.07 823.916 992.07 808.91V220.92C992.07 205.914 979.906 193.75 964.9 193.75Z" fill="white" />
              <path d="M1166.44 287.37L1004.96 848.62C998.64 870.59 977.93 885.79 954.33 885.79H52.5804C17.9004 885.79 -7.26962 853.91 1.90038 821.6L136.54 347.32C142.58 326.06 162.58 311.32 185.4 311.32H617.88C629.94 311.32 641.77 308.21 652.16 302.29L771.55 234.35C781.93 228.44 793.77 225.32 805.83 225.32H1117.63C1151.13 225.32 1175.41 256.18 1166.44 287.36" fill={color} />
            </svg>
          ) : (
            // Empty folder SVG
            <svg width="1012" height="886" viewBox="0 0 1012 886" fill="none" className="w-32 h-24" style={{ maxHeight: '96px' }}>
              <path d="M2.73 818.67C0.97 813.69 0 808.34 0 802.78V48.94C0 21.91 22.68 0 50.66 0H392.36C408.94 0 424.95 5.9 437.33 16.56L529.52 96.02C541.9 106.68 557.9 112.58 574.49 112.58H959.15C987.13 112.58 1009.81 134.49 1009.81 161.52V225.33L2.73 818.67Z" fill={lighterColor} />
              <path d="M1011.5 209.54L1004.96 848.62C998.641 870.59 977.931 885.79 954.331 885.79H52.5804C17.9004 885.79 -7.26962 853.91 1.90038 821.6L1.90038 269.5C7.94038 248.24 27.9404 233.5 50.7604 233.5H483.24C495.3 233.5 507.13 230.39 517.52 224.47L636.91 156.53C647.29 150.62 659.13 147.5 671.19 147.5H982.99C1016.49 147.5 1011.5 177 1011.5 209.54Z" fill={color} />
            </svg>
          )}
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

