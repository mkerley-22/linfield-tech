import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { Plus, Folder, FileText } from 'lucide-react'

async function getSections() {
  const sections = await prisma.section.findMany({
    include: {
      pages: {
        where: { isPublished: true },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  })
  return sections
}

export default async function SectionsPage() {
  const sections = await getSections()

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Sections
              </h1>
              <p className="text-gray-600">
                Organize pages by category (Audio, Video, etc.)
              </p>
            </div>
            <Link
              href="/sections/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Section
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => (
              <Link
                key={section.id}
                href={`/sections/${section.slug}`}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${section.color}20` }}
                    >
                      <Folder
                        className="w-6 h-6"
                        style={{ color: section.color || '#2563eb' }}
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {section.name}
                      </h2>
                      {section.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {section.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-4">
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {section.pages.length} page{section.pages.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </Link>
            ))}
            {sections.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No sections yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create sections to organize your pages by category
                </p>
                <Link
                  href="/sections/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create First Section
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

