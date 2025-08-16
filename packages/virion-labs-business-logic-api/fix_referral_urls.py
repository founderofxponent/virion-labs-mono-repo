#!/usr/bin/env python3
"""
Script to fix referral URLs in the database that were created with localhost URLs.
This script will update all referral links to use the correct production domain.
"""

import asyncio
import logging
from typing import List
from core.config import settings
from core.strapi_client import strapi_client
from schemas.strapi import ReferralLink, StrapiReferralLinkUpdate

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def fix_referral_urls():
    """Fix all referral URLs that contain localhost."""
    try:
        logger.info("Starting referral URL fix process...")
        logger.info(f"Current REFERRAL_BASE_URL: {settings.REFERRAL_BASE_URL}")
        
        # Get all referral links
        logger.info("Fetching all referral links...")
        all_links = await strapi_client.get_referral_links()
        logger.info(f"Found {len(all_links)} referral links")
        
        # Filter links that need to be updated (contain localhost)
        localhost_links = [
            link for link in all_links 
            if link.referral_url and "localhost" in link.referral_url.lower()
        ]
        
        logger.info(f"Found {len(localhost_links)} links with localhost URLs that need to be fixed")
        
        if not localhost_links:
            logger.info("No localhost URLs found. All links are already correct!")
            return
        
        # Show examples of what will be changed
        logger.info("Examples of URLs that will be changed:")
        for i, link in enumerate(localhost_links[:5]):  # Show first 5 examples
            # Extract referral code from existing URL
            old_url = link.referral_url
            # Extract the referral code (everything after the last '/')
            referral_code = old_url.split('/')[-1] if '/' in old_url else old_url
            new_url = f"{settings.REFERRAL_BASE_URL}/{referral_code}"
            logger.info(f"  {i+1}. '{old_url}' -> '{new_url}'")
        
        if len(localhost_links) > 5:
            logger.info(f"  ... and {len(localhost_links) - 5} more")
        
        # Ask for confirmation (in production, you might want to skip this)
        print(f"\nThis will update {len(localhost_links)} referral links.")
        print("Are you sure you want to proceed? (y/N): ", end="")
        response = input().strip().lower()
        
        if response != 'y':
            logger.info("Operation cancelled by user")
            return
        
        # Update each link
        updated_count = 0
        failed_count = 0
        
        for link in localhost_links:
            try:
                # Extract referral code from existing URL
                old_url = link.referral_url
                referral_code = old_url.split('/')[-1] if '/' in old_url else old_url
                
                # Generate new URL using current settings
                new_url = f"{settings.REFERRAL_BASE_URL}/{referral_code}"
                
                # Update the link
                update_data = StrapiReferralLinkUpdate(referral_url=new_url)
                await strapi_client.update_referral_link(link.documentId, update_data)
                
                logger.info(f"Updated link {link.id}: '{old_url}' -> '{new_url}'")
                updated_count += 1
                
            except Exception as e:
                logger.error(f"Failed to update link {link.id}: {str(e)}")
                failed_count += 1
        
        # Summary
        logger.info(f"Update complete!")
        logger.info(f"Successfully updated: {updated_count} links")
        if failed_count > 0:
            logger.warning(f"Failed to update: {failed_count} links")
        
        logger.info("All referral URLs have been fixed!")
        
    except Exception as e:
        logger.error(f"Error in fix_referral_urls: {str(e)}")
        raise

async def preview_changes():
    """Preview what changes would be made without actually updating."""
    try:
        logger.info("Previewing referral URL changes...")
        logger.info(f"Current REFERRAL_BASE_URL: {settings.REFERRAL_BASE_URL}")
        
        # Get all referral links
        all_links = await strapi_client.get_referral_links()
        logger.info(f"Found {len(all_links)} total referral links")
        
        # Filter links that need to be updated
        localhost_links = [
            link for link in all_links 
            if link.referral_url and "localhost" in link.referral_url.lower()
        ]
        
        logger.info(f"Found {len(localhost_links)} links with localhost URLs")
        
        if not localhost_links:
            logger.info("No localhost URLs found. All links are already correct!")
            return
        
        # Show all changes that would be made
        logger.info("URLs that would be changed:")
        for i, link in enumerate(localhost_links):
            old_url = link.referral_url
            referral_code = old_url.split('/')[-1] if '/' in old_url else old_url
            new_url = f"{settings.REFERRAL_BASE_URL}/{referral_code}"
            logger.info(f"  {i+1}. Link ID {link.id} (Title: {link.title})")
            logger.info(f"      Old: '{old_url}'")
            logger.info(f"      New: '{new_url}'")
            logger.info("")
        
    except Exception as e:
        logger.error(f"Error in preview_changes: {str(e)}")
        raise

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "preview":
        # Run preview mode
        asyncio.run(preview_changes())
    else:
        # Run actual fix
        asyncio.run(fix_referral_urls())