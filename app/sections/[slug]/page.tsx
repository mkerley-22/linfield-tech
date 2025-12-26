import { notFound } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Section model has been removed - use Category instead
export default async function SectionView({ params }: { params: { slug: string } }) {
  // Sections have been replaced by Categories
  notFound()
}
