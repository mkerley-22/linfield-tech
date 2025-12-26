'use client'

import { useState, useEffect } from 'react'
import { Folder, Link as LinkIcon, RefreshCw, Plus, X, ExternalLink, Search } from 'lucide-react'
import { Button } from './ui/Button'
import DriveFileBrowser from './DriveFileBrowser'

interface DriveIntegrationProps {
  categoryId?: string
  pageId?: string
  onFilesLinked?: () => void
}

export default function DriveIntegration({ categoryId, pageId, onFilesLinked }: DriveIntegrationProps) {
  const [driveFiles, setDriveFiles] = useState<any[]>([])
  const [driveFolder, setDriveFolder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [folderId, setFolderId] = useState('')
  const [showFileBrowser, setShowFileBrowser] = useState(false)

  useEffect(() => {
    if (categoryId) {
      loadDriveFolder()
      loadDriveFiles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId])

  const loadDriveFolder = async () => {
    if (!categoryId) return
    
    try {
      const response = await fetch(`/api/drive/folders?categoryId=${categoryId}`)
      if (response.ok) {
        const folder = await response.json()
        setDriveFolder(folder)
      }
    } catch (error) {
      console.error('Failed to load Drive folder:', error)
    }
  }

  const loadDriveFiles = async () => {
    if (!categoryId && !pageId) return
    
    try {
      // Load files from database that are linked to this category or page
      const url = categoryId 
        ? `/api/drive/files?categoryId=${categoryId}`
        : `/api/drive/files?pageId=${pageId}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setDriveFiles(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Failed to load Drive files:', error)
    }
  }

  const handleLinkFile = async (fileId: string) => {
    setIsLinking(true)
    try {
      const response = await fetch('/api/drive/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          pageId,
          categoryId,
        }),
      })

      if (!response.ok) throw new Error('Failed to link file')

      await loadDriveFiles()
      onFilesLinked?.()
    } catch (error) {
      console.error('Failed to link file:', error)
      alert('Failed to link Drive file. Please try again.')
    } finally {
      setIsLinking(false)
    }
  }

  const handleSyncFolder = async () => {
    if (!driveFolder?.driveFolderId) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderId: driveFolder.driveFolderId,
          categoryId,
        }),
      })

      if (!response.ok) throw new Error('Failed to sync folder')

      const data = await response.json()
      await loadDriveFiles()
      alert(`Synced ${data.synced} files from Drive`)
    } catch (error) {
      console.error('Failed to sync folder:', error)
      alert('Failed to sync Drive folder. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!categoryId || !folderId) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/drive/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          name: `Category Folder`,
          parentFolderId: folderId || null,
          autoSync: false,
        }),
      })

      if (!response.ok) throw new Error('Failed to create folder')

      await loadDriveFolder()
      alert('Drive folder created successfully')
    } catch (error) {
      console.error('Failed to create folder:', error)
      alert('Failed to create Drive folder. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Google Drive Integration</h3>
        </div>
        {driveFolder && (
          <Button
            onClick={handleSyncFolder}
            disabled={isLoading}
            variant="secondary"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        )}
      </div>

      {categoryId && !driveFolder && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700 mb-3">
            Link a Drive folder to automatically sync files
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              placeholder="Drive Folder ID (optional)"
              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
            />
            <Button
              onClick={handleCreateFolder}
              disabled={isLoading}
              variant="primary"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Folder
            </Button>
          </div>
        </div>
      )}

      {driveFolder && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">{driveFolder.name}</p>
              <p className="text-xs text-blue-700">Drive Folder Linked</p>
            </div>
            <a
              href={`https://drive.google.com/drive/folders/${driveFolder.driveFolderId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <Button
          onClick={() => setShowFileBrowser(!showFileBrowser)}
          variant="secondary"
          size="sm"
        >
          <Search className="w-4 h-4 mr-2" />
          {showFileBrowser ? 'Hide' : 'Browse'} Drive Files
        </Button>
      </div>

      {showFileBrowser && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-4">
          <DriveFileBrowser
            folderId={driveFolder?.driveFolderId}
            onSelectFile={handleLinkFile}
            onSelectFolder={(id) => {
              // Navigate to folder
              setShowFileBrowser(false)
              setTimeout(() => {
                setShowFileBrowser(true)
                // This would need folder navigation - simplified for now
              }, 100)
            }}
          />
        </div>
      )}

      {driveFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Linked Drive Files</h4>
          <div className="space-y-2">
            {driveFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-900 truncate">{file.fileName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={async () => {
                      try {
                        await fetch(`/api/drive/files/${file.id}`, { method: 'DELETE' })
                        await loadDriveFiles()
                        onFilesLinked?.()
                      } catch (error) {
                        console.error('Failed to unlink file:', error)
                      }
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

