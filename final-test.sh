#!/bin/bash

npm run server:dev > /tmp/server3.log 2>&1 &
SERVER_PID=$!
sleep 4

echo "=== QA Dashboard API Test ==="
echo ""

echo "1. Health Check:"
curl -s http://localhost:3001/api/health | jq '.'
echo ""

echo "2. Dashboard Stats:"
curl -s http://localhost:3001/api/tickets/stats | jq '.'
echo ""

echo "3. First Ticket:"
curl -s "http://localhost:3001/api/tickets?limit=1" | jq '.tickets[0]'
echo ""

echo "4. Sync History:"
curl -s http://localhost:3001/api/sync/history | jq '.history[0]'

kill $SERVER_PID 2>/dev/null || true
