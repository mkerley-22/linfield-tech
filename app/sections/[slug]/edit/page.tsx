import { notFound } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import SectionEditor from '@/components/SectionEditor'

// Section model has been removed - use Category instead
export default async function EditSectionPage({ params }: { params: { slug: string } }) {
  // Sections have been replaced by Categories
  notFound()
}
