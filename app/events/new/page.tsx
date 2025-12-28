import Sidebar from '@/components/Sidebar'
import EventEditor from '@/components/EventEditor'

export default function NewEventPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 lg:p-8 pt-24 lg:pt-8">
          <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">Create New Event</h1>
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <EventEditor />
          </div>
        </div>
      </main>
    </div>
  )
}

