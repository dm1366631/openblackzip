#!/bin/bash
echo "Building OpenBlackZip..."

echo "Step 1: Building frontend..."
pnpm run build

echo "Step 2: Compiling Electron main process..."
pnpm run electron:compile

echo "Step 3: Packaging..."
pnpm run dist -- --win portable --x64 --publish never

echo "Done! Check the 'release' folder for the output."