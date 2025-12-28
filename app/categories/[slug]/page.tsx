import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/Sidebar'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Edit, ArrowLeft, FileText, Plus } from 'lucide-react'
import FolderView from './FolderView'

export const dynamic = 'force-dynamic'

async function getCategory(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      Page: {
        where: { isPublished: true },
        include: {
          Attachment: true,
        },
        orderBy: { order: 'asc' },
      },
      children: {
        include: {
          Page: {
            where: { isPublished: true },
            include: {
              Attachment: true,
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  })
  return category
}

export default async function CategoryView({ params }: { params: { slug: string } }) {
  const category = await getCategory(params.slug)

  if (!category) {
    notFound()
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 lg:p-8 pt-24 lg:pt-8">
          <div className="mb-6">
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Folders
            </Link>
            <div className="flex flex-col lg:flex-row items-start justify-between mb-4 gap-4">
              <div className="flex items-center gap-3 lg:gap-4">
                <div
                  className="w-12 h-12 lg:w-16 lg:h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <FileText
                    className="w-6 h-6 lg:w-8 lg:h-8"
                    style={{ color: category.color || '#2563eb' }}
                  />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">{category.name}</h1>
                  {category.description && (
                    <p className="text-sm lg:text-lg text-gray-600">{category.description}</p>
                  )}
                </div>
              </div>
              {/* Desktop buttons - hidden on mobile */}
              <div className="hidden lg:flex gap-2">
                <Link
                  href={`/categories/${category.slug}/edit`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>
                <Link
                  href={`/pages/new?category=${category.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Page
                </Link>
              </div>
            </div>
          </div>

          <FolderView
            folderName={category.name}
            folderColor={category.color}
            subfolders={category.children || []}
            directPages={category.Page}
            parentFolderId={category.id}
          />
        </div>
      </main>
      
      {/* Mobile fixed bottom buttons */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 flex gap-2">
        <Link
          href={`/categories/${category.slug}/edit`}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          <Edit className="w-5 h-5" />
          Edit
        </Link>
        <Link
          href={`/pages/new?category=${category.id}`}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Page
        </Link>
      </div>
      
      {/* Spacer for mobile bottom buttons */}
      <div className="lg:hidden h-20" />
    </div>
  )
}
