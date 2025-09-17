#!/bin/bash
# Setup script for local development

echo "🔧 Setting up local development environment..."

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Copy environment variables to frontend
echo "📋 Copying environment variables..."
cp .env.local frontend/.env.local

# Install dependencies if needed
echo "📦 Installing dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
else
    echo "Dependencies already installed"
fi

# Create a .gitignore entry for local env if it doesn't exist
if ! grep -q "frontend/.env.local" .gitignore 2>/dev/null; then
    echo "frontend/.env.local" >> .gitignore
    echo "Added frontend/.env.local to .gitignore"
fi

echo "✅ Local development setup complete!"
echo ""
echo "🚀 To start development:"
echo "   ./restart-dev.sh"
echo ""
echo "🌐 Your app will be available at: http://localhost:3000"
echo ""
echo "📝 To make changes:"
echo "   1. Edit files in frontend/src/"
echo "   2. Changes will auto-reload"
echo "   3. Test locally before deploying"
echo ""
echo "🚀 To deploy to production:"
echo "   git add . && git commit -m 'Your changes' && git push"
echo ""
echo "🌐 Production URL: https://max-wonkage.vercel.app"
