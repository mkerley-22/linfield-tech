import Sidebar from '@/components/Sidebar'
import SectionEditor from '@/components/SectionEditor'

export default function NewSectionPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <SectionEditor />
      </main>
    </div>
  )
}


