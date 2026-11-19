#!/usr/bin/env bash
set -e

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Downloading spaCy model..."
python -m spacy download en_core_web_sm

echo "Building frontend..."
npm ci --prefix ../frontend
npm run build --prefix ../frontend

echo "Copying frontend build..."
mkdir -p static
cp -r ../frontend/dist/* static/
