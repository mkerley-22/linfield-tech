'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Folder, FileText, GripVertical } from 'lucide-react'
import FolderCard from '@/components/FolderCard'

interface Page {
  id: string
  title: string
  slug: string
  description?: string | null
  Attachment: Array<{ id: string }>
  categoryId?: string | null
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
  parentFolderId?: string | null
}

export default function FolderView({ folderName, folderColor, subfolders, directPages, parentFolderId }: FolderViewProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Collect all pages from subfolders
  const allSubfolderPages = subfolders.flatMap(subfolder => 
    subfolder.Page.map(page => ({ ...page, subfolderName: subfolder.name, subfolderSlug: subfolder.slug, subfolderId: subfolder.id }))
  )

  // Combine direct pages and subfolder pages
  const allPages = [
    ...directPages.map(page => ({ ...page, subfolderName: null, subfolderSlug: null, subfolderId: null })),
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

  // Group pages by subfolder for hierarchical display
  const pagesBySubfolder = subfolders.map(subfolder => ({
    subfolder,
    pages: subfolder.Page,
  }))

  const handleDragStart = (e: React.DragEvent, pageId: string) => {
    setDraggedPageId(pageId)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', pageId)
  }

  const handleDragEnd = () => {
    setDraggedPageId(null)
    setDragOverFolderId(null)
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverFolderId(folderId)
  }

  const handleDragLeave = () => {
    setDragOverFolderId(null)
  }

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault()
    if (!draggedPageId) return

    const page = allPages.find(p => p.id === draggedPageId)
    if (!page) return

    // Don't move if it's already in the target folder
    if (page.subfolderId === targetFolderId) {
      setDragOverFolderId(null)
      return
    }

    try {
      const response = await fetch(`/api/pages/${draggedPageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: targetFolderId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to move page')
      }

      // Refresh the page to show updated structure
      router.refresh()
    } catch (error) {
      console.error('Failed to move page:', error)
      alert('Failed to move page. Please try again.')
    } finally {
      setDraggedPageId(null)
      setDragOverFolderId(null)
      setIsDragging(false)
    }
  }

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
          <div className="p-6">
            {/* Root pages (direct pages) */}
            <div
              onDragOver={(e) => handleDragOver(e, null)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, null)}
            >
              {directPages.filter(page => {
                if (!searchQuery) return true
                const query = searchQuery.toLowerCase()
                return (
                  page.title.toLowerCase().includes(query) ||
                  (page.description && page.description.toLowerCase().includes(query))
                )
              }).length > 0 && (
                <div className="mb-6">
                  <div
                    className={`
                      flex items-center gap-2 mb-3 p-2 rounded-lg transition-colors
                      ${dragOverFolderId === null ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''}
                    `}
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      <div className="w-0.5 h-4 bg-gray-300"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-500">Root</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    {directPages.filter(page => {
                      if (!searchQuery) return true
                      const query = searchQuery.toLowerCase()
                      return (
                        page.title.toLowerCase().includes(query) ||
                        (page.description && page.description.toLowerCase().includes(query))
                      )
                    }).map((page) => (
                      <div
                        key={page.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, page.id)}
                        onDragEnd={handleDragEnd}
                        className={`
                          flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-move
                          ${draggedPageId === page.id ? 'opacity-50' : ''}
                        `}
                      >
                        <div className="w-4 h-4 flex items-center justify-center relative flex-shrink-0">
                          <div className="w-0.5 h-4 bg-gray-300 absolute top-0"></div>
                          <div className="w-2 h-0.5 bg-gray-300 absolute left-0"></div>
                        </div>
                        <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <Link
                          href={`/pages/${page.slug}`}
                          className="flex items-center gap-3 flex-1 group"
                        >
                          <FileText className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              {page.title}
                            </div>
                            {page.description && (
                              <div className="text-xs text-gray-500 line-clamp-1">
                                {page.description}
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="text-xs text-gray-400 flex-shrink-0">
                          {page.Attachment && page.Attachment.length > 0 ? (
                            <span>{page.Attachment.length} attachment{page.Attachment.length !== 1 ? 's' : ''}</span>
                          ) : (
                            <span>—</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Show drop zone for root if no root pages exist */}
              {directPages.length === 0 && dragOverFolderId === null && isDragging && (
                <div className="mb-6 p-4 border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <div className="w-0.5 h-4 bg-gray-300"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-500">Drop here to move to Root</span>
                  </div>
                </div>
              )}
            </div>

            {/* Pages grouped by subfolder with hierarchical lines */}
            {pagesBySubfolder.map(({ subfolder, pages }) => {
              const filteredSubfolderPages = pages.filter(page => {
                if (!searchQuery) return true
                const query = searchQuery.toLowerCase()
                return (
                  page.title.toLowerCase().includes(query) ||
                  (page.description && page.description.toLowerCase().includes(query)) ||
                  subfolder.name.toLowerCase().includes(query)
                )
              })

              if (filteredSubfolderPages.length === 0) return null

              return (
                <div
                  key={subfolder.id}
                  className="mb-6"
                  onDragOver={(e) => handleDragOver(e, subfolder.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, subfolder.id)}
                >
                  <div
                    className={`
                      flex items-center gap-2 mb-3 p-2 rounded-lg transition-colors
                      ${dragOverFolderId === subfolder.id ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''}
                    `}
                  >
                    <div className="w-4 h-4 flex items-center justify-center relative">
                      <div className="w-0.5 h-4 bg-gray-300 absolute top-0"></div>
                      <div className="w-2 h-0.5 bg-gray-300 absolute left-0"></div>
                    </div>
                    <Link
                      href={`/categories/${subfolder.slug}`}
                      className="flex items-center gap-2 flex-1 group"
                    >
                      <Folder className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                        {subfolder.name}
                      </span>
                      <span className="text-xs text-gray-400">({filteredSubfolderPages.length})</span>
                    </Link>
                  </div>
                  <div className="ml-6 space-y-1">
                    {filteredSubfolderPages.map((page, index) => (
                      <div
                        key={page.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, page.id)}
                        onDragEnd={handleDragEnd}
                        className={`
                          flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-move
                          ${draggedPageId === page.id ? 'opacity-50' : ''}
                        `}
                      >
                        <div className="w-4 h-4 flex items-center justify-center relative flex-shrink-0">
                          {index < filteredSubfolderPages.length - 1 ? (
                            <>
                              <div className="w-0.5 h-full bg-gray-300 absolute top-0"></div>
                              <div className="w-2 h-0.5 bg-gray-300 absolute left-0"></div>
                            </>
                          ) : (
                            <>
                              <div className="w-0.5 h-4 bg-gray-300 absolute top-0"></div>
                              <div className="w-2 h-0.5 bg-gray-300 absolute left-0"></div>
                            </>
                          )}
                        </div>
                        <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <Link
                          href={`/pages/${page.slug}`}
                          className="flex items-center gap-3 flex-1 group"
                        >
                          <FileText className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              {page.title}
                            </div>
                            {page.description && (
                              <div className="text-xs text-gray-500 line-clamp-1">
                                {page.description}
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="text-xs text-gray-400 flex-shrink-0">
                          {page.Attachment && page.Attachment.length > 0 ? (
                            <span>{page.Attachment.length} attachment{page.Attachment.length !== 1 ? 's' : ''}</span>
                          ) : (
                            <span>—</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
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

