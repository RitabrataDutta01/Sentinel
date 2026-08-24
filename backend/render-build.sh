#!/usr/bin/env bash
set -e

echo "Installing Python dependencies..."
uv sync

echo "Building frontend..."
npm ci --prefix ../frontend
npm run build --prefix ../frontend

echo "Copying frontend build..."
mkdir -p static
cp -r ../frontend/dist/* static/
