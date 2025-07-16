import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateInitials(name?: string | null): string {
  if (!name || name.trim() === '') {
    return 'U'
  }
  
  const words = name.trim().split(/\s+/)
  
  if (words.length === 1) {
    // For single word names, take first two characters or just the first if only one character
    return words[0].slice(0, 2).toUpperCase()
  }
  
  // For multiple words, take first character of first and last word
  const firstInitial = words[0].charAt(0)
  const lastInitial = words[words.length - 1].charAt(0)
  
  return (firstInitial + lastInitial).toUpperCase()
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }
    
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24)
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours)
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`
    } else if (diffInDays < 7) {
      const days = Math.floor(diffInDays)
      return days === 1 ? '1 day ago' : `${days} days ago`
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  } catch (error) {
    return 'Invalid date'
  }
}
