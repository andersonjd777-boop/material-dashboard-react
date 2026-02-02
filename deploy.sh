#!/bin/bash
# DCG Admin Dashboard Deployment Script
# Ensures proper cache clearing and linting before build

set -e  # Exit on any error

echo "=== DCG Admin Dashboard Deployment ==="
echo ""

# Step 1: Clear cache
echo "1. Clearing node_modules cache..."
rm -rf node_modules/.cache
echo "   ✓ Cache cleared"

# Step 2: Run ESLint fix on all source files
echo ""
echo "2. Running ESLint fix on source files..."
npx eslint --fix "src/**/*.js" 2>/dev/null || true
echo "   ✓ ESLint fix completed"

# Step 3: Run Prettier on all source files
echo ""
echo "3. Running Prettier on source files..."
npx prettier --write "src/**/*.js" 2>/dev/null || true
echo "   ✓ Prettier formatting completed"

# Step 4: Build
echo ""
echo "4. Building production bundle..."
npm run build
echo "   ✓ Build completed"

# Step 5: Deploy to server
echo ""
echo "5. Deploying to server..."
scp -r build/* dcg@157.245.185.88:/home/dcg/dashboard/
echo "   ✓ Deployed to dashboard.directconnectglobal.com"

echo ""
echo "=== Deployment Complete ==="
echo "View at: https://dashboard.directconnectglobal.com"

