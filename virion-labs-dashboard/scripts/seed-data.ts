import { supabase } from '../lib/supabase'

async function seedData() {
  try {
    console.log('Starting to seed data...')

    // Get the influencer user ID (John Doe)
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .eq('role', 'influencer')

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return
    }

    if (users.length === 0) {
      console.log('No influencer users found. Please create an influencer user first.')
      return
    }

    const influencerId = users[0].id
    console.log('Found influencer:', users[0].email)

    // Check if data already exists
    const { data: existingLinks } = await supabase
      .from('referral_links')
      .select('id')
      .eq('influencer_id', influencerId)

    if (existingLinks && existingLinks.length > 0) {
      console.log('Sample data already exists. Skipping seed.')
      return
    }

    // Create sample referral links
    const sampleLinks = [
      {
        influencer_id: influencerId,
        title: 'Gaming Setup Tour 2024',
        description: 'Complete gaming setup breakdown with all my favorite peripherals',
        platform: 'TikTok',
        original_url: 'https://bestbuy.com/site/gaming-chair-deluxe',
        referral_code: 'gaming-setup-ghi789',
        referral_url: 'https://ref.virionlabs.com/gaming-setup-ghi789',
        thumbnail_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
        clicks: 2161,
        conversions: 237,
        earnings: 1185.00,
        is_active: true,
        expires_at: '2024-12-31T23:59:59Z',
        created_at: '2024-01-10T16:20:00Z'
      },
      {
        influencer_id: influencerId,
        title: 'Best Skincare Routine 2024',
        description: 'The skincare products that changed my life - full routine breakdown',
        platform: 'Instagram',
        original_url: 'https://sephora.com/product/retinol-serum-P12345',
        referral_code: 'skincare-routine-def456',
        referral_url: 'https://ref.virionlabs.com/skincare-routine-def456',
        thumbnail_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
        clicks: 896,
        conversions: 157,
        earnings: 785.00,
        is_active: true,
        created_at: '2024-01-20T09:15:00Z'
      },
      {
        influencer_id: influencerId,
        title: 'Summer Tech Gadgets Review',
        description: 'My honest review of the latest tech gadgets for summer 2024',
        platform: 'YouTube',
        original_url: 'https://amazon.com/dp/B08N5WRWNW',
        referral_code: 'summer-tech-gadgets-abc123',
        referral_url: 'https://ref.virionlabs.com/summer-tech-gadgets-abc123',
        thumbnail_url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400',
        clicks: 1250,
        conversions: 91,
        earnings: 455.50,
        is_active: true,
        expires_at: '2024-08-31T23:59:59Z',
        created_at: '2024-01-15T10:30:00Z'
      }
    ]

    const { data: insertedLinks, error: linksError } = await supabase
      .from('referral_links')
      .insert(sampleLinks)
      .select()

    if (linksError) {
      console.error('Error inserting links:', linksError)
      return
    }

    console.log(`Inserted ${insertedLinks.length} referral links`)

    // Create sample referrals
    const sampleReferrals = [
      {
        influencer_id: influencerId,
        referral_link_id: insertedLinks[0].id,
        name: 'Mike Johnson',
        email: 'mike.j.gamer@yahoo.com',
        discord_id: 'mikej#9012',
        age: 28,
        status: 'completed',
        source_platform: 'TikTok',
        conversion_value: 5.00,
        metadata: {
          interests: ['gaming', 'esports'],
          signup_source: 'gaming_setup_video'
        },
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      {
        influencer_id: influencerId,
        referral_link_id: insertedLinks[0].id,
        name: 'Emma Wilson',
        email: 'emma.wilson.games@gmail.com',
        discord_id: 'emmaw#3456',
        age: 26,
        status: 'active',
        source_platform: 'TikTok',
        conversion_value: 0.00,
        metadata: {
          interests: ['gaming', 'content_creation'],
          signup_source: 'gaming_setup_video'
        },
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        influencer_id: influencerId,
        referral_link_id: insertedLinks[2].id,
        name: 'David Kim',
        email: 'david.kim.tech@gmail.com',
        discord_id: 'davidk#7890',
        age: 30,
        status: 'completed',
        source_platform: 'YouTube',
        conversion_value: 5.00,
        metadata: {
          interests: ['technology', 'gadgets'],
          signup_source: 'tech_review_video'
        },
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
      },
      {
        influencer_id: influencerId,
        referral_link_id: insertedLinks[1].id,
        name: 'Sarah Martinez',
        email: 'sarah.martinez.beauty@gmail.com',
        discord_id: 'sarahm#1234',
        age: 24,
        status: 'active',
        source_platform: 'Instagram',
        conversion_value: 0.00,
        metadata: {
          interests: ['beauty', 'skincare'],
          signup_source: 'skincare_routine_post'
        },
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
      }
    ]

    const { data: insertedReferrals, error: referralsError } = await supabase
      .from('referrals')
      .insert(sampleReferrals)
      .select()

    if (referralsError) {
      console.error('Error inserting referrals:', referralsError)
      return
    }

    console.log(`Inserted ${insertedReferrals.length} referrals`)
    console.log('Sample data seeded successfully!')

  } catch (error) {
    console.error('Error seeding data:', error)
  }
}

// Run the seed function if this script is executed directly
if (require.main === module) {
  seedData()
}

export { seedData } 