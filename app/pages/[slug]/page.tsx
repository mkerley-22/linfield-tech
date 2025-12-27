import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/Sidebar'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Edit, ArrowLeft, FileText, Image as ImageIcon, Video, Download, Plus } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'

export const dynamic = 'force-dynamic'

async function getPage(slug: string) {
  const page = await prisma.page.findUnique({
    where: { slug },
    include: {
      other_Page: {
        where: { isPublished: true },
        orderBy: { order: 'asc' },
      },
      Attachment: true,
      PageTag: {
        include: {
          Tag: true,
        },
      },
      Page: true,
      Category: true,
      DriveFile: true,
    },
  })
  return page
}

export default async function PageView({ params }: { params: { slug: string } }) {
  const page = await getPage(params.slug)

  if (!page) {
    notFound()
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="w-5 h-5" />
      case 'video':
        return <Video className="w-5 h-5" />
      case 'document':
        return <FileText className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <div className="mb-6">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Link href="/pages" className="hover:text-blue-600">
                Pages
              </Link>
              {page.Page && (
                <>
                  <span>/</span>
                  <Link
                    href={`/pages/${page.Page.slug}`}
                    className="hover:text-blue-600"
                  >
                    {page.Page.title}
                  </Link>
                </>
              )}
              <span>/</span>
              <span className="text-gray-900 font-medium">{page.title}</span>
            </nav>
            
            {page.Page && (
              <Link
                href={`/pages/${page.Page.slug}`}
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to {page.Page.title}
              </Link>
            )}
            {/* Header Image */}
            {page.headerImage && (
              <div className="mb-6 -mx-8">
                <img
                  src={page.headerImage}
                  alt={page.title}
                  className="w-full h-[250px] object-cover"
                  style={{ maxWidth: '1200px', margin: '0 auto' }}
                />
              </div>
            )}

            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{page.title}</h1>
                {page.description && (
                  <p className="text-lg text-gray-600">{page.description}</p>
                )}
              </div>
              <Link
                href={`/pages/${page.slug}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {page.Category && (
                <Link
                  href={`/categories/${page.Category.slug}`}
                  className="px-3 py-1 text-sm rounded-full font-medium hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: `${page.Category.color || '#2563eb'}20`,
                    color: page.Category.color || '#2563eb',
                  }}
                >
                  {page.Category.name}
                </Link>
              )}
              {page.PageTag && page.PageTag.length > 0 && (
                <>
                  {page.PageTag.map((pageTag) => (
                    <span
                      key={pageTag.Tag.id}
                      className="px-3 py-1 text-sm rounded-full bg-white border-[0.5px] border-blue-300 text-gray-700"
                    >
                      {pageTag.Tag.name}
                    </span>
                  ))}
                </>
              )}
            </div>
          </div>

          {page.content && page.content.trim() && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Subpages {page.other_Page && page.other_Page.length > 0 && `(${page.other_Page.length})`}
              </h2>
            </div>
            {page.other_Page && page.other_Page.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {page.other_Page.map((child) => (
                  <Link
                    key={child.id}
                    href={`/pages/${child.slug}`}
                    className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all bg-white"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {child.title}
                        </h3>
                        {child.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {child.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No subpages yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Add a subpage to organize related content
                </p>
                <Link
                  href={`/pages/new?parentId=${page.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add a Subpage
                </Link>
              </div>
            )}
          </div>

          {page.Attachment && page.Attachment.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Attachments</h2>
              <div className="space-y-2">
                {page.Attachment.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-gray-600 group-hover:text-blue-600">
                        {getFileIcon(attachment.fileType)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{attachment.fileName}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(attachment.fileSize)}
                        </p>
                      </div>
                    </div>
                    <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

