export function generateShareText(platform: string, title: string, campaignName?: string): string {
  const baseText = campaignName ? 
    `Check out this ${campaignName} promotion: ${title}` : 
    `Check this out: ${title}`
    
  switch (platform.toLowerCase()) {
    case "twitter":
      return `${baseText} 🔥`
    case "instagram": 
      return `${baseText} ✨ Link in bio!`
    case "tiktok":
      return `${baseText} 🎵 #promotion`
    case "youtube":
      return `${baseText} - Link in description!`
    case "linkedin":
      return `Excited to share: ${baseText}`
    default:
      return baseText
  }
} 