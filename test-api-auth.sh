#!/bin/bash

echo "🔐 Testing Phoenix Production API Authentication"
echo "================================================"
echo ""

# Login and extract token
echo "1️⃣  Logging in..."
RESPONSE=$(curl -s -X POST https://pal-backend-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"simple@phoenix.com","password":"test123456"}')

echo "$RESPONSE" | python3 -m json.tool
echo ""

TOKEN=$(echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('token', ''))")

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token"
    exit 1
fi

echo "✅ Token received: ${TOKEN:0:50}..."
echo ""

# Test authenticated endpoint
echo "2️⃣  Testing authenticated /api/auth/me endpoint..."
curl -s https://pal-backend-production.up.railway.app/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo ""
echo "✅ API Authentication Test Complete"
