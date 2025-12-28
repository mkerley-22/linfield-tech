import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { Plus, Folder, FileText } from 'lucide-react'
import FolderCard from '@/components/FolderCard'

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
                Folders
              </h1>
              <p className="text-sm lg:text-base text-gray-600">
                Organize pages by folder (Audio, Video, etc.)
              </p>
            </div>
            <Link
              href="/categories/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              New Folder
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const totalPages = category.Page.length + (category.children?.reduce((sum: number, child: any) => sum + child.Page.length, 0) || 0)
              return (
                <FolderCard
                  key={category.id}
                  name={category.name}
                  slug={category.slug}
                  color={category.color || '#2563eb'}
                  fileCount={totalPages}
                  subfolderCount={category.children?.length || 0}
                  description={category.description || undefined}
                />
              )
            })}
            {categories.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No folders yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create folders to organize your pages
                </p>
                <Link
                  href="/categories/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create First Folder
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
