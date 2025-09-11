#!/bin/bash
# Kill all development servers
echo "🔥 Killing all servers..."
pkill -f "next dev" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
pkill -f "node.*dev" 2>/dev/null
pkill -f "vite" 2>/dev/null
pkill -f "webpack" 2>/dev/null

# Kill processes on common dev ports
echo "🚪 Clearing ports..."
lsof -ti:3000,3001,8080,8000 2>/dev/null | xargs kill -9 2>/dev/null

# Wait a moment
sleep 2

# Start fresh server
echo "🚀 Starting fresh server..."
cd /Users/andrewmann/curricoolio/frontend && npm run dev
