import React, { useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface BusinessInfoSectionProps {
  data: {
    company_name: string
    industry: string
    business_type: 'b2b' | 'b2c' | 'both'
    website: string
    campaign_name: string
    campaign_template: string
    description: string
    campaign_start_date: string
    campaign_end_date: string
    bot_name: string
    welcome_message: string
  }
  onUpdate: (updates: any) => void
}

const INDUSTRIES = [
  { id: 'gaming', name: 'Gaming & Esports', icon: '🎮', description: 'Gaming companies, tournaments, streamers' },
  { id: 'tech', name: 'Technology', icon: '💻', description: 'SaaS, apps, dev tools' },
  { id: 'education', name: 'Education', icon: '📚', description: 'Courses, training, workshops' },
  { id: 'ecommerce', name: 'E-commerce', icon: '🛍️', description: 'Online stores, products' },
  { id: 'crypto', name: 'Crypto & Web3', icon: '₿', description: 'DeFi, NFTs, blockchain' },
  { id: 'creator', name: 'Creator Economy', icon: '🎨', description: 'Content creators, influencers' },
  { id: 'health', name: 'Health & Fitness', icon: '💪', description: 'Fitness, wellness, healthcare' },
  { id: 'other', name: 'Other', icon: '📋', description: 'Other industry' }
]

const CAMPAIGN_TEMPLATES = {
  gaming: [
    { id: 'gaming_tournament', name: 'Gaming Tournament', description: 'Tournament registration and management' },
    { id: 'gaming_community', name: 'Gaming Community', description: 'Build an engaged gaming community' },
    { id: 'beta_program', name: 'Game Beta Program', description: 'Recruit beta testers for your game' }
  ],
  tech: [
    { id: 'product_beta', name: 'Product Beta Program', description: 'Recruit beta users for software' },
    { id: 'developer_community', name: 'Developer Community', description: 'Build a developer community' },
    { id: 'saas_trial', name: 'SaaS Trial Signup', description: 'Convert Discord users to trial users' }
  ],
  education: [
    { id: 'course_enrollment', name: 'Course Enrollment', description: 'Student registration for courses' },
    { id: 'workshop_signup', name: 'Workshop Signup', description: 'Workshop and seminar registration' },
    { id: 'learning_community', name: 'Learning Community', description: 'Educational community building' }
  ],
  ecommerce: [
    { id: 'product_launch', name: 'Product Launch', description: 'New product announcement and sales' },
    { id: 'customer_onboarding', name: 'Customer Onboarding', description: 'Welcome new customers' },
    { id: 'loyalty_program', name: 'Loyalty Program', description: 'Customer retention and rewards' }
  ],
  crypto: [
    { id: 'token_launch', name: 'Token Launch', description: 'Cryptocurrency or NFT launch' },
    { id: 'dao_community', name: 'DAO Community', description: 'Decentralized community building' },
    { id: 'whitelist_signup', name: 'Whitelist Signup', description: 'Early access registration' }
  ],
  creator: [
    { id: 'fan_community', name: 'Fan Community', description: 'Build a community around your content' },
    { id: 'exclusive_access', name: 'Exclusive Access', description: 'VIP member onboarding' },
    { id: 'content_promotion', name: 'Content Promotion', description: 'Promote new content and releases' }
  ],
  health: [
    { id: 'fitness_challenge', name: 'Fitness Challenge', description: 'Health and fitness challenges' },
    { id: 'wellness_community', name: 'Wellness Community', description: 'Health and wellness community' },
    { id: 'program_enrollment', name: 'Program Enrollment', description: 'Health program registration' }
  ],
  other: [
    { id: 'custom', name: 'Custom Campaign', description: 'Create a custom campaign from scratch' },
    { id: 'referral_onboarding', name: 'Referral Onboarding', description: 'General referral and onboarding' },
    { id: 'community_growth', name: 'Community Growth', description: 'General community building' }
  ]
}

const WELCOME_MESSAGE_TEMPLATES = {
  gaming: "Welcome to our gaming community! Ready to compete and have fun? 🎮",
  tech: "Welcome to our tech community! Let's build something amazing together. 💻",
  education: "Welcome to our learning community! Ready to expand your knowledge? 📚",
  ecommerce: "Welcome! Discover amazing products and exclusive deals just for you. 🛍️",
  crypto: "Welcome to the future of finance! Let's explore Web3 together. ₿",
  creator: "Welcome to our exclusive community! Get ready for amazing content. 🎨",
  health: "Welcome to your wellness journey! Let's achieve your health goals together. 💪",
  other: "Welcome to our community! We're excited to have you here. 🎉"
}

export function BusinessInfoSection({ data, onUpdate }: BusinessInfoSectionProps) {
  const selectedIndustry = INDUSTRIES.find(ind => ind.id === data.industry)
  const availableTemplates = data.industry ? CAMPAIGN_TEMPLATES[data.industry as keyof typeof CAMPAIGN_TEMPLATES] || [] : []

  // Auto-update bot name and welcome message when company name or industry changes
  useEffect(() => {
    if (data.company_name && !data.bot_name.includes(data.company_name)) {
      onUpdate({ bot_name: `${data.company_name} Bot` })
    }
  }, [data.company_name, data.bot_name, onUpdate])

  useEffect(() => {
    if (data.industry && !data.welcome_message) {
      const template = WELCOME_MESSAGE_TEMPLATES[data.industry as keyof typeof WELCOME_MESSAGE_TEMPLATES]
      if (template) {
        onUpdate({ welcome_message: template })
      }
    }
  }, [data.industry, data.welcome_message, onUpdate])

  return (
    <div className="space-y-6">
      {/* Business Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Business Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company/Brand Name *</Label>
            <Input
              id="company_name"
              placeholder="e.g. Epic Gaming Studios"
              value={data.company_name}
              onChange={e => onUpdate({ company_name: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="business_type">Business Type</Label>
            <Select value={data.business_type} onValueChange={value => onUpdate({ business_type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="b2c">B2C (Business to Consumer)</SelectItem>
                <SelectItem value="b2b">B2B (Business to Business)</SelectItem>
                <SelectItem value="both">Both B2B and B2C</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry *</Label>
          <Select value={data.industry} onValueChange={value => onUpdate({ industry: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map(industry => (
                <SelectItem key={industry.id} value={industry.id}>
                  <div className="flex items-center gap-2">
                    <span>{industry.icon}</span>
                    <div>
                      <div>{industry.name}</div>
                      <div className="text-xs text-muted-foreground">{industry.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedIndustry && (
            <p className="text-sm text-muted-foreground">
              {selectedIndustry.icon} {selectedIndustry.description}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website (Optional)</Label>
          <Input
            id="website"
            placeholder="https://yourcompany.com"
            value={data.website}
            onChange={e => onUpdate({ website: e.target.value })}
          />
        </div>
      </div>

      {/* Campaign Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your First Campaign</h3>
        
        <div className="space-y-2">
          <Label htmlFor="campaign_name">Campaign Name *</Label>
          <Input
            id="campaign_name"
            placeholder="e.g. Summer Gaming Tournament 2024"
            value={data.campaign_name}
            onChange={e => onUpdate({ campaign_name: e.target.value })}
          />
        </div>

        {data.industry && (
          <div className="space-y-2">
            <Label htmlFor="campaign_template">Campaign Template *</Label>
            <Select value={data.campaign_template} onValueChange={value => onUpdate({ campaign_template: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {availableTemplates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    <div>
                      <div>{template.name}</div>
                      <div className="text-xs text-muted-foreground">{template.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableTemplates.length > 0 && (
              <div className="text-sm text-muted-foreground">
                💡 Templates are customized for the {selectedIndustry?.name} industry
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="description">Campaign Description</Label>
          <Textarea
            id="description"
            placeholder="Describe what your campaign is about and what participants will get..."
            value={data.description}
            onChange={e => onUpdate({ description: e.target.value })}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="campaign_start_date">Start Date (Optional)</Label>
            <Input
              id="campaign_start_date"
              type="date"
              value={data.campaign_start_date}
              onChange={e => onUpdate({ campaign_start_date: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="campaign_end_date">End Date (Optional)</Label>
            <Input
              id="campaign_end_date"
              type="date"
              value={data.campaign_end_date}
              onChange={e => onUpdate({ campaign_end_date: e.target.value })}
            />
          </div>
        </div>
      </div>

      {data.industry && data.campaign_template && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">✅ Great Choice!</h4>
          <p className="text-sm text-green-700">
            Your <Badge variant="secondary">{availableTemplates.find(t => t.id === data.campaign_template)?.name}</Badge> campaign 
            is perfect for {selectedIndustry?.name.toLowerCase()} businesses. 
            We'll set up smart defaults for your bot and onboarding flow in the next steps.
          </p>
        </div>
      )}
    </div>
  )
} 