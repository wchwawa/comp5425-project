#!/bin/bash

echo "🚀 Starting project setup..."

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed."
  echo "Please install it from https://nodejs.org/ and run this script again."
  exit 1
fi

# Show Node version
echo "✅ Node.js version: $(node -v)"

# Step 1: Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Step 2: Copy .env if not exists
if [ ! -f .env ]; then
  echo "📝 .env not found. Copying from .env.example..."
  cp .env.example .env
else
  echo "✅ .env already exists."
fi


echo "🎉 Setup complete. You can now run: npm run dev"