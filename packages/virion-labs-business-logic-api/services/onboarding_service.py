from typing import List, Dict, Optional, Any
from fastapi import HTTPException
from core.strapi_client import strapi_client
from domain.onboarding.schemas import (
    CampaignOnboardingStartCreate, CampaignOnboardingStartResponse,
    CampaignOnboardingCompletionCreate, CampaignOnboardingCompletionResponse,
    CampaignOnboardingResponseCreate, CampaignOnboardingResponse
)
from schemas.strapi import (
    StrapiCampaignOnboardingStartCreate,
    StrapiCampaignOnboardingCompletionCreate,
    StrapiCampaignOnboardingResponseCreate
)
from schemas.user_schemas import User
import logging

logger = logging.getLogger(__name__)

class OnboardingService:
    """Service layer for handling campaign onboarding lifecycle events."""

    # --- Enhanced Onboarding with Step Processing ---
    async def process_step_based_onboarding(self, campaign_id: str, user_id: str, responses: Dict[str, Any], current_user: Optional[User] = None) -> Dict[str, Any]:
        """Process step-based onboarding responses with branching logic evaluation."""
        try:
            # Get campaign onboarding fields to understand step structure
            campaign_fields = await strapi_client.get_campaign_onboarding_fields({
                "filters[campaign][id][$eq]": campaign_id,
                "sort[0]": "step_number:asc",
                "sort[1]": "sort_order:asc"
            })
            
            if not campaign_fields:
                raise HTTPException(status_code=404, detail="No onboarding fields found for campaign")
            
            # Group fields by step
            steps = {}
            for field in campaign_fields:
                step_num = field.get('step_number', 1)
                if step_num not in steps:
                    steps[step_num] = []
                steps[step_num].append(field)
            
            # Process responses and determine next step using branching logic
            processed_responses = self._process_response_types(responses, campaign_fields)
            next_step = self._evaluate_branching_logic(processed_responses, campaign_fields)
            
            # Store individual field responses
            for field_key, field_value in processed_responses.items():
                response_data = CampaignOnboardingResponseCreate(
                    campaign=int(campaign_id),
                    discord_user_id=user_id,
                    field_key=field_key,
                    field_value=str(field_value) if field_value is not None else None
                )
                await self.create_onboarding_response(response_data, current_user, user_id)
            
            return {
                "success": True,
                "processed_responses": processed_responses,
                "next_step": next_step,
                "total_steps": len(steps),
                "message": f"Step completed successfully. Next step: {next_step}" if next_step else "Onboarding completed"
            }
            
        except Exception as e:
            logger.error(f"Error processing step-based onboarding: {e}")
            raise HTTPException(status_code=500, detail="Failed to process step-based onboarding")
    
    def _process_response_types(self, responses: Dict[str, Any], campaign_fields: List[Dict]) -> Dict[str, Any]:
        """Convert response values to proper types based on field definitions."""
        processed = {}
        field_map = {field['field_key']: field for field in campaign_fields}
        
        for field_key, value in responses.items():
            field_def = field_map.get(field_key)
            if not field_def:
                processed[field_key] = value
                continue
                
            field_type = field_def.get('field_type', 'text')
            processed[field_key] = self._convert_response_value(value, field_type)
            
        return processed
    
    def _convert_response_value(self, value: Any, field_type: str) -> Any:
        """Convert response value to appropriate type based on field type."""
        if value is None:
            return None
            
        try:
            if field_type == 'boolean':
                if isinstance(value, bool):
                    return value
                return str(value).lower() in ['true', 'yes', '1']
            elif field_type == 'number':
                return float(value) if '.' in str(value) else int(value)
            elif field_type == 'multiselect':
                if isinstance(value, list):
                    return value
                return [item.strip() for item in str(value).split(',') if item.strip()]
            else:
                return str(value)
        except (ValueError, TypeError):
            return value
    
    def _evaluate_branching_logic(self, responses: Dict[str, Any], campaign_fields: List[Dict]) -> Optional[int]:
        """Evaluate branching logic to determine next step using frontend format only."""
        # Check all fields for branching logic
        for field in campaign_fields:
            branching_logic = field.get('branching_logic', [])
            if not branching_logic or not isinstance(branching_logic, list):
                continue
            
            # Process branching rules in priority order
            for rule in sorted(branching_logic, key=lambda x: x.get('priority', 0), reverse=True):
                # Validate rule structure - frontend format only: {condition, actions: {set_next_step: {step_number}}}
                if (not rule.get('condition') or 
                    not rule.get('actions') or 
                    not rule.get('actions', {}).get('set_next_step') or
                    'step_number' not in rule.get('actions', {}).get('set_next_step', {})):
                    logger.warning(f'Invalid branching rule format - skipping: {rule}')
                    continue
                    
                condition = rule['condition']
                if self._evaluate_condition(responses, condition):
                    next_step = rule['actions']['set_next_step']['step_number']
                    logger.info(f'Branching rule matched: {rule.get("id", "unnamed")} -> next step: {next_step}')
                    return next_step
        
        return None  # Continue to next sequential step
    
    def _evaluate_condition(self, responses: Dict[str, Any], condition: Dict[str, Any]) -> bool:
        """
        Enhanced evaluates a single branching condition with support for advanced operators.
        
        Supported operators:
        - Basic: equals, not_equals, contains, not_contains, empty, not_empty
        - Numeric: greater_than, less_than, greater_than_or_equal, less_than_or_equal, between, not_between
        - String: starts_with, ends_with, matches_regex
        - List: in_list, not_in_list, array_contains, array_length_equals
        - Date: before_date, after_date, between_dates
        """
        import re
        from datetime import datetime, date
        
        field_key = condition.get('field_key')
        operator = condition.get('operator')
        condition_value = condition.get('value')
        case_sensitive = condition.get('case_sensitive', False)

        if not field_key or not operator:
            return False

        field_value = responses.get(field_key)
        string_value = str(field_value or '')
        
        # Handle case sensitivity for string comparisons
        if not case_sensitive and isinstance(field_value, str):
            string_value = string_value.lower()
            if isinstance(condition_value, str):
                condition_value = condition_value.lower()
        
        # Parse numeric value
        numeric_value = None
        try:
            numeric_value = float(field_value) if field_value is not None else None
        except (ValueError, TypeError):
            pass

        # Parse date value
        date_value = None
        try:
            if isinstance(field_value, str) and field_value:
                # Try common date formats
                for fmt in ['%Y-%m-%d', '%Y-%m-%d %H:%M:%S', '%d/%m/%Y', '%m/%d/%Y']:
                    try:
                        date_value = datetime.strptime(field_value, fmt).date()
                        break
                    except ValueError:
                        continue
            elif isinstance(field_value, (datetime, date)):
                date_value = field_value.date() if isinstance(field_value, datetime) else field_value
        except (ValueError, TypeError):
            pass

        # Basic operators
        if operator == 'equals':
            return string_value == str(condition_value)

        elif operator == 'not_equals':
            return string_value != str(condition_value)

        elif operator == 'contains':
            return str(condition_value) in string_value

        elif operator == 'not_contains':
            return str(condition_value) not in string_value

        elif operator == 'empty':
            return string_value.strip() == ''

        elif operator == 'not_empty':
            return string_value.strip() != ''

        # String operators
        elif operator == 'starts_with':
            return string_value.startswith(str(condition_value))

        elif operator == 'ends_with':
            return string_value.endswith(str(condition_value))

        elif operator == 'matches_regex':
            try:
                pattern = condition_value
                flags = 0 if case_sensitive else re.IGNORECASE
                return bool(re.search(pattern, string_value, flags))
            except re.error:
                logger.warning(f"Invalid regex pattern: {condition_value}")
                return False

        # Numeric operators
        elif operator == 'greater_than':
            if numeric_value is not None:
                try:
                    return numeric_value > float(condition_value)
                except (ValueError, TypeError):
                    return False
            return False

        elif operator == 'less_than':
            if numeric_value is not None:
                try:
                    return numeric_value < float(condition_value)
                except (ValueError, TypeError):
                    return False
            return False

        elif operator == 'greater_than_or_equal':
            if numeric_value is not None:
                try:
                    return numeric_value >= float(condition_value)
                except (ValueError, TypeError):
                    return False
            return False

        elif operator == 'less_than_or_equal':
            if numeric_value is not None:
                try:
                    return numeric_value <= float(condition_value)
                except (ValueError, TypeError):
                    return False
            return False

        elif operator == 'between':
            if numeric_value is not None and isinstance(condition_value, (list, tuple)) and len(condition_value) == 2:
                try:
                    min_val, max_val = float(condition_value[0]), float(condition_value[1])
                    return min_val <= numeric_value <= max_val
                except (ValueError, TypeError):
                    return False
            return False

        elif operator == 'not_between':
            if numeric_value is not None and isinstance(condition_value, (list, tuple)) and len(condition_value) == 2:
                try:
                    min_val, max_val = float(condition_value[0]), float(condition_value[1])
                    return not (min_val <= numeric_value <= max_val)
                except (ValueError, TypeError):
                    return False
            return False

        # List/Array operators
        elif operator == 'in_list':
            if isinstance(condition_value, (list, tuple)):
                return field_value in condition_value or string_value in [str(v) for v in condition_value]
            return False

        elif operator == 'not_in_list':
            if isinstance(condition_value, (list, tuple)):
                return field_value not in condition_value and string_value not in [str(v) for v in condition_value]
            return True

        elif operator == 'array_contains':
            if isinstance(field_value, (list, tuple)):
                return condition_value in field_value
            return False

        elif operator == 'array_length_equals':
            if isinstance(field_value, (list, tuple)):
                try:
                    return len(field_value) == int(condition_value)
                except (ValueError, TypeError):
                    return False
            return False

        # Date operators
        elif operator == 'before_date':
            if date_value:
                try:
                    target_date = datetime.strptime(str(condition_value), '%Y-%m-%d').date()
                    return date_value < target_date
                except ValueError:
                    return False
            return False

        elif operator == 'after_date':
            if date_value:
                try:
                    target_date = datetime.strptime(str(condition_value), '%Y-%m-%d').date()
                    return date_value > target_date
                except ValueError:
                    return False
            return False

        elif operator == 'between_dates':
            if date_value and isinstance(condition_value, (list, tuple)) and len(condition_value) == 2:
                try:
                    start_date = datetime.strptime(str(condition_value[0]), '%Y-%m-%d').date()
                    end_date = datetime.strptime(str(condition_value[1]), '%Y-%m-%d').date()
                    return start_date <= date_value <= end_date
                except ValueError:
                    return False
            return False

        else:
            logger.warning(f"Unknown condition operator: {operator}")
            return False

    # --- Onboarding Start ---
    async def create_onboarding_start(self, start_data: CampaignOnboardingStartCreate, current_user: User) -> CampaignOnboardingStartResponse:
        """Handles the business logic for creating an onboarding start event."""
        try:
            strapi_data = StrapiCampaignOnboardingStartCreate(**start_data.model_dump())
            created_event = await strapi_client.create_onboarding_start(strapi_data)
            return CampaignOnboardingStartResponse(**created_event.model_dump())
        except Exception as e:
            logger.error(f"Error creating onboarding start event: {e}")
            raise HTTPException(status_code=500, detail="Failed to create onboarding start event.")

    async def list_onboarding_starts(self, filters: Optional[Dict], current_user: User) -> List[CampaignOnboardingStartResponse]:
        """Handles the business logic for listing onboarding start events."""
        try:
            events = await strapi_client.get_onboarding_starts(filters)
            return [CampaignOnboardingStartResponse(**event.model_dump()) for event in events]
        except Exception as e:
            logger.error(f"Error listing onboarding start events: {e}")
            raise HTTPException(status_code=500, detail="Failed to list onboarding start events.")

    # --- Onboarding Completion ---
    async def create_onboarding_completion(self, completion_data: CampaignOnboardingCompletionCreate, current_user: User) -> CampaignOnboardingCompletionResponse:
        """Handles the business logic for creating an onboarding completion event."""
        try:
            strapi_data = StrapiCampaignOnboardingCompletionCreate(**completion_data.model_dump())
            created_event = await strapi_client.create_onboarding_completion(strapi_data)
            
            # Track conversion if there's a referral link in the completion data
            await self._track_conversion_if_applicable(completion_data, current_user)
            
            return CampaignOnboardingCompletionResponse(**created_event.model_dump())
        except Exception as e:
            logger.error(f"Error creating onboarding completion event: {e}")
            raise HTTPException(status_code=500, detail="Failed to create onboarding completion event.")

    async def list_onboarding_completions(self, filters: Optional[Dict], current_user: User) -> List[CampaignOnboardingCompletionResponse]:
        """Handles the business logic for listing onboarding completion events."""
        try:
            events = await strapi_client.get_onboarding_completions(filters)
            return [CampaignOnboardingCompletionResponse(**event.model_dump()) for event in events]
        except Exception as e:
            logger.error(f"Error listing onboarding completion events: {e}")
            raise HTTPException(status_code=500, detail="Failed to list onboarding completion events.")

    # --- Onboarding Response ---
    async def create_onboarding_response(self, response_data: CampaignOnboardingResponseCreate, current_user: Optional[User] = None, discord_user_id: Optional[str] = None) -> CampaignOnboardingResponse:
        """Handles the business logic for creating an onboarding response."""
        try:
            if current_user:
                strapi_data = StrapiCampaignOnboardingResponseCreate(**response_data.model_dump())
            else:
                strapi_data = StrapiCampaignOnboardingResponseCreate(**response_data.model_dump(), user=discord_user_id)
            created_response = await strapi_client.create_onboarding_response(strapi_data)
            return CampaignOnboardingResponse(**created_response.model_dump())
        except Exception as e:
            logger.error(f"Error creating onboarding response: {e}")
            raise HTTPException(status_code=500, detail="Failed to create onboarding response.")

    async def list_onboarding_responses(self, filters: Optional[Dict], current_user: User) -> List[CampaignOnboardingResponse]:
        """Handles the business logic for listing onboarding responses."""
        try:
            responses = await strapi_client.get_onboarding_responses(filters)
            return [CampaignOnboardingResponse(**response.model_dump()) for response in responses]
        except Exception as e:
            logger.error(f"Error listing onboarding responses: {e}")
            raise HTTPException(status_code=500, detail="Failed to list onboarding responses.")

    async def _track_conversion_if_applicable(self, completion_data: CampaignOnboardingCompletionCreate, current_user: User):
        """Helper method to track referral conversions when onboarding is completed."""
        try:
            # Check if the completion data includes a referral_link_id
            referral_link_id = getattr(completion_data, 'referral_link_id', None)
            if not referral_link_id:
                logger.info("No referral link associated with onboarding completion, skipping conversion tracking")
                return

            # Get the referral link to find the referral code
            filters = {
                "filters[id][$eq]": referral_link_id,
                "populate[0]": "campaign",
                "populate[1]": "influencer"
            }
            referral_links = await strapi_client.get_referral_links(filters=filters)
            
            if not referral_links:
                logger.warning(f"Referral link with ID {referral_link_id} not found, cannot track conversion")
                return

            referral_link = referral_links[0]
            referral_code = referral_link.referral_code

            # Track the conversion
            current_conversions = referral_link.conversions or 0
            current_earnings = referral_link.earnings or 0.0
            
            # Calculate conversion value (this could be configurable per campaign)
            conversion_value = 10.0  # Default conversion value, should be made configurable
            
            new_conversions = current_conversions + 1
            new_earnings = current_earnings + conversion_value

            # Update the referral link
            from schemas.strapi import StrapiReferralLinkUpdate
            from datetime import datetime
            
            update_data = StrapiReferralLinkUpdate(
                conversions=new_conversions,
                earnings=new_earnings,
                last_conversion_at=datetime.now()
            )

            await strapi_client.update_referral_link(referral_link.id, update_data)
            
            logger.info(f"Conversion tracked for referral code {referral_code}: conversions {current_conversions} -> {new_conversions}, earnings {current_earnings} -> {new_earnings}")

        except Exception as e:
            logger.error(f"Error tracking conversion for onboarding completion: {e}")
            # Don't raise the exception as this shouldn't fail the onboarding completion

# Global instance of the service
onboarding_service = OnboardingService()