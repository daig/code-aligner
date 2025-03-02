#!/bin/bash

# Ensure out directory exists
mkdir -p out

# Compile TypeScript
npm run compile

# Determine extension directory
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    EXTENSION_DIR="$HOME/.vscode/extensions/user.code-aligner-0.1.0"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    EXTENSION_DIR="$USERPROFILE/.vscode/extensions/user.code-aligner-0.1.0"
else
    # Linux and others
    EXTENSION_DIR="$HOME/.vscode/extensions/user.code-aligner-0.1.0"
fi

# Create the extension directory if it doesn't exist
mkdir -p "$EXTENSION_DIR"

# Remove existing installation if present
rm -rf "$EXTENSION_DIR"/*

# Copy files to the extension directory
cp -r package.json out/ node_modules/ .vscodeignore README.md tsconfig.json "$EXTENSION_DIR"

# Make sure the extension directory has the right permissions
chmod -R 755 "$EXTENSION_DIR"

echo "Extension installed to $EXTENSION_DIR"
echo "Please restart VSCode to use the extension." 