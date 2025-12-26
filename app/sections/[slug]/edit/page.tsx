import { notFound } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import SectionEditor from '@/components/SectionEditor'

// Section model has been removed - use Category instead
async function getSection(slug: string) {
  return null
}

export default async function EditSectionPage({ params }: { params: { slug: string } }) {
  const section = await getSection(params.slug)
  
  if (!section) {
    notFound()
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          <h1 className="text-2xl font-bold mb-6">Edit Section</h1>
          <SectionEditor
            sectionId={section.id}
            initialName={section.name}
            initialDescription={section.description || ''}
            initialColor={section.color || '#2563eb'}
            initialIcon={section.icon || ''}
          />
        </div>
      </div>
    </div>
  )
}
