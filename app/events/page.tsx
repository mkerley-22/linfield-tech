import Sidebar from '@/components/Sidebar'
import EventsDashboard from '@/components/EventsDashboard'

export default function EventsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <EventsDashboard />
        </div>
      </main>
    </div>
  )
}

