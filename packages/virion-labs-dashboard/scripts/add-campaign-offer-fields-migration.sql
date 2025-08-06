-- Migration: Add offer/product fields to discord_guild_campaigns table
-- Simple fields to show more details about campaigns without complex configuration

-- Add offer/product information fields
ALTER TABLE discord_guild_campaigns ADD COLUMN IF NOT EXISTS
  offer_title TEXT,
  offer_description TEXT,
  offer_highlights TEXT[],
  offer_value TEXT,
  offer_expiry_date TIMESTAMP WITH TIME ZONE;

-- Add visual content fields  
ALTER TABLE discord_guild_campaigns ADD COLUMN IF NOT EXISTS
  hero_image_url TEXT,
  product_images TEXT[],
  video_url TEXT;

-- Add additional detail fields
ALTER TABLE discord_guild_campaigns ADD COLUMN IF NOT EXISTS
  what_you_get TEXT,
  how_it_works TEXT,
  requirements TEXT,
  support_info TEXT;

-- Add comments for documentation
COMMENT ON COLUMN discord_guild_campaigns.offer_title IS 'Title of the product/offer being promoted';
COMMENT ON COLUMN discord_guild_campaigns.offer_description IS 'Detailed description of the offer';
COMMENT ON COLUMN discord_guild_campaigns.offer_highlights IS 'Array of key selling points/benefits';
COMMENT ON COLUMN discord_guild_campaigns.offer_value IS 'Value proposition (e.g., "$99 value", "50% off")';
COMMENT ON COLUMN discord_guild_campaigns.offer_expiry_date IS 'When the offer expires (optional)';
COMMENT ON COLUMN discord_guild_campaigns.hero_image_url IS 'Main hero image for the landing page';
COMMENT ON COLUMN discord_guild_campaigns.product_images IS 'Array of product preview image URLs';
COMMENT ON COLUMN discord_guild_campaigns.video_url IS 'YouTube/Vimeo video URL for product demo';
COMMENT ON COLUMN discord_guild_campaigns.what_you_get IS 'Detailed explanation of what users receive';
COMMENT ON COLUMN discord_guild_campaigns.how_it_works IS 'Step-by-step process explanation';
COMMENT ON COLUMN discord_guild_campaigns.requirements IS 'Prerequisites or requirements';
COMMENT ON COLUMN discord_guild_campaigns.support_info IS 'Contact information or support details'; 