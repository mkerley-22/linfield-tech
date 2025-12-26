#!/bin/bash

echo "🔍 Google Custom Search API Setup Helper"
echo "========================================"
echo ""
echo "This script will help you verify your Google Custom Search API setup."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it first."
    exit 1
fi

# Check for API key
if grep -q "GOOGLE_CUSTOM_SEARCH_API_KEY=" .env; then
    API_KEY=$(grep "GOOGLE_CUSTOM_SEARCH_API_KEY=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    if [ -n "$API_KEY" ] && [ "$API_KEY" != "your_api_key_here" ]; then
        echo "✅ GOOGLE_CUSTOM_SEARCH_API_KEY is set"
    else
        echo "⚠️  GOOGLE_CUSTOM_SEARCH_API_KEY is not configured"
    fi
else
    echo "❌ GOOGLE_CUSTOM_SEARCH_API_KEY not found in .env"
fi

# Check for Search Engine ID
if grep -q "GOOGLE_CUSTOM_SEARCH_ENGINE_ID=" .env; then
    ENGINE_ID=$(grep "GOOGLE_CUSTOM_SEARCH_ENGINE_ID=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    if [ -n "$ENGINE_ID" ] && [ "$ENGINE_ID" != "your_search_engine_id_here" ]; then
        echo "✅ GOOGLE_CUSTOM_SEARCH_ENGINE_ID is set"
    else
        echo "⚠️  GOOGLE_CUSTOM_SEARCH_ENGINE_ID is not configured"
    fi
else
    echo "❌ GOOGLE_CUSTOM_SEARCH_ENGINE_ID not found in .env"
fi

echo ""
echo "📝 Next steps:"
echo "1. Follow the instructions in SETUP_GOOGLE_SEARCH.md"
echo "2. Add your API key and Search Engine ID to .env"
echo "3. Restart your development server (npm run dev)"
echo ""
