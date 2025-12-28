import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, FileText, Folder, Globe, EyeOff } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import NewDropdown from '@/components/NewDropdown'
import { Button } from '@/components/ui/Button'

export const dynamic = 'force-dynamic'

async function getPages() {
  const pages = await prisma.page.findMany({
    where: {
      parentId: null,
      // Show all pages, not just published ones (for admin view)
    },
    include: {
      other_Page: {
        where: { isPublished: true },
        orderBy: { order: 'asc' },
      },
      Attachment: true,
      Category: true,
    },
    orderBy: { order: 'asc' },
  })
  return pages
}

export default async function PagesPage() {
  const pages = await getPages()

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-0">
        <div className="max-w-6xl mx-auto p-4 lg:p-8 pt-24 lg:pt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 lg:mb-8 gap-4">
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">
                Pages
              </h1>
              <p className="text-sm lg:text-base text-gray-600">
                All knowledge base pages
              </p>
            </div>
            <NewDropdown />
          </div>

          {/* All Pages */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              All Pages {pages.length > 0 && `(${pages.length})`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pages.map((page) => (
                <Link
                  key={page.id}
                  href={`/pages/${page.slug}`}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {page.other_Page && page.other_Page.length > 0 ? (
                          <Folder className="w-6 h-6 text-blue-600" />
                        ) : (
                          <FileText className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {page.title}
                      </h2>
                    </div>
                  </div>
                  {page.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {page.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {page.other_Page && page.other_Page.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Folder className="w-4 h-4" />
                          {page.other_Page.length} {page.other_Page.length === 1 ? 'page' : 'pages'}
                        </span>
                      )}
                      {page.Attachment && page.Attachment.length > 0 && (
                        <span>{page.Attachment.length} attachment{page.Attachment.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {page.isPublished ? (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700">
                          <Globe className="w-3 h-3" />
                          Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-600">
                          <EyeOff className="w-3 h-3" />
                          Unpublished
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              {pages.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No pages yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Get started by creating your first knowledge base page
                  </p>
                  <Link href="/pages/new">
                    <Button variant="primary">
                      <Plus className="w-5 h-5" />
                      Create First Page
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

