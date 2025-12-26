import { notFound } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { Edit, ArrowLeft, FileText, Plus } from 'lucide-react'

// Section model has been removed - use Category instead
async function getSection(slug: string) {
  return null
}

export default async function SectionView({ params }: { params: { slug: string } }) {
  const section = await getSection(params.slug)
  
  if (!section) {
    notFound()
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <div className="mb-6">
            <Link
              href="/sections"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sections
            </Link>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">{section.name}</h1>
              <Link
                href={`/sections/${section.slug}/edit`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </div>
            {section.description && (
              <p className="text-gray-600 mt-2">{section.description}</p>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">
              Pages in this Section ({section.pages.length})
            </h2>
            {section.pages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.pages.map((page) => (
                  <Link
                    key={page.id}
                    href={`/pages/${page.slug}`}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{page.title}</h3>
                        {page.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {page.description}
                          </p>
                        )}
                      </div>
                      <FileText className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No pages in this section yet.</p>
                <Link
                  href="/pages/new"
                  className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create a Page
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
