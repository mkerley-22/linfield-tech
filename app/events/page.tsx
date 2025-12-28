import Sidebar from '@/components/Sidebar'
import EventsDashboard from '@/components/EventsDashboard'

export default function EventsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-0">
        <div className="max-w-6xl mx-auto p-4 lg:p-8 pt-24 lg:pt-8">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">
              Events
            </h1>
            <p className="text-sm lg:text-base text-gray-600">
              Tech events and meetings
            </p>
          </div>
          <EventsDashboard />
        </div>
      </main>
    </div>
  )
}

