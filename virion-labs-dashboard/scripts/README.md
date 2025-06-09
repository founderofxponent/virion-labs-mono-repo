# Scripts Directory

This directory contains utility scripts for managing the Virion Labs dashboard.

## Admin Management

### Adding Admin Users

The `add-admin.ts` script allows you to create admin users for the dashboard. Since the signup page only allows influencer registration, this script provides a way to create admin accounts with full access.

#### Prerequisites

1. Make sure you have the required environment variables set in your `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

#### Usage

```bash
npm run script:add-admin <email> <password> <full_name>
```

#### Examples

```bash
# Create an admin with simple name
npm run script:add-admin admin@virionlabs.com SecurePassword123 "Admin User"

# Create an admin with complex name (use quotes)
npm run script:add-admin john.doe@company.com MyPassword456 "John Doe"
```

#### What the script does:

1. **Validates inputs** - Checks email format, password length, and name requirements
2. **Checks for existing users** - Prevents duplicate accounts
3. **Creates auth user** - Creates the user in Supabase Auth with auto-confirmed email
4. **Creates user profile** - Adds user to `user_profiles` table with `admin` role
5. **Verifies creation** - Confirms the admin user was created successfully

#### Requirements:

- **Email**: Must be a valid email address
- **Password**: Minimum 6 characters
- **Full Name**: Minimum 2 characters (use quotes if it contains spaces)

#### Features:

- ✅ Auto-confirms email for admin users (no verification needed)
- ✅ Prevents duplicate admin creation
- ✅ Validates all inputs before processing
- ✅ Provides detailed feedback and error messages
- ✅ Cleans up on failure (removes auth user if profile creation fails)

#### Security Notes:

- The script uses the Supabase service role key for admin operations
- Admin users have full access to all dashboard features
- Consider setting up 2FA for admin accounts after creation
- Store admin credentials securely

## Other Scripts

### Database Seeding

- `seed-data.ts` - Seeds the database with initial data

### Testing & Validation

- `test-unified-data.js` - Tests unified data systems
- `validate-tracking-pipeline.js` - Validates tracking pipeline functionality

### Database Optimization

- `optimize-database.sql` - SQL script for database optimization

## Environment Variables

Make sure the following environment variables are set:

```env
# Required for all scripts
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional (for specific scripts)
SUPABASE_ANON_KEY=your_anon_key
DATABASE_URL=your_database_url
```

## Troubleshooting

### Common Issues

1. **"Missing environment variables"**
   - Ensure `.env.local` file exists in the dashboard root
   - Check that all required variables are set

2. **"User already exists"**
   - The email is already registered
   - Use a different email or update the existing user manually

3. **"Permission denied"**
   - Check that the service role key is correct
   - Verify Supabase project settings

4. **"ts-node command not found"**
   - Run `npm install` to install dev dependencies
   - Ensure ts-node is installed: `npm install -D ts-node`

### Getting Help

If you encounter issues:

1. Check the error messages - they usually indicate the specific problem
2. Verify your environment variables are correct
3. Ensure your Supabase project is properly configured
4. Check the Supabase dashboard for any auth or database issues

## Security Best Practices

- Never commit `.env.local` or environment files to version control
- Rotate your service role key regularly
- Use strong passwords for admin accounts
- Enable 2FA for admin users when possible
- Monitor admin access logs 