@echo off
echo Building OpenBlackZip for Windows...

echo Step 1: Building frontend...
call pnpm run build

echo Step 2: Compiling Electron main process...
call pnpm run electron:compile

echo Step 3: Packaging for Windows...
call pnpm run dist -- --win portable --x64 --publish never

echo Done! Check the 'release' folder for the output.
pause