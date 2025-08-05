interface PlayerAvatarProps {
  avatar: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function PlayerAvatar({ avatar, className = '', size = 'md' }: PlayerAvatarProps) {
  // Check if avatar is a data URL (base64 image)
  const isImage = avatar.startsWith('data:image/')
  
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
        />
      </div>
    )
  }
  
  // For emoji avatars
  return (
    <div className={baseClasses}>
      {avatar}
    </div>
  )
}