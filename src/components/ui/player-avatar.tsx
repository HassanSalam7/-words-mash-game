interface PlayerAvatarProps {
  avatar?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function PlayerAvatar({ avatar, className = '', size = 'md' }: PlayerAvatarProps) {
  // Check if avatar is a data URL (base64 image) or HTTP URL (Dicebear)
  const isImage = avatar && (avatar.startsWith('data:image/') || avatar.startsWith('http'))
  
  // Size classes
  const sizeClasses = {
    sm: 'w-6 h-6 text-base',
    md: 'w-8 h-8 text-2xl', 
    lg: 'w-12 h-12 text-3xl',
    xl: 'w-16 h-16 text-4xl'
  }
  
  const baseClasses = `flex items-center justify-center ${sizeClasses[size]} ${className}`
  
  if (isImage) {
    return (
      <div className={baseClasses}>
        <img
          src={avatar}
          alt="Player avatar"
          className="w-full h-full rounded-full object-cover"
          onError={(e) => {
            // Fallback to default emoji if image fails to load
            e.currentTarget.style.display = 'none'
            const parent = e.currentTarget.parentElement
            if (parent) {
              parent.innerHTML = '<span class="text-2xl">👤</span>'
            }
          }}
        />
      </div>
    )
  }
  
  // For emoji avatars or fallback
  return (
    <div className={baseClasses}>
      {avatar || '👤'}
    </div>
  )
}