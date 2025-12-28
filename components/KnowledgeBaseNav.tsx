'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Plus, ChevronRight, ChevronDown, Folder, Tag, FileText, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Page {
  id: string
  title: string
  slug: string
  description?: string | null
  categoryId?: string | null
}

interface Category {
  id: string
  name: string
  slug: string
  color?: string
  parentId?: string | null
  Page: Page[]
  children?: Category[]
}

interface PageTag {
  id: string
  name: string
  color?: string
  _count?: {
    PageTag: number
  }
}

export default function KnowledgeBaseNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<PageTag[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'folders' | 'tags'>('folders')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null)
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null)
  const [dragOverPageTargetId, setDragOverPageTargetId] = useState<string | null>(null)
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set())
  const [showTagModal, setShowTagModal] = useState(false)
  const [editingTag, setEditingTag] = useState<PageTag | null>(null)
  const [tagName, setTagName] = useState('')
  const [tagColor, setTagColor] = useState('#2563eb')

  useEffect(() => {
    fetchCategories()
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  // Detect selected category from pathname
  useEffect(() => {
    if (pathname?.startsWith('/categories/')) {
      const slug = pathname.split('/categories/')[1]?.split('/')[0]
      if (slug) {
        const findCategory = (cats: Category[]): Category | null => {
          for (const cat of cats) {
            if (cat.slug === slug) {
              return cat
            }
            if (cat.children) {
              const found = findCategory(cat.children)
              if (found) return found
            }
          }
          return null
        }
        const category = findCategory(categories)
        if (category) {
          setSelectedCategoryId(category.id)
        }
      }
    } else {
      setSelectedCategoryId(null)
    }
  }, [pathname, categories])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
        // Auto-expand categories that are in the current path
        const currentCategorySlug = pathname?.split('/').pop()
        if (currentCategorySlug) {
          const expandCategory = (cats: Category[]) => {
            cats.forEach(cat => {
              if (cat.slug === currentCategorySlug || pathname?.includes(`/categories/${cat.slug}`)) {
                setExpandedCategories(prev => {
                  const next = new Set(prev)
                  next.add(cat.id)
                  return next
                })
                // Also expand pages for this category
                if (cat.Page && cat.Page.length > 0) {
                  setExpandedPages(prev => {
                    const next = new Set(prev)
                    next.add(cat.id)
                    return next
                  })
                }
                if (cat.parentId) {
                  expandCategory(cats)
                }
              }
              if (cat.children) {
                expandCategory(cat.children)
              }
            })
          }
          expandCategory(data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
        // Also collapse pages
        setExpandedPages(prevPages => {
          const nextPages = new Set(prevPages)
          nextPages.delete(categoryId)
          return nextPages
        })
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const togglePages = (categoryId: string) => {
    setExpandedPages(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const handlePageDragStart = (e: React.DragEvent, pageId: string) => {
    setDraggedPageId(pageId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', pageId)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handlePageDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
    setDraggedPageId(null)
    setDragOverPageTargetId(null)
  }

  const handlePageDragOver = (e: React.DragEvent, categoryId: string | null) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setDragOverPageTargetId(categoryId)
  }

  const handlePageDragLeave = () => {
    setDragOverPageTargetId(null)
  }

  const handlePageDrop = async (e: React.DragEvent, targetCategoryId: string | null) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedPageId) return

    try {
      const response = await fetch(`/api/pages/${draggedPageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: targetCategoryId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to move page')
      }

      // Refresh categories to show updated structure
      await fetchCategories()
      router.refresh()
    } catch (error) {
      console.error('Failed to move page:', error)
      alert('Failed to move page. Please try again.')
    } finally {
      setDraggedPageId(null)
      setDragOverPageTargetId(null)
    }
  }

  const getPageCount = (category: Category): number => {
    const directPages = category.Page?.length || 0
    const childPages = category.children?.reduce((sum, child) => sum + getPageCount(child), 0) || 0
    return directPages + childPages
  }

  // Check if a category is a descendant of another (to prevent circular references)
  const isDescendant = (parentId: string, childId: string, cats: Category[]): boolean => {
    const findCategory = (id: string, categoryList: Category[]): Category | null => {
      for (const cat of categoryList) {
        if (cat.id === id) return cat
        if (cat.children) {
          const found = findCategory(id, cat.children)
          if (found) return found
        }
      }
      return null
    }

    const child = findCategory(childId, cats)
    if (!child) return false

    let current = child
    while (current.parentId) {
      if (current.parentId === parentId) return true
      const parent = findCategory(current.parentId, cats)
      if (!parent) break
      current = parent
    }
    return false
  }

  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    setDraggedCategoryId(categoryId)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', categoryId)
    // Make the drag image semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
    setDraggedCategoryId(null)
    setDragOverCategoryId(null)
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'

    if (!draggedCategoryId || draggedCategoryId === categoryId) {
      setDragOverCategoryId(null)
      return
    }

    // Check if we can drop here (not on itself, not on a descendant)
    const canDrop = !isDescendant(draggedCategoryId, categoryId, categories)
    if (canDrop) {
      setDragOverCategoryId(categoryId)
    } else {
      setDragOverCategoryId(null)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the element (not entering a child)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverCategoryId(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedCategoryId || draggedCategoryId === targetCategoryId) {
      setDragOverCategoryId(null)
      return
    }

    // Validate drop
    if (isDescendant(draggedCategoryId, targetCategoryId, categories)) {
      alert('Cannot move a folder into its own subfolder')
      setDragOverCategoryId(null)
      return
    }

    try {
      // Update the category's parentId
      const response = await fetch(`/api/categories/${draggedCategoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: targetCategoryId }),
      })

      if (!response.ok) {
        throw new Error('Failed to move folder')
      }

      // Refresh categories
      await fetchCategories()
      
      // Auto-expand the target category to show the moved folder
      setExpandedCategories(prev => {
        const next = new Set(prev)
        next.add(targetCategoryId)
        return next
      })
    } catch (error) {
      console.error('Failed to move folder:', error)
      alert('Failed to move folder. Please try again.')
    } finally {
      setDraggedCategoryId(null)
      setDragOverCategoryId(null)
      setIsDragging(false)
    }
  }

  const handleDropOnRoot = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedCategoryId) return

    try {
      // Move to root (set parentId to null)
      const response = await fetch(`/api/categories/${draggedCategoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: null }),
      })

      if (!response.ok) {
        throw new Error('Failed to move folder')
      }

      // Refresh categories
      await fetchCategories()
    } catch (error) {
      console.error('Failed to move folder:', error)
      alert('Failed to move folder. Please try again.')
    } finally {
      setDraggedCategoryId(null)
      setDragOverCategoryId(null)
      setIsDragging(false)
    }
  }

  const handleNewFolder = () => {
    setShowDropdown(false)
    router.push('/categories/new')
  }

  const handleNewSubfolder = () => {
    if (!selectedCategoryId) return
    setShowDropdown(false)
    router.push(`/categories/new?parentId=${selectedCategoryId}`)
  }

  const handleNewPage = () => {
    setShowDropdown(false)
    if (selectedCategoryId) {
      // Find the selected category to get its slug for the URL
      const findCategory = (cats: Category[]): Category | null => {
        for (const cat of cats) {
          if (cat.id === selectedCategoryId) return cat
          if (cat.children) {
            const found = findCategory(cat.children)
            if (found) return found
          }
        }
        return null
      }
      const category = findCategory(categories)
      if (category) {
        router.push(`/pages/new?category=${category.slug}`)
      } else {
        router.push('/pages/new')
      }
    } else {
      router.push('/pages/new')
    }
  }

  const handleNewTag = () => {
    setShowDropdown(false)
    setEditingTag(null)
    setTagName('')
    setTagColor('#2563eb')
    setShowTagModal(true)
  }

  const handleSaveTag = async () => {
    if (!tagName.trim()) {
      alert('Tag name is required')
      return
    }

    try {
      const url = editingTag ? `/api/tags/${editingTag.id}` : '/api/tags'
      const method = editingTag ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName.trim(), color: tagColor }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save tag')
      }

      await fetchTags()
      setShowTagModal(false)
      setEditingTag(null)
      setTagName('')
      setTagColor('#2563eb')
    } catch (error: any) {
      console.error('Failed to save tag:', error)
      alert(error.message || 'Failed to save tag. Please try again.')
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag? It will be removed from all pages.')) {
      return
    }

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete tag')
      }

      await fetchTags()
    } catch (error: any) {
      console.error('Failed to delete tag:', error)
      alert(error.message || 'Failed to delete tag. Please try again.')
    }
  }

  const handleEditTag = (tag: PageTag) => {
    setEditingTag(tag)
    setTagName(tag.name)
    setTagColor(tag.color || '#2563eb')
    setShowTagModal(true)
  }

  const renderCategory = (category: Category, level: number = 0, isLast: boolean = false, parentHasMore: boolean = false) => {
    const isExpanded = expandedCategories.has(category.id)
    const pagesExpanded = expandedPages.has(category.id)
    const pageCount = getPageCount(category)
    const directPageCount = category.Page?.length || 0
    const isActive = pathname === `/categories/${category.slug}` || pathname?.startsWith(`/categories/${category.slug}/`)
    const hasChildren = category.children && category.children.length > 0
    const hasPages = directPageCount > 0
    const isDragged = draggedCategoryId === category.id
    const isDragOver = dragOverCategoryId === category.id
    const isPageDragOver = dragOverPageTargetId === category.id
    const canDrop = draggedCategoryId && 
                    draggedCategoryId !== category.id && 
                    !isDescendant(draggedCategoryId, category.id, categories)

    // Calculate line positions
    const lineLeft = 12 + level * 16
    const iconLeft = lineLeft + 16
    const lineWidth = 16

    return (
      <div key={category.id} className="relative">
        {/* Curved connecting line */}
        {level > 0 && (
          <svg
            className="absolute pointer-events-none"
            style={{
              left: `${lineLeft}px`,
              top: '0',
              width: `${lineWidth + 4}px`,
              height: '100%',
              overflow: 'visible',
            }}
          >
            {/* Vertical trunk line - continues if not last or has children */}
            {(!isLast || (hasChildren && isExpanded) || (hasPages && pagesExpanded)) && (
              <line
                x1={lineWidth / 2}
                y1="0"
                x2={lineWidth / 2}
                y2="100%"
                stroke="#d1d5db"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            )}
            {/* Curved horizontal branch to folder - smooth curve */}
            <path
              d={`M ${lineWidth / 2} 12 Q ${lineWidth / 2 + 4} 12 ${lineWidth} 12`}
              stroke="#d1d5db"
              strokeWidth="1"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}

        {/* Drop indicator line above */}
        {isDragOver && canDrop && (
          <div 
            className="h-0.5 bg-blue-500 mx-3 my-1 rounded-full"
            style={{ marginLeft: `${iconLeft}px` }}
          />
        )}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, category.id)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => {
            handleDragOver(e, category.id)
            if (draggedPageId) {
              handlePageDragOver(e, category.id)
            }
          }}
          onDragLeave={(e) => {
            handleDragLeave(e)
            if (draggedPageId) {
              handlePageDragLeave()
            }
          }}
          onDrop={(e) => {
            if (draggedCategoryId) {
              handleDrop(e, category.id)
            } else if (draggedPageId) {
              handlePageDrop(e, category.id)
            }
          }}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all cursor-move group relative z-10',
            isActive
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
            isDragged && 'opacity-50',
            (isDragOver && canDrop) && 'bg-blue-100 border-2 border-blue-400 border-dashed',
            (isPageDragOver && draggedPageId) && 'bg-blue-100 border-2 border-blue-400 border-dashed',
            isDragging && !isDragged && canDrop && 'hover:bg-blue-50'
          )}
          style={{ paddingLeft: `${iconLeft}px` }}
          onClick={() => {
            if (isActive) {
              setSelectedCategoryId(category.id)
            }
          }}
        >
          {(hasChildren || hasPages) ? (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleCategory(category.id)
              }}
              className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded z-10"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}
          <Link
            href={`/categories/${category.slug}`}
            className="flex items-center gap-2 flex-1 min-w-0"
            onClick={(e) => {
              // Don't navigate if clicking the expand button or dragging
              if ((e.target as HTMLElement).closest('button') || isDragging) {
                e.preventDefault()
              }
              if (!isDragging) {
                setSelectedCategoryId(category.id)
              }
            }}
            onMouseDown={(e) => {
              // Prevent drag when clicking on link
              if (isDragging) {
                e.preventDefault()
              }
            }}
          >
            <Folder
              className="w-4 h-4 flex-shrink-0"
              style={{ color: isActive ? (category.color || '#2563eb') : (category.color || '#9ca3af') }}
            />
            <span className="truncate flex-1">{category.name}</span>
            {pageCount > 0 && (
              <span className="text-xs text-gray-500 flex-shrink-0">{pageCount}</span>
            )}
          </Link>
        </div>
        {isExpanded && (
          <div className="relative">
            {/* Render pages for this category */}
            {hasPages && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    togglePages(category.id)
                  }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors w-full relative z-10'
                  )}
                  style={{ paddingLeft: `${iconLeft + 16}px` }}
                >
                  {/* Vertical line for pages section */}
                  <svg
                    className="absolute pointer-events-none"
                    style={{
                      left: `${lineLeft + 16}px`,
                      top: '0',
                      width: '16px',
                      height: '100%',
                      overflow: 'visible',
                    }}
                  >
                    <line
                      x1="8"
                      y1="0"
                      x2="8"
                      y2="100%"
                      stroke="#d1d5db"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  {pagesExpanded ? (
                    <ChevronDown className="w-3 h-3 relative z-10" />
                  ) : (
                    <ChevronRight className="w-3 h-3 relative z-10" />
                  )}
                  <span className="relative z-10">Pages ({directPageCount})</span>
                </button>
                {pagesExpanded && category.Page && category.Page.length > 0 && (
                  <div className="relative">
                    {category.Page.map((page, index) => {
                      const isPageLast = index === category.Page.length - 1
                      const isPageDragged = draggedPageId === page.id
                      const pageLineLeft = lineLeft + 32
                      const pageIconLeft = pageLineLeft + 16
                      
                      return (
                        <div
                          key={page.id}
                          draggable
                          onDragStart={(e) => handlePageDragStart(e, page.id)}
                          onDragEnd={handlePageDragEnd}
                          className={cn(
                            'flex items-center gap-2 px-3 py-1 rounded-md transition-colors cursor-move group relative z-10',
                            'hover:bg-gray-50',
                            isPageDragged && 'opacity-50'
                          )}
                          style={{ paddingLeft: `${pageIconLeft}px` }}
                        >
                          {/* Curved connecting line for page */}
                          <svg
                            className="absolute pointer-events-none"
                            style={{
                              left: `${pageLineLeft}px`,
                              top: '0',
                              width: '20px',
                              height: '100%',
                              overflow: 'visible',
                            }}
                          >
                            {/* Vertical line - continues if not last */}
                            {!isPageLast && (
                              <line
                                x1="8"
                                y1="0"
                                x2="8"
                                y2="100%"
                                stroke="#d1d5db"
                                strokeWidth="1"
                                vectorEffect="non-scaling-stroke"
                              />
                            )}
                            {/* Curved horizontal branch to page - smooth curve */}
                            <path
                              d={`M 8 12 Q 10 12 16 12`}
                              stroke="#d1d5db"
                              strokeWidth="1"
                              fill="none"
                              vectorEffect="non-scaling-stroke"
                            />
                          </svg>
                          <GripVertical className="w-3 h-3 text-gray-400 flex-shrink-0 relative z-10" />
                          <Link
                            href={`/pages/${page.slug}`}
                            className="flex items-center gap-2 flex-1 min-w-0 relative z-10"
                            onClick={(e) => {
                              if (isDragging || draggedPageId) {
                                e.preventDefault()
                              }
                            }}
                          >
                            <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="truncate text-sm text-gray-700">{page.title}</span>
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            {/* Render child categories */}
            {hasChildren && (
              <div className="relative">
                {category.children?.map((child, index) => {
                  const childIsLast = index === (category.children?.length || 0) - 1
                  const childHasMore = !childIsLast || (hasPages && pagesExpanded)
                  return renderCategory(child, level + 1, childIsLast, childHasMore)
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const filteredCategories = categories.filter(cat => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const matchesCategory = cat.name.toLowerCase().includes(query)
    const matchesChildren = cat.children?.some(child => 
      child.name.toLowerCase().includes(query)
    )
    return matchesCategory || matchesChildren
  })

  // Filter to show only top-level categories (no parentId)
  const topLevelCategories = filteredCategories.filter(cat => !cat.parentId)

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Knowledge Base</h2>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors"
              title="Add New"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={handleNewFolder}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <Folder className="w-4 h-4" />
                  New Folder
                </button>
                {selectedCategoryId && (
                  <button
                    onClick={handleNewSubfolder}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Folder className="w-4 h-4" />
                    New Subfolder
                  </button>
                )}
                <button
                  onClick={handleNewPage}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <FileText className="w-4 h-4" />
                  New Page
                </button>
                <button
                  onClick={handleNewTag}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <Tag className="w-4 h-4" />
                  New Tag
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('folders')}
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium transition-colors border-b-2',
            activeTab === 'folders'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          Folders
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium transition-colors border-b-2',
            activeTab === 'tags'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          Tags
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        ) : activeTab === 'folders' ? (
          <div 
            className="space-y-1"
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              if (draggedPageId) {
                handlePageDragOver(e, null)
              }
            }}
            onDragLeave={(e) => {
              if (draggedPageId) {
                handlePageDragLeave()
              }
            }}
            onDrop={(e) => {
              if (draggedCategoryId) {
                handleDropOnRoot(e)
              } else if (draggedPageId) {
                handlePageDrop(e, null)
              }
            }}
          >
            {topLevelCategories.length > 0 ? (
              topLevelCategories.map((category, index) => {
                const isLast = index === topLevelCategories.length - 1
                return renderCategory(category, 0, isLast, !isLast)
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">
                  {searchQuery ? 'No categories found' : 'No categories yet'}
                </p>
                {!searchQuery && (
                  <Link
                    href="/categories/new"
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Create your first category
                  </Link>
                )}
              </div>
            )}
            {/* Drop zone indicator at the bottom when dragging */}
            {(isDragging && draggedCategoryId) || (draggedPageId && dragOverPageTargetId === null) ? (
              <div className={cn(
                "mt-2 p-2 border-2 border-dashed rounded-md text-center transition-colors",
                dragOverPageTargetId === null && draggedPageId
                  ? "border-blue-400 bg-blue-100"
                  : "border-blue-300 bg-blue-50"
              )}>
                <p className="text-xs text-blue-600">
                  {draggedPageId ? 'Drop here to move page to root' : 'Drop here to move to root level'}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-1">
            {tags.length > 0 ? (
              tags
                .filter(tag => {
                  if (!searchQuery) return true
                  return tag.name.toLowerCase().includes(searchQuery.toLowerCase())
                })
                .map((tag) => {
                  const pageCount = tag._count?.PageTag || 0
                  return (
                    <div
                      key={tag.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors group hover:bg-gray-50"
                    >
                      <Link
                        href={`/pages?tag=${tag.id}`}
                        className="flex items-center gap-2 flex-1 min-w-0"
                        onClick={() => setShowDropdown(false)}
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color || '#2563eb' }}
                        />
                        <span className="truncate flex-1 text-gray-700">{tag.name}</span>
                        {pageCount > 0 && (
                          <span className="text-xs text-gray-500 flex-shrink-0">{pageCount}</span>
                        )}
                      </Link>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleEditTag(tag)
                          }}
                          className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded text-gray-600"
                          title="Edit tag"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDeleteTag(tag.id)
                          }}
                          className="w-6 h-6 flex items-center justify-center hover:bg-red-100 rounded text-red-600"
                          title="Delete tag"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                })
            ) : (
              <div className="text-center py-8">
                <Tag className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {searchQuery ? 'No tags found' : 'No tags yet'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleNewTag}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Create your first tag
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTag ? 'Edit Tag' : 'New Tag'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag Name
                </label>
                <input
                  type="text"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="e.g., microphone, beginner, gym"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveTag()
                    } else if (e.key === 'Escape') {
                      setShowTagModal(false)
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={tagColor}
                    onChange={(e) => setTagColor(e.target.value)}
                    className="w-12 h-10 border border-gray-200 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tagColor}
                    onChange={(e) => setTagColor(e.target.value)}
                    placeholder="#2563eb"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowTagModal(false)
                  setEditingTag(null)
                  setTagName('')
                  setTagColor('#2563eb')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTag}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingTag ? 'Update' : 'Create'} Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

