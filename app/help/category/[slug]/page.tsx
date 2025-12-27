import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Search, FileText, Folder } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getPublicSiteSettings() {
  const settings = await prisma.publicSiteSettings.findUnique({
    where: { id: 'default' },
  })
  
  if (!settings || !settings.enabled) {
    return null
  }
  
  return settings
}

async function getCategory(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      Page: {
        where: { isPublished: true, parentId: null },
        orderBy: { order: 'asc' },
      },
    },
  })
  
  return category
}

export default async function PublicCategoryView({ params }: { params: { slug: string } }) {
  const settings = await getPublicSiteSettings()
  
  if (!settings) {
    notFound()
  }
  
  const category = await getCategory(params.slug)
  
  if (!category) {
    notFound()
  }
  
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/help" className="text-2xl font-bold text-gray-900">
              {settings.siteTitle}
            </Link>
            {settings.searchEnabled && (
              <div className="flex-1 max-w-xl mx-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/help"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-6"
        >
          ← Back to Help Center
        </Link>
        
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${category.color || '#2563eb'}20` }}
            >
              <Folder className="w-6 h-6" style={{ color: category.color || '#2563eb' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
              {category.description && (
                <p className="text-lg text-gray-600 mt-1">{category.description}</p>
              )}
            </div>
          </div>
        </div>
        
        {category.Page && category.Page.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.Page.map((page) => (
              <Link
                key={page.id}
                href={`/help/${page.slug}`}
                className="p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-1">
                      {page.title}
                    </h3>
                    {page.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{page.description}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No pages available in this category yet.</p>
          </div>
        )}
      </main>
    </div>
  )
}

