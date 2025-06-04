import React, { useRef } from 'react'
import { Upload, RefreshCw } from 'lucide-react'
import { Button } from './button'
import { validateImageFile } from '@/lib/avatar-upload'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  disabled?: boolean
  loading?: boolean
  children?: React.ReactNode
  className?: string
}

export function FileUpload({ 
  onFileSelect, 
  accept = "image/*", 
  disabled = false, 
  loading = false, 
  children,
  className 
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file if it's an image
    if (accept === "image/*") {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        alert(validation.error) // You might want to use a toast here instead
        return
      }
    }

    onFileSelect(file)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || loading}
        className={className}
      >
        {loading ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          children || (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </>
          )
        )}
      </Button>
    </>
  )
} 