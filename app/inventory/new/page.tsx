import Sidebar from '@/components/Sidebar'
import InventoryEditor from '@/components/InventoryEditor'

export default function NewInventoryPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 lg:p-8 pt-24 lg:pt-8">
          <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">Add New Equipment</h1>
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <InventoryEditor />
          </div>
        </div>
      </main>
    </div>
  )
}

