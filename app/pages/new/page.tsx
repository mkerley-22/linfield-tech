import Sidebar from '@/components/Sidebar'
import PageEditor from '@/components/PageEditor'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getCategory(categoryId: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    })
    return category?.id || ''
  } catch {
    return ''
  }
}

export default async function NewPagePage({
  searchParams,
}: {
  searchParams: { category?: string; parentId?: string }
}) {
  const initialCategoryId = searchParams.category
    ? await getCategory(searchParams.category)
    : ''
  
  const initialParentId = searchParams.parentId || ''

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <PageEditor 
          initialCategoryId={initialCategoryId}
          initialParentId={initialParentId}
        />
      </main>
    </div>
  )
}

