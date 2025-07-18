#!/bin/bash

# Test the deployed MCP server
# Usage: ./test_deployment.sh [PROJECT_ID] [REGION]

set -e

PROJECT_ID=${1:-virion-labs}
REGION=${2:-us-central1}
SERVICE_NAME="virion-labs-mcp-server"

echo "Testing deployed MCP Server..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')

echo "Service URL: $SERVICE_URL"
echo ""

# Test with curl (will require authentication)
echo "Testing MCP endpoint (requires authentication):"
echo "curl -H \"Authorization: Bearer \$(gcloud auth print-identity-token)\" $SERVICE_URL/mcp/"
echo ""

# Test with gcloud proxy
echo "To test locally with proxy:"
echo "gcloud run services proxy $SERVICE_NAME --port=8080 --region=$REGION"
echo ""

# Test the health of the deployment
echo "Checking deployment status..."
gcloud run services describe $SERVICE_NAME --region=$REGION --format='table(status.conditions[0].type,status.conditions[0].status,status.conditions[0].message)'