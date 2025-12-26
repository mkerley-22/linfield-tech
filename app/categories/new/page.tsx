import Sidebar from '@/components/Sidebar'
import CategoryEditor from '@/components/CategoryEditor'

export default function NewCategoryPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <CategoryEditor />
      </main>
    </div>
  )
}
