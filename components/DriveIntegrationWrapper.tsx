'use client'

import { useIntegration } from '@/hooks/useIntegration'
import DriveIntegration from './DriveIntegration'

interface DriveIntegrationWrapperProps {
  pageId?: string
  categoryId?: string
  onFilesLinked?: () => void
}

export default function DriveIntegrationWrapper({ 
  pageId, 
  categoryId, 
  onFilesLinked 
}: DriveIntegrationWrapperProps) {
  const { enabled: googleEnabled, isLoading } = useIntegration('google')

  if (isLoading) {
    return null
  }

  if (!googleEnabled) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-500">
          Enable Google Integration in Settings to sync Drive files
        </p>
      </div>
    )
  }

  return (
    <DriveIntegration
      pageId={pageId}
      categoryId={categoryId}
      onFilesLinked={onFilesLinked}
    />
  )
}


