# Virion Labs Email Templates

This directory contains custom branded email templates for Supabase Auth flows.

## Available Templates

### 1. Confirmation Email (`confirmation.html`)
- **Used for**: Email verification when users sign up
- **Supabase Template**: "Confirm signup"
- **Subject**: "Confirm Your Email - Virion Labs"

## How to Install Templates in Supabase

### Method 1: Via Supabase Dashboard (Recommended)

1. **Go to the Email Templates page:**
   - Open your Supabase project dashboard
   - Navigate to **Authentication** → **Email Templates**
   - Or go directly to: `https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/auth/templates`

2. **Configure the Confirmation Email:**
   - Click on the **"Confirm signup"** template
   - Copy the entire contents of `confirmation.html` from this directory
   - Paste it into the **"Message Body (HTML)"** field
   - Update the **Subject** to: `Confirm Your Email - Virion Labs`
   - Click **Save**

3. **Configure the Site URL:**
   - Go to **Authentication** → **URL Configuration**
   - Set **Site URL** to your production domain (e.g., `https://your-domain.com`)
   - Add your confirmation callback URL to **Redirect URLs**: `https://your-domain.com/auth/confirm`

### Method 2: Via Management API

You can also update templates programmatically using the Supabase Management API:

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

# Update the confirmation email template
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_subjects_confirmation": "Confirm Your Email - Virion Labs",
    "mailer_templates_confirmation_content": "<!-- Paste the HTML content here -->"
  }'
```

## Enable Email Confirmation

To enable email confirmation for new signups:

1. **Via Dashboard:**
   - Go to **Authentication** → **Settings**
   - Under **User Signups**, enable **"Confirm email"**
   - Save the changes

2. **Via Management API:**
   ```bash
   curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
     -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"external_email_enabled": true, "mailer_autoconfirm": false}'
   ```

## Template Variables

The templates use the following Supabase variables:

- `{{ .Email }}` - User's email address
- `{{ .ConfirmationURL }}` - Full confirmation URL with token
- `{{ .Token }}` - 6-digit OTP code (alternative to URL)
- `{{ .TokenHash }}` - Hashed token for custom URLs
- `{{ .SiteURL }}` - Your configured site URL
- `{{ .Data }}` - User metadata from signup

## Customization

To customize the templates:

1. **Branding**: Update the logo, colors, and styling in the `<style>` section
2. **Content**: Modify the welcome message and instructions
3. **URLs**: Update footer links to match your actual pages
4. **Contact**: Change support email from `support@virionlabs.com` to your actual support email

## Testing

To test the email templates:

1. Sign up a new user with email confirmation enabled
2. Check the email content and styling
3. Verify that the confirmation link works correctly
4. Test the 6-digit OTP code as an alternative

## Mobile Compatibility

The templates are designed to be mobile-responsive and include:
- Responsive CSS for mobile devices
- Touch-friendly button sizes
- Readable text at all screen sizes
- Proper viewport meta tag

## Security Considerations

- Confirmation links expire in 24 hours
- OTP codes are 6 digits and single-use
- Templates include security notices to users
- Links use HTTPS for secure transmission

## Troubleshooting

**Email not sending?**
- Check that SMTP is configured in your Supabase project
- Verify that email confirmation is enabled
- Check the Supabase logs for delivery errors

**Styling issues?**
- Some email clients strip CSS; the templates use inline styles where needed
- Test in multiple email clients (Gmail, Outlook, Apple Mail)

**Links not working?**
- Verify your Site URL and Redirect URLs are correctly configured
- Check that the confirmation endpoint (`/auth/confirm`) exists in your app

## Production Deployment

Before going to production:

1. ✅ Enable email confirmation in Supabase
2. ✅ Configure custom SMTP provider (not Supabase's development SMTP)
3. ✅ Update Site URL to production domain
4. ✅ Add production redirect URLs
5. ✅ Test email delivery and confirmation flow
6. ✅ Update support email in templates
7. ✅ Verify all footer links work correctly 