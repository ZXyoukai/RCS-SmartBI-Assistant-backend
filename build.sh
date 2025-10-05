#!/bin/bash

# Build script for Vercel deployment
echo "Starting build process..."

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo "Build completed successfully!"
