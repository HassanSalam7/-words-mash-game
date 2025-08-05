'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface AvatarSelectorProps {
  selectedAvatar: string
  onAvatarChange: (avatar: string) => void
}

const cartoonAvatars = [
  { id: 'ninja', fallback: '🥷', name: 'Ninja' },
  { id: 'robot', fallback: '🤖', name: 'Robot' },
  { id: 'wizard', fallback: '🧙‍♂️', name: 'Wizard' },
  { id: 'superhero', fallback: '🦸‍♂️', name: 'Hero' },
  { id: 'cat', fallback: '🐱', name: 'Cat' },
  { id: 'fox', fallback: '🦊', name: 'Fox' },
  { id: 'panda', fallback: '🐼', name: 'Panda' },
  { id: 'unicorn', fallback: '🦄', name: 'Unicorn' }
]

export default function AvatarSelector({ selectedAvatar, onAvatarChange }: AvatarSelectorProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB')
      return
    }

    setIsUploading(true)

    try {
      // Create a canvas to resize the image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Set canvas size to 64x64 for consistent avatar size
        canvas.width = 64
        canvas.height = 64

        // Draw image centered and cropped to fit circle
        const size = Math.min(img.width, img.height)
        const x = (img.width - size) / 2
        const y = (img.height - size) / 2

        ctx?.drawImage(img, x, y, size, size, 0, 0, 64, 64)

        // Convert to base64
        const resizedImage = canvas.toDataURL('image/jpeg', 0.8)
        setUploadedImage(resizedImage)
        onAvatarChange(resizedImage)
        setIsUploading(false)
      }

      img.onerror = () => {
        alert('Failed to load image')
        setIsUploading(false)
      }

      // Create object URL and load image
      const objectUrl = URL.createObjectURL(file)
      img.src = objectUrl
      
      // Clean up object URL after loading
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        // Set canvas size to 64x64 for consistent avatar size
        canvas.width = 64
        canvas.height = 64

        // Draw image centered and cropped to fit circle
        const size = Math.min(img.width, img.height)
        const x = (img.width - size) / 2
        const y = (img.height - size) / 2

        ctx?.drawImage(img, x, y, size, size, 0, 0, 64, 64)

        // Convert to base64
        const resizedImage = canvas.toDataURL('image/jpeg', 0.8)
        setUploadedImage(resizedImage)
        onAvatarChange(resizedImage)
        setIsUploading(false)
      }
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Failed to process image')
      setIsUploading(false)
    }
  }

  const handleRemoveUploadedImage = () => {
    setUploadedImage(null)
    if (cartoonAvatars[0]) {
      onAvatarChange(cartoonAvatars[0].fallback)
    }
  }

  const isAvatarSelected = (avatar: any) => {
    if (uploadedImage) {
      return selectedAvatar === uploadedImage
    }
    return selectedAvatar === avatar.fallback
  }

  const isUploadSelected = uploadedImage && selectedAvatar === uploadedImage

  return (
    <div className="w-full">
      {/* Avatar Grid */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        {/* Cartoon Avatars */}
        {cartoonAvatars.map((avatar) => (
          <button
            key={avatar.id}
            type="button"
            onClick={() => {
              setUploadedImage(null)
              onAvatarChange(avatar.fallback)
            }}
            className={`relative w-12 h-12 rounded-full border-2 transition-all duration-200 flex items-center justify-center text-2xl hover:scale-110 active:scale-95 ${
              isAvatarSelected(avatar) && !uploadedImage
                ? 'border-blue-500 bg-blue-50 shadow-lg scale-110'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            {avatar.fallback}
            {isAvatarSelected(avatar) && !uploadedImage && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        ))}

        {/* Upload Photo Option */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`relative w-12 h-12 rounded-full border-2 transition-all duration-200 flex items-center justify-center hover:scale-110 active:scale-95 ${
            isUploadSelected
              ? 'border-green-500 bg-green-50 shadow-lg scale-110'
              : 'border-dashed border-gray-300 hover:border-blue-300'
          }`}
        >
          {uploadedImage && isUploadSelected ? (
            <>
              <img
                src={uploadedImage}
                alt="Your avatar"
                className="w-full h-full rounded-full object-cover"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveUploadedImage()
                }}
                className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <span className="text-white text-xs">×</span>
              </button>
            </>
          ) : (
            <span className={`text-lg ${isUploading ? 'animate-spin' : ''}`}>
              {isUploading ? '⏳' : '📷'}
            </span>
          )}
        </button>
      </div>

      {/* Selected Avatar Info */}
      <div className="text-center">
        <p className="text-xs text-gray-600">
          {uploadedImage && isUploadSelected ? (
            <>
              <span className="font-medium text-green-600">Custom Photo</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="ml-2 h-auto p-1 text-xs"
              >
                Change
              </Button>
            </>
          ) : (
            cartoonAvatars.find(a => a.fallback === selectedAvatar)?.name || 'Select an avatar'
          )}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  )
}