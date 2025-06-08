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
    id: "software-trial",
    name: "Software Free Trial",
    description: "Perfect for SaaS products offering free trials or demos",
    preview_image: "/templates/software-trial.png",
    campaign_types: ["product_promotion", "referral_onboarding"],
    fields: {
      offer_title: "Get 30 Days Free Access",
      offer_description: "Experience our powerful platform with full features unlocked for 30 days. No credit card required.",
      offer_highlights: [
        "Full feature access for 30 days",
        "No credit card required",
        "24/7 customer support included",
        "Easy setup in under 5 minutes"
      ],
      offer_value: "Worth $99/month - Yours FREE",
      what_you_get: "Complete access to our premium dashboard, advanced analytics, team collaboration tools, and priority support. Perfect for testing all features before committing.",
      how_it_works: "1. Click the referral link to sign up\n2. Verify your email address\n3. Complete the quick onboarding\n4. Start using all premium features immediately",
      requirements: "Valid email address and agreement to our Terms of Service",
      support_info: "Need help? Contact our support team 24/7 at support@company.com or through our live chat."
    }
  },
  {
    id: "discount-offer",
    name: "Discount & Savings",
    description: "Great for product promotions with percentage or dollar discounts",
    preview_image: "/templates/discount-offer.png",
    campaign_types: ["product_promotion", "community_engagement"],
    fields: {
      offer_title: "Save 50% on Your First Purchase",
      offer_description: "Limited time exclusive discount for community members. Get premium quality at an unbeatable price.",
      offer_highlights: [
        "50% off regular price",
        "Limited time offer",
        "Free shipping included",
        "30-day money-back guarantee"
      ],
      offer_value: "Save $50+ on premium items",
      what_you_get: "Premium products at half price, free shipping to your door, and our satisfaction guarantee. Perfect opportunity to try our best-sellers.",
      how_it_works: "1. Use your exclusive referral code at checkout\n2. Discount automatically applied\n3. Choose from our full product range\n4. Enjoy free shipping on all orders",
      requirements: "Valid during promotional period only. One use per customer.",
      support_info: "Questions about your order? Reach us at orders@company.com or call 1-800-SUPPORT"
    }
  },
  {
    id: "community-access",
    name: "Exclusive Community Access",
    description: "For Discord servers, forums, or private communities",
    preview_image: "/templates/community-access.png",
    campaign_types: ["community_engagement", "referral_onboarding"],
    fields: {
      offer_title: "Join Our VIP Community",
      offer_description: "Get exclusive access to our private community where industry experts share insights, tips, and network with like-minded professionals.",
      offer_highlights: [
        "Exclusive member-only content",
        "Direct access to industry experts",
        "Weekly live Q&A sessions",
        "Private networking opportunities"
      ],
      offer_value: "Usually $29/month - FREE for referrals",
      what_you_get: "Access to premium discussions, expert AMA sessions, exclusive resources, job board, and networking events. Connect with 500+ professionals in your field.",
      how_it_works: "1. Join through your referral link\n2. Complete community onboarding\n3. Introduce yourself to the group\n4. Start engaging with premium content",
      requirements: "Professional background in the relevant industry. Respectful participation required.",
      support_info: "Community guidelines and support available at community@company.com"
    }
  },
  {
    id: "course-access",
    name: "Free Course Access",
    description: "Perfect for educational content and online courses",
    preview_image: "/templates/course-access.png",
    campaign_types: ["product_promotion", "referral_onboarding"],
    fields: {
      offer_title: "Unlock Premium Course for FREE",
      offer_description: "Get instant access to our comprehensive course that normally costs $199. Perfect for advancing your skills.",
      offer_highlights: [
        "10+ hours of premium content",
        "Downloadable resources included",
        "Certificate of completion",
        "Lifetime access guaranteed"
      ],
      offer_value: "$199 course completely FREE",
      what_you_get: "Full course access with 10+ video modules, downloadable worksheets, bonus materials, and a certificate upon completion. Learn at your own pace.",
      how_it_works: "1. Sign up through your referral link\n2. Access is granted immediately\n3. Start with Module 1\n4. Complete exercises and earn your certificate",
      requirements: "Basic understanding of the subject matter recommended but not required.",
      support_info: "Course support and technical help available at learn@company.com"
    }
  },
  {
    id: "consultation-booking",
    name: "Free Consultation",
    description: "For service-based businesses offering consultations",
    preview_image: "/templates/consultation-booking.png",
    campaign_types: ["referral_onboarding", "support"],
    fields: {
      offer_title: "Book Your FREE Strategy Session",
      offer_description: "Get personalized advice from our experts in a complimentary 60-minute strategy session worth $200.",
      offer_highlights: [
        "60-minute one-on-one session",
        "Personalized strategy recommendations",
        "Follow-up action plan included",
        "No sales pressure guaranteed"
      ],
      offer_value: "Normally $200 - FREE for you",
      what_you_get: "A full hour with our senior consultant to discuss your specific situation, receive personalized recommendations, and get a custom action plan.",
      how_it_works: "1. Book your session through the referral link\n2. Choose your preferred time slot\n3. Join the video call at scheduled time\n4. Receive your custom action plan",
      requirements: "Serious about implementing recommendations. Please come prepared with specific questions.",
      support_info: "Scheduling questions? Contact us at booking@company.com or call 1-800-CONSULT"
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