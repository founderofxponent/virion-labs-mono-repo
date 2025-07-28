import asyncio
import os
from typing import Dict, Any, List

from core.strapi_client import strapi_client
from core.logger import logger

async def migrate_onboarding_flow():
    """
    Migrates onboarding questions from the 'onboarding_flow' JSON field
    to the 'campaign-onboarding-fields' collection in Strapi.
    """
    logger.info("Starting migration of onboarding_flow to campaign-onboarding-fields.")

    try:
        campaigns = await strapi_client.get_campaigns()
        logger.info(f"Found {len(campaigns)} campaigns to process.")

        for campaign in campaigns:
            campaign_id = campaign.get("id")
            onboarding_flow = campaign.get("onboarding_flow")

            if not campaign_id or not onboarding_flow or not isinstance(onboarding_flow, list):
                logger.info(f"Skipping campaign {campaign_id or 'Unknown'}: No valid onboarding_flow found.")
                continue

            logger.info(f"Processing campaign {campaign_id} with {len(onboarding_flow)} onboarding questions.")

            # To make this script idempotent, we'll fetch existing fields for this campaign first.
            existing_fields = await strapi_client.get_onboarding_fields(campaign_id)
            existing_field_keys = {field.get("field_key") for field in existing_fields}

            for index, question in enumerate(onboarding_flow):
                field_key = question.get("id") # Assuming the 'id' in the JSON is the unique key
                if not field_key:
                    logger.warning(f"Skipping question in campaign {campaign_id} due to missing 'id'.")
                    continue

                if field_key in existing_field_keys:
                    logger.info(f"Skipping question '{field_key}' for campaign {campaign_id} as it already exists.")
                    continue

                # Map the old JSON structure to the new content type schema
                field_data = {
                    "field_key": field_key,
                    "field_label": question.get("question", ""),
                    "field_type": question.get("type", "text"),
                    "field_placeholder": question.get("placeholder", ""),
                    "field_description": question.get("description", ""),
                    "field_options": question.get("options", []),
                    "is_required": question.get("required", False),
                    "sort_order": index,
                    "campaign": campaign_id
                }

                try:
                    await strapi_client.create_onboarding_field(campaign_id, field_data)
                    logger.info(f"Successfully created onboarding field '{field_key}' for campaign {campaign_id}.")
                except Exception as e:
                    logger.error(f"Failed to create onboarding field '{field_key}' for campaign {campaign_id}: {e}")

    except Exception as e:
        logger.error(f"An error occurred during the migration: {e}")

    logger.info("Migration script finished.")

if __name__ == "__main__":
    asyncio.run(migrate_onboarding_flow())