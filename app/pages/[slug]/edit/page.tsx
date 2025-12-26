import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/Sidebar'
import PageEditor from '@/components/PageEditor'
import { notFound } from 'next/navigation'

async function getPage(slug: string) {
  const page = await prisma.page.findUnique({
    where: { slug },
    include: {
      Attachment: true,
      Category: true,
    },
  })
  return page
}

export default async function EditPage({ params }: { params: { slug: string } }) {
  const page = await getPage(params.slug)

  if (!page) {
    notFound()
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <PageEditor
          pageId={page.id}
          initialTitle={page.title}
          initialContent={page.content}
          initialDescription={page.description || ''}
          initialCategoryId={page.categoryId || ''}
          initialParentId={page.parentId || ''}
          initialHeaderImage={page.headerImage || ''}
          initialIsPublished={page.isPublished}
          initialFiles={page.Attachment.map((att) => ({
            id: att.id,
            fileName: att.fileName,
            fileType: att.fileType,
            fileSize: att.fileSize,
          }))}
        />
      </main>
    </div>
  )
}

