import { supabase } from '../lib/supabase'

const landingPageTemplates = [
  {
    id: '45576fc3-5d5d-400e-9ee9-7dae325ac0d9',
    template_id: 'nike-sneaker-drop',
    name: 'Nike Sneaker Drop',
    description: 'Perfect for Nike product launches and exclusive sneaker releases',
    preview_image_url: '/templates/nike-sneaker-drop.png',
    campaign_types: ['referral_onboarding', 'product_promotion'],
    category: 'ecommerce',
    customizable_fields: ['offer_title', 'offer_description', 'offer_highlights', 'offer_value', 'what_you_get', 'how_it_works', 'requirements', 'support_info', 'hero_image_url', 'product_images'],
    default_offer_title: 'Early Access to Nike Zoom Collection',
    default_offer_description: 'Get exclusive early access to the latest Nike Zoom series 48 hours before public release. Limited quantities available.',
    default_offer_highlights: ['48-hour early access window', '20% member discount on launch day', 'Free express shipping and returns', 'Access to exclusive colorways', 'Nike+ membership perks included'],
    default_offer_value: 'Save $40 + Free Shipping (Worth $65 total)',
    default_hero_image_url: null,
    default_video_url: null,
    default_what_you_get: 'Priority access to Nike\'s hottest releases, exclusive member pricing, free shipping on all orders, and first dibs on limited edition drops.',
    default_how_it_works: '1. Join Nike\'s exclusive Discord community\n2. Verify your membership status\n3. Receive early access notifications\n4. Shop before anyone else gets the chance',
    default_requirements: 'Must be 18+ with valid shipping address. Limited to one pair per member during early access.',
    default_support_info: 'Questions about releases or orders? Contact #sneaker-support in Discord or email releases@nike.com',
    color_scheme: { accent: '#FFFFFF', primary: '#000000', secondary: '#FF6B35' },
    layout_config: { layout: 'product-showcase', sections: ['hero', 'highlights', 'product-gallery', 'process', 'cta'] },
    is_active: true,
    is_default: false,
    created_by: null,
    created_at: '2025-06-17 14:33:51.157887+00',
    updated_at: '2025-06-17 14:33:51.157887+00'
  },
  {
    id: '040c2bd6-7a93-43f0-9cc6-00bb04d8b5f7',
    template_id: 'tech-startup-beta',
    name: 'Tech Startup Beta Access',
    description: 'Ideal for tech startups offering beta access to new products',
    preview_image_url: '/templates/tech-startup-beta.png',
    campaign_types: ['referral_onboarding', 'product_promotion'],
    category: 'technology',
    customizable_fields: ['offer_title', 'offer_description', 'offer_highlights', 'offer_value', 'what_you_get', 'how_it_works', 'requirements', 'support_info', 'hero_image_url'],
    default_offer_title: 'Get Exclusive Beta Access',
    default_offer_description: 'Be among the first 100 users to test our revolutionary new platform. Shape the future of technology with your feedback.',
    default_offer_highlights: ['Free lifetime premium account', 'Direct access to founding team', 'Influence product development', 'Priority customer support', 'Exclusive investor updates'],
    default_offer_value: 'Lifetime premium worth $2,400 - Completely FREE',
    default_hero_image_url: null,
    default_video_url: null,
    default_what_you_get: 'Full beta access, direct founder communication, lifetime pricing benefits, priority support, and voice in product roadmap.',
    default_how_it_works: '1. Apply for beta access through referral\n2. Get approved by our team\n3. Receive onboarding and setup\n4. Start testing and providing feedback',
    default_requirements: 'Tech background preferred. Must be willing to provide detailed feedback and sign NDA.',
    default_support_info: 'Beta support in #beta-testers channel or email beta@startup.com for technical issues',
    color_scheme: { accent: '#8B5CF6', primary: '#3B82F6', secondary: '#6366F1' },
    layout_config: { layout: 'tech-product', sections: ['hero', 'value-prop', 'features', 'beta-access', 'cta'] },
    is_active: true,
    is_default: true,
    created_by: null,
    created_at: '2025-06-17 14:34:11.41452+00',
    updated_at: '2025-06-17 14:34:11.41452+00'
  },
  {
    id: '638f8fab-9d16-4162-b377-1031b8be39a3',
    template_id: 'custom-flexible',
    name: 'Custom Flexible Template',
    description: 'Highly customizable template that works for any campaign type',
    preview_image_url: '/templates/custom-flexible.png',
    campaign_types: ['custom'],
    category: 'custom',
    customizable_fields: ['offer_title', 'offer_description', 'offer_highlights', 'offer_value', 'what_you_get', 'how_it_works', 'requirements', 'support_info', 'hero_image_url', 'video_url', 'product_images'],
    default_offer_title: 'Your Custom Offer',
    default_offer_description: 'Customize this description to match your specific campaign goals and audience.',
    default_offer_highlights: ['Customizable benefit 1', 'Customizable benefit 2', 'Customizable benefit 3'],
    default_offer_value: 'Custom value proposition',
    default_hero_image_url: null,
    default_video_url: null,
    default_what_you_get: 'Customize what your users get from joining your campaign.',
    default_how_it_works: '1. Customize your onboarding flow\n2. Set up your unique requirements\n3. Configure your success metrics\n4. Launch your custom campaign',
    default_requirements: 'Define your specific requirements here.',
    default_support_info: 'Add your support contact information and channels.',
    color_scheme: { accent: '#3B82F6', primary: '#6B7280', secondary: '#374151' },
    layout_config: { layout: 'flexible', sections: ['hero', 'benefits', 'process', 'requirements', 'cta'] },
    is_active: true,
    is_default: true,
    created_by: null,
    created_at: '2025-06-17 14:35:22.393773+00',
    updated_at: '2025-06-17 14:35:22.393773+00'
  },
  {
    id: '5c5c8eff-528a-4ce8-b483-67929716b49e',
    template_id: 'professional-network',
    name: 'Professional Business Network',
    description: 'Perfect for B2B communities and professional networking platforms',
    preview_image_url: '/templates/professional-network.png',
    campaign_types: ['vip_support'],
    category: 'business',
    customizable_fields: ['offer_title', 'offer_description', 'offer_highlights', 'offer_value', 'what_you_get', 'how_it_works', 'requirements', 'support_info', 'hero_image_url'],
    default_offer_title: 'Join Elite Business Network',
    default_offer_description: 'Connect with C-level executives and industry leaders. Access exclusive business opportunities and insights.',
    default_offer_highlights: ['Weekly networking events', 'Access to deal flow opportunities', 'Mentorship from industry leaders', 'Exclusive business insights', 'Direct messaging with executives'],
    default_offer_value: 'Membership normally $2,000/year - FREE for 90 days',
    default_hero_image_url: null,
    default_video_url: null,
    default_what_you_get: 'Full networking access, business opportunities, expert mentorship, market insights, and direct connections to decision makers.',
    default_how_it_works: '1. Apply for exclusive membership\n2. Professional background verification\n3. Welcome orientation and setup\n4. Begin networking with industry leaders',
    default_requirements: 'C-level, VP, or Director level experience required. Background verification needed.',
    default_support_info: 'Professional support at #business-help or contact our executive team at support@biznetwork.com',
    color_scheme: { accent: '#10B981', primary: '#1F2937', secondary: '#3B82F6' },
    layout_config: { layout: 'professional', sections: ['hero', 'network-value', 'opportunities', 'verification', 'cta'] },
    is_active: true,
    is_default: true,
    created_by: null,
    created_at: '2025-06-17 14:34:43.04189+00',
    updated_at: '2025-06-17 14:35:22.393773+00'
  },
  {
    id: '958ada87-1ffd-4c38-8199-7560199572b5',
    template_id: 'gaming-community',
    name: 'Gaming Community',
    description: 'Perfect for gaming communities, tournaments, and gaming-focused Discord servers',
    preview_image_url: '/templates/gaming-community.png',
    campaign_types: ['community_engagement', 'referral_onboarding'],
    category: 'gaming',
    customizable_fields: ['offer_title', 'offer_description', 'offer_highlights', 'offer_value', 'what_you_get', 'how_it_works', 'requirements', 'support_info', 'hero_image_url', 'video_url'],
    default_offer_title: 'Join Elite Gaming Community',
    default_offer_description: 'Connect with competitive gamers, join weekly tournaments, and level up your skills with our pro gaming community.',
    default_offer_highlights: ['Weekly tournaments with cash prizes', 'Training sessions with pro gamers', 'Team formation and scrimmage matches', 'Exclusive gaming tips and strategies', 'Early access to game betas'],
    default_offer_value: 'Tournament fees waived - Save $25/week',
    default_hero_image_url: null,
    default_video_url: null,
    default_what_you_get: 'Full access to competitive tournaments, pro training sessions, team matching system, strategy guides, and beta game access.',
    default_how_it_works: '1. Join our gaming Discord server\n2. Complete skill assessment\n3. Get matched with players at your level\n4. Start competing in tournaments',
    default_requirements: 'Active Discord account and commitment to good sportsmanship. Skill level doesn\'t matter - we welcome all gamers.',
    default_support_info: 'Gaming support available in #help-desk. Tournament issues? Contact moderators in #tournament-support',
    color_scheme: { accent: '#F59E0B', primary: '#7C3AED', secondary: '#10B981' },
    layout_config: { layout: 'community-focused', sections: ['hero', 'benefits', 'community-stats', 'process', 'cta'] },
    is_active: true,
    is_default: false,
    created_by: null,
    created_at: '2025-06-17 14:34:11.41452+00',
    updated_at: '2025-06-17 14:35:51.856252+00'
  }
]

const campaignTemplates = [
  {
    id: 'c8179ea2-57c0-4e17-843b-b13895f9ea27',
    name: 'Product Promotion',
    description: 'Promote specific products or services with detailed information, early access, and purchase assistance',
    campaign_type: 'product_promotion',
    template_config: {
      bot_config: {
        prefix: '/',
        bot_name: 'Product Assistant',
        features: {
          auto_role: false,
          moderation: true,
          onboarding: true,
          welcome_enabled: true,
          referral_tracking: true
        },
        template: 'advanced',
        brand_color: '#3b82f6',
        description: 'Product promotion bot that provides information, early access, and purchase assistance',
        auto_responses: {
          help: '🆘 I can assist with product details, pricing, availability, early access, and ordering. How can I help?',
          hello: '👋 Hello! I can help you with product information, special offers, and early access opportunities. What interests you?',
          order: '📦 Ready to order? I can guide you through the process and help with any questions.',
          price: '💰 I can help you with pricing information and any current discounts or special offers available.',
          products: '🛍️ Check out our latest products! I can provide details, pricing, and help you get early access.'
        },
        bot_personality: 'helpful',
        custom_commands: [],
        welcome_message: '🛍️ Welcome! I\'m here to help you discover our amazing products and exclusive offers. Ask me anything!',
        bot_response_style: 'professional',
        moderation_enabled: true,
        response_templates: {
          early_access: 'You now have early access to {product_name}! Use code {access_code}',
          product_info: 'Here are the details for {product_name}: {description}. Price: {price}',
          purchase_help: 'I can help you complete your purchase. What questions do you have?'
        },
        rate_limit_per_user: 10,
        auto_role_assignment: false,
        onboarding_channel_type: 'dm',
        referral_tracking_enabled: true,
        onboarding_completion_requirements: {
          required_fields: ['customer_name', 'email', 'product_interest'],
          completion_message: '🛍️ Great! You\'re all set up to receive product updates and exclusive offers.'
        }
      },
      analytics_config: {
        primary_metrics: ['product_inquiries', 'early_access_signups', 'purchase_assists'],
        tracking_enabled: true,
        conversion_events: ['product_viewed', 'early_access_requested', 'purchase_initiated']
      },
      onboarding_fields: [
        {
          id: 'customer_name',
          type: 'text',
          question: 'Name for Your Orders',
          required: true,
          validation: {
            max_length: 100,
            min_length: 2,
            error_message: 'Please enter a valid name (2-100 characters)'
          },
          description: 'This will be used for shipping and customer service',
          placeholder: 'Enter your preferred name',
          discord_integration: {
            collect_in_dm: true,
            show_in_embed: true
          }
        },
        {
          id: 'email',
          type: 'email',
          question: 'Your Email Address',
          required: true,
          validation: {},
          description: 'For order confirmations and exclusive product updates',
          placeholder: 'your.email@example.com',
          discord_integration: {
            collect_in_dm: true,
            show_in_embed: false
          }
        },
        {
          id: 'product_interest',
          type: 'multiselect',
          options: ['Electronics & Tech', 'Fashion & Apparel', 'Health & Wellness', 'Home & Garden', 'Sports & Fitness', 'Books & Education', 'Art & Crafts', 'Gaming & Entertainment'],
          question: 'Product Categories of Interest',
          required: true,
          description: 'We\'ll prioritize showing you relevant products',
          discord_integration: {
            collect_in_dm: true,
            show_in_embed: true
          }
        }
      ],
      landing_page_config: {
        offer_title: 'Exclusive Product Access',
        offer_value: 'Save up to 30% + Free Shipping',
        how_it_works: '1. Join our community\\n2. Get verified member status\\n3. Receive early access notifications\\n4. Shop with exclusive benefits',
        requirements: 'Community membership and valid email for notifications.',
        support_info: 'Product questions? Contact our team in #product-support or email support@company.com',
        what_you_get: 'Early product access, special pricing, exclusive bundles, priority support, and free shipping benefits.',
        offer_highlights: ['Early access to new products', 'Member-only pricing', 'Exclusive product bundles', 'Priority customer support', 'Free shipping on orders'],
        offer_description: 'Get early access to our latest products with special member pricing and exclusive offers.'
      }
    },
    is_default: true,
    created_by: null,
    created_at: '2025-06-09 23:28:38.474708+00',
    updated_at: '2025-06-09 23:28:38.474708+00',
    category: 'promotion',
    default_landing_page_id: '45576fc3-5d5d-400e-9ee9-7dae325ac0d9'
  },
  {
    id: '99967bfb-d499-4ea0-8db9-e3e20ed024a7',
    name: 'Referral Onboarding',
    description: 'Welcome new users through influencer referral links with automatic role assignment and conversion tracking',
    campaign_type: 'referral_onboarding',
    template_config: {
      bot_config: {
        prefix: '/',
        bot_name: 'Welcome Bot',
        features: {
          auto_role: true,
          moderation: true,
          onboarding: true,
          welcome_enabled: true,
          referral_tracking: true
        },
        template: 'referral_campaign',
        brand_color: '#00ff88',
        description: 'Automated referral onboarding bot that welcomes new members and tracks conversions',
        auto_responses: {
          help: '🆘 I can help you with referral codes, getting started, and accessing your member benefits. What do you need help with?',
          hello: '👋 Hey there! Welcome to the community! If you have a referral code, just share it and I\'ll unlock your special benefits.',
          welcome: 'Welcome! Share your referral code to unlock exclusive member benefits and connect with your referrer!',
          referral_invalid: '🤔 I couldn\'t find that referral code. Please double-check and try again, or contact support if you need help.',
          referral_success: '🎉 Amazing! Thanks for joining through {influencer_name}\'s referral! You now have access to exclusive benefits.'
        },
        bot_personality: 'enthusiastic',
        custom_commands: [],
        welcome_message: '🎉 Welcome to our community! Thanks for joining through a referral link. I\'ll help you get started with exclusive perks!',
        bot_response_style: 'friendly',
        moderation_enabled: true,
        response_templates: {
          field_prompt: 'Next, I need to know: {question}',
          field_success: 'Got it! {field_name} recorded.',
          onboarding_start: 'Let\'s get you set up! I\'ll need to collect some information to personalize your experience.',
          completion_success: '🎉 Onboarding complete! Welcome to the community, {name}!'
        },
        rate_limit_per_user: 5,
        auto_role_assignment: true,
        onboarding_channel_type: 'dm',
        referral_tracking_enabled: true,
        onboarding_completion_requirements: {
          required_fields: ['full_name', 'email', 'referral_source', 'interests'],
          completion_message: '🎉 Welcome to our community! You now have full access to all member benefits.',
          auto_role_on_completion: 'Member'
        }
      },
      analytics_config: {
        primary_metrics: ['referral_conversions', 'successful_onboardings', 'role_assignments'],
        tracking_enabled: true,
        conversion_events: ['referral_code_validated', 'role_assigned', 'onboarding_completed']
      },
      onboarding_fields: [
        {
          id: 'full_name',
          type: 'text',
          question: 'Your Full Name',
          required: true,
          validation: {
            max_length: 100,
            min_length: 2,
            error_message: 'Please enter a valid full name (2-100 characters)'
          },
          description: 'We use this to personalize your experience',
          placeholder: 'Enter your full name',
          discord_integration: {
            collect_in_dm: true,
            show_in_embed: true
          }
        },
        {
          id: 'email',
          type: 'email',
          question: 'Your Email Address',
          required: true,
          validation: {},
          description: 'For exclusive updates and member benefits',
          placeholder: 'your.email@example.com',
          discord_integration: {
            collect_in_dm: true,
            show_in_embed: false
          }
        },
        {
          id: 'referral_source',
          type: 'select',
          options: ['Instagram', 'YouTube', 'TikTok', 'Twitter/X', 'Friend recommendation', 'Other social media', 'Other'],
          question: 'How You Heard About Us',
          required: true,
          description: 'Help us understand our community growth',
          discord_integration: {
            collect_in_dm: true,
            show_in_embed: true
          }
        },
        {
          id: 'interests',
          type: 'multiselect',
          options: ['Exclusive deals and discounts', 'Early access to products', 'Community events', 'VIP support', 'Networking opportunities', 'Learning and education', 'Entertainment content'],
          question: 'What Interests You Most',
          required: true,
          description: 'Select all that apply - helps us tailor your experience',
          discord_integration: {
            collect_in_dm: true,
            show_in_embed: true,
            trigger_after: 'referral_source'
          }
        }
      ],
      landing_page_config: {
        offer_title: 'Join Exclusive Community',
        offer_value: 'Exclusive access worth $100+ - Completely FREE',
        how_it_works: '1. Join through referral link\\n2. Verify your referral code\\n3. Get assigned member role\\n4. Access exclusive benefits',
        requirements: 'Valid referral code from an authorized community member.',
        support_info: 'Need help? Contact our community moderators or use the #help channel.',
        what_you_get: 'Full community access, exclusive member benefits, early feature access, VIP support, and special discounts.',
        offer_highlights: ['Exclusive member benefits', 'Early access to new features', 'VIP community support', 'Special member discounts', 'Direct access to community leaders'],
        offer_description: 'Get exclusive access to our community with special member benefits and early access to new features.'
      }
    },
    is_default: true,
    created_by: null,
    created_at: '2025-06-09 23:28:38.474708+00',
    updated_at: '2025-06-09 23:28:38.474708+00',
    category: 'referral',
    default_landing_page_id: '040c2bd6-7a93-43f0-9cc6-00bb04d8b5f7'
  },
  {
    id: 'b90f1be0-f1cc-4356-ac3a-f1ac5cb60460',
    name: 'VIP Support',
    description: 'Provide premium customer support with priority assistance, dedicated specialists, and comprehensive issue tracking',
    campaign_type: 'vip_support',
    template_config: {
      bot_config: {
        prefix: '/',
        bot_name: 'VIP Support',
        features: {
          auto_role: true,
          moderation: true,
          onboarding: true,
          welcome_enabled: true,
          referral_tracking: false
        },
        template: 'support_campaign',
        brand_color: '#f59e0b',
        description: 'VIP support bot providing priority assistance and expert customer service',
        auto_responses: {
          help: '🆘 I can help with account issues, technical problems, billing questions, and escalations to specialists.',
          hello: '👋 Hello! Welcome to VIP Support. I\'m here to provide you with priority assistance for any questions or issues.',
          escalate: '📞 I\'m escalating your issue to a specialist who will contact you shortly for personalized assistance.',
          priority: '⚡ Your request has been marked as priority and will be handled by our VIP team within 15 minutes.'
        },
        target_role_id: 'VIP Member',
        bot_personality: 'professional',
        custom_commands: [],
        welcome_message: '🏆 Welcome to VIP Support! You\'re receiving our highest level of customer service. How can I assist you today?',
        bot_response_style: 'formal',
        moderation_enabled: true,
        response_templates: {
          issue_resolved: 'Great! Your issue has been resolved. Is there anything else I can help you with today?',
          ticket_created: 'VIP Ticket #{ticket_id} created. Priority: {priority}. Estimated response: {response_time}',
          specialist_assigned: 'Specialist {specialist_name} has been assigned to your case. They\'ll contact you within {time_frame}.'
        },
        rate_limit_per_user: 20,
        auto_role_assignment: true,
        onboarding_channel_type: 'dm',
        referral_tracking_enabled: false,
        onboarding_completion_requirements: {
          required_fields: ['customer_name', 'account_email', 'account_id'],
          completion_message: '🏆 VIP verification complete! You now have access to priority support channels.',
          auto_role_on_completion: 'VIP Verified'
        }
      },
      analytics_config: {
        primary_metrics: ['tickets_created', 'resolution_time', 'satisfaction_scores'],
        tracking_enabled: true,
        conversion_events: ['ticket_created', 'issue_resolved', 'escalation_requested']
      },
      onboarding_fields: [
        {
          id: 'customer_name',
          type: 'text',
          question: 'Full Name on Account',
          required: true,
          validation: {
            max_length: 100,
            min_length: 2,
            error_message: 'Please enter your full name (2-100 characters)'
          },
          description: 'Must match your account information for verification',
          placeholder: 'Enter your full legal name',
          discord_integration: {
            collect_in_dm: true,
            show_in_embed: true
          }
        },
        {
          id: 'account_email',
          type: 'email',
          question: 'Account Email Address',
          required: true,
          validation: {},
          description: 'Primary email on your account for verification',
          placeholder: 'account.email@example.com',
          discord_integration: {
            collect_in_dm: true,
            show_in_embed: false
          }
        },
        {
          id: 'account_id',
          type: 'text',
          question: 'Account ID or Customer Number',
          required: true,
          validation: {
            max_length: 50,
            error_message: 'Account ID should be under 50 characters'
          },
          description: 'Helps us quickly locate your account (if known)',
          placeholder: 'Account ID, customer number, or username',
          discord_integration: {
            collect_in_dm: true,
            show_in_embed: false
          }
        }
      ],
      landing_page_config: {
        offer_title: 'Premium VIP Support',
        offer_value: 'Premium support worth $200/month - Included',
        how_it_works: '1. Access VIP support channel\\n2. Describe your issue\\n3. Get immediate priority assistance\\n4. Escalate to specialists if needed',
        requirements: 'VIP membership status and access to premium support channels.',
        support_info: 'VIP Support available 24/7 in #vip-support or email vip@company.com',
        what_you_get: 'Priority support access, expert assistance, fast response times, and dedicated specialist attention.',
        offer_highlights: ['Priority support queue', '15-minute response time', 'Dedicated support specialists', 'Direct escalation access', 'Comprehensive issue tracking'],
        offer_description: 'Get priority access to our expert support team with dedicated assistance and faster resolution times.'
      }
    },
    is_default: true,
    created_by: null,
    created_at: '2025-06-09 23:29:39.396965+00',
    updated_at: '2025-06-09 23:29:39.396965+00',
    category: 'support',
    default_landing_page_id: '5c5c8eff-528a-4ce8-b483-67929716b49e'
  },
  {
    id: '9af9542a-0536-4a43-923a-3944445ad39d',
    name: 'Community Engagement',
    description: 'Build and nurture an active community with member introductions, events, and engagement activities',
    campaign_type: 'community_engagement',
    template_config: {
      bot_config: {
        prefix: '/',
        bot_name: 'Community Guide',
        features: {
          auto_role: false,
          moderation: true,
          onboarding: true,
          welcome_enabled: true,
          referral_tracking: false
        },
        template: 'standard',
        brand_color: '#8b5cf6',
        description: 'Community engagement bot that facilitates introductions, events, and member interactions',
        auto_responses: {
          help: '🆘 I can assist with community guidelines, upcoming events, member introductions, and connecting with others.',
          hello: '👋 Hi there! Welcome to our community! I can help you get introduced and find your place here.',
          events: '📅 Check out our upcoming community events! There\'s always something exciting happening.',
          community: '🏘️ Our community is built on connection, learning, and mutual support. How can I help you engage?'
        },
        bot_personality: 'friendly',
        custom_commands: [],
        welcome_message: '🌟 Welcome to our vibrant community! I\'m here to help you connect, participate, and make the most of your experience.',
        bot_response_style: 'casual',
        moderation_enabled: true,
        response_templates: {
          welcome_intro: 'Welcome {member_name}! We\'re excited to have you in our community.',
          discussion_starter: 'Great topic! What does everyone else think about {topic}?',
          event_notification: '📅 New event: {event_name} on {date}. Join us!'
        },
        rate_limit_per_user: 8,
        auto_role_assignment: false,
        onboarding_channel_type: 'dm',
        referral_tracking_enabled: false,
        onboarding_completion_requirements: {
          required_fields: ['display_name', 'interests', 'community_goals'],
          completion_message: '🌟 Welcome to the community! You\'re all set to participate and connect with others.'
        }
      },
      analytics_config: {
        primary_metrics: ['community_participation', 'event_attendance', 'discussion_engagement'],
        tracking_enabled: true,
        conversion_events: ['member_introduced', 'event_joined', 'discussion_participated']
      },
      onboarding_fields: [
        {
          id: 'display_name',
          type: 'text',
          question: 'Community Display Name',
          required: true,
          validation: {
            max_length: 50,
            min_length: 2,
            error_message: 'Please enter a name between 2-50 characters'
          },
          description: 'This is how other members will see you',
          placeholder: 'Enter your preferred name or nickname',
          discord_integration: {
            collect_in_dm: true,
            show_in_embed: true
          }
        },
        {
          id: 'interests',
          type: 'multiselect',
          options: ['Technology & Programming', 'Gaming & Esports', 'Art & Design', 'Music & Entertainment', 'Business & Entrepreneurship', 'Health & Fitness', 'Travel & Adventure', 'Food & Cooking', 'Books & Literature', 'Science & Learning'],
          question: 'Topics That Interest You',
          required: true,
          description: 'We\'ll suggest relevant channels and events',
          discord_integration: {
            collect_in_dm: true,
            show_in_embed: true
          }
        },
        {
          id: 'community_goals',
          type: 'text',
          question: 'What You Hope to Get Here',
          required: true,
          validation: {
            max_length: 300,
            error_message: 'Please keep your response under 300 characters'
          },
          description: 'Help us create the best community experience for you',
          placeholder: 'Learning, networking, fun, support, collaboration, etc.',
          discord_integration: {
            collect_in_dm: true,
            show_in_embed: false
          }
        }
      ],
      landing_page_config: {
        offer_title: 'Join Vibrant Community',
        offer_value: 'Free community membership with premium features',
        how_it_works: '1. Join our Discord community\\n2. Introduce yourself\\n3. Participate in discussions\\n4. Attend events and activities',
        requirements: 'Active Discord account and commitment to community guidelines.',
        support_info: 'Community questions? Ask in #community-help or message our moderators.',
        what_you_get: 'Full community access, event participation, networking opportunities, and member recognition.',
        offer_highlights: ['Weekly community events', 'Active discussion channels', 'Member networking opportunities', 'Exclusive community challenges', 'Recognition and rewards program'],
        offer_description: 'Connect with like-minded people, participate in events, and be part of an engaging community.'
      }
    },
    is_default: true,
    created_by: null,
    created_at: '2025-06-09 23:29:39.396965+00',
    updated_at: '2025-06-09 23:29:39.396965+00',
    category: 'community',
    default_landing_page_id: '958ada87-1ffd-4c38-8199-7560199572b5'
  },
  {
    id: 'c007d86e-8f24-4b21-bfff-41456b66206f',
    name: 'Custom',
    description: 'Flexible template for custom bot configurations that don\'t fit other categories',
    campaign_type: 'custom',
    template_config: {
      bot_config: {
        prefix: '/',
        bot_name: 'Custom Bot',
        features: {
          auto_role: false,
          moderation: false,
          onboarding: true,
          welcome_enabled: true,
          referral_tracking: false
        },
        template: 'custom',
        brand_color: '#6b7280',
        description: 'Customizable bot for specific use cases and requirements',
        auto_responses: {
          help: '🆘 I can be configured to help with various tasks. What would you like me to assist with?',
          hello: '👋 Hi! I\'m your custom bot assistant. How can I help you today?'
        },
        bot_personality: 'helpful',
        custom_commands: [],
        welcome_message: '👋 Hello! I\'m a custom bot ready to assist you. Feel free to configure me for your specific needs.',
        bot_response_style: 'friendly',
        moderation_enabled: false,
        response_templates: {},
        rate_limit_per_user: 5,
        auto_role_assignment: false,
        onboarding_channel_type: 'dm',
        referral_tracking_enabled: false,
        onboarding_completion_requirements: {
          required_fields: ['user_name', 'purpose'],
          completion_message: '✅ Setup complete! Your custom bot is ready to use.'
        }
      },
      analytics_config: {
        primary_metrics: ['custom_interactions', 'command_usage'],
        tracking_enabled: false,
        conversion_events: ['custom_event']
      },
      onboarding_fields: [
        {
          id: 'user_name',
          type: 'text',
          question: 'What Should We Call You',
          required: true,
          validation: {
            max_length: 100,
            min_length: 1,
            error_message: 'Please enter a valid name'
          },
          description: 'Basic information for personalization',
          placeholder: 'Enter your preferred name',
          discord_integration: {
            collect_in_dm: true,
            show_in_embed: true
          }
        },
        {
          id: 'purpose',
          type: 'text',
          question: 'What Brings You Here',
          required: true,
          validation: {
            max_length: 500,
            error_message: 'Please keep your response under 500 characters'
          },
          description: 'Help us understand how to assist you better',
          placeholder: 'Tell us about your interest or goals...',
          discord_integration: {
            collect_in_dm: true,
            show_in_embed: false
          }
        }
      ]
    },
    is_default: true,
    created_by: null,
    created_at: '2025-06-09 23:29:39.396965+00',
    updated_at: '2025-06-09 23:29:39.396965+00',
    category: 'custom',
    default_landing_page_id: '638f8fab-9d16-4162-b377-1031b8be39a3'
  }
]

async function seedCampaignTemplates() {
  try {
    console.log('Starting to seed campaign templates...')

    // Clear existing default templates
    console.log('Clearing existing default templates...')
    
    const { error: clearCampaignError } = await supabase
      .from('campaign_templates')
      .delete()
      .eq('is_default', true)

    if (clearCampaignError) {
      console.error('Error clearing campaign templates:', clearCampaignError)
      return
    }

    const { error: clearLandingError } = await supabase
      .from('landing_page_templates')
      .delete()
      .eq('is_default', true)

    if (clearLandingError) {
      console.error('Error clearing landing page templates:', clearLandingError)
      return
    }

    // Insert landing page templates first (required by foreign key constraint)
    console.log('Inserting landing page templates...')
    const { data: insertedLandingPages, error: landingError } = await supabase
      .from('landing_page_templates')
      .insert(landingPageTemplates)
      .select()

    if (landingError) {
      console.error('Error inserting landing page templates:', landingError)
      return
    }

    console.log(`Inserted ${insertedLandingPages.length} landing page templates`)

    // Insert campaign templates
    console.log('Inserting campaign templates...')
    const { data: insertedCampaigns, error: campaignError } = await supabase
      .from('campaign_templates')
      .insert(campaignTemplates)
      .select()

    if (campaignError) {
      console.error('Error inserting campaign templates:', campaignError)
      return
    }

    console.log(`Inserted ${insertedCampaigns.length} campaign templates`)
    console.log('Campaign templates seeded successfully!')

    // Print summary
    console.log('\n=== SEED SUMMARY ===')
    console.log('Landing Page Templates:')
    insertedLandingPages.forEach(template => {
      console.log(`  - ${template.name} (${template.category})`)
    })
    console.log('\nCampaign Templates:')
    insertedCampaigns.forEach(template => {
      console.log(`  - ${template.name} (${template.category})`)
    })
    console.log('====================\n')

  } catch (error) {
    console.error('Error seeding campaign templates:', error)
  }
}

// Run the seed function if this script is executed directly
if (require.main === module) {
  seedCampaignTemplates()
}

export { seedCampaignTemplates }