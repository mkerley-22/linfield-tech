'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Folder, FileText } from 'lucide-react'
import FolderCard from '@/components/FolderCard'

interface Page {
  id: string
  title: string
  slug: string
  description?: string | null
  Attachment: Array<{ id: string }>
}

interface Subfolder {
  id: string
  name: string
  slug: string
  color?: string | null
  Page: Page[]
}

interface FolderViewProps {
  folderName: string
  folderColor?: string | null
  subfolders: Subfolder[]
  directPages: Page[]
}

export default function FolderView({ folderName, folderColor, subfolders, directPages }: FolderViewProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Collect all pages from subfolders
  const allSubfolderPages = subfolders.flatMap(subfolder => 
    subfolder.Page.map(page => ({ ...page, subfolderName: subfolder.name, subfolderSlug: subfolder.slug }))
  )

  // Combine direct pages and subfolder pages
  const allPages = [
    ...directPages.map(page => ({ ...page, subfolderName: null, subfolderSlug: null })),
    ...allSubfolderPages,
  ]

  // Filter pages based on search
  const filteredPages = allPages.filter(page => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      page.title.toLowerCase().includes(query) ||
      (page.description && page.description.toLowerCase().includes(query)) ||
      (page.subfolderName && page.subfolderName.toLowerCase().includes(query))
    )
  })

  return (
    <>
      {/* Subfolders Section */}
      {subfolders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Folders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subfolders.map((subfolder) => {
              const fileCount = subfolder.Page.length
              return (
                <FolderCard
                  key={subfolder.id}
                  name={subfolder.name}
                  slug={subfolder.slug}
                  color={subfolder.color || '#2563eb'}
                  fileCount={fileCount}
                  subfolderCount={0}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Files Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Files ({allPages.length})
            </h2>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
            />
          </div>
        </div>

        {filteredPages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Folder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attachments
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPages.map((page) => (
                  <tr
                    key={page.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/pages/${page.slug}`}
                        className="flex items-center gap-3 group"
                      >
                        <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {page.title}
                          </div>
                          {page.description && (
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {page.description}
                            </div>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {page.subfolderName ? (
                        <Link
                          href={`/categories/${page.subfolderSlug}`}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: `${folderColor || '#2563eb'}20`,
                            color: folderColor || '#2563eb',
                          }}
                        >
                          <Folder className="w-4 h-4" />
                          {page.subfolderName}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-500">Root</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {page.Attachment && page.Attachment.length > 0 ? (
                        <span>{page.Attachment.length} attachment{page.Attachment.length !== 1 ? 's' : ''}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No files found' : 'No files yet'}
            </h3>
            <p className="text-gray-600">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Add pages to this folder to get started'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}

