#!/bin/bash

# Clean any previous build
rm -rf out
rm -rf node_modules

# Install dependencies 
npm install

# Compile the extension
npm run compile

echo "Setup complete. Run ./install.sh to install the extension to VS Code." 