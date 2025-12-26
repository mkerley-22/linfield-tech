import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/Sidebar'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Edit, ArrowLeft, FileText, Plus } from 'lucide-react'

async function getSection(slug: string) {
  const section = await prisma.section.findUnique({
    where: { slug },
    include: {
      pages: {
        where: { isPublished: true },
        include: {
          attachments: true,
        },
        orderBy: { order: 'asc' },
      },
    },
  })
  return section
}

export default async function SectionView({ params }: { params: { slug: string } }) {
  const section = await getSection(params.slug)

  if (!section) {
    notFound()
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <div className="mb-6">
            <Link
              href="/sections"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sections
            </Link>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${section.color}20` }}
                >
                  <FileText
                    className="w-8 h-8"
                    style={{ color: section.color || '#2563eb' }}
                  />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{section.name}</h1>
                  {section.description && (
                    <p className="text-lg text-gray-600">{section.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/sections/${section.slug}/edit`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>
                <Link
                  href={`/pages/new?section=${section.id}`}
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
              Pages in this Section ({section.pages.length})
            </h2>
            {section.pages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.pages.map((page) => (
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
                    {page.attachments.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        {page.attachments.length} attachment(s)
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
                  Add pages to this section to get started
                </p>
                <Link
                  href={`/pages/new?section=${section.id}`}
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

