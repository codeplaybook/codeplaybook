#!/usr/bin/env bash
# Deploy codeplaybook landing page to Vercel
# Usage: ./deploy.sh [--prod]

set -euo pipefail
cd "$(dirname "$0")"

if [[ "${1:-}" == "--prod" ]]; then
  vercel --yes --prod
else
  vercel --yes
fi
