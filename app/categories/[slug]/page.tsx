import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/Sidebar'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Edit, ArrowLeft, FileText, Plus } from 'lucide-react'

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
              Back to Categories
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

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Pages in this Category ({category.Page.length})
            </h2>
            {category.Page.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.Page.map((page) => (
                  <Link
                    key={page.id}
                    href={`/pages/${page.slug}`}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">{page.title}</h3>
                    {page.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {page.description}
                      </p>
                    )}
                    {page.Attachment && page.Attachment.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        {page.Attachment.length} attachment(s)
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No pages yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Add pages to this category to get started
                </p>
                <Link
                  href={`/pages/new?category=${category.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add First Page
                </Link>
              </div>
            )}
          </div>
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
