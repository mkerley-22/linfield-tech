import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Search, ArrowLeft, FileText } from 'lucide-react'

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

async function getPage(slug: string) {
  const page = await prisma.page.findUnique({
    where: { slug, isPublished: true },
    include: {
      Category: true,
      other_Page: {
        where: { isPublished: true },
        orderBy: { order: 'asc' },
      },
    },
  })
  
  return page
}

export default async function PublicPageView({ params }: { params: { slug: string } }) {
  const settings = await getPublicSiteSettings()
  
  if (!settings) {
    notFound()
  }
  
  const page = await getPage(params.slug)
  
  if (!page) {
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
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/help"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Help Center
        </Link>
        
        <article className="prose prose-lg max-w-none">
          <h1>{page.title}</h1>
          {page.description && (
            <p className="text-xl text-gray-600">{page.description}</p>
          )}
          {page.Category && (
            <div className="mb-4">
              <span
                className="px-3 py-1 rounded-full text-sm font-medium bg-white border-[0.5px] border-blue-300 text-gray-700"
              >
                {page.Category.name}
              </span>
            </div>
          )}
          <div dangerouslySetInnerHTML={{ __html: page.content }} />
        </article>
        
        {page.other_Page && page.other_Page.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Related Pages ({page.other_Page.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {page.other_Page.map((childPage) => (
                <Link
                  key={childPage.id}
                  href={`/help/${childPage.slug}`}
                  className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all bg-white"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {childPage.title}
                      </h3>
                      {childPage.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{childPage.description}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

