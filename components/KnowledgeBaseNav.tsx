'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Plus, ChevronRight, ChevronDown, Folder, Tag, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
  color?: string
  parentId?: string | null
  Page: Array<{ id: string }>
  children?: Category[]
}

export default function KnowledgeBaseNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'folders' | 'tags'>('folders')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

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
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const getPageCount = (category: Category): number => {
    const directPages = category.Page?.length || 0
    const childPages = category.children?.reduce((sum, child) => sum + getPageCount(child), 0) || 0
    return directPages + childPages
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

  const renderCategory = (category: Category, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.id)
    const pageCount = getPageCount(category)
    const isActive = pathname === `/categories/${category.slug}` || pathname?.startsWith(`/categories/${category.slug}/`)
    const hasChildren = category.children && category.children.length > 0

    return (
      <div key={category.id}>
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer group',
            isActive
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
          )}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => {
            if (isActive) {
              setSelectedCategoryId(category.id)
            }
          }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleCategory(category.id)
              }}
              className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded"
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
              // Don't navigate if clicking the expand button
              if ((e.target as HTMLElement).closest('button')) {
                e.preventDefault()
              }
              setSelectedCategoryId(category.id)
            }}
          >
            <Folder
              className="w-4 h-4 flex-shrink-0"
              style={{ color: category.color || '#2563eb' }}
            />
            <span className="truncate flex-1">{category.name}</span>
            {pageCount > 0 && (
              <span className="text-xs text-gray-500 flex-shrink-0">{pageCount}</span>
            )}
          </Link>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {category.children?.map(child => renderCategory(child, level + 1))}
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
          <div className="space-y-1">
            {topLevelCategories.length > 0 ? (
              topLevelCategories.map(category => renderCategory(category))
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
          </div>
        ) : (
          <div className="text-center py-8">
            <Tag className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Tags coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}

