import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { Plus, Folder, FileText } from 'lucide-react'

// Section model has been removed - use Category instead
async function getSections() {
  return []
}

export default async function SectionsPage() {
  const sections = await getSections()

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Sections</h1>
            <Link
              href="/sections/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Section
            </Link>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-600 text-center py-12">
              Sections have been replaced by Categories. Please use the Categories page instead.
            </p>
            <div className="text-center mt-4">
              <Link
                href="/categories"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Categories
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
