import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/Sidebar'
import SectionEditor from '@/components/SectionEditor'
import { notFound } from 'next/navigation'

async function getSection(slug: string) {
  const section = await prisma.section.findUnique({
    where: { slug },
  })
  return section
}

export default async function EditSectionPage({ params }: { params: { slug: string } }) {
  const section = await getSection(params.slug)

  if (!section) {
    notFound()
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <SectionEditor
          sectionId={section.id}
          initialName={section.name}
          initialDescription={section.description || ''}
          initialColor={section.color || '#2563eb'}
        />
      </main>
    </div>
  )
}

