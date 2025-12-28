'use client'

import { useState, useEffect } from 'react'
import { Folder, File, Image as ImageIcon, FileText, Video, Loader2, Search } from 'lucide-react'
import { Button } from './ui/Button'

interface DriveFileBrowserProps {
  folderId?: string
  onSelectFile: (fileId: string) => void
  onSelectFolder?: (folderId: string) => void
}

export default function DriveFileBrowser({ folderId, onSelectFile, onSelectFolder }: DriveFileBrowserProps) {
  const [files, setFiles] = useState<any[]>([])
  const [currentFolder, setCurrentFolder] = useState(folderId || 'root')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (currentFolder) {
      loadFiles(currentFolder)
    }
  }, [currentFolder])

  const loadFiles = async (folder: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/drive/files?folderId=${folder}`)
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error('Failed to load Drive files:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('folder')) return <Folder className="w-5 h-5 text-blue-600" />
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-green-600" />
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5 text-purple-600" />
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="w-5 h-5 text-red-600" />
    return <File className="w-5 h-5 text-gray-600" />
  }

  const filteredFiles = files.filter(file => 
    file.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const folders = filteredFiles.filter(f => f.mimeType === 'application/vnd.google-apps.folder')
  const fileItems = filteredFiles.filter(f => f.mimeType !== 'application/vnd.google-apps.folder')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search files..."
          className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {folders.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Folders</h4>
              {folders.map((file) => (
                <button
                  key={file.id}
                  onClick={() => {
                    if (onSelectFolder) {
                      onSelectFolder(file.id)
                    } else {
                      setCurrentFolder(file.id)
                    }
                  }}
                  className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-left"
                >
                  {getFileIcon(file.mimeType)}
                  <span className="text-sm text-gray-900 flex-1 truncate">{file.name}</span>
                </button>
              ))}
            </div>
          )}

          {fileItems.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Files</h4>
              {fileItems.map((file) => (
                <button
                  key={file.id}
                  onClick={() => onSelectFile(file.id)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-left"
                >
                  {getFileIcon(file.mimeType)}
                  <span className="text-sm text-gray-900 flex-1 truncate">{file.name}</span>
                </button>
              ))}
            </div>
          )}

          {filteredFiles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No files found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


