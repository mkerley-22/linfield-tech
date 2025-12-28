import Sidebar from '@/components/Sidebar'
import CategoryEditor from '@/components/CategoryEditor'

export default function NewCategoryPage({
  searchParams,
}: {
  searchParams: { parentId?: string }
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <CategoryEditor initialParentId={searchParams.parentId || ''} />
      </main>
    </div>
  )
}
