#!/usr/bin/env bash
set -e

API_URL=${1:-http://localhost:5000/api}
EMAIL=${2:-admin@marineprocure.com}
PASSWORD=${3:-Password123!}

echo "Testing health endpoint..."
curl -fsS "$API_URL/health" || true

echo "\nTesting login..."
LOGIN_RESPONSE=$(curl -fsS -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")

if [ -z "$TOKEN" ]; then
  echo "Login failed: token missing"
  exit 1
fi

echo "Login OK"

echo "Testing admin console..."
curl -fsS "$API_URL/admin/console" -H "Authorization: Bearer $TOKEN" >/dev/null

echo "Testing reports..."
curl -fsS "$API_URL/reports/dashboard" -H "Authorization: Bearer $TOKEN" >/dev/null

echo "Testing uploads list..."
curl -fsS "$API_URL/uploads" -H "Authorization: Bearer $TOKEN" >/dev/null

echo "All smoke tests passed."
