import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/Sidebar'
import CategoryEditor from '@/components/CategoryEditor'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getCategory(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
  })
  return category
}

export default async function EditCategoryPage({ params }: { params: { slug: string } }) {
  const category = await getCategory(params.slug)

  if (!category) {
    notFound()
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <CategoryEditor
          categoryId={category.id}
          initialName={category.name}
          initialDescription={category.description || ''}
          initialColor={category.color || '#2563eb'}
        />
      </main>
    </div>
  )
}
