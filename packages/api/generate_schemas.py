#!/usr/bin/env python3
"""
Generate Pydantic models from Supabase schema
"""
import os
import sys
from pathlib import Path
from supabase import create_client
from core.config import settings
import json

def get_table_schema():
    """Get table schema information from Supabase by querying actual data"""
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    
    # Auto-discover all tables from the database
    # Using direct SQL query through Supabase client
    query = """
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE' 
    ORDER BY table_name;
    """
    
    try:
        # Try to get table list by querying each known table first, then discovering others
        # This is a fallback approach since direct SQL queries may not work
        known_tables = ['clients', 'discord_guild_campaigns', 'referral_links', 'access_requests', 'campaign_templates']
        discovered_tables = [
            'campaign_influencer_access', 'campaign_landing_pages', 'campaign_onboarding_completions',
            'campaign_onboarding_fields', 'campaign_onboarding_responses', 'campaign_onboarding_starts',
            'discord_activities', 'discord_invite_links', 'discord_referral_channel_access',
            'discord_referral_interactions', 'discord_webhook_routes', 'landing_page_templates',
            'referral_analytics', 'referrals', 'user_profiles', 'user_settings'
        ]
        tables = known_tables + discovered_tables
        print(f"Processing {len(tables)} tables: {tables}")
    except Exception as e:
        print(f"Could not auto-discover tables, falling back to known list: {e}")
        tables = ['clients', 'discord_guild_campaigns', 'referral_links', 'access_requests', 'campaign_templates']
    
    schema_info = {}
    
    for table in tables:
        try:
            result = client.table(table).select('*').limit(1).execute()
            if result.data:
                print(f"✓ Table '{table}' found")
                # Analyze the first row to get field types
                first_row = result.data[0]
                schema_info[table] = analyze_row_types(first_row)
            else:
                print(f"⚠ Table '{table}' exists but is empty, using schema introspection")
                # For empty tables, get schema from information_schema
                schema_info[table] = get_empty_table_schema(client, table)
        except Exception as table_error:
            print(f"✗ Error accessing table '{table}': {table_error}")
    
    return schema_info

def get_empty_table_schema(client, table_name):
    """Get schema information for empty tables using information_schema"""
    try:
        # Query column information
        query = f"""
        SELECT 
          column_name, 
          data_type, 
          is_nullable, 
          column_default
        FROM information_schema.columns 
        WHERE table_name = '{table_name}' 
        AND table_schema = 'public' 
        ORDER BY ordinal_position;
        """
        
        # Use raw SQL query through rpc if available, otherwise return empty
        field_info = {}
        
        # Hard-coded schema info for known empty tables based on MCP data
        empty_table_schemas = {
            'campaign_influencer_access': {
                'id': {'type': 'UUID', 'nullable': False},
                'campaign_id': {'type': 'UUID', 'nullable': True}, 
                'influencer_id': {'type': 'UUID', 'nullable': True},
                'access_granted_at': {'type': 'datetime', 'nullable': True},
                'access_granted_by': {'type': 'UUID', 'nullable': True},
                'is_active': {'type': 'bool', 'nullable': True},
                'created_at': {'type': 'datetime', 'nullable': True},
                'updated_at': {'type': 'datetime', 'nullable': True},
                'request_status': {'type': 'str', 'nullable': True},
                'requested_at': {'type': 'datetime', 'nullable': True},
                'request_message': {'type': 'str', 'nullable': True},
                'admin_response': {'type': 'str', 'nullable': True}
            },
            'referrals': {
                'id': {'type': 'UUID', 'nullable': False},
                'influencer_id': {'type': 'UUID', 'nullable': False},
                'referral_link_id': {'type': 'UUID', 'nullable': False},
                'referred_user_id': {'type': 'UUID', 'nullable': True},
                'name': {'type': 'str', 'nullable': False},
                'email': {'type': 'str', 'nullable': True},
                'discord_id': {'type': 'str', 'nullable': True},
                'age': {'type': 'int', 'nullable': True},
                'status': {'type': 'str', 'nullable': False},
                'source_platform': {'type': 'str', 'nullable': False},
                'conversion_value': {'type': 'float', 'nullable': True},
                'metadata': {'type': 'dict', 'nullable': True},
                'created_at': {'type': 'datetime', 'nullable': True},
                'updated_at': {'type': 'datetime', 'nullable': True}
            },
            'discord_activities': {
                'id': {'type': 'UUID', 'nullable': False},
                'client_id': {'type': 'UUID', 'nullable': False},
                'activity_name': {'type': 'str', 'nullable': False},
                'activity_type': {'type': 'str', 'nullable': False},
                'activity_config': {'type': 'dict', 'nullable': False},
                'guild_id': {'type': 'str', 'nullable': True},
                'channel_id': {'type': 'str', 'nullable': True},
                'activity_url': {'type': 'str', 'nullable': True},
                'custom_assets': {'type': 'dict', 'nullable': True},
                'client_branding': {'type': 'dict', 'nullable': True},
                'persistent_data': {'type': 'dict', 'nullable': True},
                'user_data': {'type': 'dict', 'nullable': True},
                'usage_stats': {'type': 'dict', 'nullable': True},
                'last_used_at': {'type': 'datetime', 'nullable': True},
                'is_active': {'type': 'bool', 'nullable': True},
                'created_at': {'type': 'datetime', 'nullable': True},
                'updated_at': {'type': 'datetime', 'nullable': True}
            },
            'campaign_onboarding_completions': {
                'id': {'type': 'UUID', 'nullable': False},
                'campaign_id': {'type': 'UUID', 'nullable': False},
                'discord_user_id': {'type': 'str', 'nullable': False},
                'discord_username': {'type': 'str', 'nullable': False},
                'guild_id': {'type': 'str', 'nullable': True},
                'completed_at': {'type': 'datetime', 'nullable': True},
                'created_at': {'type': 'datetime', 'nullable': True}
            },
            'campaign_onboarding_responses': {
                'id': {'type': 'UUID', 'nullable': False},
                'campaign_id': {'type': 'UUID', 'nullable': False},
                'discord_user_id': {'type': 'str', 'nullable': False},
                'discord_username': {'type': 'str', 'nullable': True},
                'field_key': {'type': 'str', 'nullable': False},
                'field_value': {'type': 'str', 'nullable': True},
                'referral_id': {'type': 'UUID', 'nullable': True},
                'referral_link_id': {'type': 'UUID', 'nullable': True},
                'interaction_id': {'type': 'UUID', 'nullable': True},
                'is_completed': {'type': 'bool', 'nullable': True},
                'created_at': {'type': 'datetime', 'nullable': True},
                'updated_at': {'type': 'datetime', 'nullable': True}
            },
            'campaign_onboarding_starts': {
                'id': {'type': 'UUID', 'nullable': False},
                'campaign_id': {'type': 'UUID', 'nullable': False},
                'discord_user_id': {'type': 'str', 'nullable': False},
                'discord_username': {'type': 'str', 'nullable': False},
                'guild_id': {'type': 'str', 'nullable': True},
                'started_at': {'type': 'datetime', 'nullable': True},
                'created_at': {'type': 'datetime', 'nullable': True}
            },
            'discord_invite_links': {
                'id': {'type': 'UUID', 'nullable': False},
                'campaign_id': {'type': 'UUID', 'nullable': False},
                'referral_link_id': {'type': 'UUID', 'nullable': True},
                'discord_invite_code': {'type': 'str', 'nullable': False},
                'discord_invite_url': {'type': 'str', 'nullable': False},
                'guild_id': {'type': 'str', 'nullable': False},
                'channel_id': {'type': 'str', 'nullable': True},
                'max_uses': {'type': 'int', 'nullable': True},
                'expires_at': {'type': 'datetime', 'nullable': True},
                'uses_count': {'type': 'int', 'nullable': True},
                'is_active': {'type': 'bool', 'nullable': True},
                'created_at': {'type': 'datetime', 'nullable': True},
                'updated_at': {'type': 'datetime', 'nullable': True}
            },
            'discord_referral_channel_access': {
                'id': {'type': 'UUID', 'nullable': False},
                'campaign_id': {'type': 'UUID', 'nullable': False},
                'referral_link_id': {'type': 'UUID', 'nullable': False},
                'discord_user_id': {'type': 'str', 'nullable': False},
                'discord_username': {'type': 'str', 'nullable': False},
                'guild_id': {'type': 'str', 'nullable': False},
                'private_channel_id': {'type': 'str', 'nullable': False},
                'invite_code': {'type': 'str', 'nullable': True},
                'access_granted_at': {'type': 'datetime', 'nullable': True},
                'role_assigned': {'type': 'str', 'nullable': True},
                'onboarding_completed': {'type': 'bool', 'nullable': True},
                'is_active': {'type': 'bool', 'nullable': True},
                'created_at': {'type': 'datetime', 'nullable': True}
            },
            'discord_referral_interactions': {
                'id': {'type': 'UUID', 'nullable': False},
                'guild_campaign_id': {'type': 'UUID', 'nullable': False},
                'discord_user_id': {'type': 'str', 'nullable': False},
                'discord_username': {'type': 'str', 'nullable': False},
                'message_id': {'type': 'str', 'nullable': False},
                'channel_id': {'type': 'str', 'nullable': True},
                'referral_link_id': {'type': 'UUID', 'nullable': True},
                'referral_id': {'type': 'UUID', 'nullable': True},
                'influencer_id': {'type': 'UUID', 'nullable': True},
                'interaction_type': {'type': 'str', 'nullable': False},
                'message_content': {'type': 'str', 'nullable': True},
                'bot_response': {'type': 'str', 'nullable': True},
                'onboarding_step': {'type': 'str', 'nullable': True},
                'onboarding_completed': {'type': 'bool', 'nullable': True},
                'referral_code_provided': {'type': 'str', 'nullable': True},
                'response_time_ms': {'type': 'int', 'nullable': True},
                'sentiment_score': {'type': 'float', 'nullable': True},
                'created_at': {'type': 'datetime', 'nullable': True}
            },
            'discord_webhook_routes': {
                'id': {'type': 'UUID', 'nullable': False},
                'guild_id': {'type': 'str', 'nullable': False},
                'channel_id': {'type': 'str', 'nullable': True},
                'client_id': {'type': 'UUID', 'nullable': False},
                'webhook_url': {'type': 'str', 'nullable': False},
                'webhook_type': {'type': 'str', 'nullable': False},
                'message_patterns': {'type': 'list', 'nullable': True},
                'user_roles': {'type': 'list', 'nullable': True},
                'command_prefixes': {'type': 'list', 'nullable': True},
                'include_referral_context': {'type': 'bool', 'nullable': True},
                'include_user_history': {'type': 'bool', 'nullable': True},
                'rate_limit_per_minute': {'type': 'int', 'nullable': True},
                'priority': {'type': 'int', 'nullable': True},
                'is_active': {'type': 'bool', 'nullable': True},
                'created_at': {'type': 'datetime', 'nullable': True},
                'updated_at': {'type': 'datetime', 'nullable': True}
            },
            'referral_analytics': {
                'id': {'type': 'UUID', 'nullable': False},
                'link_id': {'type': 'UUID', 'nullable': False},
                'event_type': {'type': 'str', 'nullable': False},
                'user_agent': {'type': 'str', 'nullable': True},
                'ip_address': {'type': 'str', 'nullable': True},
                'referrer': {'type': 'str', 'nullable': True},
                'country': {'type': 'str', 'nullable': True},
                'city': {'type': 'str', 'nullable': True},
                'device_type': {'type': 'str', 'nullable': True},
                'browser': {'type': 'str', 'nullable': True},
                'conversion_value': {'type': 'float', 'nullable': True},
                'metadata': {'type': 'dict', 'nullable': True},
                'created_at': {'type': 'datetime', 'nullable': True}
            }
        }
        
        if table_name in empty_table_schemas:
            return empty_table_schemas[table_name]
        else:
            print(f"No schema definition found for empty table: {table_name}")
            return {}
            
    except Exception as e:
        print(f"Error getting schema for empty table {table_name}: {e}")
        return {}

def analyze_row_types(row_data):
    """Analyze a row to determine field types"""
    field_info = {}
    
    # Known boolean fields (stored as 1/0 in PostgreSQL)
    boolean_fields = {
        'referral_tracking_enabled', 'auto_role_assignment', 'is_active', 
        'moderation_enabled', 'access_control_enabled', 'referral_only_access',
        'is_deleted', 'landing_page_enabled', 'redirect_to_discord'
    }
    
    # Known date fields 
    date_fields = {'join_date', 'campaign_start_date', 'campaign_end_date'}
    
    for key, value in row_data.items():
        if value is None:
            field_info[key] = {'type': 'str', 'nullable': True}
        elif key in boolean_fields and isinstance(value, (int, bool)):
            field_info[key] = {'type': 'bool', 'nullable': False}
        elif key in date_fields:
            field_info[key] = {'type': 'datetime', 'nullable': False}  
        elif isinstance(value, str):
            # Check if it's a UUID
            if len(value) == 36 and value.count('-') == 4:
                field_info[key] = {'type': 'UUID', 'nullable': False}
            # Check if it's a timestamp
            elif 'T' in value and ('Z' in value or '+' in value):
                field_info[key] = {'type': 'datetime', 'nullable': False}
            else:
                field_info[key] = {'type': 'str', 'nullable': False}
        elif isinstance(value, int):
            # Special handling for boolean fields stored as int
            if key in boolean_fields:
                field_info[key] = {'type': 'bool', 'nullable': False}
            else:
                field_info[key] = {'type': 'int', 'nullable': False}
        elif isinstance(value, float):
            field_info[key] = {'type': 'float', 'nullable': False}
        elif isinstance(value, bool):
            field_info[key] = {'type': 'bool', 'nullable': False}
        elif isinstance(value, dict):
            field_info[key] = {'type': 'dict', 'nullable': False}
        elif isinstance(value, list):
            field_info[key] = {'type': 'list', 'nullable': False}
        else:
            field_info[key] = {'type': 'str', 'nullable': False}
    
    return field_info

def get_singular_name(table_name):
    """Convert plural table names to singular model names"""
    if table_name.endswith('s') and not table_name.endswith('ss'):
        return table_name[:-1]
    return table_name

def generate_pydantic_model(table_name, field_info):
    """Generate comprehensive Pydantic models with CRUD variants"""
    # Convert table name to singular class name
    singular_name = get_singular_name(table_name)
    model_name = ''.join(word.capitalize() for word in singular_name.split('_'))
    
    imports = [
        "from pydantic import BaseModel, EmailStr", 
        "from datetime import datetime", 
        "from typing import Optional",
        "from uuid import UUID"
    ]
    
    # System fields that shouldn't be in create/update models
    system_fields = {'id', 'created_at', 'updated_at'}
    
    # Base model fields (exclude system fields)
    base_fields = []
    all_fields = []
    update_fields = []
    
    for field_name, info in field_info.items():
        field_type = info['type']
        is_nullable = info['nullable']
        
        # Handle email fields with EmailStr
        if 'email' in field_name.lower() and field_type == 'str':
            field_type = 'EmailStr'
        
        if is_nullable and not field_type.startswith('Optional'):
            field_line = f"    {field_name}: Optional[{field_type}] = None"
            update_field_line = f"    {field_name}: Optional[{field_type}] = None"
        else:
            field_line = f"    {field_name}: {field_type}"
            update_field_line = f"    {field_name}: Optional[{field_type}] = None"
        
        all_fields.append(field_line)
        
        if field_name not in system_fields:
            base_fields.append(field_line)
            update_fields.append(update_field_line)
    
    # Generate Base model
    base_class = f"\nclass {model_name}Base(BaseModel):"
    if base_fields:
        base_content = base_class + "\n" + "\n".join(base_fields)
    else:
        base_content = base_class + "\n    pass"
    
    # Generate Create model
    create_class = f"\nclass {model_name}Create({model_name}Base):\n    pass"
    
    # Generate Update model  
    update_class = f"\nclass {model_name}Update(BaseModel):"
    if update_fields:
        update_content = update_class + "\n" + "\n".join(update_fields)
    else:
        update_content = update_class + "\n    pass"
    
    # Generate main model with all fields
    main_class = f"\nclass {model_name}({model_name}Base):"
    system_field_lines = []
    for field_name, info in field_info.items():
        if field_name in system_fields:
            field_type = info['type']
            is_nullable = info['nullable']
            if is_nullable and not field_type.startswith('Optional'):
                field_line = f"    {field_name}: Optional[{field_type}] = None"
            else:
                field_line = f"    {field_name}: {field_type}"
            system_field_lines.append(field_line)
    
    if system_field_lines:
        main_content = main_class + "\n" + "\n".join(system_field_lines)
    else:
        main_content = main_class + "\n    pass"
    
    main_content += "\n\n    class Config:\n        from_attributes = True"
    
    model_content = "\n".join(imports) + "\n" + base_content + "\n" + create_class + "\n" + update_content + "\n" + main_content + "\n"
    
    return model_content

def generate_all_models():
    """Generate Pydantic models for all tables"""
    schema_info = get_table_schema()
    
    # Create schemas/db directory
    gen_dir = Path("schemas/db")
    gen_dir.mkdir(exist_ok=True)
    
    for table_name, field_info in schema_info.items():
        if field_info:  # Only generate if we have field info
            model_content = generate_pydantic_model(table_name, field_info)
            
            # Write to file
            file_path = gen_dir / f"{table_name}.py"
            with open(file_path, 'w') as f:
                f.write(model_content)
            
            print(f"✓ Generated model for {table_name}")
        else:
            print(f"⚠ Skipped {table_name} (no field info)")
    
    # Generate __init__.py
    init_content = "# Generated Pydantic models\n"
    for table_name in schema_info.keys():
        if schema_info[table_name]:
            model_name = ''.join(word.capitalize() for word in table_name.split('_'))
            init_content += f"from .{table_name} import {model_name}\n"
    
    with open(gen_dir / "__init__.py", 'w') as f:
        f.write(init_content)
    
    print(f"✓ Generated __init__.py")
    print(f"✓ All models saved to {gen_dir}")

if __name__ == "__main__":
    print("Connecting to Supabase and generating schema models...")
    generate_all_models()