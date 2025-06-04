#!/usr/bin/env ts-node

/**
 * Admin Creation Script
 * 
 * This script allows you to create admin users for the Virion Labs dashboard.
 * It creates a user in Supabase auth and sets their role to 'admin' in the user_profiles table.
 * 
 * Usage:
 *   npm run script:add-admin <email> <password> <full_name>
 *   
 * Example:
 *   npm run script:add-admin admin@virionlabs.com SecurePassword123 "Admin User"
 */

import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nPlease make sure these are set in your .env.local file.')
  process.exit(1)
}

// Create Supabase client with service role key (admin permissions)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface CreateAdminParams {
  email: string
  password: string
  fullName: string
}

async function createAdmin({ email, password, fullName }: CreateAdminParams) {
  console.log('🔧 Creating admin user...')
  console.log(`📧 Email: ${email}`)
  console.log(`👤 Name: ${fullName}`)
  console.log('---')

  try {
    // Step 1: Create user in Supabase Auth
    console.log('1️⃣ Creating user in Supabase Auth...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName,
        role: 'admin'
      },
      email_confirm: true // Auto-confirm email for admin users
    })

    if (authError) {
      console.error('❌ Failed to create user in Auth:', authError.message)
      return false
    }

    if (!authData.user) {
      console.error('❌ No user data returned from Auth')
      return false
    }

    console.log('✅ User created in Auth with ID:', authData.user.id)

    // Step 2: Create or update user profile with admin role
    console.log('2️⃣ Creating user profile with admin role...')
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
        role: 'admin',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('❌ Failed to create user profile:', profileError.message)
      // Try to clean up the auth user if profile creation failed
      await supabase.auth.admin.deleteUser(authData.user.id)
      return false
    }

    console.log('✅ User profile created with admin role')

    // Step 3: Verify the user was created correctly
    console.log('3️⃣ Verifying admin user...')
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (fetchError || !profile) {
      console.error('❌ Failed to verify user profile:', fetchError?.message)
      return false
    }

    console.log('✅ Admin user verified successfully!')
    console.log('---')
    console.log('📊 Admin User Details:')
    console.log(`   ID: ${profile.id}`)
    console.log(`   Email: ${profile.email}`)
    console.log(`   Name: ${profile.full_name}`)
    console.log(`   Role: ${profile.role}`)
    console.log(`   Created: ${profile.created_at}`)
    console.log('---')
    console.log('🎉 Admin user created successfully!')
    console.log('💡 The admin can now log in to the dashboard with the provided credentials.')

    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Virion Labs Admin Creation Script')
  console.log('====================================\n')

  // Parse command line arguments
  const args = process.argv.slice(2)
  
  if (args.length !== 3) {
    console.error('❌ Invalid arguments provided.')
    console.error('\nUsage:')
    console.error('  npm run script:add-admin <email> <password> <full_name>')
    console.error('\nExample:')
    console.error('  npm run script:add-admin admin@virionlabs.com SecurePassword123 "Admin User"')
    console.error('\nRequired arguments:')
    console.error('  email     - Admin email address')
    console.error('  password  - Admin password (min 6 characters)')
    console.error('  full_name - Admin full name (use quotes if it contains spaces)')
    process.exit(1)
  }

  const [email, password, fullName] = args

  // Basic validation
  if (!email.includes('@')) {
    console.error('❌ Invalid email address provided')
    process.exit(1)
  }

  if (password.length < 6) {
    console.error('❌ Password must be at least 6 characters long')
    process.exit(1)
  }

  if (fullName.length < 2) {
    console.error('❌ Full name must be at least 2 characters long')
    process.exit(1)
  }

  // Check if user already exists
  console.log('🔍 Checking if user already exists...')
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('email, role')
    .eq('email', email)
    .single()

  if (existingProfile) {
    console.log(`⚠️  User with email ${email} already exists with role: ${existingProfile.role}`)
    
    if (existingProfile.role === 'admin') {
      console.log('✅ User is already an admin. No action needed.')
      process.exit(0)
    } else {
      console.log('❓ Do you want to update their role to admin? (This cannot be undone)')
      console.log('   To proceed manually, update the user_profiles table in your database.')
      process.exit(1)
    }
  }

  // Create the admin user
  const success = await createAdmin({ email, password, fullName })
  
  if (success) {
    console.log('\n🎯 Next Steps:')
    console.log('1. The admin can now log in at: [your-dashboard-url]/login')
    console.log('2. Admin users have full access to all features')
    console.log('3. Consider setting up 2FA for enhanced security')
    process.exit(0)
  } else {
    console.log('\n❌ Failed to create admin user. Please check the errors above.')
    process.exit(1)
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error)
  process.exit(1)
})

// Run the script
if (require.main === module) {
  main()
} 