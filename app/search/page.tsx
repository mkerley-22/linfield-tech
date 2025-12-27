import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/Sidebar'
import SearchBar from '@/components/SearchBar'
import Link from 'next/link'
import { FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function searchPages(query: string) {
  if (!query) {
    return []
  }

  const pages = await prisma.page.findMany({
    where: {
      isPublished: true,
      OR: [
        { title: { contains: query } },
        { description: { contains: query } },
        { content: { contains: query } },
      ],
    },
    include: {
      Attachment: true,
    },
    take: 20,
  })

  return pages
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const query = searchParams.q || ''
  const results = await searchPages(query)

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Search</h1>
          <SearchBar />
          {query && (
            <div className="mt-8">
              <p className="text-gray-600 mb-4">
                Found {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
              </p>
              <div className="space-y-4">
                {results.map((page) => (
                  <Link
                    key={page.id}
                    href={`/pages/${page.slug}`}
                    className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                          {page.title}
                        </h2>
                        {page.description && (
                          <p className="text-gray-600 mb-2">{page.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {page.Attachment && page.Attachment.length > 0 && (
                            <span>{page.Attachment.length} attachment(s)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                {results.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No results found for &quot;{query}&quot;</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {!query && (
            <div className="text-center py-12 mt-8">
              <p className="text-gray-600">Enter a search query to find pages</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

