#!/bin/bash
# Helper script to start the frontend server from any directory
cd "$(dirname "$0")/frontend" || exit
echo "Starting server from $(pwd)"
npm run dev
