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
  
  // Parse theme if it exists
  let theme = null
  if (settings.themeJson) {
    try {
      theme = JSON.parse(settings.themeJson)
    } catch {
      theme = null
    }
  }
  
  return { ...settings, theme }
}

async function getCategories() {
  const settings = await prisma.publicSiteSettings.findUnique({
    where: { id: 'default' },
  })
  
  let categoryIds: string[] = []
  if (settings?.navigationJson) {
    try {
      categoryIds = JSON.parse(settings.navigationJson)
    } catch {
      categoryIds = []
    }
  }
  
  const categories = await prisma.category.findMany({
    where: categoryIds.length > 0 ? { id: { in: categoryIds } } : undefined,
    include: {
      Page: {
        where: { isPublished: true, parentId: null },
        orderBy: { order: 'asc' },
        take: 5,
      },
    },
    orderBy: { name: 'asc' },
  })
  
  return categories
}

async function getHomepage() {
  const settings = await prisma.publicSiteSettings.findUnique({
    where: { id: 'default' },
  })
  
  if (settings?.homepagePageId) {
    const page = await prisma.page.findUnique({
      where: { id: settings.homepagePageId, isPublished: true },
    })
    return page
  }
  
  return null
}

export default async function PublicHelpPage() {
  const settings = await getPublicSiteSettings()
  
  if (!settings) {
    notFound()
  }
  
  const homepage = await getHomepage()
  const categories = await getCategories()
  
  // If there's a custom homepage, show it
  if (homepage) {
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
          <article className="prose prose-lg max-w-none">
            <h1>{homepage.title}</h1>
            {homepage.description && <p className="text-xl text-gray-600">{homepage.description}</p>}
            <div dangerouslySetInnerHTML={{ __html: homepage.content }} />
          </article>
        </main>
      </div>
    )
  }
  
  // Default: Show category list
  const theme = settings.theme || {}
  const colors = theme.colors || {}
  const fonts = theme.fonts || {}
  const spacing = theme.spacing || {}
  
  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: colors.background || '#ffffff',
        fontFamily: fonts.body || 'Inter, sans-serif',
      }}
    >
      {/* Hero Section */}
      <div 
        className="text-white"
        style={{ backgroundColor: colors.primary || '#2563eb' }}
      >
        <div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          style={{ paddingTop: spacing.sectionPadding || '4rem', paddingBottom: spacing.sectionPadding || '4rem' }}
        >
          <h1 
            className="text-4xl font-bold mb-4"
            style={{ fontFamily: fonts.heading || 'Inter, sans-serif' }}
          >
            {settings.siteTitle}
          </h1>
          {settings.siteDescription && (
            <p className="text-xl" style={{ opacity: 0.9 }}>{settings.siteDescription}</p>
          )}
          
          {settings.searchEnabled && (
            <div className="mt-8 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Try searching for help topics..."
                  className="w-full pl-12 pr-4 py-4 text-lg border-0 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none text-gray-900"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Categories Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/help/category/${category.slug}`}
              className="p-6 border rounded-lg hover:shadow-md transition-all group"
              style={{
                backgroundColor: colors.secondary || '#f3f4f6',
                borderColor: `${colors.primary || '#2563eb'}40`,
                borderRadius: spacing.borderRadius || '0.5rem',
                padding: spacing.cardPadding || '1.5rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.primary || '#2563eb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${colors.primary || '#2563eb'}40`
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${category.color || '#2563eb'}20` }}
                >
                  <Folder className="w-5 h-5" style={{ color: category.color || '#2563eb' }} />
                </div>
                <h3 
                  className="text-lg font-semibold group-hover:opacity-80"
                  style={{ 
                    fontFamily: fonts.heading || 'Inter, sans-serif',
                    color: colors.text || '#111827',
                  }}
                >
                  {category.name}
                </h3>
              </div>
              {category.description && (
                <p className="text-sm text-gray-600 mb-3">{category.description}</p>
              )}
              {category.Page && category.Page.length > 0 && (
                <div className="space-y-2">
                  {category.Page.map((page) => (
                    <div key={page.id} className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>{page.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

