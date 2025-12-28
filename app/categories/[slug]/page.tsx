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
        <div className="max-w-6xl mx-auto p-8">
          <div className="mb-6">
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Categories
            </Link>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <FileText
                    className="w-8 h-8"
                    style={{ color: category.color || '#2563eb' }}
                  />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{category.name}</h1>
                  {category.description && (
                    <p className="text-lg text-gray-600">{category.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
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
    </div>
  )
}
