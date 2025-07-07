import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Palette, Bot, MessageCircle } from "lucide-react"

interface BotBrandingSectionProps {
  data: {
    bot_name: string
    brand_color: string
    brand_logo_url: string
    bot_personality: string
    bot_response_style: string
    welcome_message: string
    company_name: string
    industry: string
  }
  onUpdate: (updates: any) => void
}

const BOT_PERSONALITIES = [
  { id: 'helpful', name: 'Helpful', description: 'Friendly and supportive, always ready to assist', emoji: '🤝' },
  { id: 'enthusiastic', name: 'Enthusiastic', description: 'High-energy and exciting, great for gaming/events', emoji: '🎉' },
  { id: 'professional', name: 'Professional', description: 'Business-focused and formal, perfect for B2B', emoji: '💼' },
  { id: 'witty', name: 'Witty', description: 'Clever and humorous, engaging for younger audiences', emoji: '😄' },
  { id: 'calm', name: 'Calm', description: 'Zen and peaceful, ideal for wellness/education', emoji: '🧘' }
]

const RESPONSE_STYLES = [
  { id: 'friendly', name: 'Friendly', description: 'Warm and approachable tone' },
  { id: 'concise', name: 'Concise', description: 'Brief and to-the-point responses' },
  { id: 'detailed', name: 'Detailed', description: 'Comprehensive and thorough explanations' },
  { id: 'casual', name: 'Casual', description: 'Relaxed and informal communication' },
  { id: 'formal', name: 'Formal', description: 'Professional and structured responses' }
]

const BRAND_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', 
  '#3b82f6', '#ef4444', '#84cc16', '#f97316', '#06b6d4'
]

export function BotBrandingSection({ data, onUpdate }: BotBrandingSectionProps) {
  const selectedPersonality = BOT_PERSONALITIES.find(p => p.id === data.bot_personality)
  const selectedStyle = RESPONSE_STYLES.find(s => s.id === data.bot_response_style)

  return (
    <div className="space-y-6">
      {/* Bot Identity */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Bot Identity</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bot_name">Bot Name *</Label>
            <Input
              id="bot_name"
              placeholder={`${data.company_name || 'Your'} Bot`}
              value={data.bot_name}
              onChange={e => onUpdate({ bot_name: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              This will be displayed as your bot's name in Discord
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="brand_logo_url">Bot Avatar URL (Optional)</Label>
            <Input
              id="brand_logo_url"
              placeholder="https://yourcompany.com/logo.png"
              value={data.brand_logo_url}
              onChange={e => onUpdate({ brand_logo_url: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              URL to your logo or bot avatar image
            </p>
          </div>
        </div>
      </div>

      {/* Brand Colors */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Brand Colors</h3>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="brand_color">Primary Brand Color</Label>
          <div className="flex items-center gap-4">
            <Input
              id="brand_color"
              type="color"
              value={data.brand_color}
              onChange={e => onUpdate({ brand_color: e.target.value })}
              className="w-16 h-10 p-1 rounded"
            />
            <Input
              type="text"
              value={data.brand_color}
              onChange={e => onUpdate({ brand_color: e.target.value })}
              placeholder="#6366f1"
              className="flex-1 font-mono"
            />
          </div>
          
          <div className="flex gap-2 mt-2">
            <p className="text-sm text-muted-foreground">Quick colors:</p>
            {BRAND_COLORS.map(color => (
              <button
                key={color}
                className="w-6 h-6 rounded border-2 border-white shadow-sm hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => onUpdate({ brand_color: color })}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bot Personality */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Bot Personality</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bot_personality">Personality Type *</Label>
            <Select value={data.bot_personality} onValueChange={value => onUpdate({ bot_personality: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select personality" />
              </SelectTrigger>
              <SelectContent>
                {BOT_PERSONALITIES.map(personality => (
                  <SelectItem key={personality.id} value={personality.id}>
                    <div className="flex items-center gap-2">
                      <span>{personality.emoji}</span>
                      <div>
                        <div>{personality.name}</div>
                        <div className="text-xs text-muted-foreground">{personality.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPersonality && (
              <p className="text-sm text-muted-foreground">
                {selectedPersonality.emoji} {selectedPersonality.description}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bot_response_style">Response Style *</Label>
            <Select value={data.bot_response_style} onValueChange={value => onUpdate({ bot_response_style: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                {RESPONSE_STYLES.map(style => (
                  <SelectItem key={style.id} value={style.id}>
                    <div>
                      <div>{style.name}</div>
                      <div className="text-xs text-muted-foreground">{style.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStyle && (
              <p className="text-sm text-muted-foreground">
                {selectedStyle.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Welcome Message</h3>
        
        <div className="space-y-2">
          <Label htmlFor="welcome_message">First Message Users See *</Label>
          <Textarea
            id="welcome_message"
            placeholder="Welcome to our community! We're excited to have you here."
            value={data.welcome_message}
            onChange={e => onUpdate({ welcome_message: e.target.value })}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            This message will be shown to users when they first interact with your bot
          </p>
        </div>
      </div>

      {/* Preview Card */}
      {data.bot_name && data.welcome_message && (
        <Card className="border-2 border-dashed border-primary/30">
          <CardHeader>
            <CardTitle className="text-sm">Bot Preview</CardTitle>
            <CardDescription>How your bot will appear to users</CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="bg-gray-100 rounded-lg p-4 border-l-4"
              style={{ borderLeftColor: data.brand_color }}
            >
              <div className="flex items-start gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: data.brand_color }}
                >
                  {data.brand_logo_url ? (
                    <img 
                      src={data.brand_logo_url} 
                      alt="Bot" 
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling!.style.display = 'block'
                      }}
                    />
                  ) : null}
                  <span style={{ display: data.brand_logo_url ? 'none' : 'block' }}>
                    {data.bot_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{data.bot_name}</span>
                    <Badge variant="secondary" className="text-xs">BOT</Badge>
                    {selectedPersonality && (
                      <span className="text-xs">{selectedPersonality.emoji}</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700">
                    {data.welcome_message}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {data.industry && selectedPersonality && selectedStyle && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">🎨 Perfect Match!</h4>
          <p className="text-sm text-blue-700">
            Your <Badge variant="secondary">{selectedPersonality.name}</Badge> personality with{' '}
            <Badge variant="secondary">{selectedStyle.name}</Badge> style is ideal for{' '}
            {data.industry} businesses. This combination will create engaging user experiences!
          </p>
        </div>
      )}
    </div>
  )
} 