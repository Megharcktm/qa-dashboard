#!/bin/bash

echo "Testing DevRev Sync Endpoint..."
echo ""

npm run server:dev > /tmp/server.log 2>&1 &
SERVER_PID=$!

sleep 4

echo "Server PID: $SERVER_PID"
echo ""

echo "Testing Sync Endpoint..."
echo "POST /api/sync/trigger"
curl -X POST http://localhost:3001/api/sync/trigger \
  -H "Content-Type: application/json" \
  -d '{"force":false}' \
  2>/dev/null

echo ""
echo ""
echo "Waiting for sync to complete..."
sleep 10

echo "Getting Sync History..."
echo "GET /api/sync/history"
curl -s http://localhost:3001/api/sync/history 2>/dev/null | jq . || echo "Failed to get history"

echo ""
echo "Getting Tickets..."
echo "GET /api/tickets?limit=5"
curl -s "http://localhost:3001/api/tickets?limit=5" 2>/dev/null | jq . || echo "Failed to get tickets"

echo ""
echo "Getting Stats..."
echo "GET /api/tickets/stats"
curl -s http://localhost:3001/api/tickets/stats 2>/dev/null | jq . || echo "Failed to get stats"

echo ""
echo "Killing server..."
kill $SERVER_PID 2>/dev/null || true

sleep 1
