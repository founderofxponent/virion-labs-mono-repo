export interface CampaignTemplate {
  id: string
  name: string
  description: string
  category: 'referral' | 'promotion' | 'community' | 'support' | 'custom'
  
  // Default bot configuration
  bot_config: {
    bot_name: string
    bot_personality: 'helpful' | 'enthusiastic' | 'professional' | 'friendly' | 'casual'
    bot_response_style: 'formal' | 'casual' | 'friendly' | 'professional' | 'enthusiastic'
    prefix: string
    brand_color: string
    description: string
    welcome_message: string
    auto_responses: Record<string, string>
    custom_commands: Array<{
      command: string
      response: string
      description?: string
    }>
    features: {
      welcome_enabled: boolean
      referral_tracking: boolean
      onboarding: boolean
      auto_role: boolean
      moderation: boolean
    }
  }
  
  // Analytics configuration
  analytics_config: {
    primary_metrics: string[]
    conversion_events: string[]
    tracking_enabled: boolean
  }
  
  // Landing page configuration
  landing_page_config?: {
    offer_title: string
    offer_description: string
    offer_highlights: string[]
    offer_value: string
    what_you_get: string
    how_it_works: string
    requirements: string
    support_info: string
  }
}

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'referral_onboarding',
    name: 'Referral Onboarding',
    description: 'Welcome new users through influencer referral links with automatic role assignment and conversion tracking',
    category: 'referral',
    bot_config: {
      bot_name: 'Welcome Bot',
      bot_personality: 'enthusiastic',
      bot_response_style: 'friendly',
      prefix: '!',
      brand_color: '#00ff88',
      description: 'Automated referral onboarding bot that welcomes new members and tracks conversions',
      welcome_message: '🎉 Welcome to our community! Thanks for joining through a referral link. I\'ll help you get started with exclusive perks!',
      auto_responses: {
        'hello': '👋 Hey there! Welcome to the community! If you have a referral code, just share it and I\'ll unlock your special benefits.',
        'help': '🆘 I can help you with referral codes, getting started, and accessing your member benefits. What do you need help with?',
        'referral_success': '🎉 Amazing! Thanks for joining through {influencer_name}\'s referral! You now have access to exclusive benefits.',
        'referral_invalid': '🤔 I couldn\'t find that referral code. Please double-check and try again, or contact support if you need help.',
        'welcome': 'Welcome! Share your referral code to unlock exclusive member benefits and connect with your referrer!'
      },
      custom_commands: [
        {
          command: '!benefits',
          response: '✨ Here are your exclusive member benefits: Early access, special discounts, VIP support, and community perks!',
          description: 'Show member benefits'
        },
        {
          command: '!referral',
          response: 'Share your referral code in this channel and I\'ll verify it for you!',
          description: 'Referral code instructions'
        }
      ],
      features: {
        welcome_enabled: true,
        referral_tracking: true,
        onboarding: true,
        auto_role: true,
        moderation: true
      }
    },
    analytics_config: {
      primary_metrics: ['referral_conversions', 'successful_onboardings', 'role_assignments'],
      conversion_events: ['referral_code_validated', 'role_assigned', 'onboarding_completed'],
      tracking_enabled: true
    },
    landing_page_config: {
      offer_title: 'Join Exclusive Community',
      offer_description: 'Get exclusive access to our community with special member benefits and early access to new features.',
      offer_highlights: [
        'Exclusive member benefits',
        'Early access to new features',
        'VIP community support',
        'Special member discounts',
        'Direct access to community leaders'
      ],
      offer_value: 'Exclusive access worth $100+ - Completely FREE',
      what_you_get: 'Full community access, exclusive member benefits, early feature access, VIP support, and special discounts.',
      how_it_works: '1. Join through referral link\n2. Verify your referral code\n3. Get assigned member role\n4. Access exclusive benefits',
      requirements: 'Valid referral code from an authorized community member.',
      support_info: 'Need help? Contact our community moderators or use the #help channel.'
    }
  },
  
  {
    id: 'product_promotion',
    name: 'Product Promotion',
    description: 'Promote specific products or services with detailed information, early access, and purchase assistance',
    category: 'promotion',
    bot_config: {
      bot_name: 'Product Assistant',
      bot_personality: 'helpful',
      bot_response_style: 'professional',
      prefix: '!',
      brand_color: '#3b82f6',
      description: 'Product promotion bot that provides information, early access, and purchase assistance',
      welcome_message: '🛍️ Welcome! I\'m here to help you discover our amazing products and exclusive offers. Ask me anything!',
      auto_responses: {
        'hello': '👋 Hello! I can help you with product information, special offers, and early access opportunities. What interests you?',
        'help': '🆘 I can assist with product details, pricing, availability, early access, and ordering. How can I help?',
        'products': '🛍️ Check out our latest products! I can provide details, pricing, and help you get early access.',
        'price': '💰 I can help you with pricing information and any current discounts or special offers available.',
        'order': '📦 Ready to order? I can guide you through the process and help with any questions.'
      },
      custom_commands: [
        {
          command: '!catalog',
          response: '📋 Here\'s our product catalog with the latest items and exclusive releases!',
          description: 'Show product catalog'
        },
        {
          command: '!offers',
          response: '🏷️ Current offers: Early access discounts, member pricing, and exclusive bundles available!',
          description: 'Show current offers'
        },
        {
          command: '!early-access',
          response: '⏰ Get early access to new products before public release! Ask me how to qualify.',
          description: 'Early access information'
        }
      ],
      features: {
        welcome_enabled: true,
        referral_tracking: true,
        onboarding: true,
        auto_role: false,
        moderation: true
      }
    },
    analytics_config: {
      primary_metrics: ['product_inquiries', 'early_access_signups', 'purchase_assists'],
      conversion_events: ['product_viewed', 'early_access_requested', 'purchase_initiated'],
      tracking_enabled: true
    },
    landing_page_config: {
      offer_title: 'Exclusive Product Access',
      offer_description: 'Get early access to our latest products with special member pricing and exclusive offers.',
      offer_highlights: [
        'Early access to new products',
        'Member-only pricing',
        'Exclusive product bundles',
        'Priority customer support',
        'Free shipping on orders'
      ],
      offer_value: 'Save up to 30% + Free Shipping',
      what_you_get: 'Early product access, special pricing, exclusive bundles, priority support, and free shipping benefits.',
      how_it_works: '1. Join our community\n2. Get verified member status\n3. Receive early access notifications\n4. Shop with exclusive benefits',
      requirements: 'Community membership and valid email for notifications.',
      support_info: 'Product questions? Contact our team in #product-support or email support@company.com'
    }
  },
  
  {
    id: 'community_engagement',
    name: 'Community Engagement',
    description: 'Build and engage community members through discussions, events, and interactive activities',
    category: 'community',
    bot_config: {
      bot_name: 'Community Bot',
      bot_personality: 'friendly',
      bot_response_style: 'casual',
      prefix: '!',
      brand_color: '#8b5cf6',
      description: 'Community engagement bot that facilitates discussions and activities',
      welcome_message: '🌟 Welcome to our amazing community! I\'m here to help you connect, participate, and make the most of your experience here.',
      auto_responses: {
        'hello': '👋 Hey there! Welcome to the community! I can help you find discussions, events, and ways to get involved.',
        'help': '🆘 I can help you navigate the community, find events, join discussions, and connect with other members.',
        'events': '📅 Check out our upcoming community events! Gaming tournaments, discussions, workshops, and more.',
        'rules': '📋 Here are our community guidelines to ensure everyone has a great experience together.',
        'channels': '📢 Let me show you our different channels and what each one is for!'
      },
      custom_commands: [
        {
          command: '!events',
          response: '📅 Upcoming events: Weekly discussions, gaming nights, workshops, and community challenges!',
          description: 'Show upcoming events'
        },
        {
          command: '!leaderboard',
          response: '🏆 Community leaderboard: See the most active and helpful members this week!',
          description: 'Show community leaderboard'
        },
        {
          command: '!introduce',
          response: '👋 New here? Introduce yourself in #introductions and let the community welcome you!',
          description: 'Introduction guide'
        }
      ],
      features: {
        welcome_enabled: true,
        referral_tracking: false,
        onboarding: true,
        auto_role: false,
        moderation: true
      }
    },
    analytics_config: {
      primary_metrics: ['community_participation', 'event_attendance', 'discussion_engagement'],
      conversion_events: ['member_introduced', 'event_joined', 'discussion_participated'],
      tracking_enabled: true
    },
    landing_page_config: {
      offer_title: 'Join Vibrant Community',
      offer_description: 'Connect with like-minded people, participate in events, and be part of an engaging community.',
      offer_highlights: [
        'Weekly community events',
        'Active discussion channels',
        'Member networking opportunities',
        'Exclusive community challenges',
        'Recognition and rewards program'
      ],
      offer_value: 'Free community membership with premium features',
      what_you_get: 'Full community access, event participation, networking opportunities, and member recognition.',
      how_it_works: '1. Join our Discord community\n2. Introduce yourself\n3. Participate in discussions\n4. Attend events and activities',
      requirements: 'Active Discord account and commitment to community guidelines.',
      support_info: 'Community questions? Ask in #community-help or message our moderators.'
    }
  },
  
  {
    id: 'vip_support',
    name: 'VIP Support',
    description: 'Premium customer support with priority assistance, dedicated channels, and expert help',
    category: 'support',
    bot_config: {
      bot_name: 'VIP Support',
      bot_personality: 'professional',
      bot_response_style: 'formal',
      prefix: '!',
      brand_color: '#f59e0b',
      description: 'VIP support bot providing premium customer assistance and priority help',
      welcome_message: '🌟 Welcome to VIP Support! I\'m here to provide you with premium assistance. How can I help you today?',
      auto_responses: {
        'hello': 'Good day! Welcome to VIP Support. I\'m here to assist you with any questions or issues you may have.',
        'help': '🆘 VIP Support services: Priority assistance, technical support, account management, and escalation to specialists.',
        'urgent': '🚨 For urgent issues, I can immediately escalate to our VIP support team. Please describe your issue.',
        'account': '👤 I can help with account-related questions, billing, subscriptions, and profile management.',
        'technical': '🔧 Technical issues? I can provide immediate assistance or connect you with our technical specialists.'
      },
      custom_commands: [
        {
          command: '!ticket',
          response: '🎫 I\'ll create a priority support ticket for you. Please describe your issue in detail.',
          description: 'Create support ticket'
        },
        {
          command: '!escalate',
          response: '⬆️ Escalating to VIP support specialist. You\'ll receive priority attention within 15 minutes.',
          description: 'Escalate to specialist'
        },
        {
          command: '!status',
          response: '📊 Let me check the status of your recent tickets and ongoing issues.',
          description: 'Check ticket status'
        }
      ],
      features: {
        welcome_enabled: true,
        referral_tracking: false,
        onboarding: true,
        auto_role: true,
        moderation: false
      }
    },
    analytics_config: {
      primary_metrics: ['tickets_created', 'resolution_time', 'satisfaction_scores'],
      conversion_events: ['ticket_created', 'issue_resolved', 'escalation_requested'],
      tracking_enabled: true
    },
    landing_page_config: {
      offer_title: 'Premium VIP Support',
      offer_description: 'Get priority access to our expert support team with dedicated assistance and faster resolution times.',
      offer_highlights: [
        'Priority support queue',
        '15-minute response time',
        'Dedicated support specialists',
        'Direct escalation access',
        'Comprehensive issue tracking'
      ],
      offer_value: 'Premium support worth $200/month - Included',
      what_you_get: 'Priority support access, expert assistance, fast response times, and dedicated specialist attention.',
      how_it_works: '1. Access VIP support channel\n2. Describe your issue\n3. Get immediate priority assistance\n4. Escalate to specialists if needed',
      requirements: 'VIP membership status and access to premium support channels.',
      support_info: 'VIP Support available 24/7 in #vip-support or email vip@company.com'
    }
  },
  
  {
    id: 'custom',
    name: 'Custom Configuration',
    description: 'Fully customizable bot with your own settings, responses, and features',
    category: 'custom',
    bot_config: {
      bot_name: 'Custom Bot',
      bot_personality: 'helpful',
      bot_response_style: 'friendly',
      prefix: '!',
      brand_color: '#6b7280',
      description: 'Custom configured bot tailored to your specific needs',
      welcome_message: 'Welcome! This bot has been customized for your specific needs. How can I assist you?',
      auto_responses: {
        'hello': 'Hello! I\'m a custom bot configured for your specific needs. How can I help?',
        'help': 'I can assist with various tasks. My capabilities have been customized for your requirements.'
      },
      custom_commands: [],
      features: {
        welcome_enabled: true,
        referral_tracking: false,
        onboarding: false,
        auto_role: false,
        moderation: true
      }
    },
    analytics_config: {
      primary_metrics: ['custom_interactions', 'command_usage'],
      conversion_events: ['custom_event'],
      tracking_enabled: false
    }
  }
]

export function getCampaignTemplate(templateId: string): CampaignTemplate | undefined {
  return CAMPAIGN_TEMPLATES.find(template => template.id === templateId)
}

export function getCampaignTemplatesByCategory(category: string): CampaignTemplate[] {
  return CAMPAIGN_TEMPLATES.filter(template => template.category === category)
}

export function getAllCampaignTemplates(): CampaignTemplate[] {
  return CAMPAIGN_TEMPLATES
} 