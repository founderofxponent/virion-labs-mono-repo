#!/bin/bash
# Schema regeneration script for CI/CD pipeline

echo "🔄 Regenerating Pydantic models from Supabase schema..."

# Check if environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing required environment variables:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

# Run the schema generation script
python3 generate_schemas.py

if [ $? -eq 0 ]; then
    echo "✅ Schema generation completed successfully"
    echo "📁 Generated models saved to: generated_schemas/"
    
    # Check if there are any changes
    if git diff --quiet generated_schemas/; then
        echo "ℹ️  No schema changes detected"
    else
        echo "⚠️  Schema changes detected! Please review and commit:"
        git diff --name-only generated_schemas/
    fi
else
    echo "❌ Schema generation failed"
    exit 1
fi