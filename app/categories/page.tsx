import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { Plus, Folder, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getCategories() {
  const categories = await prisma.category.findMany({
    include: {
      Page: {
        where: { isPublished: true },
        orderBy: { order: 'asc' },
      },
      children: {
        include: {
          Page: {
            where: { isPublished: true },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
    where: {
      parentId: null, // Only get top-level categories
    },
    orderBy: { order: 'asc' },
  })
  return categories
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-0">
        <div className="max-w-6xl mx-auto p-4 lg:p-8 pt-24 lg:pt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 lg:mb-8 gap-4">
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">
                Categories
              </h1>
              <p className="text-sm lg:text-base text-gray-600">
                Organize pages by category (Audio, Video, etc.)
              </p>
            </div>
            <Link
              href="/categories/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              New Category
            </Link>
          </div>

          <div className="space-y-6">
            {categories.map((category) => {
              const totalPages = category.Page.length + (category.children?.reduce((sum: number, child: any) => sum + child.Page.length, 0) || 0)
              return (
                <div key={category.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <Link
                    href={`/categories/${category.slug}`}
                    className="group block"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <Folder
                            className="w-6 h-6"
                            style={{ color: category.color || '#2563eb' }}
                          />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {category.name}
                          </h2>
                          {category.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-4">
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {totalPages} page{totalPages !== 1 ? 's' : ''}
                      </span>
                      {category.children && category.children.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Folder className="w-4 h-4" />
                          {category.children.length} subcategor{category.children.length !== 1 ? 'ies' : 'y'}
                        </span>
                      )}
                    </div>
                  </Link>
                  
                  {/* Show subcategories */}
                  {category.children && category.children.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">Subcategories</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {category.children.map((subcategory: any) => (
                          <Link
                            key={subcategory.id}
                            href={`/categories/${subcategory.slug}`}
                            className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${subcategory.color}20` }}
                            >
                              <Folder
                                className="w-4 h-4"
                                style={{ color: subcategory.color || '#2563eb' }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                {subcategory.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {subcategory.Page.length} page{subcategory.Page.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {categories.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No categories yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create categories to organize your pages
                </p>
                <Link
                  href="/categories/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create First Category
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
