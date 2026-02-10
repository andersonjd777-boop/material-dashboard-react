#!/bin/bash
# ============================================================
# DEPRECATED — DO NOT USE
# ============================================================
# This manual deployment script has been replaced by the
# GitHub Actions CI/CD pipeline at .github/workflows/ci-cd.yml
#
# To deploy:
#   1. Push to the 'main' branch
#   2. GitHub Actions will automatically build, test, and deploy
#
# For manual builds (local testing only):
#   npm run build
# ============================================================

echo "ERROR: This script is deprecated."
echo ""
echo "Deployments are now handled by GitHub Actions CI/CD."
echo "Push to the 'main' branch to trigger an automatic deployment."
echo ""
echo "See: .github/workflows/ci-cd.yml"
exit 1
