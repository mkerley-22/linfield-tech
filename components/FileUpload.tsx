'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File, Image as ImageIcon, Video, FileText } from 'lucide-react'
import { formatFileSize, getFileType } from '@/lib/utils'

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>
  existingFiles?: Array<{
    id: string
    fileName: string
    fileType: string
    fileSize: number
  }>
  onDelete?: (fileId: string) => Promise<void>
}

export default function FileUpload({ onUpload, existingFiles = [], onDelete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return
      setUploading(true)
      try {
        await onUpload(acceptedFiles)
      } catch (error) {
        console.error('Upload error:', error)
        alert('Failed to upload files. Please try again.')
      } finally {
        setUploading(false)
      }
    },
    [onUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 100 * 1024 * 1024, // 100MB
  })

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="w-5 h-5" />
      case 'video':
        return <Video className="w-5 h-5" />
      case 'document':
        return <FileText className="w-5 h-5" />
      default:
        return <File className="w-5 h-5" />
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 bg-gray-50'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop files here...</p>
        ) : (
          <>
            <p className="text-gray-700 font-medium mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports documents, images, videos, and schematics (max 100MB)
            </p>
          </>
        )}
      </div>

      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900">Uploaded Files</h4>
          <div className="space-y-2">
            {existingFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-gray-600">{getFileIcon(file.fileType)}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.fileName}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</p>
                  </div>
                </div>
                {onDelete && (
                  <button
                    onClick={() => onDelete(file.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

