export interface LandingPageTemplate {
  id: string
  name: string
  description: string
  preview_image: string
  campaign_types: string[] // Which campaign types this template works for
  fields: {
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

export const LANDING_PAGE_TEMPLATES: LandingPageTemplate[] = [
  {
    id: "nike-sneaker-drop",
    name: "Nike Sneaker Drop",
    description: "Perfect for Nike product launches and exclusive sneaker releases",
    preview_image: "/templates/nike-sneaker-drop.png", 
    campaign_types: ["referral_onboarding", "product_promotion"],
    fields: {
      offer_title: "Early Access to Nike Zoom Collection",
      offer_description: "Get exclusive early access to the latest Nike Zoom series 48 hours before public release. Limited quantities available.",
      offer_highlights: [
        "48-hour early access window",
        "20% member discount on launch day", 
        "Free express shipping and returns",
        "Access to exclusive colorways",
        "Nike+ membership perks included"
      ],
      offer_value: "Save $40 + Free Shipping (Worth $65 total)",
      what_you_get: "Priority access to Nike's hottest releases, exclusive member pricing, free shipping on all orders, and first dibs on limited edition drops.",
      how_it_works: "1. Join Nike's exclusive Discord community\n2. Verify your membership status\n3. Receive early access notifications\n4. Shop before anyone else gets the chance",
      requirements: "Must be 18+ with valid shipping address. Limited to one pair per member during early access.",
      support_info: "Questions about releases or orders? Contact #sneaker-support in Discord or email releases@nike.com"
    }
  },
  {
    id: "gaming-community",
    name: "Gaming Community",
    description: "Perfect for gaming communities, tournaments, and gaming-focused Discord servers",
    preview_image: "/templates/gaming-community.png",
    campaign_types: ["community_engagement", "referral_onboarding"],
    fields: {
      offer_title: "Join Elite Gaming Community",
      offer_description: "Connect with competitive gamers, join weekly tournaments, and level up your skills with our pro gaming community.",
      offer_highlights: [
        "Weekly tournaments with cash prizes",
        "Training sessions with pro gamers",
        "Team formation and scrimmage matches",
        "Exclusive gaming tips and strategies",
        "Early access to game betas"
      ],
      offer_value: "Tournament fees waived - Save $25/week",
      what_you_get: "Full access to competitive tournaments, pro training sessions, team matching system, strategy guides, and beta game access.",
      how_it_works: "1. Join our gaming Discord server\n2. Complete skill assessment\n3. Get matched with players at your level\n4. Start competing in tournaments",
      requirements: "Active Discord account and commitment to good sportsmanship. Skill level doesn't matter - we welcome all gamers.",
      support_info: "Gaming support available in #help-desk. Tournament issues? Contact moderators in #tournament-support"
    }
  },
  {
    id: "tech-startup-beta",
    name: "Tech Startup Beta Access",
    description: "Ideal for tech startups offering beta access to new products",
    preview_image: "/templates/tech-startup-beta.png",
    campaign_types: ["referral_onboarding", "product_promotion"],
    fields: {
      offer_title: "Get Exclusive Beta Access",
      offer_description: "Be among the first 100 users to test our revolutionary new platform. Shape the future of technology with your feedback.",
      offer_highlights: [
        "Free lifetime premium account",
        "Direct access to founding team",
        "Influence product development",
        "Priority customer support",
        "Exclusive investor updates"
      ],
      offer_value: "Lifetime premium worth $2,400 - Completely FREE",
      what_you_get: "Full beta access, direct founder communication, lifetime pricing benefits, priority support, and voice in product roadmap.",
      how_it_works: "1. Apply for beta access through referral\n2. Get approved by our team\n3. Receive onboarding and setup\n4. Start testing and providing feedback",
      requirements: "Tech background preferred. Must be willing to provide detailed feedback and sign NDA.",
      support_info: "Beta support in #beta-testers channel or email beta@startup.com for technical issues"
    }
  },
  {
    id: "fashion-vip-access",
    name: "Fashion VIP Collection",
    description: "Perfect for fashion brand collections and seasonal launches",
    preview_image: "/templates/fashion-vip-access.png",
    campaign_types: ["product_promotion", "community_engagement"],
    fields: {
      offer_title: "VIP Access to New Collection",
      offer_description: "Get exclusive first look at our stunning new seasonal collection with VIP pricing and styling consultation.",
      offer_highlights: [
        "VIP preview 1 week early",
        "30% off entire new collection",
        "Free personal styling consultation", 
        "Exclusive limited edition pieces",
        "Free shipping and easy returns"
      ],
      offer_value: "Styling session worth $150 + 30% savings",
      what_you_get: "Early collection access, significant discounts, professional styling advice, and exclusive pieces not available to the public.",
      how_it_works: "1. Join our fashion Discord community\n2. Complete style preferences quiz\n3. Get VIP preview access code\n4. Shop with exclusive member benefits",
      requirements: "Must complete style preferences to receive personalized recommendations. Age 18+ required.",
      support_info: "Fashion advice in #style-help or contact our customer care team at orders@fashionbrand.com"
    }
  },
  {
    id: "fitness-challenge",
    name: "Fitness Community Challenge",
    description: "Great for fitness apps and health & wellness communities",
    preview_image: "/templates/fitness-challenge.png",
    campaign_types: ["community_engagement", "referral_onboarding"],
    fields: {
      offer_title: "Join 30-Day Transformation Challenge",
      offer_description: "Transform your fitness with our community-driven 30-day challenge. Get personal coaching and premium app access.",
      offer_highlights: [
        "30-day guided transformation program",
        "Personal trainer coaching",
        "Custom nutrition and workout plans",
        "Daily motivation and accountability",
        "Prize pool for top performers"
      ],
      offer_value: "Premium coaching worth $300 - FREE",
      what_you_get: "Complete 30-day program, personal coaching, custom meal plans, workout routines, and community support throughout your journey.",
      how_it_works: "1. Join our fitness Discord community\n2. Set your transformation goals\n3. Get your personalized program\n4. Start your 30-day journey with support",
      requirements: "Basic fitness level recommended but not required. Must commit to full 30-day program.",
      support_info: "Fitness coaching in #trainer-help or email our support team at support@fitnessapp.com"
    }
  },
  {
    id: "tech-support-vip",
    name: "VIP Tech Support",
    description: "Perfect for tech companies offering premium support services",
    preview_image: "/templates/tech-support-vip.png",
    campaign_types: ["support", "community_engagement"],
    fields: {
      offer_title: "Get VIP Technical Support",
      offer_description: "Receive priority technical support with guaranteed 1-hour response time and dedicated support specialist.",
      offer_highlights: [
        "1-hour guaranteed response time",
        "Dedicated support specialist",
        "Direct phone and chat support",
        "Screen sharing assistance",
        "Follow-up until resolution"
      ],
      offer_value: "Premium support worth $100/month - FREE",
      what_you_get: "Priority technical support, dedicated specialist, multiple contact methods, remote assistance, and complete issue resolution.",
      how_it_works: "1. Join our tech support Discord\n2. Register for VIP support status\n3. Contact us anytime for help\n4. Get immediate priority assistance",
      requirements: "Must have a legitimate technical support need. No abuse of support system.",
      support_info: "VIP support available 24/7 in #vip-support or email priority@techstartup.com"
    }
  }
]

export function getTemplateById(id: string): LandingPageTemplate | undefined {
  return LANDING_PAGE_TEMPLATES.find(template => template.id === id)
}

export function getTemplatesByCampaignType(campaignType: string): LandingPageTemplate[] {
  return LANDING_PAGE_TEMPLATES.filter(template => 
    template.campaign_types.includes(campaignType)
  )
} 